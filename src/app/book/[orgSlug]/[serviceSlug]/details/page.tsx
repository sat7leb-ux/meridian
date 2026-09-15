import { createPublicClient } from "@/lib/supabase/public";
import { formatTime, formatDate, formatCurrency, cn } from "@/lib/utils";
import type { Service, Staff, BookingFormField } from "@/lib/types";
import { Clock, Globe, Phone, Video, MapPin, CheckCircle2, ArrowRight, ChevronLeft, User, Calendar } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Textarea, Select } from "@/components/ui/input";
import { createBooking } from "@/lib/actions/booking";

interface PageProps {
  params: Promise<{ orgSlug: string; serviceSlug: string }>;
  searchParams: Promise<{ slot?: string; tz?: string }>;
}

async function getBookingData(orgSlug: string, serviceSlug: string) {
  const sb = createPublicClient();
  if (!sb) return null;

  const { data: org } = await sb
    .from("meridian_organizations")
    .select("*")
    .eq("slug", orgSlug)
    .eq("is_active", true)
    .single();

  if (!org) return null;

  const { data: service } = await sb
    .from("meridian_services")
    .select("*")
    .eq("org_id", org.id)
    .eq("slug", serviceSlug)
    .eq("is_published", true)
    .eq("is_active", true)
    .single();

  if (!service) return null;

  const { data: staffList } = await sb
    .from("meridian_staff")
    .select("*")
    .eq("org_id", org.id)
    .eq("is_active", true)
    .eq("is_bookable", true)
    .order("display_name");

  const { data: serviceStaff } = await sb
    .from("meridian_service_staff")
    .select("staff_id")
    .eq("service_id", service.id);

  const assignedStaffIds = (serviceStaff ?? []).map((ss: { staff_id: string }) => ss.staff_id);
  const assignedStaff = (staffList ?? []).filter((s: Staff) => assignedStaffIds.includes(s.id));

  // Get booking form fields
  let formFields: BookingFormField[] = [];
  if (service.form_id) {
    const { data: fields } = await sb
      .from("booking_form_fields")
      .select("*")
      .eq("form_id", service.form_id)
      .order("sort_order");
    formFields = (fields ?? []) as BookingFormField[];
  }

  return {
    org,
    service: service as Service,
    staff: assignedStaff as Staff[],
    formFields,
  };
}

export default async function BookingDetailsPage({ params, searchParams }: PageProps) {
  const { orgSlug, serviceSlug } = await params;
  const { slot, tz } = await searchParams;
  const data = await getBookingData(orgSlug, serviceSlug);

  if (!data || !slot) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-display font-semibold mb-2">Invalid booking</h1>
          <p className="text-mute">Please select a time slot first.</p>
        </div>
      </div>
    );
  }

  const { org, service, staff, formFields } = data;
  const slotStart = new Date(slot);
  const slotEnd = new Date(slotStart.getTime() + service.duration_minutes * 60000);
  const timezone = tz || org.timezone;

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
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/book/${orgSlug}/${serviceSlug}`} className="flex items-center gap-3">
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
            {timezone}
          </Badge>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link href={`/book/${orgSlug}/${serviceSlug}`} className="inline-flex items-center gap-1 text-sm text-mute hover:text-teal mb-6">
          <ChevronLeft className="h-4 w-4" />
          Back to calendar
        </Link>

        <div className="grid lg:grid-cols-[1fr_280px] gap-8">
          {/* Form */}
          <div>
            <h1 className="text-2xl font-display font-bold mb-2">Your details</h1>
            <p className="text-mute mb-6">Fill in your information to confirm the booking.</p>

            <form action={createBooking} className="space-y-4">
              <input type="hidden" name="org_id" value={org.id} />
              <input type="hidden" name="service_id" value={service.id} />
              <input type="hidden" name="staff_id" value={staff[0]?.id ?? ""} />
              <input type="hidden" name="starts_at" value={slotStart.toISOString()} />
              <input type="hidden" name="ends_at" value={slotEnd.toISOString()} />
              <input type="hidden" name="timezone" value={timezone} />
              <input type="hidden" name="duration_minutes" value={service.duration_minutes} />

              {/* System fields */}
              <Field name="name" label="Full Name" placeholder="John Doe" required />
              <Field name="email" label="Email Address" type="email" placeholder="john@example.com" required />
              <Field name="phone" label="Phone Number" type="tel" placeholder="+1 555 000 0000" />

              {/* Custom form fields */}
              {formFields.filter((f) => !f.is_system).map((field) => (
                <div key={field.id}>
                  {field.type === "textarea" ? (
                    <Textarea
                      name={field.key}
                      label={field.label}
                      placeholder={field.placeholder ?? undefined}
                      required={field.is_required}
                    />
                  ) : field.type === "select" && field.options ? (
                    <Select
                      name={field.key}
                      label={field.label}
                      options={field.options}
                      required={field.is_required}
                    />
                  ) : (
                    <Field
                      name={field.key}
                      label={field.label}
                      type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : field.type === "number" ? "number" : "text"}
                      placeholder={field.placeholder ?? undefined}
                      required={field.is_required}
                    />
                  )}
                </div>
              ))}

              <Field name="notes" label="Notes (optional)" placeholder="Anything we should know?" />

              <Button type="submit" className="w-full" size="lg">
                Confirm booking <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </div>

          {/* Summary sidebar */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="card p-5">
              <h3 className="font-display font-semibold mb-4">Booking summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-mute">Service</span>
                  <span className="font-medium">{service.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-mute">Date</span>
                  <span className="font-medium">{formatDate(slotStart, timezone)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-mute">Time</span>
                  <span className="tabular font-medium">{formatTime(slotStart, timezone)}</span>
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
              <div className="flex items-start gap-2 text-xs text-mute">
                <CheckCircle2 className="h-4 w-4 text-ok shrink-0 mt-0.5" />
                <span>You will receive a confirmation email with a link to reschedule or cancel.</span>
              </div>
            </div>
          </div>
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
