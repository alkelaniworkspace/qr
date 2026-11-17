import "server-only";
import { env } from "@/lib/env";
import { site } from "@/lib/site";
import { escapeHtml } from "@/lib/email";

/** E-mail types Supabase Auth hands to the send-email hook. */
export type AuthEmailType = "signup" | "magiclink" | "recovery" | "invite" | "email_change" | "email" | "reauthentication";

export interface AuthMail { subject: string; html: string; text: string }

const FONT = "Inter,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

function layout({ preheader, title, intro, cta, link, after, code }: {
  preheader: string; title: string; intro: string; cta?: string; link?: string; after: string; code?: string;
}): string {
  const button = cta && link ? `
    <tr><td style="padding:28px 0 8px">
      <a href="${link}" style="display:inline-block;background:#c8ff2e;color:#111111;font:700 16px/1 ${FONT};text-decoration:none;padding:17px 30px;border-radius:999px">${escapeHtml(cta)}</a>
    </td></tr>` : "";
  const otp = code ? `
    <tr><td style="padding:26px 0 6px">
      <div style="display:inline-block;background:#f4f4f0;border-radius:16px;padding:16px 26px;font:800 32px/1 ${FONT};letter-spacing:6px;color:#111111">${escapeHtml(code)}</div>
    </td></tr>` : "";
  const fallback = link ? `
    <tr><td style="padding:22px 0 0;font:400 13px/1.55 ${FONT};color:#8a8a85">
      Der Button funktioniert nicht? Kopiere diesen Link in deinen Browser:<br>
      <a href="${link}" style="color:#111111;word-break:break-all">${escapeHtml(link)}</a>
    </td></tr>` : "";
  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f4f4f0">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0"><tr><td align="center" style="padding:40px 16px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
    <tr><td style="padding:0 8px 22px">
      <a href="${env.appUrl}" style="text-decoration:none"><img src="${env.appUrl}/email/qlick-logo.png" width="92" height="32" alt="${site.name}" style="display:block;border:0"></a>
    </td></tr>
    <tr><td style="background:#ffffff;border-radius:24px;padding:40px 36px;border:1px solid #e8e8e2">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td><div style="width:44px;height:6px;border-radius:6px;background:#c8ff2e"></div></td></tr>
        <tr><td style="padding:22px 0 0;font:800 28px/1.15 ${FONT};color:#111111;letter-spacing:-0.5px">${escapeHtml(title)}</td></tr>
        <tr><td style="padding:14px 0 0;font:400 16px/1.6 ${FONT};color:#3d3d3a">${intro}</td></tr>
        ${button}${otp}
        <tr><td style="padding:22px 0 0;font:400 14px/1.6 ${FONT};color:#6b6b66">${after}</td></tr>
        ${fallback}
      </table>
    </td></tr>
    <tr><td style="padding:24px 8px 0;font:400 12px/1.6 ${FONT};color:#8a8a85">
      ${site.name} · QR-Codes für dein Business · <a href="${env.appUrl}" style="color:#8a8a85">${site.domain}</a><br>
      Fragen? Schreib uns an <a href="mailto:${site.email}" style="color:#8a8a85">${site.email}</a> · <a href="${env.appUrl}/datenschutz" style="color:#8a8a85">Datenschutz</a>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

const plain = (lines: (string | undefined)[]) => [...lines.filter(Boolean), "", `${site.name} · ${site.domain}`].join("\n");

export function renderAuthEmail(type: AuthEmailType, o: { link?: string; code?: string; name?: string; newEmail?: string }): AuthMail {
  const hi = o.name ? `Hallo ${escapeHtml(o.name.split(" ")[0])},` : "Hallo,";
  const hiText = o.name ? `Hallo ${o.name.split(" ")[0]},` : "Hallo,";
  switch (type) {
    case "signup":
      return {
        subject: `Bestätige deine E-Mail für ${site.name}`,
        html: layout({
          preheader: "Ein Klick und dein Konto ist startklar.",
          title: "Willkommen bei Qlick",
          intro: `${hi}<br>schön, dass du da bist. Bestätige kurz deine E-Mail-Adresse, dann ist dein Konto startklar und du kannst deinen ersten Code gestalten.`,
          cta: "E-Mail bestätigen", link: o.link,
          after: "Der Link ist eine Stunde gültig. Wenn du dich nicht bei Qlick registriert hast, kannst du diese E-Mail einfach ignorieren.",
        }),
        text: plain([hiText, "", "Bestätige deine E-Mail-Adresse, dann ist dein Qlick-Konto startklar:", o.link, "", "Der Link ist eine Stunde gültig. Nicht registriert? Dann ignoriere diese E-Mail."]),
      };
    case "magiclink":
    case "email":
      return {
        subject: `Dein Anmelde-Link für ${site.name}`,
        html: layout({
          preheader: "Ein Klick und du bist angemeldet.",
          title: "Hier ist dein Anmelde-Link",
          intro: `${hi}<br>klick auf den Button und du bist bei Qlick angemeldet. Ganz ohne Passwort.`,
          cta: "Jetzt anmelden", link: o.link,
          after: "Der Link funktioniert einmal und ist eine Stunde gültig. Du hast keinen Link angefordert? Dann ignoriere diese E-Mail, dein Konto bleibt sicher.",
        }),
        text: plain([hiText, "", "Hier ist dein Anmelde-Link für Qlick:", o.link, "", "Einmal nutzbar, eine Stunde gültig. Nicht angefordert? Dann ignoriere diese E-Mail."]),
      };
    case "recovery":
      return {
        subject: `Neues Passwort für ${site.name}`,
        html: layout({
          preheader: "Setze jetzt ein neues Passwort.",
          title: "Passwort zurücksetzen",
          intro: `${hi}<br>du hast ein neues Passwort für dein Qlick-Konto angefordert. Klick auf den Button und wähle ein neues.`,
          cta: "Neues Passwort festlegen", link: o.link,
          after: "Der Link ist eine Stunde gültig. Du hast nichts angefordert? Dann ignoriere diese E-Mail, dein bisheriges Passwort bleibt bestehen.",
        }),
        text: plain([hiText, "", "Setze hier ein neues Passwort für dein Qlick-Konto:", o.link, "", "Eine Stunde gültig. Nicht angefordert? Dann ignoriere diese E-Mail."]),
      };
    case "invite":
      return {
        subject: `Du wurdest zu ${site.name} eingeladen`,
        html: layout({
          preheader: "Nimm die Einladung an und leg los.",
          title: "Du bist eingeladen",
          intro: `${hi}<br>für dich wurde ein Konto bei Qlick angelegt. Nimm die Einladung an und gestalte QR-Codes, Speisekarten und Seiten für dein Business.`,
          cta: "Einladung annehmen", link: o.link,
          after: "Du kennst Qlick nicht? Dann ignoriere diese E-Mail.",
        }),
        text: plain([hiText, "", "Du wurdest zu Qlick eingeladen:", o.link]),
      };
    case "email_change":
      return {
        subject: `Bestätige deine neue E-Mail-Adresse`,
        html: layout({
          preheader: "Bestätige die Änderung deiner E-Mail-Adresse.",
          title: "Neue E-Mail bestätigen",
          intro: `${hi}<br>bitte bestätige, dass dein Qlick-Konto künftig ${o.newEmail ? `<b>${escapeHtml(o.newEmail)}</b>` : "diese neue Adresse"} verwenden soll.`,
          cta: "Änderung bestätigen", link: o.link,
          after: "Du hast nichts geändert? Dann ignoriere diese E-Mail und schreib uns kurz an info@qlickqr.com.",
        }),
        text: plain([hiText, "", "Bestätige die Änderung deiner E-Mail-Adresse:", o.link]),
      };
    case "reauthentication":
      return {
        subject: `Dein Bestätigungscode: ${o.code ?? ""}`,
        html: layout({
          preheader: "Dein Code für Qlick.",
          title: "Dein Bestätigungscode",
          intro: `${hi}<br>gib diesen Code in Qlick ein, um die Aktion zu bestätigen.`,
          code: o.code,
          after: "Der Code ist ein paar Minuten gültig. Gib ihn niemals an andere weiter.",
        }),
        text: plain([hiText, "", `Dein Bestätigungscode: ${o.code ?? ""}`]),
      };
  }
}
