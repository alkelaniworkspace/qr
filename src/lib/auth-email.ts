import "server-only";
import { site } from "@/lib/site";
import { escapeHtml } from "@/lib/email";
import { mailLayout as layout } from "@/lib/mail-layout";

/** E-mail types Supabase Auth hands to the send-email hook. */
export type AuthEmailType = "signup" | "magiclink" | "recovery" | "invite" | "email_change" | "email" | "reauthentication";

export interface AuthMail { subject: string; html: string; text: string }

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
