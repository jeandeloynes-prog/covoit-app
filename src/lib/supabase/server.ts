// src/lib/supabase/server.ts
"use server";

import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

type Database = any;

export function getSupabaseServerClient(): SupabaseClient<Database> {
  const cookieStore = cookies();
  const headerStore = headers();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name, options) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
      headers: {
        get(key) {
          return headerStore.get(key) ?? undefined;
        },
      },
    }
  );
}
