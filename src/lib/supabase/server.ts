// src/lib/supabase/client.ts
"use server";

import { cookies, headers } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Client Supabase pour les actions/route handlers (App Router).
 * Note: cookies().set/remove ne sont autorisés qu’en Server Actions/Route Handlers.
 * Si tu l’appelles depuis un RSC pur, voir variante “read-only” plus bas.
 */
export function getSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // autorisé en Server Actions / Route Handlers
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options });
        }
      },
      headers: {
        get(key: string) {
          return headers().get(key) ?? undefined;
        }
      }
    }
  );
}

/**
 * Variante “read-only” si besoin dans un RSC pur (ne tente pas d’écrire des cookies).
 */
// export function getSupabaseServerClientReadOnly() {
//   return createServerClient(
//     supabaseUrl,
//     supabaseAnonKey,
//     {
//       cookies: {
//         get(name: string) {
//           return cookies().get(name)?.value;
//         },
//         // no-ops pour éviter les erreurs hors actions/routes
//         set: () => {},
//         remove: () => {}
//       },
//       headers: {
//         get(key: string) {
//           return headers().get(key) ?? undefined;
//         }
//       }
//     }
//   );
// }
