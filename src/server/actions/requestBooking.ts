"use server";

import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  tripId: z.string().uuid(),
  seats: z.number().int().min(1).max(10), // adapte la borne max à ton produit
});

export async function requestBookingAction(input: unknown) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT", details: parsed.error.flatten() };
  }
  const { tripId, seats } = parsed.data;

  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .rpc("request_booking", { p_trip_id: tripId, p_seats: seats });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, booking: data };
}
