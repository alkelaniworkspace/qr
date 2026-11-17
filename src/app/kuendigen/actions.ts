"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { adminClient } from "@/lib/supabase/admin";
import { billingConfigured, billingProfile, isLive, stripe, syncSubscription } from "@/lib/billing";
import { escapeHtml, sendMail } from "@/lib/email";
import { mailLayout } from "@/lib/mail-layout";
import { site } from "@/lib/site";
import { PLANS, planOf } from "@/lib/plans";

export type CancelState = { error?: string; done?: { at: string; email: string; plan: string; until: string | null } } | undefined;

const schema = z.object({
  name: z.string().trim().min(2, "Bitte deinen Namen angeben").max(120),
  email: z.email("Bitte die E-Mail deines Kontos angeben"),
  kind: z.enum(["ordentlich", "ausserordentlich"]),
  reason: z.string().trim().max(1000).optional(),
  when: z.enum(["next", "date"]),
  date: z.string().max(20).optional(),
});

const stamp = new Intl.DateTimeFormat("de-DE", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Berlin" });
const dateFmt = new Intl.DateTimeFormat("de-DE", { dateStyle: "long", timeZone: "Europe/Berlin" });
const hits = new Map<string, number[]>();

/** § 312k BGB: cancel without signing in. Confirms by e-mail; a running Qlick subscription ends at the period end. */
export async function submitCancellation(_: CancelState, form: FormData): Promise<CancelState> {
  const parsed = schema.safeParse({
    name: form.get("name"), email: String(form.get("email") ?? "").trim(), kind: form.get("kind"),
    reason: form.get("reason") || undefined, when: form.get("when"), date: form.get("date") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (d.kind === "ausserordentlich" && !d.reason) return { error: "Bitte gib bei einer außerordentlichen Kündigung den Grund an." };

  // light abuse protection per IP
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "?";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 3_600_000);
  if (recent.length >= 5) return { error: "Zu viele Anfragen. Bitte versuche es später erneut oder schreib an " + site.email };
  hits.set(ip, [...recent, now]);

  const at = stamp.format(new Date());
  let plan = "Kein laufendes Abo gefunden";
  let until: string | null = null;
  const { data: uid } = await adminClient().rpc("user_id_by_email", { p_email: d.email } as never);
  if (uid && billingConfigured()) {
    const prof = await billingProfile(uid as string);
    if (prof?.subscription_id && isLive(prof.subscription_status)) {
      try {
        // extraordinary cancellations are reviewed by hand; the subscription ends at the period end in any case
        const sub = await stripe().subscriptions.update(prof.subscription_id, { cancel_at_period_end: true });
        await syncSubscription(sub);
        const after = await billingProfile(uid as string);
        plan = `${site.name} ${PLANS[planOf(prof.plan)].label}`;
        until = after?.current_period_end ? dateFmt.format(new Date(after.current_period_end)) : null;
      } catch (e) { console.error("cancel page", e); }
    }
  }

  const when = d.when === "next" ? "zum nächstmöglichen Zeitpunkt" : `zum ${d.date ? dateFmt.format(new Date(d.date)) : "angegebenen Datum"}`;
  const rows = [
    ["Eingang", at], ["Name", d.name], ["E-Mail", d.email], ["Vertrag", plan],
    ["Art", d.kind === "ordentlich" ? "Ordentliche Kündigung" : "Außerordentliche Kündigung"], ["Zeitpunkt", when],
    ...(d.reason ? [["Grund", d.reason]] : []), ...(until ? [["Vertragsende", until]] : []),
  ];
  const table = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:16px;background:#f4f4f0">${rows.map(([k, v]) => `<tr><td style="padding:10px 16px;font:400 13px/1.4 Inter,Arial,sans-serif;color:#6b6b66;width:120px;vertical-align:top">${k}</td><td style="padding:10px 16px;font:600 13px/1.4 Inter,Arial,sans-serif;color:#111">${escapeHtml(v)}</td></tr>`).join("")}</table>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");

  const okCustomer = await sendMail(d.email, `Eingangsbestätigung deiner Kündigung`, mailLayout({
    preheader: `Wir haben deine Kündigung am ${at} erhalten.`,
    title: "Kündigung erhalten",
    intro: `Hallo ${escapeHtml(d.name.split(" ")[0])},<br>wir bestätigen den Eingang deiner Kündigung. Hier sind die Angaben:`,
    block: table,
    after: until
      ? `Dein Abo endet am ${until}. Bis dahin bleibt alles freigeschaltet, danach läuft dein Konto kostenlos im Free-Tarif weiter. Du hast das nicht veranlasst? Dann setze dein Abo unter Tarif & Rechnungen einfach fort.`
      : `Wir prüfen deine Kündigung und melden uns, falls wir noch etwas brauchen. Fragen? ${site.email}`,
  }), `Kündigung erhalten\n\n${text}`);
  await sendMail(site.email, `Kündigung über Website: ${d.email}`, mailLayout({ preheader: "Neue Kündigung", title: "Neue Kündigung", intro: "Über „Verträge hier kündigen“ ist eine Kündigung eingegangen.", block: table, after: "Automatisch erzeugt." }), text);

  if (!okCustomer) return { error: `Die Bestätigung konnte nicht gesendet werden. Bitte schreib uns an ${site.email}.` };
  return { done: { at, email: d.email, plan, until } };
}
