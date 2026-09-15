import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a stub that gracefully degrades when env vars are missing
    return null as any;
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export { createClient as createServerClient };
