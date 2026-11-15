"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUserId } from "@/lib/supabase/server";
import { getType, validateContent, type CodeMode } from "@/lib/codes/types";
import { sanitizeStyle } from "@/lib/qr/sanitize";
import { collectUrls, findUnsafeUrls } from "@/lib/safety";
import { newSlug } from "@/lib/codes/slug";

export interface SaveInput {
  name: string;
  type: string;
  mode: CodeMode;
  slug: string;
  content: unknown;
  style: unknown;
}

export type SaveResult =
  | { ok: true; id: string; slug: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

async function prepare(input: SaveInput) {
  const def = getType(input.type);
  if (!def) return { error: "Unbekannter Code-Typ" } as const;
  if (!def.modes.includes(input.mode)) return { error: "Dieser Typ unterstützt den gewählten Modus nicht" } as const;
  const name = input.name.trim().slice(0, 120) || def.label;

  const content = validateContent(def.id, input.content);
  if (!content.ok) return { error: "Bitte die markierten Felder prüfen", fieldErrors: content.errors } as const;

  const style = sanitizeStyle(input.style);
  if (!style.ok) return { error: style.error } as const;

  const unsafe = await findUnsafeUrls(collectUrls(content.data));
  if (unsafe.length) return { error: `Dieser Link ist als gefährlich gemeldet: ${unsafe[0]}` } as const;

  return { def, name, content: content.data, style: style.style } as const;
}

export async function createCode(input: SaveInput): Promise<SaveResult> {
  if (!(await getUserId())) return { ok: false, message: "Bitte melde dich an" };
  const p = await prepare(input);
  if ("error" in p) return { ok: false, message: p.error ?? "Fehler", fieldErrors: "fieldErrors" in p ? p.fieldErrors : undefined };

  const supabase = await createClient();
  let slug = /^[A-Za-z0-9_-]{4,64}$/.test(input.slug) ? input.slug : newSlug();
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase
      .from("qr_codes")
      .insert({ name: p.name, slug, type: p.def.id, mode: input.mode, content: p.content, style: p.style })
      .select("id, slug")
      .single();
    if (!error && data) {
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/codes");
      return { ok: true, id: data.id, slug: data.slug };
    }
    if (error?.message.includes("PLAN_LIMIT_REACHED")) {
      return { ok: false, message: "Dein Tarif ist voll. Upgrade für mehr dynamische Codes, oder erstelle einen statischen Code." };
    }
    if (error?.code === "23505") {
      slug = newSlug();
      continue;
    }
    console.error("createCode", error);
    return { ok: false, message: "Speichern fehlgeschlagen. Bitte erneut versuchen." };
  }
  return { ok: false, message: "Speichern fehlgeschlagen. Bitte erneut versuchen." };
}

export async function updateCode(id: string, input: SaveInput): Promise<SaveResult> {
  if (!(await getUserId())) return { ok: false, message: "Bitte melde dich an" };
  const supabase = await createClient();
  const { data: existing } = await supabase.from("qr_codes").select("type, mode, slug").eq("id", id).maybeSingle();
  if (!existing) return { ok: false, message: "Code nicht gefunden" };

  // Type, mode and slug are fixed once a code exists: it may already be printed.
  const p = await prepare({ ...input, type: existing.type, mode: existing.mode, slug: existing.slug });
  if ("error" in p) return { ok: false, message: p.error ?? "Fehler", fieldErrors: "fieldErrors" in p ? p.fieldErrors : undefined };

  const { error } = await supabase.from("qr_codes").update({ name: p.name, content: p.content, style: p.style }).eq("id", id);
  if (error) {
    console.error("updateCode", error);
    return { ok: false, message: "Speichern fehlgeschlagen" };
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/codes");
  revalidatePath(`/dashboard/codes/${id}`);
  return { ok: true, id, slug: existing.slug };
}

export async function setCodeStatus(id: string, status: "active" | "paused") {
  const supabase = await createClient();
  await supabase.from("qr_codes").update({ status }).eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/codes");
  revalidatePath(`/dashboard/codes/${id}`);
}

export async function deleteCode(id: string) {
  const supabase = await createClient();
  await supabase.from("qr_codes").delete().eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/codes");
}

/** Moves guest codes (made without an account in this browser) into the signed-in account. */
export async function claimGuestCodes(items: { slug: string; token: string }[]): Promise<{ claimed: string[] }> {
  if (!(await getUserId())) return { claimed: [] };
  const supabase = await createClient();
  const claimed: string[] = [];
  for (const it of items.slice(0, 200)) {
    if (!/^[A-Za-z0-9_-]{4,64}$/.test(it.slug) || !/^[A-Za-z0-9_-]{32,128}$/.test(it.token)) continue;
    const { data } = await supabase.rpc("claim_guest_code", { p_slug: it.slug, p_token: it.token } as never);
    if (data) claimed.push(it.slug);
  }
  if (claimed.length) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/codes");
  }
  return { claimed };
}
