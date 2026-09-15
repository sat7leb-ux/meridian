import { createPublicClient } from "@/lib/supabase/public";
import { getAvailableSlots, groupSlotsByDay } from "@/lib/scheduling/availability";
import { formatTime, formatDate, formatCurrency, cn, detectTimezone } from "@/lib/utils";
import type { Service, Staff, Schedule, AvailabilityRule } from "@/lib/types";
import { Clock, Globe, Phone, Video, MapPin, CheckCircle2, ArrowRight, ChevronLeft, ChevronRight, User, Calendar, Shield, Zap, BarChart3 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeroBooker } from "@/components/hero-booker";

async function getDemoData() {
  const sb = createPublicClient();
  if (!sb) return null;

  const { data: org } = await sb
    .from("organizations")
    .select("*")
    .eq("slug", "demo")
    .eq("is_active", true)
    .single();

  if (!org) return null;

  const { data: services } = await sb
    .from("services")
    .select("*, service_categories(name)")
    .eq("org_id", org.id)
    .eq("is_published", true)
    .eq("is_active", true)
    .order("sort_order");

  const { data: staff } = await sb
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

  return {
    org,
    services: (services ?? []) as (Service & { service_categories: { name: string } | null })[],
    staff: (staff ?? []) as Staff[],
    schedules: (schedules ?? []) as (Schedule & { availability_rules: AvailabilityRule[] })[],
  };
}

export default async function LandingPage() {
  const data = await getDemoData();

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="border-b border-hairline bg-surface/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-teal flex items-center justify-center">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl">Meridian</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#features" className="text-mute hover:text-teal transition-colors">Features</a>
            <a href="#how-it-works" className="text-mute hover:text-teal transition-colors">How it works</a>
            <a href="#pricing" className="text-mute hover:text-teal transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/book/demo">
              <Button size="sm">Book a demo</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal/5 via-paper to-brass/5" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="mb-4">
                <Zap className="h-3 w-3 mr-1" />
                Scheduling that treats time correctly
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight">
                Book a time that works for{" "}
                <span className="text-teal">everyone</span>
              </h1>
              <p className="text-lg text-mute mb-8 max-w-lg">
                The scheduling platform with timezone-safe precision, database-level double-booking prevention, and tokenised reschedule links. No account needed for your customers.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/book/demo">
                  <Button size="lg">
                    Try live demo <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" size="lg">See features</Button>
                </Link>
              </div>
            </div>
            <div className="lg:pl-8">
              {data && <HeroBooker data={data} />}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 md:py-24 bg-surface">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Everything you need for scheduling
            </h2>
            <p className="text-mute max-w-2xl mx-auto">
              Built for businesses that take time seriously. No double bookings, no timezone confusion, no lost customers.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Globe className="h-6 w-6" />,
                title: "Timezone-safe",
                desc: "Every booking is stored in UTC and displayed in the customer's local timezone. DST changes are handled correctly.",
              },
              {
                icon: <Shield className="h-6 w-6" />,
                title: "No double bookings",
                desc: "Database-level exclusion constraints guarantee two bookings can never overlap. Not just app-level checks.",
              },
              {
                icon: <Zap className="h-6 w-6" />,
                title: "Tokenised links",
                desc: "Customers reschedule and cancel with a secure link in their email. No account required, ever.",
              },
              {
                icon: <Phone className="h-6 w-6" />,
                title: "Call-first booking",
                desc: "Phone, video, audio, in-person — each service configures its own meeting methods and instructions.",
              },
              {
                icon: <Calendar className="h-6 w-6" />,
                title: "Smart availability",
                desc: "Working hours, breaks, holidays, buffers, minimum notice, daily limits — all configurable per service.",
              },
              {
                icon: <BarChart3 className="h-6 w-6" />,
                title: "Analytics built-in",
                desc: "Dashboard with booking trends, no-show rates, and customer history. No third-party tools needed.",
              },
            ].map((f) => (
              <div key={f.title} className="card p-6">
                <div className="h-12 w-12 rounded-lg bg-teal/10 flex items-center justify-center text-teal mb-4">
                  {f.icon}
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-mute">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              How it works
            </h2>
            <p className="text-mute max-w-2xl mx-auto">
              Three steps to a confirmed booking. No accounts, no friction.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Pick a service", desc: "Choose from your published services with clear descriptions, durations, and prices." },
              { step: "02", title: "Select a time", desc: "Browse the calendar with availability density dots. Pick a slot in your own timezone." },
              { step: "03", title: "Confirm & done", desc: "Fill in your details and confirm. Get a tokenised link to reschedule or cancel anytime." },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="text-5xl font-display font-bold text-teal/20 mb-4">{s.step}</div>
                <h3 className="font-display font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-mute">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section id="pricing" className="py-16 md:py-24 bg-surface">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-mute max-w-2xl mx-auto">
              Start free. Scale as you grow. No per-seat charges for receptionists.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { name: "Starter", price: "$0", period: "/mo", features: ["1 staff member", "3 services", "Unlimited bookings", "Email notifications"] },
              { name: "Pro", price: "$29", period: "/mo", features: ["10 staff members", "Unlimited services", "Custom forms", "Calendar sync", "Priority support"] },
              { name: "Enterprise", price: "Custom", period: "", features: ["Unlimited everything", "Custom domain", "SSO & audit log", "Dedicated support", "SLA"] },
            ].map((p) => (
              <div key={p.name} className="card p-6">
                <h3 className="font-display font-semibold text-lg mb-1">{p.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-display font-bold">{p.price}</span>
                  <span className="text-mute">{p.period}</span>
                </div>
                <ul className="space-y-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-ok shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Ready to stop double-booking?
          </h2>
          <p className="text-mute mb-8">
            Try the live demo or sign up for free. Your first booking link is ready in under three minutes.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/book/demo">
              <Button size="lg">Try live demo <ArrowRight className="h-4 w-4" /></Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="lg">Create free account</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-hairline bg-surface">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-teal flex items-center justify-center">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <span className="font-display font-bold">Meridian</span>
            </div>
            <p className="text-sm text-mute">
              Scheduling that treats time correctly.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
