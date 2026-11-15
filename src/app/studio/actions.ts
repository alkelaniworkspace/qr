"use server";

import { randomBytes } from "node:crypto";
import { anonClient } from "@/lib/supabase/anon";
import { supabaseConfigured } from "@/lib/env";
import { getType, validateContent, type CodeTypeId } from "@/lib/codes/types";
import { sanitizeStyle } from "@/lib/qr/sanitize";
import { collectUrls, findUnsafeUrls } from "@/lib/safety";
import type { QrStyle } from "@/lib/qr/style";

export interface GuestCodeInput {
  slug: string;
  /** Edit token. Missing on the first publish, which creates the code. */
  token?: string;
  name: string;
  type: string;
  content: unknown;
  style: unknown;
}

export type PublishResult =
  | { ok: true; slug: string; token: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export interface GuestCode {
  slug: string;
  name: string;
  type: CodeTypeId;
  content: Record<string, unknown>;
  style: QrStyle;
  scanCount: number;
  createdAt: string;
}

const SLUG = /^[A-Za-z0-9_-]{4,64}$/;
const TOKEN = /^[A-Za-z0-9_-]{32,128}$/;

/**
 * Creates or updates a dynamic code without an account. The slug (what is
 * printed) never changes; name, content, style and even the type can.
 */
export async function publishGuestCode(input: GuestCodeInput): Promise<PublishResult> {
  if (!supabaseConfigured) return { ok: false, message: "Dynamische Codes sind gerade nicht verfügbar." };
  if (!SLUG.test(input.slug)) return { ok: false, message: "Ungültiger Code" };
  const def = getType(input.type);
  if (!def) return { ok: false, message: "Unbekannter Code-Typ" };

  const content = validateContent(def.id, input.content);
  if (!content.ok) return { ok: false, message: "Bitte die markierten Felder prüfen", fieldErrors: content.errors };
  const style = sanitizeStyle(input.style);
  if (!style.ok) return { ok: false, message: style.error };
  const unsafe = await findUnsafeUrls(collectUrls(content.data));
  if (unsafe.length) return { ok: false, message: `Dieser Link ist als gefährlich gemeldet: ${unsafe[0]}` };

  const name = input.name.trim().slice(0, 120) || def.label;
  const db = anonClient();

  if (input.token) {
    if (!TOKEN.test(input.token)) return { ok: false, message: "Ungültiger Bearbeitungs-Link" };
    const { data, error } = await db.rpc("update_guest_code", {
      p_slug: input.slug, p_token: input.token, p_name: name, p_type: def.id, p_content: content.data, p_style: style.style,
    } as never);
    if (error) {
      console.error("update_guest_code", error.message);
      return { ok: false, message: "Speichern fehlgeschlagen. Bitte erneut versuchen." };
    }
    if (!data) return { ok: false, message: "Bearbeitungs-Link passt nicht zu diesem Code." };
    return { ok: true, slug: input.slug, token: input.token };
  }

  const token = randomBytes(24).toString("base64url");
  const { error } = await db.rpc("create_guest_code", {
    p_slug: input.slug, p_token: token, p_name: name, p_type: def.id, p_content: content.data, p_style: style.style,
  } as never);
  if (error) {
    if (error.code === "23505") return { ok: false, message: "SLUG_TAKEN" };
    if (error.message.includes("RATE_LIMIT")) return { ok: false, message: "Gerade sehr viel los. Bitte in einer Minute erneut versuchen." };
    console.error("create_guest_code", error.message);
    return { ok: false, message: "Speichern fehlgeschlagen. Bitte erneut versuchen." };
  }
  return { ok: true, slug: input.slug, token };
}

export async function loadGuestCode(slug: string, token: string): Promise<GuestCode | null> {
  if (!supabaseConfigured || !SLUG.test(slug) || !TOKEN.test(token)) return null;
  const { data, error } = await anonClient().rpc("get_guest_code", { p_slug: slug, p_token: token } as never);
  if (error) return null;
  const row = (Array.isArray(data) ? data[0] : data) as
    | { slug: string; name: string; type: CodeTypeId; content: Record<string, unknown>; style: QrStyle; scan_count: number; created_at: string }
    | undefined;
  if (!row) return null;
  return { slug: row.slug, name: row.name, type: row.type, content: row.content, style: row.style, scanCount: row.scan_count, createdAt: row.created_at };
}
