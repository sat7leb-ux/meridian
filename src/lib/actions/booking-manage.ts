"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function cancelBooking(formData: FormData) {
  const sb = createAdminClient();
  if (!sb) redirect("/");

  const bookingId = formData.get("booking_id") as string;
  const token = formData.get("token") as string;

  const { error } = await sb
    .from("meridian_bookings")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by: "customer",
    })
    .eq("id", bookingId);

  if (error) {
    console.error("Cancel error:", error);
  }

  revalidatePath(`/b/${token}`);
  redirect(`/b/${token}`);
}

export async function rescheduleBooking(formData: FormData) {
  const sb = createAdminClient();
  if (!sb) redirect("/");

  const bookingId = formData.get("booking_id") as string;
  const token = formData.get("token") as string;
  const newStartsAt = formData.get("new_starts_at") as string;

  if (!newStartsAt) {
    redirect(`/b/${token}`);
  }

  // Get the booking to calculate the new end time
  const { data: booking } = await sb
    .from("meridian_bookings")
    .select("duration_minutes, meridian_services(buffer_before_minutes, buffer_after_minutes)")
    .eq("id", bookingId)
    .single();

  if (!booking) {
    redirect(`/b/${token}`);
  }

  const startsAt = new Date(newStartsAt);
  const endsAt = new Date(startsAt.getTime() + booking.duration_minutes * 60000);
  const bufferBefore = booking.meridian_services?.buffer_before_minutes ?? 0;
  const bufferAfter = booking.meridian_services?.buffer_after_minutes ?? 0;

  const { error } = await sb
    .from("meridian_bookings")
    .update({
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      period: `[${new Date(startsAt.getTime() - bufferBefore * 60000).toISOString()}, ${new Date(endsAt.getTime() + bufferAfter * 60000).toISOString()})`,
      status: "confirmed",
    })
    .eq("id", bookingId);

  if (error) {
    console.error("Reschedule error:", error);
  }

  revalidatePath(`/b/${token}`);
  redirect(`/b/${token}`);
}
