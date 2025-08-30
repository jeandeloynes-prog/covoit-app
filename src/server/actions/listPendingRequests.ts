"use server";

import { prisma } from "./_shared";
import type { ActionResult } from "./_shared";

// Types locaux correspondant exactement au select ci‑dessous
type PendingRequestRow = {
  id: string;
  createdAt: Date | string;
  seats: number;
  passengerId: string;
  tripId: string;
  trip: { startsAt: Date | string | null } | null;
};

/**
 * Retourne les réservations en attente (status = "pending") pour le driver courant.
 */
export async function listPendingRequestsAction(): Promise<
  ActionResult<
    {
      booking_id: string;
      created_at: string;
      seats: number;
      passenger_id: string;
      trip_id: string;
      trip_starts_at: string | null;
    }[]
  >
> {
  try {
    // TODO: filtrer par driver courant si nécessaire (ex: where: { status: "pending", trip: { driverId: currentDriverId } })
    const rows = await prisma.booking.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" }, // ou "desc" selon ton besoin
      select: {
        id: true,
        createdAt: true,
        seats: true,
        passengerId: true,
        tripId: true,
        trip: { select: { startsAt: true } },
      },
    });

    return {
      ok: true,
      data: (rows as PendingRequestRow[]).map((r) => ({
        booking_id: r.id,
        created_at: new Date(r.createdAt).toISOString(),
        seats: r.seats,
        passenger_id: r.passengerId,
        trip_id: r.tripId,
        trip_starts_at: r.trip?.startsAt
          ? new Date(r.trip.startsAt).toISOString()
          : null,
      })),
    };
  } catch (e) {
    console.error(e);
    return {
      ok: false,
      error: "Impossible de lister les demandes.",
    };
  }
}
