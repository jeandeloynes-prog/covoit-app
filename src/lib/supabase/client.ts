// src/lib/supabase/client.ts
import { createClient } from "@supabase/supabase-js";
import { createServerClient as createSSRClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function getBrowserClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}

// Server client avec gestion des cookies (pour conserver la session côté serveur)
export function getServerClient() {
  const cookieStore = cookies();
  const cookieHeader = headers().get("cookie") ?? "";
  return createSSRClient({
    supabaseUrl,
    supabaseKey: supabaseAnonKey,
    getRequestHeader: () => ({ cookie: cookieHeader }),
    getCookie(name) {
      return cookieStore.get(name)?.value ?? parseCookieHeader(cookieHeader)[name] ?? "";
    },
    setCookie(name, value, options) {
      cookieStore.set({ name, value, ...options });
    },
    serializeCookie: serializeCookieHeader,
  });
}
