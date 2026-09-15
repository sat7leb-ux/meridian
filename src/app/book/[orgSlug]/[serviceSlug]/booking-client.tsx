"use client";

import { useState } from "react";
import { cn, formatTime, formatDate } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Clock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Slot } from "@/lib/types";

interface BookingClientProps {
  slotsByDay: Record<string, { start: string; end: string }[]>;
  density: Record<string, "none" | "low" | "medium" | "high">;
  timezone: string;
  service: { id: string; slug: string; name: string; duration_minutes: number; price_cents: number; currency: string };
  orgSlug: string;
  staffTimezone: string;
}

export function BookingClient({ slotsByDay, density, timezone, service, orgSlug, staffTimezone }: BookingClientProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isToday = (day: number) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return d.toDateString() === today.toDateString();
  };

  const isPast = (day: number) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const getDayKey = (day: number) => {
    const m = String(currentMonth.getMonth() + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${currentMonth.getFullYear()}-${m}-${d}`;
  };

  const selectedSlots = selectedDate ? slotsByDay[selectedDate] ?? [] : [];

  return (
    <div className="space-y-6">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-semibold">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {dayNames.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-mute py-2">
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
                "relative aspect-square rounded-slot text-sm font-medium transition-all",
                isPast(day) && "opacity-30 cursor-not-allowed",
                !isPast(day) && hasSlots && "hover:border-teal cursor-pointer",
                isSelected && "bg-teal text-white border-teal",
                isToday(day) && !isSelected && "border-teal",
                !hasSlots && !isPast(day) && "opacity-50 cursor-not-allowed",
              )}
            >
              <span className="tabular">{day}</span>
              {hasSlots && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {dayDensity === "low" && <span className="h-1 w-1 rounded-full bg-current" />}
                  {dayDensity === "medium" && (
                    <>
                      <span className="h-1 w-1 rounded-full bg-current" />
                      <span className="h-1 w-1 rounded-full bg-current" />
                    </>
                  )}
                  {dayDensity === "high" && (
                    <>
                      <span className="h-1 w-1 rounded-full bg-current" />
                      <span className="h-1 w-1 rounded-full bg-current" />
                      <span className="h-1 w-1 rounded-full bg-current" />
                    </>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Timezone indicator */}
      <div className="flex items-center gap-2 text-sm text-mute">
        <Globe className="h-4 w-4" />
        <span>Times shown in {timezone}</span>
      </div>

      {/* Slots for selected day */}
      {selectedDate && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-mute">
            Available times for {formatDate(new Date(selectedDate + "T00:00:00"), timezone)}
          </h3>
          {selectedSlots.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {selectedSlots.map((slot, i) => {
                const slotStart = new Date(slot.start);
                const isSelected = selectedSlot?.start.getTime() === slotStart.getTime();
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedSlot({ start: slotStart, end: new Date(slot.end) })}
                    className={cn(
                      "slot text-center",
                      isSelected && "border-teal bg-teal text-white"
                    )}
                  >
                    <span className="tabular text-sm">{formatTime(slotStart, timezone)}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-mute">No available times for this date.</p>
          )}
        </div>
      )}

      {/* Continue button */}
      {selectedSlot && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-mute">Selected time</p>
              <p className="font-display font-semibold">
                {formatDate(selectedSlot.start, timezone)} at {formatTime(selectedSlot.start, timezone)}
              </p>
            </div>
            <Clock className="h-5 w-5 text-teal" />
          </div>
          <Link
            href={`/book/${orgSlug}/${service.slug}/details?slot=${selectedSlot.start.toISOString()}&tz=${encodeURIComponent(timezone)}`}
          >
            <Button className="w-full">
              Continue <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
