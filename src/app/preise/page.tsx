import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Ban, Check, Cookie, Infinity as InfinityIcon, Lock, Minus, Plus, Printer, RefreshCcw, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PricingPlans } from "@/components/marketing/pricing-plans";
import { FOUNDER, PLANS, SALES_EMAIL, type PlanId } from "@/lib/plans";
import { getT } from "@/lib/i18n-server";
import type { Translate } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { T } = await getT();
  return {
    title: T("Preise", "Pricing"),
    description: T(
      "Statische QR-Codes für immer kostenlos. Dynamische Codes, Speisekarten, Formulare und Statistik ab 3,99 € im Monat. Monatlich kündbar.",
      "Static QR codes free forever. Dynamic codes, menus, forms and statistics from €3.99 a month. Cancel monthly.",
    ),
  };
}

type Cell = boolean | string;

function content(T: Translate) {
  const all = T("Unbegrenzt", "Unlimited");
  const always = [
    { icon: InfinityIcon, title: T("Statische Codes unbegrenzt", "Unlimited static codes"), text: T("Kostenlos, ohne Konto, ohne Ablaufdatum.", "Free, no account, no expiry.") },
    { icon: Printer, title: T("Gedruckt bleibt gedruckt", "Printed stays printed"), text: T("Codes funktionieren auch nach einer Kündigung.", "Codes keep working after you cancel.") },
    { icon: Cookie, title: T("Statistik ohne Cookies", "Cookie-free statistics"), text: T("Kein Banner, keine Profile, DSGVO-konform.", "No banner, no profiles, GDPR-compliant.") },
    { icon: Lock, title: T("Ohne Konto nutzbar", "No account needed"), text: T("Statische Codes direkt im Browser erstellen.", "Create static codes right in the browser.") },
    { icon: RefreshCcw, title: T("Monatlich kündbar", "Cancel monthly"), text: T("Mit einem Klick, ohne Mindestlaufzeit.", "One click, no minimum term.") },
    { icon: Ban, title: T("Keine Werbung", "No ads"), text: T("Weder auf deinen Seiten noch beim Scannen.", "Not on your pages, not when scanning.") },
  ];
  const rows: { group: string; rows: [string, Record<PlanId, Cell>][] }[] = [
    { group: "Codes", rows: [
      [T("Statische QR-Codes", "Static QR codes"), { free: all, start: all, pro: all, business: all }],
      [T("Dynamische QR-Codes", "Dynamic QR codes"), { free: String(PLANS.free.dynamic), start: String(PLANS.start.dynamic), pro: String(PLANS.pro.dynamic), business: String(PLANS.business.dynamic) }],
      [T("Mehr als 150 Codes", "More than 150 codes"), { free: false, start: false, pro: false, business: T("Auf Anfrage", "On request") }],
      [T("Ziel jederzeit ändern", "Change the target any time"), { free: true, start: true, pro: true, business: true }],
      [T("Alle Designs, Rahmen, Logos", "All designs, frames, logos"), { free: true, start: true, pro: true, business: true }],
      [T("Ohne Qlick-Branding", "No Qlick branding"), { free: false, start: true, pro: true, business: true }],
    ] },
    { group: T("Seiten & Inhalte", "Pages & content"), rows: [
      [T("Speisekarte, Link-Seite, Visitenkarte, Event", "Menu, link page, business card, event"), { free: true, start: true, pro: true, business: true }],
      [T("20 Speisekarten-Vorlagen", "20 menu templates"), { free: true, start: true, pro: true, business: true }],
      [T("Speisekarten-Import per Link", "Menu import from a link"), { free: false, start: false, pro: true, business: true }],
      [T("Formulare", "Forms"), { free: "1", start: "3", pro: all, business: all }],
      [T("Antworten pro Monat", "Responses per month"), { free: "100", start: T("1.000", "1,000"), pro: all, business: all }],
      [T("Event-Anmeldung mit E-Mail-Bestätigung", "Event sign-up with email confirmation"), { free: true, start: true, pro: true, business: true }],
    ] },
    { group: T("Druck & Video", "Print & video"), rows: [
      [T("Poster A6 bis A0 (PDF)", "Posters A6 to A0 (PDF)"), { free: true, start: true, pro: true, business: true }],
      [T("Sticker mit Schnittkante (SVG, PDF)", "Stickers with cut line (SVG, PDF)"), { free: true, start: true, pro: true, business: true }],
      [T("Animation als MP4", "Animation as MP4"), { free: true, start: true, pro: true, business: true }],
    ] },
    { group: T("Statistik", "Statistics"), rows: [
      [T("Aufbewahrung", "Retention"), { free: T("30 Tage", "30 days"), start: T("90 Tage", "90 days"), pro: T("2 Jahre", "2 years"), business: T("2 Jahre", "2 years") }],
      [T("Export Excel / PDF", "Export Excel / PDF"), { free: false, start: false, pro: true, business: true }],
      [T("Wochenbericht per E-Mail", "Weekly email report"), { free: false, start: false, pro: true, business: true }],
    ] },
    { group: "Team", rows: [
      [T("Mehrere Standorte und Marken", "Several locations and brands"), { free: false, start: false, pro: false, business: true }],
      [T("Team-Mitglieder", "Team members"), { free: "1", start: "1", pro: "1", business: "5" }],
      [T("Eigene Domain, White Label", "Custom domain, white label"), { free: false, start: false, pro: false, business: true }],
    ] },
  ];
  const faq: [string, string][] = [
    [T("Was ist der Unterschied zwischen statisch und dynamisch?", "What is the difference between static and dynamic?"),
     T("Ein statischer Code enthält den Inhalt direkt, zum Beispiel deine Website oder dein WLAN. Er ist für immer kostenlos und funktioniert ohne uns. Ein dynamischer Code führt über einen kurzen Link: Du kannst das Ziel später ändern, ohne neu zu drucken, und siehst, wie oft gescannt wurde.",
       "A static code contains the content itself, for example your website or your Wi-Fi. It is free forever and works without us. A dynamic code goes through a short link: you can change the target later without reprinting, and you see how often it was scanned.")],
    [T("Was passiert mit gedruckten Codes, wenn ich kündige?", "What happens to printed codes if I cancel?"),
     T("Gedruckte Codes funktionieren auch nach einer Kündigung weiter. Statische Codes brauchen uns ohnehin nicht, sie enthalten den Inhalt direkt.", "Printed codes keep working after you cancel. Static codes don't need us anyway, they contain the content directly.")],
    [T("Ich brauche mehr als 150 Codes.", "I need more than 150 codes."),
     T(`Schreib uns an ${SALES_EMAIL}. Du bekommst ein Angebot nach Anzahl, mit Mengenpreis und persönlicher Einrichtung.`, `Write to ${SALES_EMAIL}. You get an offer based on quantity, with volume pricing and personal onboarding.`)],
    [T("Wie funktioniert das Gründer-Angebot?", "How does the founder offer work?"),
     T(`Die ersten ${FOUNDER.seats} zahlenden Kunden erhalten ${FOUNDER.discount} % Rabatt auf ihren Tarif, für immer, solange das Abo läuft. Der Rabatt wird automatisch angewendet.`, `The first ${FOUNDER.seats} paying customers get ${FOUNDER.discount}% off their plan, forever, as long as the subscription runs. The discount is applied automatically.`)],
    [T("Brauche ich eine Kreditkarte für den Test?", "Do I need a credit card for the trial?"),
     T("Nein. Du testest 14 Tage alle Funktionen deines Tarifs. Danach entscheidest du, ob du bleibst.", "No. You try every feature of your plan for 14 days, then decide whether to stay.")],
    [T("Kann ich den Tarif wechseln?", "Can I change my plan?"), T("Ja, jederzeit im Dashboard unter Tarif & Rechnungen.", "Yes, any time in the dashboard under Plan & billing.")],
  ];
  return { always, rows, faq };
}

function CellView({ v, hero, biz }: { v: Cell; hero: boolean; biz: boolean }) {
  if (v === true) return <span className={hero ? "text-lime-ink" : biz ? "text-[#e2294f]" : "text-fg"}><Check className="mx-auto size-[18px]" strokeWidth={2.5} /></span>;
  if (v === false) return <Minus className="mx-auto size-4 text-faint/50" />;
  return <span className={hero || biz ? "font-semibold text-fg" : "text-fg/80"}>{v}</span>;
}

export default async function PricingPage() {
  const { T } = await getT();
  const { always, rows, faq } = content(T);
  const ids = Object.keys(PLANS) as PlanId[];
  return (
    <>
      <SiteHeader />
      <main className="pr-page relative flex-1 overflow-hidden">
        <div aria-hidden className="pr-aurora pointer-events-none absolute inset-x-0 top-0 h-[900px]" />
        <div aria-hidden className="pr-grid pointer-events-none absolute inset-x-0 top-0 h-[700px]" />

        {/* hero */}
        <section className="relative mx-auto max-w-[1320px] px-5 pb-6 pt-20 text-center sm:px-8 sm:pt-28">
          <Link href="/signup" className="rise group inline-flex items-center gap-2 card !rounded-full py-1.5 pl-1.5 pr-4 text-[13px] text-dim transition hover:text-fg">
            <span className="whitespace-nowrap rounded-full bg-lime px-2.5 py-0.5 text-[12px] font-bold text-[#0a0a0b] shadow-[0_0_18px_-2px_rgb(189_251_4/0.7)]">−{FOUNDER.discount} %</span>
            {T(`Gründer-Angebot für die ersten ${FOUNDER.seats} Kunden, für immer`, `Founder offer for the first ${FOUNDER.seats} customers, forever`)}
            <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
          </Link>
          <h1 className="rise font-display mx-auto mt-8 max-w-4xl text-[46px] leading-[0.98] sm:text-[84px]" style={{ animationDelay: "80ms" }}>
            {T("Ein fairer Preis.", "A fair price.")}<br />{T("Kein", "No")} <span className="glow-text shimmer-text">{T("Kleingedrucktes.", "fine print.")}</span>
          </h1>
          <p className="rise mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-dim" style={{ animationDelay: "160ms" }}>
            {T("Statische Codes kosten nichts, für immer. Bezahlt wird nur, was mitwächst: dynamische Codes, Seiten, Formulare und Statistik.", "Static codes cost nothing, forever. You only pay for what grows with you: dynamic codes, pages, forms and statistics.")}
          </p>
        </section>

        <section className="relative mx-auto max-w-[1320px] px-5 pb-24 pt-10 sm:px-8">
          <PricingPlans />
          <p className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-faint">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-4" /> {T("Alle Preise inkl. MwSt.", "All prices incl. VAT")}</span>
            <span className="inline-flex items-center gap-1.5"><BadgeCheck className="size-4" /> {T("14 Tage gratis, ohne Kreditkarte", "14 days free, no credit card")}</span>
            <span className="inline-flex items-center gap-1.5"><RefreshCcw className="size-4" /> {T("Monatlich kündbar", "Cancel monthly")}</span>
          </p>
        </section>

        {/* always included */}
        <section className="relative border-y border-edge bg-hi/[0.02]">
          <div className="mx-auto max-w-[1320px] px-5 py-20 sm:px-8">
            <h2 className="font-display text-[32px] leading-tight sm:text-[44px]">{T("In jedem Tarif enthalten", "Included in every plan")}</h2>
            <div className="mt-10 grid gap-px overflow-hidden rounded-[24px] border border-edge bg-edge sm:grid-cols-2 lg:grid-cols-3">
              {always.map(({ icon: Icon, title, text }) => (
                <div key={title} className="card-light group flex gap-4 bg-solid p-6 transition hover:bg-hi/[0.03]">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-edge-strong bg-hi/[0.05] text-lime-ink transition group-hover:scale-105 group-hover:shadow-[0_0_24px_-6px_rgb(189_251_4/0.7)]"><Icon className="size-5" /></span>
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
          <h2 className="font-display text-[32px] leading-tight sm:text-[44px]">{T("Alle Funktionen im Vergleich", "Compare all features")}</h2>
          <div className="mt-10 overflow-x-auto rounded-[24px] border border-edge [scrollbar-width:thin]">
            <table className="w-full min-w-[760px] border-collapse text-[14px]">
              <thead>
                <tr className="sticky top-0 bg-solid">
                  <th className="w-[34%] p-5 text-left font-medium text-faint">{T("Funktion", "Feature")}</th>
                  {ids.map((id) => (
                    <th key={id} className={`p-5 text-center ${id === "pro" ? "bg-lime/[0.14]" : id === "business" ? "bg-[#e2294f]/[0.1]" : ""}`}>
                      <span className={`font-display block text-[18px] ${id === "pro" ? "text-lime-ink" : id === "business" ? "text-[#e2294f]" : ""}`}>{PLANS[id].label}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((g) => (
                  <Fragment key={g.group}>
                    <tr><td colSpan={5} className="border-t border-edge px-5 pb-2 pt-6 text-[12px] font-semibold text-lime-ink">{g.group}</td></tr>
                    {g.rows.map(([label, cells]) => (
                      <tr key={label} className="border-t border-edge transition hover:bg-hi/[0.03]">
                        <td className="px-5 py-3.5 text-fg/80">{label}</td>
                        {ids.map((id) => <td key={id} className={`px-5 py-3.5 text-center ${id === "pro" ? "bg-lime/[0.07]" : id === "business" ? "bg-[#e2294f]/[0.05]" : ""}`}><CellView v={cells[id]} hero={id === "pro"} biz={id === "business"} /></td>)}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* faq */}
        <section id="faq" className="relative mx-auto grid max-w-[1320px] scroll-mt-24 gap-10 px-5 pb-24 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="font-display text-[32px] leading-tight sm:text-[44px]">{T("Häufige Fragen", "FAQ")}</h2>
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-dim">{T("Noch etwas offen? Schreib uns an", "Anything else? Write to")} <a href={`mailto:${SALES_EMAIL}`} className="text-fg underline decoration-edge-strong underline-offset-4">{SALES_EMAIL}</a>.</p>
          </div>
          <div className="divide-y divide-edge border-y border-edge">
            {faq.map(([q, a]) => (
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
            <h2 className="font-display relative text-[40px] leading-[1] sm:text-[64px]">{T("Bereit, wenn", "Ready when")} <span className="text-lime [text-shadow:0_0_40px_rgb(189_251_4/0.5)]">{T("du", "you")}</span> {T("es bist.", "are.")}</h2>
            <p className="relative mx-auto mt-5 max-w-md text-[17px] text-white/65">{T("Starte kostenlos. Upgrade erst, wenn du mehr brauchst.", "Start for free. Upgrade only when you need more.")}</p>
            <div className="relative mt-9 flex flex-wrap justify-center gap-3">
              <Link href="/studio" className="pr-cta inline-flex h-12 items-center gap-2 rounded-full px-6 text-[15px] font-semibold">{T("Kostenlos starten", "Start for free")} <ArrowRight className="size-4" /></Link>
              <Link href="/signup?plan=pro" className="inline-flex h-12 items-center rounded-full border border-white/20 px-6 text-[15px] font-semibold text-white hover:bg-white/10">{T("Pro 14 Tage testen", "Try Pro for 14 days")}</Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
