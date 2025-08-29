// src/app/actions/request-seat.ts
"use server";

import { getSupabaseServerClient } from "@/lib/supabase";
import { requestBooking } from "@/server/rpc/request_booking";

export async function requestSeat(formData: FormData) {
  const rideId = String(formData.get("ride_id") || "");
  const passengers = Number(formData.get("passengers") || 0);
  const message = String(formData.get("message") || "");

  const supabase = getSupabaseServerClient();

  // Exemple: lire l’utilisateur
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const res = await requestBooking({
    rideId,
    passengers,
    ...(message ? { message } : {}),
    ...(user?.id ? { userId: user.id } : {})
  });

  return res;
}
