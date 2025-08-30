"use server";

import type { Prisma } from "@prisma/client";
import { prisma, getCurrentUserId, type ActionResult } from "./_shared";

type AcceptBookingData = {
  bookingId: string;
  tripId: string;
  seatsTaken: number;
  seats: number;
  status: "ACCEPTED";
};

/**
 * Accepte une réservation si:
 * - la réservation existe et est en statut PENDING
 * - l'utilisateur courant est le propriétaire (driver) du trajet
 * - il reste des places
 * La logique est protégée contre les races via updateMany/count.
 */
export async function acceptBooking(
  bookingId: string
): Promise<ActionResult<AcceptBookingData>> {
  const userId = getCurrentUserId();
  if (!userId) {
    return { ok: false, error: "Not authenticated.", code: "UNKNOWN" };
  }

  try {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1) Charger la réservation minimale
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        select: { id: true, status: true, tripId: true },
      });

      if (!booking) {
        return { kind: "ERR" as const, code: "BOOKING_NOT_FOUND" as const };
      }

      if (booking.status === "ACCEPTED") {
        return { kind: "ERR" as const, code: "ALREADY_ACCEPTED" as const };
      }
      if (booking.status === "REJECTED") {
        return { kind: "ERR" as const, code: "ALREADY_REJECTED" as const };
      }
      if (booking.status !== "PENDING") {
        return { kind: "ERR" as const, code: "BOOKING_NOT_PENDING" as const };
      }

      // 2) Charger le trip et vérifier la propriété
      const trip = await tx.trip.findUnique({
        where: { id: booking.tripId },
        select: {
          id: true,
          driverId: true,
          seats: true,
          seatsTaken: true,
        },
      });

      if (!trip) {
        // Cas rare: data corrompue
        return { kind: "ERR" as const, code: "UNKNOWN" as const };
      }

      if (trip.driverId !== userId) {
        return { kind: "ERR" as const, code: "NOT_OWNER" as const };
      }

      // 3) Vérifier la capacité et incrémenter de manière atomique
      if (trip.seatsTaken >= trip.seats) {
        return { kind: "ERR" as const, code: "TRIP_FULL" as const };
      }

      // Incrément protégé contre les races
      const tripUpdate = await tx.trip.updateMany({
        where: {
          id: trip.id,
          // encore dispo au moment de l'incrément
          seatsTaken: { lt: trip.seats },
        },
        data: { seatsTaken: { increment: 1 } },
      });

      if (tripUpdate.count === 0) {
        // Quelqu’un a pris la dernière place juste avant nous
        return { kind: "ERR" as const, code: "CONCURRENCY_CONFLICT" as const };
      }

      // 4) Passer la réservation à ACCEPTED, avec garde sur le statut
      const bookingUpdate = await tx.booking.updateMany({
        where: { id: booking.id, status: "PENDING" },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
      });

      if (bookingUpdate.count === 0) {
        // Le statut a changé pendant la transaction
        // (ex: déjà accepté/rejeté ailleurs)
        // On annule l’incrément précédemment fait pour rester consistant
        await tx.trip.update({
          where: { id: trip.id },
          data: { seatsTaken: { decrement: 1 } },
        });
        return { kind: "ERR" as const, code: "CONCURRENCY_CONFLICT" as const };
      }

      // 5) Retourner l’état final
      const latestTrip = await tx.trip.findUnique({
        where: { id: trip.id },
        select: { id: true, seats: true, seatsTaken: true },
      });

      if (!latestTrip) {
        // Très improbable
        return { kind: "ERR" as const, code: "UNKNOWN" as const };
      }

      return {
        kind: "OK" as const,
        data: {
          bookingId: booking.id,
          tripId: latestTrip.id,
          seatsTaken: latestTrip.seatsTaken,
          seats: latestTrip.seats,
          status: "ACCEPTED" as const,
        },
      };
    });

    if (result.kind === "ERR") {
      return { ok: false, error: result.code, code: result.code };
    }
    return { ok: true, data: result.data };
  } catch (e) {
    // Log en dev si besoin
    // console.error(e);
    return { ok: false, error: "Unexpected error.", code: "UNKNOWN" };
  }
}

export default acceptBooking;
