import "server-only";
import { cache } from "react";
import { adminClient } from "@/lib/supabase/admin";
import type { CodeMode, CodeTypeId } from "./types";

export interface PublicCode {
  id: string;
  slug: string;
  name: string;
  type: CodeTypeId;
  mode: CodeMode;
  status: "active" | "paused";
  content: Record<string, unknown>;
}

/** Public lookup by slug (bypasses RLS, returns only what a scanner needs). */
export const getPublicCode = cache(async (slug: string): Promise<PublicCode | null> => {
  if (!/^[A-Za-z0-9_-]{4,64}$/.test(slug)) return null;
  const { data } = await adminClient()
    .from("qr_codes")
    .select("id, slug, name, type, mode, status, content")
    .eq("slug", slug)
    .maybeSingle();
  return (data as PublicCode | null) ?? null;
});
