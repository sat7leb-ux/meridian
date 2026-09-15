import { createPublicClient } from "@/lib/supabase/public";
import { getAvailableSlots, groupSlotsByDay, slotDensityByDay } from "@/lib/scheduling/availability";
import { detectTimezone, formatTime, formatDate, formatCurrency, cn } from "@/lib/utils";
import type { Service, Staff, Schedule, AvailabilityRule } from "@/lib/types";
import { Calendar, Clock, Globe, Phone, Video, MapPin, CheckCircle2, ArrowRight, ChevronLeft, ChevronRight, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookingClient } from "./booking-client";

interface PageProps {
  params: Promise<{ orgSlug: string; serviceSlug: string }>;
}

async function getServiceData(orgSlug: string, serviceSlug: string) {
  const sb = createPublicClient();
  if (!sb) return null;

  const { data: org } = await sb
    .from("organizations")
    .select("*")
    .eq("slug", orgSlug)
    .eq("is_active", true)
    .single();

  if (!org) return null;

  const { data: service } = await sb
    .from("services")
    .select("*, service_categories(name)")
    .eq("org_id", org.id)
    .eq("slug", serviceSlug)
    .eq("is_published", true)
    .eq("is_active", true)
    .single();

  if (!service) return null;

  const { data: staffList } = await sb
    .from("staff")
    .select("*")
    .eq("org_id", org.id)
    .eq("is_active", true)
    .eq("is_bookable", true)
    .order("display_name");

  const { data: schedules } = await sb
    .from("schedules")
    .select("*, availability_rules(*)")
    .eq("org_id", org.id);

  // Get service-staff assignments
  const { data: serviceStaff } = await sb
    .from("service_staff")
    .select("staff_id")
    .eq("service_id", service.id);

  const assignedStaffIds = (serviceStaff ?? []).map((ss: { staff_id: string }) => ss.staff_id);
  const assignedStaff = (staffList ?? []).filter((s: Staff) => assignedStaffIds.includes(s.id));

  return {
    org,
    service: service as Service & { service_categories: { name: string } | null },
    staff: assignedStaff as Staff[],
    schedules: (schedules ?? []) as (Schedule & { availability_rules: AvailabilityRule[] })[],
  };
}

export default async function ServiceBookingPage({ params }: PageProps) {
  const { orgSlug, serviceSlug } = await params;
  const data = await getServiceData(orgSlug, serviceSlug);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-display font-semibold mb-2">Service not found</h1>
          <p className="text-mute">This booking link is invalid or has been deactivated.</p>
        </div>
      </div>
    );
  }

  const { org, service, staff, schedules } = data;

  // Get staff timezone (use first staff's timezone or org timezone)
  const staffTimezone = staff[0]?.timezone ?? org.timezone;

  // Get schedule rules for the staff
  const staffSchedule = schedules.find((s) => s.staff_id === staff[0]?.id) ?? schedules[0];
  const rules = staffSchedule?.availability_rules ?? [];

  // Get busy intervals for the next 60 days
  const now = new Date();
  const from = new Date(now);
  const to = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const sb = createPublicClient();
  let busyIntervals: { start: Date; end: Date }[] = [];

  if (sb && staff.length > 0) {
    const { data: busyData } = await sb
      .from("bookings")
      .select("starts_at, ends_at, services(buffer_before_minutes, buffer_after_minutes)")
      .eq("staff_id", staff[0].id)
      .not("status", "in", "(cancelled,no_show)")
      .gte("starts_at", from.toISOString())
      .lte("starts_at", to.toISOString());

    if (busyData) {
      busyIntervals = busyData.map((b: { starts_at: string; ends_at: string; services: { buffer_before_minutes: number; buffer_after_minutes: number } | null }) => ({
        start: new Date(new Date(b.starts_at).getTime() - (b.services?.buffer_before_minutes ?? 0) * 60000),
        end: new Date(new Date(b.ends_at).getTime() + (b.services?.buffer_after_minutes ?? 0) * 60000),
      }));
    }
  }

  // Calculate slots
  const slots = getAvailableSlots({
    from,
    to,
    scheduleTimezone: staffTimezone,
    rules: rules.map((r: AvailabilityRule) => ({
      weekday: r.weekday,
      startTime: r.start_time,
      endTime: r.end_time,
    })),
    busy: busyIntervals,
    service: {
      durationMinutes: service.duration_minutes,
      slotIntervalMinutes: service.slot_interval_minutes,
      bufferBeforeMinutes: service.buffer_before_minutes,
      bufferAfterMinutes: service.buffer_after_minutes,
      minimumNoticeMinutes: service.minimum_notice_minutes,
      maximumAdvanceDays: service.maximum_advance_days,
      maxBookingsPerDay: service.max_bookings_per_day,
    },
    now,
  });

  const slotsByDay = groupSlotsByDay(slots, detectTimezone());
  const density = slotDensityByDay(slots, detectTimezone());

  const methodIcons = {
    video: <Video className="h-4 w-4" />,
    phone: <Phone className="h-4 w-4" />,
    audio: <Phone className="h-4 w-4" />,
    online_meeting: <Video className="h-4 w-4" />,
    in_person: <MapPin className="h-4 w-4" />,
    custom: <Globe className="h-4 w-4" />,
  };

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="border-b border-hairline bg-surface">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/book/${orgSlug}`} className="flex items-center gap-3">
            {org.logo_url ? (
              <img src={org.logo_url} alt={org.name} className="h-8 w-8 rounded" />
            ) : (
              <div className="h-8 w-8 rounded bg-teal flex items-center justify-center">
                <Clock className="h-4 w-4 text-white" />
              </div>
            )}
            <span className="font-display font-semibold text-lg">{org.name}</span>
          </Link>
          <Badge variant="outline" className="text-mute">
            <Globe className="h-3 w-3 mr-1" />
            {detectTimezone()}
          </Badge>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link href={`/book/${orgSlug}`} className="inline-flex items-center gap-1 text-sm text-mute hover:text-teal mb-6">
          <ChevronLeft className="h-4 w-4" />
          Back to services
        </Link>

        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          {/* Main content */}
          <div>
            <h1 className="text-3xl font-display font-bold mb-2">{service.name}</h1>
            {service.description && <p className="text-mute mb-6">{service.description}</p>}

            {/* Staff picker */}
            {staff.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-medium text-mute mb-3">Choose a staff member</h2>
                <div className="flex flex-wrap gap-2">
                  {staff.map((s) => (
                    <button
                      key={s.id}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-field border text-sm transition-colors",
                        s.color ? "border-current" : "border-hairline",
                        "hover:border-teal"
                      )}
                      style={s.color ? { borderColor: s.color } : undefined}
                    >
                      {s.avatar_url ? (
                        <img src={s.avatar_url} alt={s.display_name} className="h-6 w-6 rounded-full" />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-teal/10 flex items-center justify-center">
                          <User className="h-3 w-3 text-teal" />
                        </div>
                      )}
                      <span>{s.display_name}</span>
                      {s.title && <span className="text-mute text-xs">· {s.title}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Calendar + Slots */}
            <BookingClient
              slotsByDay={Object.fromEntries(
                Object.entries(slotsByDay).map(([k, v]) => [k, v.map((s) => ({ start: s.start.toISOString(), end: s.end.toISOString() }))])
              )}
              density={density}
              timezone={detectTimezone()}
              service={service}
              orgSlug={orgSlug}
              staffTimezone={staffTimezone}
            />
          </div>

          {/* Sidebar summary */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="card p-5">
              <h3 className="font-display font-semibold mb-4">Booking summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-mute">Service</span>
                  <span className="font-medium">{service.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-mute">Duration</span>
                  <span className="tabular">{service.duration_minutes} min</span>
                </div>
                {service.price_cents > 0 && (
                  <div className="flex justify-between">
                    <span className="text-mute">Price</span>
                    <span className="tabular font-semibold text-brass">
                      {formatCurrency(service.price_cents, service.currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-mute">Methods</span>
                  <span className="flex gap-1">
                    {service.meeting_methods.map((m) => (
                      <span key={m}>{methodIcons[m]}</span>
                    ))}
                  </span>
                </div>
              </div>
              <hr className="hairline my-4" />
              <p className="text-xs text-mute">
                Select a time slot to continue. You can reschedule or cancel later with a link sent to your email.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-hairline mt-auto">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center text-sm text-mute">
          Powered by <span className="font-semibold text-teal">Meridian</span>
        </div>
      </footer>
    </div>
  );
}
