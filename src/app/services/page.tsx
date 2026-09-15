import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { Clock, Plus, Edit, Trash2, Globe, Mail, Phone, MapPin, Video, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, EmptyState } from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function ServicesPage() {
  const sb = await createServerClient();
  if (!sb) redirect("/login");

  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await sb
    .from("organization_members")
    .select("org_id")
    .eq("user_id", user.id)
    .eq("is_active", true);

  if (!memberships || memberships.length === 0) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-display font-semibold mb-2">No organization</h1>
          <p className="text-mute">You are not a member of any organization yet.</p>
        </div>
      </div>
    );
  }

  const orgId = memberships[0].org_id;

  const { data: services } = await sb
    .from("meridian_services")
    .select("*")
    .eq("org_id", orgId)
    .order("sort_order");

  const { data: categories } = await sb
    .from("meridian_service_categories")
    .select("*")
    .eq("org_id", orgId)
    .order("sort_order");

  return (
    <div className="min-h-screen bg-paper">
      {/* Top bar */}
      <header className="border-b border-hairline bg-surface sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-teal flex items-center justify-center">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg">Services</span>
          </div>
          <Link href="/services/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              New service
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {services && services.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((s: { id: string; name: string; description: string | null; duration_minutes: number; price_cents: number; meeting_methods: string[]; is_published: boolean }) => (
              <Card key={s.id} hover>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-display font-semibold">{s.name}</h3>
                  </div>
                  <Badge variant={s.is_published ? "confirmed" : "pending"}>
                    {s.is_published ? "Published" : "Draft"}
                  </Badge>
                </div>
                {s.description && (
                  <p className="text-sm text-mute mb-3 line-clamp-2">{s.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-mute mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {s.duration_minutes} min
                  </span>
                  {s.price_cents > 0 && (
                    <span className="tabular font-medium text-brass">
                      ${(s.price_cents / 100).toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 mb-3">
                  {s.meeting_methods.map((m) => (
                    <span key={m} className="text-mute">
                      {m === "video" && <Video className="h-3.5 w-3.5" />}
                      {m === "phone" && <Phone className="h-3.5 w-3.5" />}
                      {m === "in_person" && <MapPin className="h-3.5 w-3.5" />}
                      {m === "audio" && <Phone className="h-3.5 w-3.5" />}
                      {m === "online_meeting" && <Video className="h-3.5 w-3.5" />}
                      {m === "custom" && <Globe className="h-3.5 w-3.5" />}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Link href={`/services/${s.id}/edit`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Edit className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </Link>
                  <form action={deleteService} className="flex-1">
                    <input type="hidden" name="id" value={s.id} />
                    <Button variant="ghost" size="sm" className="w-full text-stop hover:text-stop">
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </form>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No services yet"
            description="Create your first service to start accepting bookings."
            action={
              <Link href="/services/new">
                <Button>
                  <Plus className="h-4 w-4" />
                  Create service
                </Button>
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}

async function deleteService(formData: FormData) {
  "use server";
  const sb = createAdminClient();
  if (!sb) redirect("/login");

  const id = formData.get("id") as string;
  await sb.from("meridian_services").delete().eq("id", id);

  revalidatePath("/services");
  redirect("/services");
}
