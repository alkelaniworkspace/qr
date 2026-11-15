"use server";

import { headers } from "next/headers";
import { anonClient } from "@/lib/supabase/anon";
import { getPublicForm } from "@/lib/forms/public";
import { validateAnswers } from "@/lib/forms/types";
import { parseUserAgent } from "@/lib/analytics/user-agent";

const MESSAGES: Record<string, string> = {
  CLOSED: "Dieses Formular nimmt gerade keine Antworten an.",
  LIMIT: "Dieses Formular hat sein Monatslimit erreicht.",
  RATE_LIMIT: "Gerade sehr viele Antworten. Bitte gleich noch einmal.",
  NOT_FOUND: "Formular nicht gefunden.",
};

export async function submitForm(slug: string, raw: Record<string, unknown>, honeypot?: string) {
  if (honeypot) return { ok: true as const };
  const form = await getPublicForm(slug);
  if (!form) return { ok: false as const, message: MESSAGES.NOT_FOUND };
  const checked = validateAnswers(form.fields, raw ?? {});
  if (!checked.ok) return { ok: false as const, message: "Bitte die markierten Felder prüfen.", errors: checked.errors };
  const h = await headers();
  const ua = parseUserAgent(h.get("user-agent") ?? "");
  const meta = { device: ua.device, os: ua.os, lang: (h.get("accept-language") ?? "").slice(0, 2), country: h.get("x-vercel-ip-country") ?? null };
  const db = anonClient();
  const { data, error } = await db.rpc("submit_form_response", { p_slug: slug, p_answers: checked.answers, p_meta: meta } as never);
  if (error) return { ok: false as const, message: "Senden fehlgeschlagen. Bitte erneut versuchen." };
  if (data !== "OK") return { ok: false as const, message: MESSAGES[String(data)] ?? "Senden fehlgeschlagen." };
  if (form.settings.showResults) {
    const { data: poll } = await db.rpc("form_poll_results", { p_slug: slug } as never);
    return { ok: true as const, poll: (poll ?? {}) as Record<string, Record<string, number>> };
  }
  return { ok: true as const };
}
