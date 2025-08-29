// src/server/rpc/request_booking.ts
"use server";

import { z } from "zod";
import { getServerClient } from "@/lib/supabase/client";

const schema = z.object({
  rideId: z.string().uuid(),
  passengers: z.number().int().min(1).max(10).default(1),
  message: z.string().max(2000).optional(),
});

export async function requestBooking(input: z.infer<typeof schema>) {
  const { rideId, passengers, message } = schema.parse(input);
  const supabase = getServerClient();

  const { data, error } = await supabase.rpc("request_booking", {
    p_ride_id: rideId,
    p_passengers: passengers,
    p_message: message ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }
  return data;
}
