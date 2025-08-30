"use server";

import { prisma, getCurrentUserId } from "./_shared";
import type { ActionResult, ActionErrorCode } from "./_shared";

/**
 * Accepte une réservation en s'assurant:
 * - que le driver est propriétaire du trip,
 * - que la réservation est "pending",
 * - qu'il reste assez de places,
 * - que tout se fait de manière atomique.
 */
export async function acceptBookingAction(input: {
  bookingId: string;
}): Promise<ActionResult<{ bookingId: string }>> {
  const { bookingId } = input;

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { ok: false, error: "Utilisateur non authentifié.", code: "NOT_OWNER" };
    }

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        select: {
          id: true,
          status: true,
          seats: true,
          tripId: true,
          trip: { select: { id: true, driverId: true, seatsAvailable: true } },
        },
      });

      if (!booking) {
        return fail("BOOKING_NOT_FOUND", "Réservation introuvable.");
      }

      if (booking.trip?.driverId !== userId) {
        return fail("NOT_OWNER", "Vous n’êtes pas le conducteur de ce trajet.");
      }

      if (booking.status === "accepted") {
        return fail("ALREADY_ACCEPTED", "Réservation déjà acceptée.");
      }
      if (booking.status === "rejected") {
        return fail("ALREADY_REJECTED", "Réservation déjà refusée.");
      }
      if (booking.status !== "pending") {
        return fail("BOOKING_NOT_PENDING", "Réservation non en attente.");
      }

      const seatsLeft = booking.trip?.seatsAvailable ?? 0;
      if (seatsLeft < booking.seats) {
        return fail("TRIP_FULL", "Plus de places disponibles.");
      }

      // Mise à jour atomique: décrémente les places et passe la réservation à "accepted"
      const updatedTrip = await tx.trip.update({
        where: { id: booking.tripId, seatsAvailable: seatsLeft },
        data: { seatsAvailable: { decrement: booking.seats } },
      });

      if (!updatedTrip) {
        return fail("CONCURRENCY_CONFLICT", "Conflit de concurrence.");
      }

      const updatedBooking = await tx.booking.update({
        where: { id: bookingId, status: "pending" },
        data: { status: "accepted" },
      });

      return { ok: true as const, data: { bookingId: updatedBooking.id } };
    });

    return result;
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Erreur serveur.", code: "UNKNOWN" };
  }
}

function fail(code: ActionErrorCode, error: string): ActionResult<never> {
  return { ok: false, error, code };
}
