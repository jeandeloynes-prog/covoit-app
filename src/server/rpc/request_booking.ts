// src/server/rpc/request_booking.ts

export type RequestBookingInput = {
  rideId: string;
  userId: string;
};

export type RequestBookingResult = {
  ok: boolean;
  bookingId?: string;
  error?: string;
};

/**
 * Stub côté serveur pour déverrouiller le build.
 * Remplace par l'appel Supabase/RPC réel quand prêt.
 */
export async function requestBooking(
  _input: RequestBookingInput
): Promise<RequestBookingResult> {
  // TODO: intégrer insertion Supabase ou RPC
  return { ok: true };
}
