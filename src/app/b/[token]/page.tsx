import { createPublicClient } from "@/lib/supabase/public";
import { formatTime, formatDate, formatCurrency, hashToken } from "@/lib/utils";
import type { Booking } from "@/lib/types";
import { Clock, Globe, Phone, Video, MapPin, CheckCircle2, Calendar, ExternalLink, Copy, Download } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ confirmed?: string }>;
}

async function getBookingByToken(token: string) {
  const sb = createPublicClient();
  if (!sb) return null;

  // Hash the token and look up the booking
  const tokenHash = await hashToken(token);
  const { data: booking } = await sb
    .from("bookings")
    .select("*, services(name, description, meeting_instructions), staff(display_name, title, email, phone)")
    .eq("access_token_hash", tokenHash)
    .single();

  return booking as (Booking & {
    services: { name: string; description: string | null; meeting_instructions: string | null };
    staff: { display_name: string; title: string | null; email: string | null; phone: string | null };
  }) | null;
}

export default async function BookingConfirmationPage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const { confirmed } = await searchParams;
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
        {confirmed === "true" && (
          <div className="card p-6 mb-6 border-ok/30 bg-ok/5">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="h-8 w-8 text-ok shrink-0" />
              <div>
                <h1 className="text-xl font-display font-bold text-ok mb-1">Booking confirmed!</h1>
                <p className="text-sm text-mute">
                  A confirmation email has been sent to your email address with all the details.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="card p-6 mb-6">
          <h1 className="text-2xl font-display font-bold mb-2">{booking.services.name}</h1>
          {booking.services.description && (
            <p className="text-mute mb-4">{booking.services.description}</p>
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

          {booking.staff && (
            <div className="border-t border-hairline pt-4 mb-4">
              <p className="text-sm text-mute mb-2">Your host</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-teal/10 flex items-center justify-center">
                  <span className="text-teal font-medium">{booking.staff.display_name.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-medium">{booking.staff.display_name}</p>
                  {booking.staff.title && <p className="text-sm text-mute">{booking.staff.title}</p>}
                </div>
              </div>
            </div>
          )}

          {booking.services.meeting_instructions && (
            <div className="border-t border-hairline pt-4">
              <p className="text-sm text-mute mb-1">Instructions</p>
              <p className="text-sm">{booking.services.meeting_instructions}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <a href={`/book/demo/strategy-call`}>
              <Calendar className="h-4 w-4" />
              Book another
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={`/b/${token}`}>
              <ExternalLink className="h-4 w-4" />
              Manage booking
            </a>
          </Button>
        </div>
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
