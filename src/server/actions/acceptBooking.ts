"use server";

import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({ bookingId: z.string().uuid() });

export async function acceptBookingAction(input: unknown) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT", details: parsed.error.flatten() };
  }
  const { bookingId } = parsed.data;

  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .rpc("accept_booking", { p_booking_id: bookingId });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, booking: data };
}
