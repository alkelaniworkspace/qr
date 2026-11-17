"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { escapeHtml, mailConfigured, sendMail } from "@/lib/email";
import { mailLayout } from "@/lib/mail-layout";
import { env, serverEnv } from "@/lib/env";
import type { PublicFormData } from "@/components/forms/form-view";
import { anonClient } from "@/lib/supabase/anon";
import { getPublicForm } from "@/lib/forms/public";
import { isInput, validateAnswers } from "@/lib/forms/types";
import { parseUserAgent } from "@/lib/analytics/user-agent";

const MESSAGES: Record<string, string> = {
  CLOSED: "Dieses Formular nimmt gerade keine Antworten an.",
  FULL: "Leider sind schon alle Plätze vergeben.",
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
  if (data !== "OK") return { ok: false as const, message: String(data) === "CLOSED" && form.settings.closedMessage ? form.settings.closedMessage : MESSAGES[String(data)] ?? "Senden fehlgeschlagen." };
  if (mailConfigured() && (form.settings.notifyOwner || form.settings.confirmField)) {
    const answers = checked.answers;
    after(() => notify(form, answers).catch((e) => console.error("form mail", e)));
  }
  if (form.settings.showResults) {
    const { data: poll } = await db.rpc("form_poll_results", { p_slug: slug } as never);
    return { ok: true as const, poll: (poll ?? {}) as Record<string, Record<string, number>> };
  }
  return { ok: true as const };
}

const fmt = (v: unknown) => (Array.isArray(v) ? v.join(", ") : v === true ? "Ja" : String(v ?? ""));

/** Owner notification and the respondent's copy, sent after the response is stored. */
async function notify(form: PublicFormData, answers: Record<string, unknown>) {
  const rows = form.fields.filter((f) => isInput(f.type) && answers[f.id] !== undefined).map((f) => [f.label, fmt(answers[f.id])] as const);
  const table = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:16px;background:#f4f4f0">${rows.map(([k, v]) => `<tr><td style="padding:11px 16px;font:400 13px/1.45 Inter,Arial,sans-serif;color:#6b6b66;width:42%;vertical-align:top">${escapeHtml(k)}</td><td style="padding:11px 16px;font:600 13px/1.45 Inter,Arial,sans-serif;color:#111;white-space:pre-line">${escapeHtml(v)}</td></tr>`).join("")}</table>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  const jobs: Promise<boolean>[] = [];
  if (form.settings.notifyOwner && serverEnv().secretKey) {
    const { data: owner } = await adminClient().rpc("form_owner_email", { p_slug: form.slug } as never);
    if (typeof owner === "string" && owner) {
      jobs.push(sendMail(owner, `Neue Antwort: ${form.title}`, mailLayout({
        preheader: `Neue Antwort auf „${form.title}“`, title: "Neue Antwort", intro: `Auf dein Formular <b>${escapeHtml(form.title)}</b> ist gerade eine Antwort eingegangen.`,
        block: table, cta: "Alle Antworten ansehen", link: `${env.appUrl}/dashboard/forms`, after: "Du bekommst diese E-Mail, weil die Benachrichtigung in den Formular-Einstellungen aktiv ist.",
      }), text));
    }
  }
  const to = form.settings.confirmField ? answers[form.settings.confirmField] : undefined;
  if (typeof to === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    jobs.push(sendMail(to, `Deine Antwort: ${form.title}`, mailLayout({
      preheader: "Eine Kopie deiner Angaben.", title: form.settings.thankYouTitle || "Danke!", intro: `${escapeHtml(form.settings.thankYou || "Wir haben deine Angaben erhalten.")}<br><br>Hier ist eine Kopie für dich:`,
      block: table, after: `Du hast das Formular „${escapeHtml(form.title)}“ ausgefüllt. Wenn das nicht du warst, kannst du diese E-Mail ignorieren.`,
    }), text));
  }
  await Promise.all(jobs);
}
