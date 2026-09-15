import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function POST() {
  const sb = await createServerClient();
  if (!sb) redirect("/login");

  const { error } = await sb.auth.signOut();

  if (error) {
    redirect("/login?error=Could not sign out");
  }

  revalidatePath("/", "layout");
  redirect("/login");
}
