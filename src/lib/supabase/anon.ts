import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

let client: ReturnType<typeof createClient> | null = null;

/** Server-side client with the publishable key and no session: can only call public RPCs. */
export function anonClient() {
  if (!client) {
    client = createClient(env.supabaseUrl, env.supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
