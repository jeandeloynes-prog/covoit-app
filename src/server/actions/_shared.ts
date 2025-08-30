"use server";

import { prisma } from "@/server/db";
import { cookies } from "next/headers";

/**
 * À adapter à ton auth. Ici on suppose un cookie "uid".
 * Note: cookies() est synchrone en Server Actions/Route Handlers.
 */
export function getCurrentUserId(): string | null {
  const uid = cookies().get("uid")?.value ?? null;
  return uid;
}

// Alias pour compatibilité si certains imports attendent getUserId
export const getUserId = getCurrentUserId;

export type ActionErrorCode =
  | "BOOKING_NOT_FOUND"
  | "BOOKING_NOT_PENDING"
  | "ALREADY_ACCEPTED"
  | "ALREADY_REJECTED"
  | "NOT_OWNER"
  | "TRIP_FULL"
  | "CONCURRENCY_CONFLICT"
  | "UNKNOWN";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: ActionErrorCode };

// Réexport pratique
export { prisma };
