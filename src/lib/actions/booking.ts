"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { generateToken, hashToken } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

interface BookingFormData {
  org_id: string;
  service_id: string;
  staff_id: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
  duration_minutes: string;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
}

export async function createBooking(formData: FormData) {
  const sb = createAdminClient();
  if (!sb) {
    redirect("/book/demo/strategy-call?error=Database not configured");
  }

  const data: BookingFormData = {
    org_id: formData.get("org_id") as string,
    service_id: formData.get("service_id") as string,
    staff_id: formData.get("staff_id") as string,
    starts_at: formData.get("starts_at") as string,
    ends_at: formData.get("ends_at") as string,
    timezone: formData.get("timezone") as string,
    duration_minutes: formData.get("duration_minutes") as string,
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string | undefined,
    notes: formData.get("notes") as string | undefined,
  };

  // Get service details for price and buffers
  const { data: service } = await sb
    .from("services")
    .select("*")
    .eq("id", data.service_id)
    .single();

  if (!service) {
    redirect("/book/demo/strategy-call?error=Service not found");
  }

  // Check for existing customer or create new one
  let customerId: string;
  const { data: existingCustomer } = await sb
    .from("customers")
    .select("id")
    .eq("org_id", data.org_id)
    .eq("email", data.email.toLowerCase())
    .single();

  if (existingCustomer) {
    customerId = existingCustomer.id;
  } else {
    const { data: newCustomer } = await sb
      .from("customers")
      .insert({
        org_id: data.org_id,
        full_name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone || null,
        timezone: data.timezone,
      })
      .select("id")
      .single();
    customerId = newCustomer!.id;
  }

  // Generate access token
  const accessToken = generateToken();
  const tokenHash = await hashToken(accessToken);

  // Create booking
  const startsAt = new Date(data.starts_at);
  const endsAt = new Date(data.ends_at);
  const bufferBefore = service.buffer_before_minutes ?? 0;
  const bufferAfter = service.buffer_after_minutes ?? 0;

  const { data: booking, error } = await sb
    .from("bookings")
    .insert({
      org_id: data.org_id,
      service_id: data.service_id,
      staff_id: data.staff_id,
      customer_id: customerId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      period: `[${new Date(startsAt.getTime() - bufferBefore * 60000).toISOString()}, ${new Date(endsAt.getTime() + bufferAfter * 60000).toISOString()})`,
      duration_minutes: parseInt(data.duration_minutes),
      customer_timezone: data.timezone,
      staff_timezone: service.timezone ?? "UTC",
      status: "confirmed",
      meeting_method: service.default_method,
      price_cents: service.price_cents,
      currency: service.currency,
      access_token_hash: tokenHash,
      title: service.name,
      customer_note: data.notes || null,
      source: "public",
    })
    .select("*, services(name), staff(display_name)")
    .single();

  if (error) {
    console.error("Booking error:", error);
    redirect(`/book/demo/strategy-call?error=${encodeURIComponent(error.message)}`);
  }

  // Redirect to confirmation page
  redirect(`/b/${accessToken}?confirmed=true`);
}
