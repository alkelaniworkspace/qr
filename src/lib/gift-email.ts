import "server-only";
import { env } from "@/lib/env";
import { site } from "@/lib/site";
import { PLANS, type PlanId } from "@/lib/plans";
import { escapeHtml } from "@/lib/email";
import { FONT, mailLayout } from "@/lib/mail-layout";

const TONE: Record<string, { bg: string; fg: string; sub: string; chip: string; chipFg: string }> = {
  start: { bg: "#c8ff2e", fg: "#111111", sub: "#3b4a0a", chip: "#111111", chipFg: "#c8ff2e" },
  pro: { bg: "#111111", fg: "#ffffff", sub: "#a3a39d", chip: "#c8ff2e", chipFg: "#111111" },
  business: { bg: "#c8102e", fg: "#ffffff", sub: "#ffd3da", chip: "#ffffff", chipFg: "#c8102e" },
};

const dateFmt = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric" });

export function durationText(months: number | null, until: string | null): string {
  if (until) return `bis ${dateFmt.format(new Date(until))}`;
  if (months) return months === 12 ? "1 Jahr" : months === 1 ? "1 Monat" : `${months} Monate`;
  return "unbegrenzt";
}

export function limitText(plan: PlanId, limit: number | null): string {
  if (limit === -1) return "unbegrenzt";
  const n = limit ?? PLANS[plan].dynamic;
  return n === null ? "unbegrenzt" : `${n}`;
}

/** "You got Qlick Pro as a gift" e-mail. `pending` = the person has no account yet. */
export function renderGiftEmail(o: {
  plan: PlanId; months: number | null; until: string | null; limit: number | null;
  message?: string; name?: string; email: string; pending: boolean;
}) {
  const def = PLANS[o.plan];
  const t = TONE[o.plan] ?? TONE.pro;
  const dur = durationText(o.months, o.until);
  const codes = limitText(o.plan, o.limit);
  const hi = o.name ? `Hallo ${escapeHtml(o.name.split(" ")[0])},` : "Hallo,";
  const link = o.pending ? `${env.appUrl}/signup?gift=1&email=${encodeURIComponent(o.email)}` : `${env.appUrl}/dashboard`;
  const row = (k: string, v: string) => `
    <tr>
      <td style="padding:9px 0;font:400 14px/1.4 ${FONT};color:${t.sub};border-top:1px solid ${t.fg}22">${k}</td>
      <td align="right" style="padding:9px 0;font:700 14px/1.4 ${FONT};color:${t.fg};border-top:1px solid ${t.fg}22">${v}</td>
    </tr>`;
  const card = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${t.bg};border-radius:20px">
      <tr><td style="padding:24px 24px 6px">
        <span style="display:inline-block;background:${t.chip};color:${t.chipFg};font:700 12px/1 ${FONT};padding:7px 11px;border-radius:999px">Geschenk</span>
        <div style="padding-top:14px;font:800 34px/1.05 ${FONT};color:${t.fg};letter-spacing:-0.8px">${site.name} ${def.label}</div>
        <div style="padding-top:6px;font:400 14px/1.5 ${FONT};color:${t.sub}">Alle ${def.label}-Funktionen, ohne Kosten für dich.</div>
      </td></tr>
      <tr><td style="padding:12px 24px 18px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${row("Laufzeit", o.pending && o.months ? `${dur} ab Registrierung` : dur)}
          ${row("Dynamische QR-Codes", codes)}
          ${row("Preis", "0,00 €")}
        </table>
      </td></tr>
    </table>
    ${o.message ? `<div style="margin-top:18px;padding:16px 18px;border-radius:16px;background:#f4f4f0;font:italic 400 15px/1.55 ${FONT};color:#3d3d3a">„${escapeHtml(o.message)}“<div style="padding-top:8px;font:600 13px/1 ${FONT};font-style:normal;color:#111111">Dein ${site.name}-Team</div></div>` : ""}`;

  const intro = o.pending
    ? `${hi}<br>wir haben eine Überraschung für dich: Du bekommst <b>${site.name} ${def.label}</b> geschenkt. Erstelle einfach ein kostenloses Konto mit dieser E-Mail-Adresse (<b>${escapeHtml(o.email)}</b>), dann ist dein Geschenk sofort aktiv.`
    : `${hi}<br>wir haben eine Überraschung für dich: Dein Konto wurde auf <b>${site.name} ${def.label}</b> hochgestuft. Das Geschenk ist ab sofort aktiv, du musst nichts weiter tun.`;

  return {
    subject: `Ein Geschenk für dich: ${site.name} ${def.label}`,
    html: mailLayout({
      preheader: `${site.name} ${def.label}, ${dur}. Geschenkt von uns.`,
      title: "Ein Geschenk für dich",
      intro,
      block: card,
      cta: o.pending ? "Konto erstellen und Geschenk aktivieren" : "Zu meinem Konto",
      link,
      accent: o.plan === "business" ? "#c8102e" : "#c8ff2e",
      after: o.pending
        ? "Du kannst dich auch mit Google anmelden, solange es dieselbe E-Mail-Adresse ist. Es fallen keine Kosten an, und du gehst kein Abo ein."
        : `Wenn das Geschenk endet, läuft dein Konto einfach im Free-Tarif weiter. Deine Codes bleiben erhalten und es fallen keine Kosten an.`,
    }),
    text: [
      o.name ? `Hallo ${o.name.split(" ")[0]},` : "Hallo,", "",
      `Du bekommst ${site.name} ${def.label} geschenkt.`,
      `Laufzeit: ${dur}`, `Dynamische QR-Codes: ${codes}`, "",
      o.message ? `„${o.message}“\n` : "",
      o.pending ? `Erstelle ein kostenloses Konto mit ${o.email}, dann ist das Geschenk aktiv:` : "Das Geschenk ist ab sofort aktiv:",
      link, "", `${site.name} · ${site.domain}`,
    ].join("\n"),
  };
}
