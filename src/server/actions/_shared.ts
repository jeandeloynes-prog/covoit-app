"use server";

import { prisma } from "@/server/db";
import { cookies } from "next/headers";

/**
 * À adapter à ton auth. Ici on suppose un cookie "uid".
 */
export async function getCurrentUserId(): Promise<string | null> {
  const uid = (await cookies()).get("uid")?.value ?? null;
  return uid;
}

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

export { prisma };
