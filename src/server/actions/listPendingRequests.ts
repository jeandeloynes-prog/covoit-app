"use server";

import { prisma } from "./_shared";
import type { ActionResult } from "./_shared";

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
    // À adapter à ton auth (driverId courant)
    // Si tu utilises getCurrentUserId, importe‑le et filtre sur trip.driverId
    const rows = await prisma.booking.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
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
      data: rows.map((r) => ({
        booking_id: r.id,
        created_at: r.createdAt.toISOString(),
        seats: r.seats,
        passenger_id: r.passengerId,
        trip_id: r.tripId,
        trip_starts_at: r.trip?.startsAt?.toISOString() ?? null,
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
