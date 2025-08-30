"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export type PendingRequest = {
  booking_id: string;
  created_at: string;
  seats: number;
  passenger_id: string;
  trip_id: string;
  trip_starts_at: string;
};

export async function listPendingRequestsAction() {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id,
      created_at,
      seats,
      passenger_id,
      trip_id,
      trips!inner(
        starts_at
      )
    `)
    .eq("status", "pending")
    // join côté supabase: trips!inner(...) ne renvoie que les bookings dont le trip est visible
    // et la policy "bookings_reader" autorise le conducteur à lire ses bookings
    .order("created_at", { ascending: false });

  if (error) {
    return { ok: false as const, error: error.message, data: [] as PendingRequest[] };
  }

  const mapped: PendingRequest[] =
    (data ?? []).map((row: any) => ({
      booking_id: row.id,
      created_at: row.created_at,
      seats: row.seats,
      passenger_id: row.passenger_id,
      trip_id: row.trip_id,
      trip_starts_at: row.trips?.starts_at ?? null,
    }));

  return { ok: true as const, data: mapped };
}
