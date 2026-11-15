import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Ban, Check, Cookie, Infinity as InfinityIcon, Lock, Minus, Plus, Printer, RefreshCcw, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PricingPlans } from "@/components/marketing/pricing-plans";
import { FOUNDER, PLANS, type PlanId } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Preise",
  description: "Statische QR-Codes für immer kostenlos. Dynamische Codes, Speisekarten, Formulare und Statistik ab 3,99 € im Monat. Monatlich kündbar.",
};

const ALWAYS = [
  { icon: InfinityIcon, title: "Statische Codes unbegrenzt", text: "Kostenlos, ohne Konto, ohne Ablaufdatum." },
  { icon: Printer, title: "Gedruckt bleibt gedruckt", text: "Codes funktionieren auch nach einer Kündigung." },
  { icon: Cookie, title: "Statistik ohne Cookies", text: "Kein Banner, keine Profile, DSGVO-konform." },
  { icon: Lock, title: "Ohne Konto nutzbar", text: "Statische Codes direkt im Browser erstellen." },
  { icon: RefreshCcw, title: "Monatlich kündbar", text: "Mit einem Klick, ohne Mindestlaufzeit." },
  { icon: Ban, title: "Keine Werbung", text: "Weder auf deinen Seiten noch beim Scannen." },
];

type Cell = boolean | string;
const ROWS: { group: string; rows: [string, Record<PlanId, Cell>][] }[] = [
  { group: "Codes", rows: [
    ["Statische QR-Codes", { free: "Unbegrenzt", start: "Unbegrenzt", pro: "Unbegrenzt", business: "Unbegrenzt" }],
    ["Dynamische QR-Codes", { free: String(PLANS.free.dynamic), start: String(PLANS.start.dynamic), pro: String(PLANS.pro.dynamic), business: "Unbegrenzt" }],
    ["Ziel jederzeit ändern", { free: true, start: true, pro: true, business: true }],
    ["Alle Designs, Rahmen, Logos", { free: true, start: true, pro: true, business: true }],
    ["Ohne Qlick-Branding", { free: false, start: true, pro: true, business: true }],
  ] },
  { group: "Seiten & Inhalte", rows: [
    ["Speisekarte, Link-Seite, Visitenkarte, Event", { free: true, start: true, pro: true, business: true }],
    ["20 Speisekarten-Vorlagen", { free: true, start: true, pro: true, business: true }],
    ["Speisekarten-Import per Link", { free: false, start: false, pro: true, business: true }],
    ["Formulare", { free: "1", start: "3", pro: "Unbegrenzt", business: "Unbegrenzt" }],
    ["Antworten pro Monat", { free: "100", start: "1.000", pro: "Unbegrenzt", business: "Unbegrenzt" }],
    ["Event-Anmeldung mit E-Mail-Bestätigung", { free: true, start: true, pro: true, business: true }],
  ] },
  { group: "Druck & Video", rows: [
    ["Poster A6 bis A0 (PDF)", { free: true, start: true, pro: true, business: true }],
    ["Sticker mit Schnittkante (SVG, PDF)", { free: true, start: true, pro: true, business: true }],
    ["Animation als MP4", { free: true, start: true, pro: true, business: true }],
  ] },
  { group: "Statistik", rows: [
    ["Aufbewahrung", { free: `${PLANS.free.statsDays} Tage`, start: `${PLANS.start.statsDays} Tage`, pro: "2 Jahre", business: "2 Jahre" }],
    ["Export Excel / PDF", { free: false, start: false, pro: true, business: true }],
    ["Wochenbericht per E-Mail", { free: false, start: false, pro: true, business: true }],
  ] },
  { group: "Team", rows: [
    ["Mehrere Standorte und Marken", { free: false, start: false, pro: false, business: true }],
    ["Team-Mitglieder", { free: "1", start: "1", pro: "1", business: "5" }],
    ["Eigene Domain, White Label", { free: false, start: false, pro: false, business: true }],
  ] },
];

const FAQ = [
  ["Was ist der Unterschied zwischen statisch und dynamisch?", "Ein statischer Code enthält den Inhalt direkt, zum Beispiel deine Website oder dein WLAN. Er ist für immer kostenlos und funktioniert ohne uns. Ein dynamischer Code führt über einen kurzen Link: Du kannst das Ziel später ändern, ohne neu zu drucken, und siehst, wie oft gescannt wurde."],
  ["Was passiert mit gedruckten Codes, wenn ich kündige?", "Gedruckte Codes funktionieren auch nach einer Kündigung weiter. Statische Codes brauchen uns ohnehin nicht, sie enthalten den Inhalt direkt."],
  ["Wie funktioniert das Gründer-Angebot?", `Die ersten ${FOUNDER.seats} zahlenden Kunden erhalten ${FOUNDER.discount} % Rabatt auf ihren Tarif, für immer, solange das Abo läuft. Der Rabatt wird automatisch angewendet.`],
  ["Brauche ich eine Kreditkarte für den Test?", "Nein. Du testest 14 Tage alle Funktionen deines Tarifs. Danach entscheidest du, ob du bleibst."],
  ["Kann ich den Tarif wechseln?", "Ja, jederzeit im Dashboard unter Tarif & Rechnungen."],
];

function CellView({ v, hero }: { v: Cell; hero: boolean }) {
  if (v === true) return <span className={hero ? "text-lime-ink" : "text-fg"}><Check className="mx-auto size-[18px]" strokeWidth={2.5} /></span>;
  if (v === false) return <Minus className="mx-auto size-4 text-faint/50" />;
  return <span className={hero ? "font-semibold text-fg" : "text-fg/80"}>{v}</span>;
}

export default function PricingPage() {
  const ids = Object.keys(PLANS) as PlanId[];
  return (
    <>
      <SiteHeader />
      <main className="pr-page relative flex-1 overflow-hidden">
        <div aria-hidden className="pr-aurora pointer-events-none absolute inset-x-0 top-0 h-[900px]" />
        <div aria-hidden className="pr-grid pointer-events-none absolute inset-x-0 top-0 h-[700px]" />

        {/* hero */}
        <section className="relative mx-auto max-w-[1320px] px-5 pb-6 pt-20 text-center sm:px-8 sm:pt-28">
          <Link href="/signup" className="group inline-flex items-center gap-2 card !rounded-full py-1.5 pl-1.5 pr-4 text-[13px] text-dim transition hover:text-fg">
            <span className="rounded-full bg-lime whitespace-nowrap px-2.5 py-0.5 text-[12px] font-bold text-[#0a0a0b] shadow-[0_0_18px_-2px_rgb(189_251_4/0.7)]">−{FOUNDER.discount} %</span>
            Gründer-Angebot für die ersten {FOUNDER.seats} Kunden, für immer
            <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
          </Link>
          <h1 className="font-display mx-auto mt-8 max-w-4xl text-[46px] leading-[0.98] sm:text-[84px]">
            Ein fairer Preis.<br />Kein <span className="glow-text">Kleingedrucktes.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-dim">
            Statische Codes kosten nichts, für immer. Bezahlt wird nur, was mitwächst: dynamische Codes, Seiten, Formulare und Statistik.
          </p>
        </section>

        <section className="relative mx-auto max-w-[1320px] px-5 pb-24 pt-10 sm:px-8">
          <PricingPlans />
          <p className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-faint">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-4" /> Alle Preise inkl. MwSt.</span>
            <span className="inline-flex items-center gap-1.5"><BadgeCheck className="size-4" /> 14 Tage gratis, ohne Kreditkarte</span>
            <span className="inline-flex items-center gap-1.5"><RefreshCcw className="size-4" /> Monatlich kündbar</span>
          </p>
        </section>

        {/* always included */}
        <section className="relative border-y border-edge bg-hi/[0.02]">
          <div className="mx-auto max-w-[1320px] px-5 py-20 sm:px-8">
            <h2 className="font-display text-[32px] leading-tight sm:text-[44px]">In jedem Tarif enthalten</h2>
            <div className="mt-10 grid gap-px overflow-hidden rounded-[24px] border border-edge bg-edge sm:grid-cols-2 lg:grid-cols-3">
              {ALWAYS.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-4 bg-solid p-6">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-edge-strong bg-hi/[0.05] text-lime-ink"><Icon className="size-5" /></span>
                  <span>
                    <span className="block text-[16px] font-semibold">{title}</span>
                    <span className="mt-1 block text-[14px] leading-relaxed text-dim">{text}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* comparison */}
        <section className="relative mx-auto max-w-[1320px] px-5 py-24 sm:px-8">
          <h2 className="font-display text-[32px] leading-tight sm:text-[44px]">Alle Funktionen im Vergleich</h2>
          <div className="mt-10 overflow-x-auto rounded-[24px] border border-edge [scrollbar-width:thin]">
            <table className="w-full min-w-[760px] border-collapse text-[14px]">
              <thead>
                <tr className="sticky top-0 bg-solid">
                  <th className="w-[34%] p-5 text-left font-medium text-faint">Funktion</th>
                  {ids.map((id) => (
                    <th key={id} className={`p-5 text-center ${id === "pro" ? "bg-lime/[0.14]" : ""}`}>
                      <span className={`font-display block text-[18px] ${id === "pro" ? "text-lime-ink" : ""}`}>{PLANS[id].label}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((g) => (
                  <Fragment key={g.group}>
                    <tr><td colSpan={5} className="border-t border-edge px-5 pb-2 pt-6 text-[12px] font-semibold text-lime-ink">{g.group}</td></tr>
                    {g.rows.map(([label, cells]) => (
                      <tr key={label} className="border-t border-edge transition hover:bg-hi/[0.03]">
                        <td className="px-5 py-3.5 text-fg/80">{label}</td>
                        {ids.map((id) => <td key={id} className={`px-5 py-3.5 text-center ${id === "pro" ? "bg-lime/[0.07]" : ""}`}><CellView v={cells[id]} hero={id === "pro"} /></td>)}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* faq */}
        <section className="relative mx-auto grid max-w-[1320px] gap-10 px-5 pb-24 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="font-display text-[32px] leading-tight sm:text-[44px]">Häufige Fragen</h2>
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-dim">Noch etwas offen? Schreib uns an <a href="mailto:hallo@qlick.codes" className="text-fg underline decoration-edge-strong underline-offset-4">hallo@qlick.codes</a>.</p>
          </div>
          <div className="divide-y divide-edge border-y border-edge">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[16px] font-medium">
                  {q}
                  <span className="grid size-8 shrink-0 place-items-center rounded-full border border-edge-strong transition group-open:rotate-45 group-open:border-lime group-open:bg-lime group-open:text-[#0a0a0b]"><Plus className="size-4" /></span>
                </summary>
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-dim">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* cta */}
        <section className="relative mx-auto max-w-[1320px] px-5 pb-28 sm:px-8">
          <div className="pr-spot relative overflow-hidden rounded-[36px] bg-[#0e0e0f] px-8 py-20 text-center text-white sm:px-16">
            <div aria-hidden className="pr-aurora absolute inset-0 opacity-80" />
            <h2 className="font-display relative text-[40px] leading-[1] sm:text-[64px]">Bereit, wenn <span className="text-lime [text-shadow:0_0_40px_rgb(189_251_4/0.5)]">du</span> es bist.</h2>
            <p className="relative mx-auto mt-5 max-w-md text-[17px] text-white/65">Starte kostenlos. Upgrade erst, wenn du mehr brauchst.</p>
            <div className="relative mt-9 flex flex-wrap justify-center gap-3">
              <Link href="/studio" className="pr-cta inline-flex h-12 items-center gap-2 rounded-full px-6 text-[15px] font-semibold">Kostenlos starten <ArrowRight className="size-4" /></Link>
              <Link href="/signup?plan=pro" className="inline-flex h-12 items-center rounded-full border border-white/20 px-6 text-[15px] font-semibold text-white hover:bg-white/10">Pro 14 Tage testen</Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
