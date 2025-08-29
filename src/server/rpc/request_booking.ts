// src/server/rpc/request_booking.ts

export type RequestBookingInput = {
  rideId: string;
  passengers: number;
  message?: string;
  /**
   * Optionnel: si tu veux passer l'userId depuis le serveur (ex: via cookies).
   * Sinon on pourra le déduire côté serveur via la session Supabase.
   */
  userId?: string;
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
  // Exemple: validation minimale (garde le build safe)
  if (!_input.rideId || !Number.isFinite(_input.passengers) || _input.passengers <= 0) {
    return { ok: false, error: "Invalid input" };
  }

  // TODO: intégrer l'insertion Supabase ou un RPC.
  // Retourne un bookingId factice pour l’instant.
  return { ok: true, bookingId: "stub-booking-id" };
}
