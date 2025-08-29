// src/server/rpc/list_public_rides.ts
"use server";

import { z } from "zod";
import { getServerClient } from "@/lib/supabase/client";

const schema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  from: z.date().optional(),
  to: z.date().optional(),
});

export async function listPublicRides(input?: Partial<z.infer<typeof schema>>) {
  const { limit, from, to } = schema.parse({ limit: 20, ...input });
  const supabase = getServerClient();

  const { data, error } = await supabase.rpc("list_public_rides", {
    p_limit: limit,
    p_from: (from ?? new Date()).toISOString(),
    p_to: (to ?? new Date(Date.now() + 1000 * 60 * 60 * 24 * 90)).toISOString(),
  });

  if (error) throw new Error(error.message);
  return data ?? [];
}
