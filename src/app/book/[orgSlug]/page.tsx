import { createPublicClient } from "@/lib/supabase/public";
import { getAvailableSlots, groupSlotsByDay, slotDensityByDay } from "@/lib/scheduling/availability";
import { detectTimezone, formatTime, formatDate, formatCurrency, cn } from "@/lib/utils";
import type { Service, Staff, Schedule, AvailabilityRule } from "@/lib/types";
import { Calendar, Clock, Globe, Phone, Video, MapPin, CheckCircle2, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: Promise<{ orgSlug: string }>;
}

async function getOrgData(orgSlug: string) {
  const sb = createPublicClient();
  if (!sb) return null;

  const { data: org } = await sb
    .from("meridian_organizations")
    .select("*")
    .eq("slug", orgSlug)
    .eq("is_active", true)
    .single();

  if (!org) return null;

  const { data: services } = await sb
    .from("meridian_services")
    .select("*")
    .eq("org_id", org.id)
    .eq("is_published", true)
    .eq("is_active", true)
    .order("sort_order");

  const { data: staff } = await sb
    .from("meridian_staff")
    .select("*")
    .eq("org_id", org.id)
    .eq("is_active", true)
    .eq("is_bookable", true)
    .order("display_name");

  const { data: schedules } = await sb
    .from("meridian_schedules")
    .select("*, meridian_availability_rules(*)")
    .eq("org_id", org.id);

  return {
    org,
    services: (services ?? []) as Service[],
    staff: (staff ?? []) as Staff[],
    schedules: (schedules ?? []) as (Schedule & { availability_rules: AvailabilityRule[] })[],
  };
}

export default async function BookingPage({ params }: PageProps) {
  const { orgSlug } = await params;
  const data = await getOrgData(orgSlug);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-display font-semibold mb-2">Organization not found</h1>
          <p className="text-mute">This booking link is invalid or has been deactivated.</p>
        </div>
      </div>
    );
  }

  const { org, services, staff, schedules } = data;

  // Group services by category
  const categories = services.reduce<Record<string, typeof services>>((acc, s) => {
    const cat = "Services";
    (acc[cat] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="border-b border-hairline bg-surface">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {org.logo_url ? (
              <img src={org.logo_url} alt={org.name} className="h-8 w-8 rounded" />
            ) : (
              <div className="h-8 w-8 rounded bg-teal flex items-center justify-center">
                <Clock className="h-4 w-4 text-white" />
              </div>
            )}
            <span className="font-display font-semibold text-lg">{org.name}</span>
          </div>
          <Badge variant="outline" className="text-mute">
            <Globe className="h-3 w-3 mr-1" />
            {org.timezone}
          </Badge>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Book a time that works for everyone
          </h1>
          <p className="text-lg text-mute max-w-2xl mx-auto">
            Select a service, choose your time, and we will handle the rest.
            No account needed — just pick a slot and confirm.
          </p>
        </div>

        {/* Services by category */}
        {Object.entries(categories).map(([category, categoryServices]) => (
          <div key={category} className="mb-10">
            <h2 className="text-xl font-display font-semibold mb-4">{category}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {categoryServices.map((service) => (
                <ServiceCard key={service.id} service={service} orgSlug={orgSlug} />
              ))}
            </div>
          </div>
        ))}

        {services.length === 0 && (
          <div className="text-center py-12 card">
            <Clock className="h-12 w-12 text-mute mx-auto mb-4" />
            <h2 className="text-xl font-display font-semibold mb-2">No services available</h2>
            <p className="text-mute">This organization has not published any booking services yet.</p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-hairline mt-auto">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center text-sm text-mute">
          Powered by <span className="font-semibold text-teal">Meridian</span> — scheduling that treats time correctly
        </div>
      </footer>
    </div>
  );
}

function ServiceCard({ service, orgSlug }: { service: Service; orgSlug: string }) {
  const methodIcons = {
    video: <Video className="h-4 w-4" />,
    phone: <Phone className="h-4 w-4" />,
    audio: <Phone className="h-4 w-4" />,
    online_meeting: <Video className="h-4 w-4" />,
    in_person: <MapPin className="h-4 w-4" />,
    custom: <Globe className="h-4 w-4" />,
  };

  return (
    <Link href={`/book/${orgSlug}/${service.slug}`}>
      <div className="card p-5 hover:border-teal transition-colors cursor-pointer group">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-display font-semibold text-lg group-hover:text-teal transition-colors">
              {service.name}
            </h3>
            {service.description && (
              <p className="text-sm text-mute mt-1">{service.description}</p>
            )}
          </div>
          {service.price_cents > 0 && (
            <span className="tabular font-semibold text-brass">
              {formatCurrency(service.price_cents, service.currency)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-mute">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {service.duration_minutes} min
          </span>
          <span className="flex items-center gap-1">
            {service.meeting_methods.map((m) => (
              <span key={m} className="inline-flex">
                {methodIcons[m]}
              </span>
            ))}
          </span>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm font-medium text-teal">
          Book now <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}
