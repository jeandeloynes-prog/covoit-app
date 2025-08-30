"use server";

import { prisma, getCurrentUserId } from "./_shared";
import type { ActionResult, ActionErrorCode } from "./_shared";

/**
 * Refuse une réservation en s'assurant:
 * - ownership du driver,
 * - statut "pending",
 * - idempotence (déjà refusée/acceptée renvoie un code clair).
 */
export async function rejectBookingAction(input: {
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
          trip: { select: { id: true, driverId: true } },
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

      const updatedBooking = await tx.booking.update({
        where: { id: bookingId, status: "pending" },
        data: { status: "rejected" },
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
