import "server-only";
import { cache } from "react";
import { anonClient } from "@/lib/supabase/anon";
import { supabaseConfigured } from "@/lib/env";
import { getType, validateContent, type CodeMode, type CodeTypeId } from "./types";

export interface PublicCode {
  id: string;
  slug: string;
  name: string;
  type: CodeTypeId;
  mode: CodeMode;
  status: "active" | "paused";
  content: Record<string, unknown>;
}

/**
 * Public lookup by slug through the `public_code` RPC (returns only what a
 * scanner needs). Content is validated again on read, so nothing written
 * past the app's own checks can turn into a bad redirect or page.
 */
export const getPublicCode = cache(async (slug: string): Promise<PublicCode | null> => {
  if (!/^[A-Za-z0-9_-]{4,64}$/.test(slug)) return null;
  if (!supabaseConfigured) return null;
  const { data, error } = await anonClient().rpc("public_code", { p_slug: slug } as never);
  if (error) {
    console.error("public_code", error.message);
    return null;
  }
  const row = (Array.isArray(data) ? data[0] : data) as PublicCode | undefined;
  if (!row || !getType(row.type)) return null;
  const valid = validateContent(row.type, row.content);
  if (!valid.ok) return null;
  return { ...row, content: valid.data };
});
