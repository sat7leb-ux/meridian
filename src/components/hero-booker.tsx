"use client";

import { useState } from "react";
import { cn, formatTime, formatDate, detectTimezone } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Clock, Globe, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Service, Staff, Schedule, AvailabilityRule } from "@/lib/types";
import { getAvailableSlots, groupSlotsByDay, slotDensityByDay } from "@/lib/scheduling/availability";
import Link from "next/link";

interface HeroBookerProps {
  data: {
    org: { name: string; timezone: string; logo_url: string | null };
    services: (Service & { service_categories: { name: string } | null })[];
    staff: Staff[];
    schedules: (Schedule & { availability_rules: AvailabilityRule[] })[];
  };
}

export function HeroBooker({ data }: HeroBookerProps) {
  const [selectedService, setSelectedService] = useState<Service | null>(data.services[0] ?? null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(data.staff[0] ?? null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [timezone, setTimezone] = useState(detectTimezone());

  const staffTimezone = selectedStaff?.timezone ?? data.org.timezone;
  const staffSchedule = data.schedules.find((s) => s.staff_id === selectedStaff?.id) ?? data.schedules[0];
  const rules = staffSchedule?.availability_rules ?? [];

  // Calculate slots for the visible month
  const now = new Date();
  const from = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const to = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  const slots = selectedService
    ? getAvailableSlots({
        from,
        to,
        scheduleTimezone: staffTimezone,
        rules: rules.map((r) => ({ weekday: r.weekday, startTime: r.start_time, endTime: r.end_time })),
        busy: [],
        service: {
          durationMinutes: selectedService.duration_minutes,
          slotIntervalMinutes: selectedService.slot_interval_minutes,
          bufferBeforeMinutes: selectedService.buffer_before_minutes,
          bufferAfterMinutes: selectedService.buffer_after_minutes,
          minimumNoticeMinutes: selectedService.minimum_notice_minutes,
          maximumAdvanceDays: selectedService.maximum_advance_days,
          maxBookingsPerDay: selectedService.max_bookings_per_day,
        },
        now,
      })
    : [];

  const slotsByDay = groupSlotsByDay(slots, timezone);
  const density = slotDensityByDay(slots, timezone);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const isToday = (day: number) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return d.toDateString() === now.toDateString();
  };

  const isPast = (day: number) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return d < new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };

  const getDayKey = (day: number) => {
    const m = String(currentMonth.getMonth() + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${currentMonth.getFullYear()}-${m}-${d}`;
  };

  const selectedSlots = selectedDate ? slotsByDay[selectedDate] ?? [] : [];

  return (
    <div className="card p-5 shadow-float">
      {/* Service selector */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {data.services.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSelectedService(s);
                setSelectedDate(null);
                setSelectedSlot(null);
              }}
              className={cn(
                "px-3 py-1.5 rounded-field text-sm font-medium transition-colors",
                selectedService?.id === s.id
                  ? "bg-teal text-white"
                  : "bg-hairline/20 text-ink hover:bg-hairline/40"
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Staff selector */}
      {data.staff.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {data.staff.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSelectedStaff(s);
                  setSelectedDate(null);
                  setSelectedSlot(null);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-field text-xs font-medium transition-colors",
                  selectedStaff?.id === s.id
                    ? "bg-teal/10 text-teal border border-teal"
                    : "bg-hairline/20 text-ink hover:bg-hairline/40"
                )}
              >
                <User className="h-3 w-3" />
                {s.display_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-display font-semibold">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={prevMonth} className="h-7 w-7 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={nextMonth} className="h-7 w-7 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5 mb-3">
        {dayNames.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-mute py-1">
            {d}
          </div>
        ))}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayKey = getDayKey(day);
          const dayDensity = density[dayKey] ?? "none";
          const hasSlots = dayDensity !== "none";
          const isSelected = selectedDate === dayKey;

          return (
            <button
              key={day}
              disabled={isPast(day) || !hasSlots}
              onClick={() => {
                setSelectedDate(dayKey);
                setSelectedSlot(null);
              }}
              className={cn(
                "relative aspect-square rounded-slot text-xs font-medium transition-all",
                isPast(day) && "opacity-20 cursor-not-allowed",
                !isPast(day) && hasSlots && "hover:border-teal cursor-pointer",
                isSelected && "bg-teal text-white border-teal",
                isToday(day) && !isSelected && "border-teal",
                !hasSlots && !isPast(day) && "opacity-40 cursor-not-allowed",
              )}
            >
              <span className="tabular">{day}</span>
              {hasSlots && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-px">
                  {dayDensity === "low" && <span className="h-0.5 w-0.5 rounded-full bg-current" />}
                  {dayDensity === "medium" && (
                    <>
                      <span className="h-0.5 w-0.5 rounded-full bg-current" />
                      <span className="h-0.5 w-0.5 rounded-full bg-current" />
                    </>
                  )}
                  {dayDensity === "high" && (
                    <>
                      <span className="h-0.5 w-0.5 rounded-full bg-current" />
                      <span className="h-0.5 w-0.5 rounded-full bg-current" />
                      <span className="h-0.5 w-0.5 rounded-full bg-current" />
                    </>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Timezone */}
      <div className="flex items-center gap-1.5 text-xs text-mute mb-3">
        <Globe className="h-3 w-3" />
        <span>{timezone}</span>
      </div>

      {/* Slots */}
      {selectedDate && selectedSlots.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-mute">
            {formatDate(new Date(selectedDate + "T00:00:00"), timezone)}
          </p>
          <div className="grid grid-cols-3 gap-1">
            {selectedSlots.slice(0, 6).map((slot, i) => {
              const isSelected = selectedSlot?.start.getTime() === slot.start.getTime();
              return (
                <button
                  key={i}
                  onClick={() => setSelectedSlot(slot)}
                  className={cn(
                    "slot text-center py-1.5",
                    isSelected && "border-teal bg-teal text-white"
                  )}
                >
                  <span className="tabular text-xs">{formatTime(slot.start, timezone)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected slot CTA */}
      {selectedSlot && selectedService && (
        <div className="mt-3 pt-3 border-t border-hairline">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-mute">Selected</p>
              <p className="text-sm font-medium">
                {formatDate(selectedSlot.start, timezone)} · {formatTime(selectedSlot.start, timezone)}
              </p>
            </div>
            <Clock className="h-4 w-4 text-teal" />
          </div>
          <Link href={`/book/demo/${selectedService.slug}?slot=${selectedSlot.start.toISOString()}&tz=${encodeURIComponent(timezone)}`}>
            <Button className="w-full" size="sm">
              Book this time
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
