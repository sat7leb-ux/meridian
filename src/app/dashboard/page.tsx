import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Clock, Calendar, Users, Settings, LogOut, BarChart3, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard, Card, EmptyState } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function DashboardPage() {
  const sb = await createServerClient();
  if (!sb) {
    redirect("/login");
  }

  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Get user's organizations
  const { data: memberships } = await sb
    .from("organization_members")
    .select("org_id, roles(name, permissions)")
    .eq("user_id", user.id)
    .eq("is_active", true);

  if (!memberships || memberships.length === 0) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-display font-semibold mb-2">No organization</h1>
          <p className="text-mute mb-4">You are not a member of any organization yet.</p>
          <Link href="/book/demo">
            <Button>Try the demo</Button>
          </Link>
        </div>
      </div>
    );
  }

  const orgId = memberships[0].org_id;

  // Get org data
  const { data: org } = await sb
    .from("meridian_organizations")
    .select("*")
    .eq("id", orgId)
    .single();

  // Get stats
  const { data: bookings } = await sb
    .from("meridian_bookings")
    .select("*, meridian_services(name), meridian_staff(display_name), meridian_customers(full_name, email)")
    .eq("org_id", orgId)
    .order("starts_at", { ascending: false })
    .limit(10);

  const { data: services } = await sb
    .from("meridian_services")
    .select("*")
    .eq("org_id", orgId)
    .eq("is_active", true);

  const { data: customers } = await sb
    .from("meridian_customers")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(5);

  const totalBookings = bookings?.length ?? 0;
  const upcomingBookings = bookings?.filter((b: { starts_at: string; status: string }) => new Date(b.starts_at) > new Date() && b.status !== "cancelled").length ?? 0;
  const totalServices = services?.length ?? 0;
  const totalCustomers = customers?.length ?? 0;

  return (
    <div className="min-h-screen bg-paper">
      {/* Top bar */}
      <header className="border-b border-hairline bg-surface sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-teal flex items-center justify-center">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg">{org?.name ?? "Dashboard"}</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-mute">
              <Globe className="h-3 w-3 mr-1" />
              {org?.timezone ?? "UTC"}
            </Badge>
            <form action="/api/auth/signout" method="post">
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total bookings" value={totalBookings} icon={<Calendar className="h-4 w-4" />} />
          <StatCard label="Upcoming" value={upcomingBookings} icon={<Clock className="h-4 w-4" />} />
          <StatCard label="Services" value={totalServices} icon={<BarChart3 className="h-4 w-4" />} />
          <StatCard label="Customers" value={totalCustomers} icon={<Users className="h-4 w-4" />} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent bookings */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-lg">Recent bookings</h2>
              <Link href="/appointments" className="text-sm text-teal hover:underline">
                View all
              </Link>
            </div>
            {bookings && bookings.length > 0 ? (
              <div className="space-y-3">
                {bookings.slice(0, 5).map((b: { id: string; meridian_customers: { full_name: string } | null; meridian_services: { name: string } | null; starts_at: string; status: string }) => (
                  <div key={b.id} className="flex items-center justify-between py-2 border-b border-hairline last:border-0">
                    <div>
                      <p className="font-medium text-sm">{b.meridian_customers?.full_name ?? "Unknown"}</p>
                      <p className="text-xs text-mute">{b.meridian_services?.name ?? "Unknown service"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm tabular">{new Date(b.starts_at).toLocaleDateString()}</p>
                      <Badge variant={b.status === "confirmed" ? "confirmed" : b.status === "cancelled" ? "cancelled" : "pending"}>
                        {b.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No bookings yet"
                description="Bookings will appear here once customers start scheduling."
              />
            )}
          </Card>

          {/* Services */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-lg">Services</h2>
              <Link href="/services" className="text-sm text-teal hover:underline">
                Manage
              </Link>
            </div>
            {services && services.length > 0 ? (
              <div className="space-y-3">
                {services.slice(0, 5).map((s: { id: string; name: string; duration_minutes: number; price_cents: number; is_published: boolean }) => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b border-hairline last:border-0">
                    <div>
                      <p className="font-medium text-sm">{s.name}</p>
                      <p className="text-xs text-mute">{s.duration_minutes} min · {s.price_cents > 0 ? `$${(s.price_cents / 100).toFixed(2)}` : "Free"}</p>
                    </div>
                    <Badge variant={s.is_published ? "confirmed" : "pending"}>
                      {s.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No services yet"
                description="Create your first service to start accepting bookings."
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
