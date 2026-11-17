import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronDown, CreditCard, Mail, Printer, QrCode, Rocket, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Hilfe & Kontakt", description: `Antworten zu ${site.name}: QR-Codes, Druck, Konto, Tarife und Datenschutz.` };

const TOPICS = [
  { icon: Rocket, title: "Erste Schritte", items: [
    ["Was ist der Unterschied zwischen statischen und dynamischen Codes?", "Ein statischer Code enthält den Inhalt direkt (z. B. WLAN-Daten) und funktioniert für immer, ganz ohne Konto. Ein dynamischer Code zeigt auf einen Kurzlink. So kannst du den Inhalt später ändern, ohne neu zu drucken, und siehst, wie oft gescannt wurde."],
    ["Brauche ich ein Konto?", "Für statische Codes nicht. Für dynamische Codes, Speisekarten, Seiten und Statistiken legst du ein kostenloses Konto an, mit Google oder per E-Mail."],
    ["Wie erstelle ich meine Speisekarte?", "Im Studio wählst du „Speisekarte“, suchst dir eine Vorlage aus und trägst Kategorien, Gerichte, Preise und Fotos ein. Die Vorschau rechts zeigt dir live, wie es auf dem Handy aussieht."],
  ] },
  { icon: QrCode, title: "Codes & Inhalte", items: [
    ["Kann ich den Inhalt nach dem Druck ändern?", "Ja, bei dynamischen Codes jederzeit. Der gedruckte Code bleibt gleich, nur das Ziel ändert sich."],
    ["Mein Code funktioniert nicht. Was tun?", "Prüfe, ob der Code pausiert oder im Papierkorb ist. Achte beim Druck auf genug Kontrast und eine Mindestgröße von etwa 2 × 2 cm. Unser Studio testet jedes Design automatisch auf Lesbarkeit."],
    ["Ich habe einen Code gelöscht. Ist er weg?", "Gelöschte Codes liegen 30 Tage im Papierkorb unter „Meine Codes“. Dort kannst du sie wiederherstellen."],
  ] },
  { icon: Printer, title: "Druck & Video", items: [
    ["Welche Formate kann ich herunterladen?", "PNG, SVG und PDF für den Code, dazu Poster von A6 bis A0, Sticker mit Schnittkante und eine Animation als MP4 für Social Media und Bildschirme."],
    ["Welches Format nimmt meine Druckerei?", "Am besten das PDF oder SVG. Beide sind Vektorformate und bleiben in jeder Größe scharf."],
  ] },
  { icon: CreditCard, title: "Konto & Tarif", items: [
    ["Wie kündige ich?", "Unter „Tarif & Rechnungen“ mit einem Klick, oder ohne Anmeldung über „Verträge hier kündigen“. Dein Konto läuft danach kostenlos im Free-Tarif weiter."],
    ["Was passiert mit meinen Codes nach einer Kündigung?", "Sie funktionieren weiter. Du kannst nur keine neuen dynamischen Codes über dem Free-Limit mehr anlegen."],
    ["Bekomme ich Rechnungen mit USt-IdNr.?", "Ja. Firmenname, Adresse und USt-IdNr. gibst du beim Bezahlen an. Alle Rechnungen findest du unter „Tarif & Rechnungen“."],
  ] },
  { icon: ShieldCheck, title: "Datenschutz & Sicherheit", items: [
    ["Setzt Qlick Cookies bei meinen Gästen?", "Nein. Die Scan-Statistik kommt ohne Cookies aus und speichert keine IP-Adressen. Ein Cookie-Banner brauchst du dafür nicht."],
    ["Wo liegen meine Daten?", "Bei unseren Dienstleistern mit Auftragsverarbeitungsvertrag. Details stehen in der Datenschutzerklärung. Du kannst alle Daten jederzeit in den Einstellungen herunterladen oder dein Konto löschen."],
  ] },
];

export default function HelpPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-16 sm:px-8">
        <p className="text-sm font-semibold text-dim">Hilfe</p>
        <h1 className="mt-2 font-display text-5xl leading-[0.95] sm:text-6xl">Wie können wir helfen?</h1>
        <p className="mt-4 max-w-xl text-[16px] text-dim">Die wichtigsten Antworten auf einen Blick. Nicht dabei? Schreib uns, wir antworten in der Regel innerhalb eines Werktags.</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <a href={`mailto:${site.email}`} className="card group p-6 transition hover:-translate-y-0.5">
            <Mail className="size-6" />
            <p className="mt-4 font-semibold">E-Mail an uns</p>
            <p className="mt-1 text-sm text-dim">{site.email}</p>
          </a>
          <Link href="/dashboard/billing" className="card group p-6 transition hover:-translate-y-0.5">
            <CreditCard className="size-6" />
            <p className="mt-4 font-semibold">Tarif & Rechnungen</p>
            <p className="mt-1 flex items-center gap-1 text-sm text-dim">Abo, Zahlung, Rechnungen <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" /></p>
          </Link>
          <Link href="/studio" className="group rounded-[24px] bg-lime p-6 text-night transition hover:-translate-y-0.5">
            <QrCode className="size-6" />
            <p className="mt-4 font-semibold">Direkt loslegen</p>
            <p className="mt-1 flex items-center gap-1 text-sm text-night/70">Ersten Code erstellen <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" /></p>
          </Link>
        </div>

        <div className="mt-16 space-y-12">
          {TOPICS.map((t) => (
            <section key={t.title}>
              <h2 className="flex items-center gap-3 text-2xl font-bold"><span className="grid size-10 place-items-center rounded-xl bg-hi/[0.06]"><t.icon className="size-5" /></span>{t.title}</h2>
              <div className="mt-5 divide-y divide-edge rounded-[24px] border border-edge">
                {t.items.map(([q, a]) => (
                  <details key={q} className="group px-6 py-4 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">{q}<ChevronDown className="size-4 shrink-0 text-dim transition group-open:rotate-180" /></summary>
                    <p className="mt-2 text-[15px] leading-relaxed text-dim">{a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
