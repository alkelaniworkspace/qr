import Link from "next/link";
import {
  ArrowRight, BarChart3, Check, Gauge, Infinity as InfinityIcon, Layers, Palette, PenLine, Printer, ShieldCheck, Sparkles, Zap,
} from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Sparkline } from "@/components/marketing/sparkline";
import { Reveal } from "@/components/motion/reveal";
import { ButtonLink } from "@/components/ui/button";
import { TypeIcon } from "@/components/type-icon";
import { renderQrSvg } from "@/lib/qr/render";
import { DEFAULT_STYLE, STYLE_PRESETS, type QrStyle } from "@/lib/qr/style";
import { CODE_TYPES, TYPE_ORDER } from "@/lib/codes/types";
import { PLANS, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/cn";

const qr = (data: string, style: Partial<QrStyle>, id: string, size = 360) =>
  renderQrSvg(data, { ...DEFAULT_STYLE, ...style } as QrStyle, { size, id });

const HERO_QR = qr("https://scanwerk.de/r/hero", STYLE_PRESETS[1].style, "hero", 420);
const PRESET_QRS = STYLE_PRESETS.map((p) => ({ ...p, svg: qr(`https://scanwerk.de/r/${p.id}`, p.style, `p-${p.id}`, 240) }));

const USE_CASES = ["Speisekarte", "Visitenkarte", "Google-Bewertungen", "WLAN", "Gutscheine", "Events", "Link-Seite", "PDF-Katalog", "App-Download", "Standort"];

const FEATURES = [
  { icon: Palette, title: "Design-Studio", text: "10 Muster, 6 × 7 Eck-Kombinationen, eigene Farben für Ecken, Logo mit Freistellung, Rahmen mit Text.", span: "lg:col-span-2", accent: true },
  { icon: Gauge, title: "Echter Scan-Test", text: "Jede Änderung wird live mit einem echten QR-Scanner geprüft. Kein kaputter Druck mehr." },
  { icon: PenLine, title: "Jederzeit ändern", text: "Neue Karte, neue Aktion: Inhalt ändern, gedruckter Code bleibt." },
  { icon: Layers, title: "Seiten ohne Website", text: "Speisekarte, Visitenkarte, Link-Seite, Gutschein, Event, PDF. Fertig fürs Handy." },
  { icon: BarChart3, title: "Statistik ohne Cookies", text: "Scans pro Tag, Uhrzeit, Gerät und Stadt. Ohne Cookies, ohne IP-Speicherung.", span: "lg:col-span-2", chart: true },
  { icon: Printer, title: "Druckfertig", text: "PNG bis 4096 px und SVG als Vektor für Druckerei, Schild und Auto." },
];

const PROMISES = [
  { icon: InfinityIcon, badge: "Für immer", title: "Kein Code wird abgeschaltet", text: "Auch nicht nach einer Kündigung. Dein Druck bleibt gültig, für immer." },
  { icon: ShieldCheck, badge: "Ohne Falle", title: "Keine Werbung, kein Umweg", text: "Zwischen Scan und Ziel steht nichts. Keine Anzeige, kein Pop-up, keine Abo-Falle." },
  { icon: Sparkles, badge: "Geprüft", title: "Sichere Ziele", text: "Links werden auf Phishing und Schadsoftware geprüft, bevor sie live gehen." },
];

export default function Home() {
  return (
    <div className="ambient">
      <SiteHeader />

      {/* ───────── Hero ───────── */}
      <section className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:pt-24">
        <div className="animate-rise">
          <p className="inline-flex items-center gap-2.5 rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1.5 text-xs font-semibold text-brand">
            <span className="size-2 rounded-full bg-brand animate-pulse-dot" />
            Codes, die nie abgeschaltet werden
          </p>
          <h1 className="mt-7 font-display text-[3.2rem] uppercase leading-[0.92] sm:text-7xl lg:text-[5.2rem]">
            QR-Codes,<br />
            <span className="text-brand glow-text">die auffallen.</span>
          </h1>
          <p className="mt-7 max-w-lg text-lg leading-relaxed text-dim">
            Gestalte Codes im Look deiner Marke, ändere den Inhalt jederzeit und sieh live, wer scannt.
            Für Restaurants, Shops, Handwerk und Agenturen.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <ButtonLink href="/studio" size="lg" className="shine">Code erstellen <ArrowRight className="size-4" /></ButtonLink>
            <ButtonLink href="/studio?type=review" variant="secondary" size="lg">Google-Bewertungs-Code</ButtonLink>
          </div>
          <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm text-dim">
            {["Keine Kreditkarte", "Statische Codes gratis", "DSGVO-freundlich"].map((t) => (
              <li key={t} className="flex items-center gap-1.5"><Check className="size-4 text-brand" /> {t}</li>
            ))}
          </ul>
        </div>

        {/* Live product composition */}
        <div className="relative mx-auto w-full max-w-[520px]">
          <div className="pointer-events-none absolute left-1/2 top-1/2 size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/20 blur-[90px] animate-breathe" />
          <div className="relative animate-float">
            <div className="card card-glow relative mx-auto w-[72%] overflow-hidden p-5">
              <div className="flex items-center justify-between">
                <span className="badge bg-brand text-on-brand">Live</span>
                <span className="text-xs text-dim">dili-grill.de/menu</span>
              </div>
              <div className="relative mt-4 overflow-hidden rounded-2xl bg-bg p-4 [&>div>svg]:h-auto [&>div>svg]:w-full">
                <div dangerouslySetInnerHTML={{ __html: HERO_QR }} />
                <div className="absolute inset-x-3 h-0.5 rounded-full bg-brand shadow-[0_0_16px_4px_rgba(212,42,78,0.7)] animate-scan" />
              </div>
            </div>
          </div>
          <div className="card absolute -bottom-16 -left-2 w-48 p-4 shadow-lift sm:-left-16" style={{ animation: "float 7s ease-in-out infinite reverse" }}>
            <p className="text-xs text-dim">Scans heute</p>
            <p className="mt-1 font-display text-3xl text-brand glow-text">+ 38 %</p>
            <Sparkline points={[3, 4, 3, 6, 5, 8, 7, 11, 10, 14]} className="mt-2 h-8 w-full" />
          </div>
          <div className="card absolute -right-2 -top-8 w-40 p-4 shadow-lift sm:-right-12" style={{ animation: "float 8s ease-in-out infinite" }}>
            <span className="badge bg-gold text-bg">Scan-Test</span>
            <p className="mt-2 font-display text-3xl">100<span className="text-base text-dim">/100</span></p>
            <p className="text-xs text-dim">Lesbarkeit geprüft</p>
          </div>
        </div>
      </section>

      {/* ───────── Marquee ───────── */}
      <div className="overflow-hidden border-y border-edge bg-surface/60 py-5">
        <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
          {[...USE_CASES, ...USE_CASES].map((u, i) => (
            <span key={i} className="flex items-center gap-10 font-display text-2xl uppercase text-dim">
              {u} <span className="size-2 rotate-45 bg-brand" />
            </span>
          ))}
        </div>
      </div>

      {/* ───────── Facts ───────── */}
      <section className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-5 py-20 sm:px-8 lg:grid-cols-4">
        {[
          ["15", "Code-Typen", "text-brand glow-text"],
          ["10", "Muster", "text-mint"],
          ["42", "Eck-Kombinationen", "text-gold"],
          ["0", "Cookies beim Scan", "text-navy-bright"],
        ].map(([n, label, color], i) => (
          <Reveal key={label} delay={i * 90}>
            <div className="card p-6">
              <p className={cn("font-display text-6xl", color)}>{n}</p>
              <p className="mt-2 text-sm text-dim">{label}</p>
            </div>
          </Reveal>
        ))}
      </section>

      {/* ───────── Features bento ───────── */}
      <section id="funktionen" className="mx-auto max-w-7xl scroll-mt-20 px-5 pb-24 sm:px-8">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Funktionen</p>
          <h2 className="mt-3 max-w-3xl font-display text-5xl uppercase leading-[0.95] sm:text-6xl">Alles, was ein starker Code braucht.</h2>
        </Reveal>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text, span, accent, chart }, i) => (
            <Reveal key={title} delay={(i % 3) * 90} className={span}>
              <div className={cn("card group relative h-full overflow-hidden p-7 transition duration-300 hover:-translate-y-1 hover:border-brand/40", accent && "card-glow")}>
                <span className={cn("grid size-12 place-items-center rounded-2xl transition", accent ? "bg-brand text-on-brand" : "bg-elevated text-brand group-hover:bg-brand group-hover:text-on-brand")}>
                  <Icon className="size-5" strokeWidth={2} />
                </span>
                <h3 className="mt-6 font-display text-2xl uppercase">{title}</h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-dim">{text}</p>
                {accent && (
                  <div className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-8">
                    {PRESET_QRS.map((p) => (
                      <div key={p.id} className="rounded-xl bg-white/5 p-1.5 transition hover:scale-110 [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: p.svg }} />
                    ))}
                  </div>
                )}
                {chart && <Sparkline points={[2, 3, 2, 5, 4, 6, 9, 7, 10, 9, 13, 15]} className="mt-6 h-16 w-full" />}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── Designs ───────── */}
      <section id="designs" className="scroll-mt-20 border-y border-edge bg-surface/40">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Designs</p>
              <h2 className="mt-3 font-display text-5xl uppercase leading-[0.95] sm:text-6xl">Kein Code sieht<br />aus wie der andere.</h2>
            </div>
            <ButtonLink href="/studio" variant="secondary">Selbst gestalten <ArrowRight className="size-4" /></ButtonLink>
          </Reveal>
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {PRESET_QRS.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 80}>
                <div className="card group p-4 transition duration-300 hover:-translate-y-1.5 hover:rotate-[-1deg] hover:border-brand/40">
                  <div className="overflow-hidden rounded-2xl [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: p.svg }} />
                  <p className="mt-3 flex items-center justify-between font-display text-sm uppercase">
                    {p.name} <ArrowRight className="size-4 -translate-x-1 text-brand opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Promise ───────── */}
      <section id="versprechen" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-24 sm:px-8">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Unser Versprechen</p>
          <h2 className="mt-3 max-w-4xl font-display text-5xl uppercase leading-[0.95] sm:text-6xl">
            Andere schalten deine Codes ab. <span className="text-brand glow-text">Wir nicht.</span>
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {PROMISES.map(({ icon: Icon, badge, title, text }, i) => (
            <Reveal key={title} delay={i * 100}>
              <div className="card h-full p-7 transition hover:border-brand/40">
                <div className="flex items-center justify-between">
                  <Icon className="size-7 text-brand" strokeWidth={1.8} />
                  <span className="badge bg-brand/15 text-brand">{badge}</span>
                </div>
                <h3 className="mt-8 font-display text-2xl uppercase leading-tight">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-dim">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── Types ───────── */}
      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <Reveal>
          <div className="card p-8 sm:p-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="font-display text-3xl uppercase">16 Code-Typen</h3>
              <span className="badge bg-brand text-on-brand"><Zap className="size-3" /> Sofort startklar</span>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {TYPE_ORDER.map((t) => (
                <Link
                  key={t}
                  href={`/studio?type=${t}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-edge bg-elevated px-4 py-2.5 text-sm font-medium transition hover:-translate-y-0.5 hover:border-brand/50 hover:text-brand"
                >
                  <TypeIcon name={CODE_TYPES[t].icon} className="size-4" /> {CODE_TYPES[t].label}
                </Link>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ───────── Pricing ───────── */}
      <section id="preise" className="scroll-mt-20 border-t border-edge">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Preise</p>
            <h2 className="mt-3 font-display text-5xl uppercase leading-[0.95] sm:text-6xl">Ehrlich. Ohne Falle.</h2>
            <p className="mt-4 text-dim">Monatlich kündbar. Statische Codes sind immer kostenlos und unbegrenzt.</p>
          </Reveal>
          <div className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {(Object.keys(PLANS) as PlanId[]).map((id, i) => {
              const p = PLANS[id];
              const featured = id === "business";
              return (
                <Reveal key={id} delay={i * 90}>
                  <div className={cn("card flex h-full flex-col p-7 transition hover:-translate-y-1", featured && "card-glow")}>
                    <div className="flex items-center justify-between">
                      <p className="font-display text-lg uppercase">{p.label}</p>
                      {featured && <span className="badge bg-brand text-on-brand">Beliebt</span>}
                    </div>
                    <p className={cn("mt-5 font-display text-6xl", featured && "text-brand glow-text")}>{p.price} €</p>
                    <p className="mt-1 text-sm text-dim">pro Monat</p>
                    <ul className="mt-7 flex-1 space-y-3 text-sm">
                      {p.features.map((f) => (
                        <li key={f} className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-brand" /> <span className="text-fg/90">{f}</span></li>
                      ))}
                    </ul>
                    <ButtonLink href="/studio" variant={featured ? "primary" : "secondary"} className={cn("mt-8 w-full", featured && "shine")}>
                      {p.price === 0 ? "Kostenlos starten" : "Auswählen"}
                    </ButtonLink>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────── CTA ───────── */}
      <section className="mx-auto w-full max-w-7xl px-5 pb-24 sm:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[32px] bg-brand px-8 py-16 text-center text-on-brand sm:px-16">
            <div className="pointer-events-none absolute -right-10 -top-10 size-64 rotate-12 rounded-[48px] border-[14px] border-on-brand/10" />
            <div className="pointer-events-none absolute -bottom-12 -left-8 size-48 -rotate-12 rounded-[40px] border-[12px] border-on-brand/10" />
            <h2 className="relative font-display text-5xl uppercase leading-[0.95] sm:text-6xl">Dein nächster Code<br />wird gesehen.</h2>
            <div className="relative mt-9 flex flex-wrap justify-center gap-3">
              <Link href="/studio" className="inline-flex h-14 items-center gap-2 rounded-[14px] bg-on-brand px-7 font-display text-[15px] font-bold uppercase tracking-[0.03em] text-brand shadow-[0_4px_0_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 active:translate-y-1 active:shadow-none">
                Jetzt Code erstellen <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <SiteFooter />
    </div>
  );
}
