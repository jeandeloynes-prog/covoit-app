"use server";

import { prisma } from "./_shared";
import type { ActionResult } from "./_shared";
import type { Prisma } from "@prisma/client";

// On accepte deux formes d'input pour éviter de modifier l'UI:
// - { bookingId: string }
// - { booking_id: string }
type AcceptInputCamel = { bookingId: string };
type AcceptInputSnake = { booking_id: string };
type AcceptInput = AcceptInputCamel | AcceptInputSnake;

function getBookingId(input: AcceptInput): string {
  return "bookingId" in input ? input.bookingId : input.booking_id;
}

/**
 * Accepte une réservation (status: pending -> accepted).
 * Si tu gères des compteurs de sièges au niveau du trip,
 * adapte la section correspondante (voir commentaires).
 */
export async function acceptBookingAction(
  input: AcceptInput
): Promise<
  ActionResult<{
    booking_id: string;
    status: "accepted";
    accepted_at: string;
  }>
> {
  try {
    const booking_id = getBookingId(input);

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

        // Exemple: décrémenter des sièges disponibles sur le trajet
        // (décommente/ajuste selon ton schéma Prisma)
        // await tx.trip.update({
        //   where: { id: booking.tripId },
        //   data: { seatsAvailable: { decrement: booking.seats } },
        // });

        const updated = await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: "accepted",
            // acceptedAt: new Date(), // décommente si tu as ce champ
          },
          select: { id: true, updatedAt: true },
        });

        return {
          booking_id: updated.id,
          accepted_at: new Date(updated.updatedAt).toISOString(),
        };
      }
    );

    return {
      ok: true,
      data: {
        booking_id: result.booking_id,
        status: "accepted",
        accepted_at: result.accepted_at,
      },
    };
  } catch (e: any) {
    console.error(e);
    const code =
      typeof e?.message === "string" ? e.message : "ACCEPT_BOOKING_FAILED";
    const human =
      code === "BOOKING_NOT_FOUND"
        ? "Réservation introuvable."
        : code === "BOOKING_NOT_PENDING"
        ? "La réservation n'est pas en statut pending."
        : "Impossible d'accepter la réservation.";
    return { ok: false, error: human };
  }
}
