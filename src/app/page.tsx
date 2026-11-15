import Link from "next/link";
import {
  ArrowRight, BarChart3, ClipboardList, Download, FileSpreadsheet, Film, Infinity as InfinityIcon, Languages, Printer, ShieldCheck, Sparkles, Sticker, Star, UtensilsCrossed,
} from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Sparkline } from "@/components/marketing/sparkline";
import { HeroShowcase } from "@/components/marketing/hero-showcase";
import { ForeverStory } from "@/components/marketing/forever-story";
import { StaticVsDynamic } from "@/components/marketing/static-vs-dynamic";
import { DesignPlayground } from "@/components/marketing/design-playground";
import { Pricing } from "@/components/marketing/pricing";
import { Reveal } from "@/components/motion/reveal";
import { HostedPage } from "@/components/pages/hosted-pages";
import { ButtonLink } from "@/components/ui/button";
import { renderQrSvg } from "@/lib/qr/render";
import { DEFAULT_STYLE, STYLE_PRESETS, type QrStyle } from "@/lib/qr/style";
import { STARTERS } from "@/lib/templates";
import { cn } from "@/lib/cn";

const qr = (data: string, style: Partial<QrStyle>, id: string, size = 360) =>
  renderQrSvg(data, { ...DEFAULT_STYLE, ...style } as QrStyle, { size, id });

const HERO_IDS = ["qlick", "classic", "lime-night", "silver", "bubble", "leaf", "noir", "shield"];
const HERO_DESIGNS = HERO_IDS.map((id) => STYLE_PRESETS.find((p) => p.id === id)!).filter(Boolean).map((p) => ({ id: p.id, name: p.name, svg: qr("https://qlick.codes/r/dili", { ...p.style, frame: { ...DEFAULT_STYLE.frame, style: "none" } }, `h-${p.id}`, 420) }));
const STORY_QR = qr("https://qlick.codes/r/tisch7", { dots: "rounded", fill: { type: "solid", color: "#191919" }, background: "#ffffff" }, "story", 300);

const USE_CASES = ["Speisekarte", "Google-Bewertungen", "Formulare", "Visitenkarte", "WLAN", "Gutscheine", "Mini-Website", "Events", "Link-Seite", "Umfragen"];

const BENTO = [
  { icon: UtensilsCrossed, title: "Speisekarte in Minuten", text: "Link von Lieferando oder Text einfügen. Gerichte, Preise, Allergene sind da.", span: "lg:col-span-2 lg:row-span-2", big: true },
  { icon: Star, title: "Mehr Google-Bewertungen", text: "Ein Scan öffnet direkt das Bewertungsfenster." },
  { icon: ClipboardList, title: "Formulare & Umfragen", text: "Antworten, Statistik, Export nach Excel." },
  { icon: BarChart3, title: "Statistik ohne Cookies", text: "Scans nach Tag, Uhrzeit, Gerät und Stadt.", chart: true },
  { icon: Film, title: "Videos für Stories", text: "Animierte Codes für Instagram und TikTok." },
  { icon: Sticker, title: "Sticker mit Schnittkante", text: "Druckfertig für jede Sticker-Druckerei." },
  { icon: Printer, title: "A6 bis A0", text: "Poster, Aufsteller, Tischkarten als PDF." },
  { icon: Languages, title: "Mehrsprachig", text: "Deutsch, Englisch, Türkisch, Arabisch." },
];

export default function Home() {
  return (
    <div className="ambient overflow-x-clip">
      <SiteHeader />

      {/* ───────── Hero ───────── */}
      <section className="relative mx-auto grid max-w-[1400px] items-center gap-12 px-5 pb-16 pt-12 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
        <div className="animate-rise">
          <p className="inline-flex items-center gap-2 rounded-full border border-edge bg-hi/5 px-3.5 py-1.5 text-sm text-dim backdrop-blur">
            <span className="size-1.5 rounded-full bg-lime" /> Neu: Formulare, Videos und Speisekarten-Import
          </p>
          <h1 className="mt-6 font-display text-[clamp(3.2rem,8vw,7.2rem)] leading-[0.92]">
            Ein Code.<br /><span className="glow-text">Für immer.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-dim sm:text-xl">
            Einmal drucken, alles dahinter jederzeit ändern. Speisekarte, Bewertungen, Formulare und Mini-Websites, in deinem Design.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="/studio" size="lg">Kostenlos starten <ArrowRight className="size-4" /></ButtonLink>
            <ButtonLink href="#so-gehts" variant="secondary" size="lg">So funktioniert&apos;s</ButtonLink>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-dim">
            <span className="flex items-center gap-2"><InfinityIcon className="size-4" /> Codes laufen nie ab</span>
            <span className="flex items-center gap-2"><ShieldCheck className="size-4" /> DSGVO, Server in der EU</span>
            <span className="flex items-center gap-2"><Download className="size-4" /> Ohne Anmeldung testen</span>
          </div>
        </div>
        <HeroShowcase designs={HERO_DESIGNS} />
      </section>

      {/* ───────── Marquee ───────── */}
      <div className="overflow-hidden border-y border-edge py-5">
        <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
          {[...USE_CASES, ...USE_CASES].map((u, i) => (
            <span key={i} className="flex items-center gap-10 font-display text-2xl text-faint">{u}<span className="size-1.5 rounded-full bg-faint" /></span>
          ))}
        </div>
      </div>

      {/* ───────── Forever story ───────── */}
      <section id="so-gehts" className="mx-auto max-w-[1400px] scroll-mt-20 px-5 py-28 sm:px-8">
        <Reveal className="max-w-3xl">
          <p className="text-sm font-semibold text-dim">So geht&apos;s</p>
          <h2 className="mt-3 font-display text-5xl leading-[0.95] sm:text-7xl">Gedruckt ist nicht <span className="glow-text">fertig.</span></h2>
          <p className="mt-5 max-w-xl text-lg text-dim">Neue Preise, neues Gericht, sogar ein ganz anderer Inhalt. Der Code auf dem Tisch bleibt derselbe.</p>
        </Reveal>
        <div className="mt-14"><ForeverStory qrSvg={STORY_QR} /></div>
      </section>

      {/* ───────── Static vs dynamic ───────── */}
      <section className="border-y border-edge bg-hi/[0.02]">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-28 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <Reveal>
            <p className="text-sm font-semibold text-dim">Der Unterschied</p>
            <h2 className="mt-3 font-display text-5xl leading-[0.95] sm:text-6xl">Andere Codes altern. Deiner nicht.</h2>
            <p className="mt-5 text-lg text-dim">Bei normalen Codes steckt der Link im Muster. Jede Änderung heißt neu drucken. Qlick-Codes zeigen auf deinen festen Link. Was dahinter liegt, änderst du, so oft du willst.</p>
            <ul className="mt-8 space-y-3 text-sm">
              {["Kein Ablaufdatum, auch nicht nach einer Kündigung", "Typ wechseln: Website heute, Speisekarte morgen", "Jede Änderung sofort live"].map((t) => (
                <li key={t} className="flex items-center gap-3"><span className="grid size-6 place-items-center rounded-full bg-lime text-night"><InfinityIcon className="size-3.5" /></span>{t}</li>
              ))}
            </ul>
          </Reveal>
          <StaticVsDynamic />
        </div>
      </section>

      {/* ───────── Design playground ───────── */}
      <section id="designs" className="mx-auto max-w-[1400px] scroll-mt-20 px-5 py-28 sm:px-8">
        <Reveal className="mb-12 max-w-3xl">
          <p className="text-sm font-semibold text-dim">Design</p>
          <h2 className="mt-3 font-display text-5xl leading-[0.95] sm:text-7xl">Probier es aus.</h2>
          <p className="mt-5 text-lg text-dim">Ein Klick, ein neuer Look. Jeder Code wird live mit einem echten Scanner geprüft.</p>
        </Reveal>
        <DesignPlayground />
      </section>

      {/* ───────── Templates rail ───────── */}
      <section className="border-y border-edge py-28">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-dim">Vorlagen</p>
              <h2 className="mt-3 font-display text-5xl leading-[0.95] sm:text-6xl">Deine Mini-Website, fertig in 60 Sekunden.</h2>
            </div>
            <ButtonLink href="/studio" variant="secondary">Alle Vorlagen <ArrowRight className="size-4" /></ButtonLink>
          </Reveal>
        </div>
        <div className="mt-14 flex snap-x gap-6 overflow-x-auto px-5 pb-6 [scrollbar-width:none] sm:px-[max(2rem,calc((100vw-1400px)/2+2rem))]">
          {STARTERS.map((st, i) => (
            <Reveal key={st.id} delay={i * 80} className="snap-start">
              <div className="group block w-[300px] shrink-0">
                <div className="relative h-[600px] overflow-hidden rounded-[44px] border-[10px] border-[#0b0b0b] bg-black shadow-lift transition duration-500 group-hover:-translate-y-2 group-hover:rotate-[-1deg]">
                  <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
                  <div className="h-full overflow-y-auto [scrollbar-width:none]">
                    <div className="origin-top-left" style={{ width: 390, transform: "scale(0.718)" }}>
                      <HostedPage code={{ id: st.id, slug: st.id, name: String(st.content.name), type: st.type, mode: "static", status: "active", content: st.content }} />
                    </div>
                  </div>
                </div>
                <Link href="/studio" className="mt-4 flex items-center justify-between font-semibold hover:underline">{st.name} <ArrowRight className="size-4" /></Link>
                <p className="text-sm text-dim">{st.hint}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── Bento ───────── */}
      <section id="funktionen" className="mx-auto max-w-[1400px] scroll-mt-20 px-5 py-28 sm:px-8">
        <Reveal className="max-w-3xl">
          <p className="text-sm font-semibold text-dim">Funktionen</p>
          <h2 className="mt-3 font-display text-5xl leading-[0.95] sm:text-7xl">Mehr als ein Code.</h2>
        </Reveal>
        <div className="mt-14 grid auto-rows-[minmax(190px,auto)] gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENTO.map(({ icon: Icon, title, text, span, big, chart }, i) => (
            <Reveal key={title} delay={(i % 4) * 70} className={span}>
              <div className={cn("card group relative flex h-full flex-col overflow-hidden p-7 transition duration-500 hover:-translate-y-1 hover:border-edge-strong", big && "justify-between")}>
                <span className={cn("grid size-11 place-items-center rounded-2xl transition", big ? "bg-lime text-night" : "bg-hi/10 group-hover:bg-brand group-hover:text-on-brand")}><Icon className="size-5" /></span>
                <div className={big ? "mt-10" : "mt-6"}>
                  <h3 className={cn("font-display leading-tight", big ? "text-4xl" : "text-xl")}>{title}</h3>
                  <p className={cn("mt-2 text-dim", big ? "max-w-md text-lg" : "text-sm")}>{text}</p>
                </div>
                {big && (
                  <div className="mt-8 grid grid-cols-3 gap-2 text-xs">
                    {["Döner im Brot · 7,50 €", "Margherita · 8,90 €", "Ayran · 2,00 €", "Falafel · 6,50 €", "Dürüm · 8,50 €", "Cola · 2,50 €"].map((t, k) => (
                      <span key={t} className="truncate rounded-xl border border-edge bg-hi/5 px-3 py-2 opacity-0 [animation:rise_.6s_ease-out_forwards]" style={{ animationDelay: `${600 + k * 150}ms` }}>{t}</span>
                    ))}
                  </div>
                )}
                {chart && <Sparkline points={[2, 3, 2, 5, 4, 6, 9, 7, 10, 9, 13, 15]} className="mt-auto h-12 w-full pt-4" />}
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-4">
          <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
            <p className="flex items-center gap-3 text-lg"><FileSpreadsheet className="size-5" /> Alles exportieren: Antworten, Statistik und Speisekarte als Excel oder PDF.</p>
            <span className="flex items-center gap-2 text-sm text-dim"><Sparkles className="size-4" /> Inklusive in Pro</span>
          </div>
        </Reveal>
      </section>

      {/* ───────── Pricing ───────── */}
      <section id="preise" className="scroll-mt-20 border-t border-edge">
        <div className="mx-auto max-w-[1400px] px-5 py-28 sm:px-8">
          <Reveal className="mx-auto mb-10 max-w-2xl text-center">
            <p className="text-sm font-semibold text-dim">Preise</p>
            <h2 className="mt-3 font-display text-5xl leading-[0.95] sm:text-7xl">Fair. Ohne Falle.</h2>
          </Reveal>
          <Pricing />
        </div>
      </section>

      {/* ───────── CTA ───────── */}
      <section className="mx-auto w-full max-w-[1400px] px-5 pb-28 sm:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[40px] bg-[#191919] px-8 py-20 text-center text-white sm:px-16">
            <div className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-lime/20 blur-3xl" />
            <h2 className="relative font-display text-5xl leading-[0.95] sm:text-7xl">Dein Code wartet.</h2>
            <p className="relative mx-auto mt-5 max-w-lg text-lg text-white/70">In zwei Minuten fertig. Kostenlos, ohne Anmeldung.</p>
            <Link href="/studio" className="relative mt-9 inline-flex h-14 items-center gap-2 rounded-full bg-lime px-8 text-[16px] font-semibold text-night transition hover:scale-[1.03] active:scale-[0.98]">
              Jetzt Code erstellen <ArrowRight className="size-4" />
            </Link>
          </div>
        </Reveal>
      </section>

      <SiteFooter />
    </div>
  );
}
