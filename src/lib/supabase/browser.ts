// src/lib/supabase/browser.ts
"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient, GenericSchema } from "@supabase/supabase-js";

// Schéma minimal pour satisfaire les génériques ("public" doit exister)
type Database = { public: GenericSchema };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let browserClient: SupabaseClient<Database> | null = null;

/**
 * Singleton côté navigateur
 */
export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  return browserClient;
}
