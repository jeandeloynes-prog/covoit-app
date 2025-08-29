// src/server/rpc/request_booking.ts

export type RequestBookingInput = {
  rideId: string;
  passengers: number;
  message?: string | undefined;
  userId?: string | undefined;
};

export type RequestBookingResult = {
  ok: boolean;
  bookingId?: string;
  error?: string;
};

/**
 * Stub côté serveur pour débloquer le build.
 * Remplace par l'appel Supabase/RPC réel quand tu seras prêt.
 */
export async function requestBooking(
  _input: RequestBookingInput
): Promise<RequestBookingResult> {
  // Validation minimale
  if (
    !_input.rideId ||
    !Number.isFinite(_input.passengers) ||
    _input.passengers <= 0
  ) {
    return { ok: false, error: "Invalid input" };
  }

  // TODO: intégrer l'insertion Supabase ou un RPC réel.
  return { ok: true, bookingId: "stub-booking-id" };
}
