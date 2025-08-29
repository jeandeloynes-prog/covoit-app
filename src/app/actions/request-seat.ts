// src/app/actions/request-seat.ts
"use server";

import { requestBooking } from "@/server/rpc/request_booking";

export async function requestSeat(formData: FormData) {
  const rideId = String(formData.get("ride_id") || "");
  const passengers = Number(formData.get("passengers") || 1);
  const message = String(formData.get("message") || "");

  await requestBooking({ rideId, passengers, message: message || undefined });
}
