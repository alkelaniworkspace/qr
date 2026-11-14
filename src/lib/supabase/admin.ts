import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env, serverEnv } from "@/lib/env";

let client: ReturnType<typeof createClient> | null = null;

/**
 * Service client that bypasses RLS. Only for public reads by slug
 * (redirects, hosted pages) and for recording scans. Never expose to users.
 */
export function adminClient() {
  if (!client) {
    client = createClient(env.supabaseUrl, serverEnv().secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
