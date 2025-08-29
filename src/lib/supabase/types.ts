import type { Database } from "@/lib/supabase/types";
// puis:
let browserClient: SupabaseClient<Database> | null = null;
browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
