// src/server/rpc/accept_booking.ts
"use server";

import { z } from "zod";
import { getServerClient } from "@/lib/supabase/client";

const schema = z.object({ bookingId: z.string().uuid() });

export async function acceptBooking(input: z.infer<typeof schema>) {
  const { bookingId } = schema.parse(input);
  const supabase = getServerClient();

  const { data, error } = await supabase.rpc("accept_booking", { p_booking_id: bookingId });

  if (error) {
    throw new Error(error.message);
  }
  return data;
}
