"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function rejectBookingAction(input: { bookingId: string }) {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .rpc("reject_booking", { p_booking_id: input.bookingId });

  if (error) {
    const code =
      error.message === "FORBIDDEN_OR_NOT_PENDING"
        ? "FORBIDDEN_OR_NOT_PENDING"
        : "UNKNOWN";
    return { ok: false as const, error: code };
  }

  return { ok: true as const, booking: data };
}
