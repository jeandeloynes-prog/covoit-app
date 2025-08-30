"use server";

import { prisma } from "./_shared";
import type { ActionResult } from "./_shared";
import type { Prisma } from "@prisma/client";

// On accepte deux formes d'input pour éviter de modifier l'UI:
// - { bookingId: string, reason?: string | null }
// - { booking_id: string, reason?: string | null }
type RejectInputCamel = { bookingId: string; reason?: string | null };
type RejectInputSnake = { booking_id: string; reason?: string | null };
type RejectInput = RejectInputCamel | RejectInputSnake;

function getBookingId(input: RejectInput): string {
  return "bookingId" in input ? input.bookingId : input.booking_id;
}

/**
 * Rejette une réservation et remet les sièges à disposition.
 */
export async function rejectBookingAction(
  input: RejectInput
): Promise<
  ActionResult<{
    booking_id: string;
    status: "rejected";
    rejected_at: string;
  }>
> {
  try {
    const booking_id = getBookingId(input);
    const reason = "reason" in input ? input.reason ?? null : null;

    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const booking = await tx.booking.findUnique({
          where: { id: booking_id },
          select: {
            id: true,
            status: true,
            seats: true,
            tripId: true,
          },
        });

        if (!booking) {
          throw new Error("BOOKING_NOT_FOUND");
        }
        if (booking.status !== "pending") {
          throw new Error("BOOKING_NOT_PENDING");
        }

        // Exemple: libérer des sièges (à adapter selon ton schéma)
        // await tx.trip.update({
        //   where: { id: booking.tripId },
        //   data: { seatsAvailable: { increment: booking.seats } },
        // });

        const updated = await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: "rejected",
            // reason: reason, // décommente si tu as ce champ
            // rejectedAt: new Date(), // décommente si champ dédié
          },
          select: { id: true, updatedAt: true },
        });

        return {
          booking_id: updated.id,
          rejected_at: new Date(updated.updatedAt).toISOString(),
        };
      }
    );

    return {
      ok: true,
      data: {
        booking_id: result.booking_id,
        status: "rejected",
        rejected_at: result.rejected_at,
      },
    };
  } catch (e: any) {
    console.error(e);
    const code =
      typeof e?.message === "string" ? e.message : "REJECT_BOOKING_FAILED";
    const human =
      code === "BOOKING_NOT_FOUND"
        ? "Réservation introuvable."
        : code === "BOOKING_NOT_PENDING"
        ? "La réservation n'est pas en statut pending."
        : "Impossible de rejeter la réservation.";
    return { ok: false, error: human };
  }
}
