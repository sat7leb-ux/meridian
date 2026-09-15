// lib/scheduling/availability.ts
//
// Pure slot engine. No database access, no network, no framework.
// Everything in and out is a UTC instant; local wall-clock times are only
// ever resolved through an IANA timezone with Luxon.

import { DateTime, Interval } from "luxon";
import type { Slot, SlotQuery } from "@/lib/types";

/* ------------------------------------------------------------------ types */

export interface AvailabilityRule {
  /** 0 = Sunday … 6 = Saturday, in the schedule's own timezone */
  weekday: number;
  /** local wall-clock, "09:00" or "09:00:00" */
  startTime: string;
  endTime: string;
}

export interface AvailabilityOverride {
  /** ISO date, "2026-09-18" */
  date: string;
  isClosed: boolean;
  startTime?: string;
  endTime?: string;
}

export interface BusyInterval {
  start: Date;
  end: Date;
}

export interface ServiceRules {
  durationMinutes: number;
  slotIntervalMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  minimumNoticeMinutes: number;
  maximumAdvanceDays: number;
  maxBookingsPerDay?: number | null;
}

/* ------------------------------------------------------------ small utils */

/** Merge overlapping or touching intervals into a sorted, disjoint list. */
export function mergeIntervals(list: Interval[]): Interval[] {
  const valid = list.filter((i) => i.isValid && i.length("minutes") > 0);
  if (valid.length === 0) return [];

  const sorted = [...valid].sort((a, b) => a.start!.toMillis() - b.start!.toMillis());
  const out: Interval[] = [sorted[0]];

  for (const current of sorted.slice(1)) {
    const last = out[out.length - 1];
    if (current.start! <= last.end!) {
      if (current.end! > last.end!) {
        out[out.length - 1] = Interval.fromDateTimes(last.start!, current.end!);
      }
    } else {
      out.push(current);
    }
  }
  return out;
}

/** windows − busy, in one linear pass. Both inputs need not be sorted. */
export function subtractIntervals(windows: Interval[], busy: Interval[]): Interval[] {
  const blocked = mergeIntervals(busy);
  let result = mergeIntervals(windows);

  for (const b of blocked) {
    const next: Interval[] = [];
    for (const w of result) {
      if (b.end! <= w.start! || b.start! >= w.end!) {
        next.push(w); // no overlap
        continue;
      }
      if (b.start! > w.start!) next.push(Interval.fromDateTimes(w.start!, b.start!));
      if (b.end! < w.end!) next.push(Interval.fromDateTimes(b.end!, w.end!));
    }
    result = next;
  }
  return result;
}

function parseLocalTime(dayStart: DateTime, hhmm: string): DateTime {
  const [h, m = "0", s = "0"] = hhmm.split(":");
  return dayStart.set({
    hour: Number(h),
    minute: Number(m),
    second: Number(s),
    millisecond: 0,
  });
}

/* --------------------------------------------------------- window builder */

/**
 * Build the working windows for every local day in range.
 * A date override replaces that day's recurring rules completely.
 */
export function buildWorkingWindows(q: SlotQuery): Interval[] {
  const zone = q.scheduleTimezone;
  const overrides = new Map((q.overrides ?? []).map((o) => [o.date, o]));

  // Widen by one local day each side: a window can start on the previous
  // local day and still contain slots inside the requested UTC range.
  let cursor = DateTime.fromJSDate(q.from, { zone }).startOf("day").minus({ days: 1 });
  const last = DateTime.fromJSDate(q.to, { zone }).startOf("day").plus({ days: 1 });

  const windows: Interval[] = [];

  while (cursor <= last) {
    const iso = cursor.toISODate()!;
    const override = overrides.get(iso);

    if (override) {
      if (!override.isClosed && override.startTime && override.endTime) {
        windows.push(
          Interval.fromDateTimes(
            parseLocalTime(cursor, override.startTime),
            parseLocalTime(cursor, override.endTime),
          ),
        );
      }
      // isClosed, or an override with no times: the day has no windows
    } else {
      // Luxon weekday: 1 = Monday … 7 = Sunday. Our rules use 0 = Sunday.
      const weekday = cursor.weekday === 7 ? 0 : cursor.weekday;
      for (const rule of q.rules.filter((r) => r.weekday === weekday)) {
        const start = parseLocalTime(cursor, rule.startTime);
        let end = parseLocalTime(cursor, rule.endTime);
        if (end <= start) end = end.plus({ days: 1 }); // overnight shift
        windows.push(Interval.fromDateTimes(start, end));
      }
    }
    cursor = cursor.plus({ days: 1 });
  }

  return mergeIntervals(windows);
}

/* ----------------------------------------------------------------- engine */

export function getAvailableSlots(q: SlotQuery): Slot[] {
  const {
    service,
    scheduleTimezone: zone,
    bookingsPerDay = {},
    now = new Date(),
  } = q;

  const nowDt = DateTime.fromJSDate(now, { zone });
  const earliest = nowDt.plus({ minutes: service.minimumNoticeMinutes });
  const latest = nowDt.plus({ days: service.maximumAdvanceDays }).endOf("day");

  const requested = Interval.fromDateTimes(
    DateTime.fromJSDate(q.from, { zone }),
    DateTime.fromJSDate(q.to, { zone }),
  );
  if (!requested.isValid) return [];

  // 1. working windows − busy time
  const working = buildWorkingWindows(q);
  const busy = q.busy.map((b) =>
    Interval.fromDateTimes(
      DateTime.fromJSDate(b.start, { zone }),
      DateTime.fromJSDate(b.end, { zone }),
    ),
  );
  const free = subtractIntervals(working, busy);

  // 2. cut each free window into candidate slots
  const step = Math.max(5, service.slotIntervalMinutes);
  const span = service.durationMinutes;
  const padBefore = service.bufferBeforeMinutes;
  const padAfter = service.bufferAfterMinutes;

  const slots: Slot[] = [];
  const dailyCount: Record<string, number> = { ...bookingsPerDay };

  for (const window of free) {
    // A slot must fit with its buffers inside the free window, because the
    // buffers are what the database exclusion constraint will compare.
    let cursor = window.start!.plus({ minutes: padBefore });

    // align to the step grid relative to the top of the hour
    const minuteOffset = cursor.minute % step;
    if (minuteOffset !== 0) cursor = cursor.plus({ minutes: step - minuteOffset }).startOf("minute");

    while (true) {
      const start = cursor;
      const end = start.plus({ minutes: span });
      if (end.plus({ minutes: padAfter }) > window.end!) break;

      const withinRequest = start >= requested.start! && start < requested.end!;
      const afterNotice = start >= earliest;
      const withinHorizon = start <= latest;

      if (withinRequest && afterNotice && withinHorizon) {
        const dayKey = start.toISODate()!;
        const limit = service.maxBookingsPerDay ?? Infinity;
        if ((dailyCount[dayKey] ?? 0) < limit) {
          slots.push({ start: start.toUTC().toJSDate(), end: end.toUTC().toJSDate() });
        }
      }

      cursor = cursor.plus({ minutes: step });
    }
  }

  return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
}

/* ----------------------------------------------------------- grouped view */

/** Group slots by local date in the *customer's* zone, for the slot column. */
export function groupSlotsByDay(
  slots: Slot[],
  displayTimezone: string,
): Record<string, Slot[]> {
  return slots.reduce<Record<string, Slot[]>>((acc, slot) => {
    const key = DateTime.fromJSDate(slot.start, { zone: displayTimezone }).toISODate()!;
    (acc[key] ??= []).push(slot);
    return acc;
  }, {});
}

/** Availability density per day, for the dots on the month grid. */
export function slotDensityByDay(
  slots: Slot[],
  displayTimezone: string,
): Record<string, "none" | "low" | "medium" | "high"> {
  const grouped = groupSlotsByDay(slots, displayTimezone);
  const out: Record<string, "none" | "low" | "medium" | "high"> = {};
  for (const [day, list] of Object.entries(grouped)) {
    out[day] = list.length === 0 ? "none" : list.length <= 3 ? "low" : list.length <= 8 ? "medium" : "high";
  }
  return out;
}

/* ----------------------------------------------------------------- guards */

/**
 * Final server-side check before insert. The database exclusion constraint is
 * the real guarantee; this exists to return a friendly error first.
 */
export function isSlotStillValid(chosen: Slot, available: Slot[]): boolean {
  return available.some(
    (s) => s.start.getTime() === chosen.start.getTime() && s.end.getTime() === chosen.end.getTime(),
  );
}
