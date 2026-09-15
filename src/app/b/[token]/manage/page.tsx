import { createPublicClient } from "@/lib/supabase/public";
import { hashToken } from "@/lib/utils";
import { formatTime, formatDate, formatCurrency, cn } from "@/lib/utils";
import type { Booking, Service, Staff, Schedule, AvailabilityRule } from "@/lib/types";
import { Clock, Globe, Phone, Video, MapPin, CheckCircle2, XCircle, Calendar, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cancelBooking, rescheduleBooking } from "@/lib/actions/booking-manage";

interface PageProps {
  params: Promise<{ token: string }>;
}

async function getBookingByToken(token: string) {
  const sb = createPublicClient();
  if (!sb) return null;

  const tokenHash = await hashToken(token);
  const { data: booking } = await sb
    .from("meridian_bookings")
    .select("*, meridian_services(name, description, meeting_instructions, duration_minutes, price_cents, currency, buffer_before_minutes, buffer_after_minutes, slot_interval_minutes, minimum_notice_minutes, maximum_advance_days), meridian_staff(display_name, title, email, phone, timezone)")
    .eq("access_token_hash", tokenHash)
    .single();

  return booking as (Booking & {
    meridian_services: { name: string; description: string | null; meeting_instructions: string | null; duration_minutes: number; price_cents: number; currency: string; buffer_before_minutes: number; buffer_after_minutes: number; slot_interval_minutes: number; minimum_notice_minutes: number; maximum_advance_days: number };
    meridian_staff: { display_name: string; title: string | null; email: string | null; phone: string | null; timezone: string };
  }) | null;
}

export default async function ManageBookingPage({ params }: PageProps) {
  const { token } = await params;
  const booking = await getBookingByToken(token);

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-display font-semibold mb-2">Booking not found</h1>
          <p className="text-mute">This link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  const isCancelled = booking.status === "cancelled";
  const isCompleted = booking.status === "completed";

  const methodIcons = {
    video: <Video className="h-5 w-5" />,
    phone: <Phone className="h-5 w-5" />,
    audio: <Phone className="h-5 w-5" />,
    online_meeting: <Video className="h-5 w-5" />,
    in_person: <MapPin className="h-5 w-5" />,
    custom: <Globe className="h-5 w-5" />,
  };

  const statusLabels = {
    pending: "Pending",
    confirmed: "Confirmed",
    payment_pending: "Payment Pending",
    paid: "Paid",
    cancelled: "Cancelled",
    completed: "Completed",
    no_show: "No Show",
  };

  const statusVariants = {
    pending: "pending",
    confirmed: "confirmed",
    payment_pending: "pending",
    paid: "confirmed",
    cancelled: "cancelled",
    completed: "confirmed",
    no_show: "cancelled",
  } as const;

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="border-b border-hairline bg-surface">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-teal flex items-center justify-center">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <span className="font-display font-semibold text-lg">Meridian</span>
          </div>
          <Badge variant={statusVariants[booking.status] ?? "default"}>
            {statusLabels[booking.status] ?? booking.status}
          </Badge>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {isCancelled && (
          <div className="card p-6 mb-6 border-stop/30 bg-stop/5">
            <div className="flex items-start gap-4">
              <XCircle className="h-8 w-8 text-stop shrink-0" />
              <div>
                <h1 className="text-xl font-display font-bold text-stop mb-1">Booking cancelled</h1>
                <p className="text-sm text-mute">This booking has been cancelled.</p>
              </div>
            </div>
          </div>
        )}

        {isCompleted && (
          <div className="card p-6 mb-6 border-ok/30 bg-ok/5">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="h-8 w-8 text-ok shrink-0" />
              <div>
                <h1 className="text-xl font-display font-bold text-ok mb-1">Booking completed</h1>
                <p className="text-sm text-mute">This booking has been completed.</p>
              </div>
            </div>
          </div>
        )}

        <div className="card p-6 mb-6">
          <h1 className="text-2xl font-display font-bold mb-2">{booking.meridian_services.name}</h1>
          {booking.meridian_services.description && (
            <p className="text-mute mb-4">{booking.meridian_services.description}</p>
          )}

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-teal shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-mute">Date & Time</p>
                <p className="font-medium">{formatDate(booking.starts_at, booking.customer_timezone)}</p>
                <p className="tabular text-sm">{formatTime(booking.starts_at, booking.customer_timezone)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-teal shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-mute">Duration</p>
                <p className="tabular font-medium">{booking.duration_minutes} minutes</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-teal shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-mute">Timezone</p>
                <p className="font-medium">{booking.customer_timezone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-teal shrink-0 mt-0.5">{methodIcons[booking.meeting_method]}</div>
              <div>
                <p className="text-sm text-mute">Meeting method</p>
                <p className="font-medium capitalize">{booking.meeting_method.replace("_", " ")}</p>
              </div>
            </div>
          </div>

          {booking.meridian_staff && (
            <div className="border-t border-hairline pt-4 mb-4">
              <p className="text-sm text-mute mb-2">Your host</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-teal/10 flex items-center justify-center">
                  <span className="text-teal font-medium">{booking.meridian_staff.display_name.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-medium">{booking.meridian_staff.display_name}</p>
                  {booking.meridian_staff.title && <p className="text-sm text-mute">{booking.meridian_staff.title}</p>}
                </div>
              </div>
            </div>
          )}

          {booking.meridian_services.meeting_instructions && (
            <div className="border-t border-hairline pt-4">
              <p className="text-sm text-mute mb-1">Instructions</p>
              <p className="text-sm">{booking.meridian_services.meeting_instructions}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        {!isCancelled && !isCompleted && (
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="font-display font-semibold mb-3">Reschedule</h3>
              <p className="text-sm text-mute mb-4">Choose a new time for your booking.</p>
              <RescheduleForm bookingId={booking.id} token={token} />
            </div>

            <div className="card p-5 border-stop/20">
              <h3 className="font-display font-semibold text-stop mb-3">Cancel booking</h3>
              <p className="text-sm text-mute mb-4">This action cannot be undone.</p>
              <CancelForm bookingId={booking.id} token={token} />
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="flex gap-3">
            <Link href="/book/demo/strategy-call">
              <Button variant="outline">
                <Calendar className="h-4 w-4" />
                Book again
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-hairline mt-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 text-center text-sm text-mute">
          Powered by <span className="font-semibold text-teal">Meridian</span>
        </div>
      </footer>
    </div>
  );
}

function RescheduleForm({ bookingId, token }: { bookingId: string; token: string }) {
  return (
    <form action={rescheduleBooking} className="space-y-3">
      <input type="hidden" name="booking_id" value={bookingId} />
      <input type="hidden" name="token" value={token} />
      <div className="flex gap-2">
        <input
          type="datetime-local"
          name="new_starts_at"
          required
          className="flex-1 rounded-field border border-hairline bg-surface px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
        />
        <Button type="submit" variant="outline">
          Reschedule
        </Button>
      </div>
    </form>
  );
}

function CancelForm({ bookingId, token }: { bookingId: string; token: string }) {
  return (
    <form action={cancelBooking}>
      <input type="hidden" name="booking_id" value={bookingId} />
      <input type="hidden" name="token" value={token} />
      <Button type="submit" variant="danger" size="sm">
        <XCircle className="h-4 w-4" />
        Cancel this booking
      </Button>
    </form>
  );
}
