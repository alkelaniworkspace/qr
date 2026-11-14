import Link from "next/link";
import {
  ArrowRight, BarChart3, Check, Gauge, Infinity as InfinityIcon, Layers, Palette, PenLine, Printer, ShieldCheck, Sparkles,
} from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ButtonLink } from "@/components/ui/button";
import { TypeIcon } from "@/components/type-icon";
import { renderQrSvg } from "@/lib/qr/render";
import { DEFAULT_STYLE, type QrStyle } from "@/lib/qr/style";
import { CODE_TYPES, TYPE_ORDER } from "@/lib/codes/types";
import { PLANS, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/cn";

const showcase = (data: string, style: Partial<QrStyle>, id: string) =>
  renderQrSvg(data, { ...DEFAULT_STYLE, ...style } as QrStyle, { size: 360, id });

const HERO = [
  showcase("https://scanwerk.de/r/menu", {
    dots: "fluid", eyeFrame: "rounded", eyeBall: "circle", fill: { type: "solid", color: "#14130f" },
    frame: { style: "label", text: "SPEISEKARTE", color: "#14130f", textColor: "#d9c49a" },
  }, "h1"),
  showcase("https://scanwerk.de/r/gold", {
    dots: "classy", eyeFrame: "leaf", eyeBall: "leaf", fill: { type: "linear", colors: ["#d9c49a", "#a8823f"], rotation: 45 }, background: "#14130f", margin: 2,
  }, "h2"),
  showcase("https://scanwerk.de/r/green", {
    dots: "dots", eyeFrame: "circle", eyeBall: "circle", fill: { type: "radial", colors: ["#1f6b4f", "#0b2a20"], rotation: 0 },
    frame: { style: "card", text: "Bewerte uns", color: "#0b2a20", textColor: "#ffffff" },
  }, "h3"),
];

const FEATURES = [
  { icon: Palette, title: "Design-Studio", text: "Sechs Muster, eigene Ecken, Farbverläufe, Logo mit Freistellung, Rahmen mit Text. Dein Code sieht aus wie deine Marke." },
  { icon: Gauge, title: "Echter Lesbarkeitstest", text: "Jede Änderung wird sofort mit einem echten QR-Scanner geprüft. Du druckst nie wieder einen Code, der nicht funktioniert." },
  { icon: PenLine, title: "Später ändern", text: "Neue Speisekarte, neue Aktion, neuer Link: Inhalt ändern, gedruckter Code bleibt gleich." },
  { icon: Layers, title: "Seiten ohne Website", text: "Speisekarte, Visitenkarte, Link-Seite, Gutschein, Event oder PDF. Elegant gestaltet, fertig für das Handy." },
  { icon: BarChart3, title: "Statistik ohne Cookies", text: "Scans pro Tag, Uhrzeit, Gerät und Stadt. Ohne Cookies und ohne gespeicherte IP-Adressen." },
  { icon: Printer, title: "Druckfertig", text: "PNG bis 4096 Pixel und SVG als Vektor für Druckerei, Schild und Fahrzeugbeschriftung." },
];

const PROMISES = [
  { icon: InfinityIcon, title: "Für immer aktiv", text: "Wir schalten keinen Code ab. Auch nicht nach einer Kündigung. Dein Druck bleibt gültig." },
  { icon: ShieldCheck, title: "Keine Werbung, keine Umwege", text: "Zwischen Scan und Ziel steht nichts: keine Anzeige, keine Abo-Falle, kein Pop-up." },
  { icon: Sparkles, title: "Geprüfte Ziele", text: "Links werden auf Phishing und Schadsoftware geprüft. Wer deinen Code scannt, ist sicher." },
];

export default function Home() {
  return (
    <>
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grain opacity-60" />
        <div className="pointer-events-none absolute -right-40 -top-40 size-[640px] rounded-full bg-gold-soft/25 blur-3xl" />
        <SiteHeader />

        {/* Hero */}
        <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-10 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:pt-16">
          <div className="animate-rise">
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-3.5 py-1.5 text-xs font-medium text-ink-soft backdrop-blur">
              <span className="size-1.5 rounded-full bg-success" /> Für Gastronomie, Handel, Handwerk und Agenturen
            </p>
            <h1 className="mt-6 font-display text-[3.4rem] leading-[0.98] tracking-tight sm:text-7xl lg:text-[5.4rem]">
              QR-Codes in <em className="text-gold">Manufaktur-</em>Qualität.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
              Gestalte Codes, die zu deiner Marke passen, ändere ihren Inhalt jederzeit und sieh, wer scannt.
              Und das Wichtigste: Sie funktionieren für immer.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <ButtonLink href="/signup" size="lg">Kostenlos starten <ArrowRight className="size-4" /></ButtonLink>
              <ButtonLink href="/create" variant="secondary" size="lg">Ohne Anmeldung testen</ButtonLink>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              {["Keine Kreditkarte", "Codes laufen für immer", "Ohne Cookies gemessen"].map((t) => (
                <li key={t} className="flex items-center gap-1.5"><Check className="size-4 text-gold" /> {t}</li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto h-[460px] w-full max-w-[520px] sm:h-[520px]">
            <div className="absolute left-0 top-6 w-[50%] -rotate-6 rounded-[28px] border border-line bg-white p-5 shadow-lift transition duration-500 hover:rotate-0 [&>div>svg]:h-auto [&>div>svg]:w-full">
              <div dangerouslySetInnerHTML={{ __html: HERO[0] }} />
            </div>
            <div className="absolute right-0 top-0 w-[44%] rotate-[5deg] rounded-[28px] bg-ink p-4 shadow-lift transition duration-500 hover:rotate-0 [&>div>svg]:h-auto [&>div>svg]:w-full">
              <div dangerouslySetInnerHTML={{ __html: HERO[1] }} />
            </div>
            <div className="absolute bottom-0 right-[4%] w-[44%] rotate-[3deg] rounded-[28px] border border-line bg-white p-4 shadow-lift transition duration-500 hover:rotate-0 [&>div>svg]:h-auto [&>div>svg]:w-full">
              <div dangerouslySetInnerHTML={{ __html: HERO[2] }} />
            </div>
          </div>
        </section>
      </div>

      {/* Promise */}
      <section id="versprechen" className="bg-ink text-paper">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold-soft">Unser Versprechen</p>
          <h2 className="mt-4 max-w-3xl font-display text-5xl leading-tight sm:text-6xl">
            Andere schalten deine Codes ab, wenn du nicht zahlst. <em className="text-gold-soft">Wir nicht.</em>
          </h2>
          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-3">
            {PROMISES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="bg-ink p-8">
                <Icon className="size-7 text-gold-soft" strokeWidth={1.4} />
                <h3 className="mt-6 text-lg font-medium">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-paper/65">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="funktionen" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">Funktionen</p>
          <h2 className="mt-4 font-display text-5xl leading-tight sm:text-6xl">Alles, was ein guter Code braucht.</h2>
        </div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-3xl border border-line bg-white p-7 transition hover:-translate-y-1 hover:shadow-lift">
              <span className="grid size-11 place-items-center rounded-2xl bg-sand"><Icon className="size-5" strokeWidth={1.6} /></span>
              <h3 className="mt-6 text-lg font-medium">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-[32px] border border-line bg-sand/50 p-8 sm:p-10">
          <h3 className="font-display text-3xl">15 Code-Typen</h3>
          <div className="mt-6 flex flex-wrap gap-2">
            {TYPE_ORDER.map((t) => (
              <Link
                key={t}
                href={CODE_TYPES[t].modes.includes("static") ? "/create" : "/signup"}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm transition hover:border-ink/30"
              >
                <TypeIcon name={CODE_TYPES[t].icon} className="size-4" /> {CODE_TYPES[t].label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="preise" className="border-t border-line bg-white/60">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">Preise</p>
            <h2 className="mt-4 font-display text-5xl leading-tight sm:text-6xl">Ehrliche Preise. Ohne Falle.</h2>
            <p className="mt-4 text-muted">Monatlich kündbar. Statische Codes sind immer kostenlos und unbegrenzt.</p>
          </div>
          <div className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {(Object.keys(PLANS) as PlanId[]).map((id) => {
              const p = PLANS[id];
              const featured = id === "business";
              return (
                <div key={id} className={cn("flex flex-col rounded-3xl border p-7", featured ? "border-ink bg-ink text-paper shadow-lift" : "border-line bg-white")}>
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{p.label}</p>
                    {featured && <span className="rounded-full bg-gold-soft/20 px-2.5 py-1 text-[11px] font-medium text-gold-soft">Beliebt</span>}
                  </div>
                  <p className="mt-4 font-display text-6xl leading-none">{p.price} €</p>
                  <p className={cn("mt-1 text-sm", featured ? "text-paper/60" : "text-muted")}>pro Monat</p>
                  <ul className="mt-7 flex-1 space-y-3 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2.5"><Check className={cn("mt-0.5 size-4 shrink-0", featured ? "text-gold-soft" : "text-gold")} /> {f}</li>
                    ))}
                  </ul>
                  <ButtonLink href="/signup" variant={featured ? "gold" : "secondary"} className="mt-8 w-full">
                    {p.price === 0 ? "Kostenlos starten" : "Auswählen"}
                  </ButtonLink>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-7xl px-5 py-24 sm:px-8">
        <div className="relative overflow-hidden rounded-[40px] bg-ink px-8 py-16 text-center text-paper sm:px-16">
          <div className="pointer-events-none absolute -left-20 -top-20 size-80 rounded-full bg-gold/20 blur-3xl" />
          <h2 className="relative font-display text-5xl leading-tight sm:text-6xl">Dein nächster Code verdient mehr <br className="hidden sm:block" />als Schwarz auf Weiß.</h2>
          <div className="relative mt-9 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/signup" variant="gold" size="lg">Jetzt kostenlos starten</ButtonLink>
            <ButtonLink href="/create" size="lg" className="bg-white/10 text-paper hover:bg-white/20">Studio ansehen</ButtonLink>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
