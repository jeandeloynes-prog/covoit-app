// src/lib/supabase/client.ts
// Shim de compatibilité: réexporte les helpers actuels + alias legacy.

export { getSupabaseServerClient } from "./server";
export { getSupabaseBrowserClient } from "./browser";

// Alias legacy pour le code existant
export { getSupabaseServerClient as getServerClient } from "./server";
export { getSupabaseBrowserClient as getBrowserClient } from "./browser";

// Réexport du type (placeholder ou vos types générés plus tard)
export type { Database } from "./types";
