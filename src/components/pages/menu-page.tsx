"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Clock, Flame, Leaf, MapPin, Phone, Plus, Search, Sparkles, Star, Wheat, X } from "lucide-react";
import type { MenuItemData, MenuSectionData } from "@/lib/codes/types";
import { mapsUrl } from "@/lib/codes/payload";
import { menuTemplate, type HeadingKind, type ItemKind, type MenuTemplate, type NavKind } from "@/lib/menu-templates";
import { SmartImg } from "./smart-img";

/**
 * Menu page engine. A template (src/lib/menu-templates.ts) picks one of each:
 * header, category navigation, section heading, dish layout and texture.
 * Colours and fonts come from the page design (CSS variables on the shell).
 */

type C = Record<string, unknown>;
const s = (v: unknown) => String(v ?? "").trim();
const money = (p: string) => (p && /\d$/.test(p) ? `${p} €` : p);
const priceOf = (it: MenuItemData) => it.price || it.variants.find((v) => v.price)?.price || "";

const BADGES: Record<string, { label: string; icon: typeof Star; tone?: string }> = {
  beliebt: { label: "Beliebt", icon: Star },
  neu: { label: "Neu", icon: Sparkles },
  vegan: { label: "Vegan", icon: Leaf, tone: "green" },
  vegetarisch: { label: "Vegetarisch", icon: Leaf, tone: "green" },
  scharf: { label: "Scharf", icon: Flame, tone: "red" },
  hausgemacht: { label: "Hausgemacht", icon: Wheat },
};
const ALLERGENS: Record<string, string> = {
  A: "Glutenhaltiges Getreide", B: "Krebstiere", C: "Eier", D: "Fisch", E: "Erdnüsse", F: "Soja", G: "Milch/Laktose",
  H: "Schalenfrüchte", L: "Sellerie", M: "Senf", N: "Sesam", O: "Sulfite", P: "Lupinen", R: "Weichtiere",
};
const allergenList = (tags: string) => tags.toUpperCase().split(/[\s,;]+/).filter((t) => ALLERGENS[t]);
const sectionId = (i: number) => `kat-${i}`;
const itemKey = (i: number, j: number) => `${i}-${j}`;
const pad2 = (n: number) => String(n).padStart(2, "0");

function normalize(raw: unknown): MenuSectionData[] {
  return ((raw as Partial<MenuSectionData>[]) ?? []).map((sec) => ({
    title: sec.title ?? "",
    note: sec.note ?? "",
    items: (sec.items ?? []).map((it: Partial<MenuItemData>) => ({
      name: it.name ?? "", description: it.description ?? "", price: it.price ?? "", tags: it.tags ?? "", image: it.image ?? "",
      soldOut: it.soldOut ?? false, variants: it.variants ?? [], badges: it.badges ?? [],
    })),
  }));
}

/** Pages made before templates existed: map the old layout choice onto the engine. */
function legacyTemplate(layout: string): MenuTemplate {
  const items: ItemKind = layout === "grid" ? "grid" : layout === "list" ? "leader" : layout === "elegant" ? "centered" : "row";
  return { id: "legacy", name: "", mood: "", header: "below", nav: "underline", heading: layout === "elegant" ? "lines" : "plain", items, texture: "none", design: { preset: "studio" } };
}

function useReveal(root: React.RefObject<HTMLElement | null>, deps: unknown[]) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.querySelectorAll<HTMLElement>("[data-reveal]").forEach((n) => (n.dataset.in = ""));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).dataset.in = "";
          io.unobserve(e.target);
        }
      }),
      { rootMargin: "0px 0px -6% 0px", threshold: 0.05 },
    );
    el.querySelectorAll("[data-reveal]:not([data-in])").forEach((n) => io.observe(n));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function MenuPage({ c }: { c: C }) {
  const sections = useMemo(() => normalize(c.sections), [c.sections]);
  const t = menuTemplate(c.template) ?? legacyTemplate(s(c.layout) || "cards");
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  useReveal(rootRef, [sections, query, t.id]);

  useEffect(() => {
    const els = sections.map((_, i) => document.getElementById(sectionId(i))).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(Number(visible.target.getAttribute("data-index")));
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    els.forEach((el) => io.observe(el));
    // Back at the top: the first category is the active one.
    const onScroll = () => { if (els[0].getBoundingClientRect().top > window.innerHeight * 0.3) setActive(0); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { io.disconnect(); window.removeEventListener("scroll", onScroll); };
  }, [sections, query]);

  const q = query.trim().toLowerCase();
  const filtered = q ? sections.map((sec) => ({ ...sec, items: sec.items.filter((it) => `${it.name} ${it.description}`.toLowerCase().includes(q)) })) : sections;
  const usedAllergens = Array.from(new Set(sections.flatMap((sec) => sec.items.flatMap((it) => allergenList(it.tags))))).sort();
  const frame = t.header === "frame";

  return (
    <div ref={rootRef} className={`mn -mx-5 -mt-8 min-h-screen mn-tx-${t.texture}`} data-tpl={t.id}>
      <div className={frame ? "mn-frame mx-3 mt-3 pb-6" : ""}>
        <Header c={c} t={t} />
        <Nav t={t} sections={sections} active={active} searching={searching} setSearching={setSearching} query={query} setQuery={setQuery} />
        <div className={t.items === "carousel" ? "" : "px-5"}>
          {filtered.map((sec, i) =>
            sec.items.length === 0 && q ? null : (
              <section key={i} id={sectionId(i)} data-index={i} className="scroll-mt-16 pt-10">
                <Heading kind={t.heading} title={sec.title} note={sec.note} index={i} count={sec.items.length} padded={t.items === "carousel"} />
                <Items kind={t.items} items={sec.items} sectionIndex={i} open={open} setOpen={setOpen} />
              </section>
            ),
          )}
          {q && filtered.every((sec) => sec.items.length === 0) && <p className="py-12 text-center text-[var(--pg-muted)]">Nichts gefunden für „{query}“.</p>}
        </div>
        {(usedAllergens.length > 0 || s(c.footer)) && (
          <footer className="mx-5 mt-14 border-t border-[var(--pg-line)] pt-6 text-[12px] leading-relaxed text-[var(--pg-muted)]">
            {usedAllergens.length > 0 && <p className="mb-3"><span className="font-semibold text-[var(--pg-fg)]">Allergene:</span> {usedAllergens.map((a) => `${a} ${ALLERGENS[a]}`).join(" · ")}</p>}
            {s(c.footer) && <p className="whitespace-pre-line">{s(c.footer)}</p>}
          </footer>
        )}
      </div>
      {(s(c.phone) || s(c.address)) && (
        <div className="mp-orderbar mn-orderbar sticky bottom-3 z-20 mx-5 mt-10 flex gap-2 p-1.5">
          {s(c.phone) && <a href={`tel:${s(c.phone).replace(/[^\d+]/g, "")}`} className="mn-cta flex h-11 flex-1 items-center justify-center gap-2 text-[14px] font-semibold"><Phone className="size-4" /> Bestellen</a>}
          {s(c.address) && <a href={mapsUrl(s(c.address))} target="_blank" rel="noopener" className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full text-[14px] font-semibold"><MapPin className="size-4" /> Route</a>}
        </div>
      )}
    </div>
  );
}

// ───────── header ─────────

function Actions({ c, center }: { c: C; center?: boolean }) {
  const hours = s(c.hours);
  return (
    <>
      <div className={`mn-in mt-5 flex flex-wrap gap-2 text-[14px] ${center ? "justify-center" : ""}`} style={{ animationDelay: "160ms" }}>
        {s(c.phone) && <a href={`tel:${s(c.phone).replace(/[^\d+]/g, "")}`} className="mn-cta inline-flex h-10 items-center gap-2 px-4 font-medium"><Phone className="size-4" /> Anrufen</a>}
        {s(c.address) && <a href={mapsUrl(s(c.address))} target="_blank" rel="noopener" className="mn-ghost inline-flex h-10 items-center gap-2 px-4 font-medium"><MapPin className="size-4" /> Route</a>}
      </div>
      {hours && (
        <details className={`group mt-4 text-[14px] text-[var(--pg-muted)] ${center ? "text-center" : ""}`}>
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5"><Clock className="size-4" /> Öffnungszeiten <ChevronDown className="size-3.5 transition group-open:rotate-180" /></summary>
          <p className="mt-2 whitespace-pre-line leading-relaxed">{hours}</p>
        </details>
      )}
    </>
  );
}

function Title({ children, size = 2.4, className = "", center }: { children: React.ReactNode; size?: number; className?: string; center?: boolean }) {
  return <h1 className={`pg-display mn-in leading-[1.0] ${center ? "text-center" : ""} ${className}`} style={{ fontSize: `calc(${size}rem * var(--pg-display-scale))`, animationDelay: "60ms" }}>{children}</h1>;
}

function Logo({ c, className }: { c: C; className: string }) {
  const logo = s(c.logo);
  const name = s(c.name) || "Lokal";
  return logo
    ? <SmartImg src={logo} width={240} eager className={`object-cover ${className}`} fallback={<span className={`pg-display grid place-items-center bg-[var(--accent)] text-[var(--on-accent)] ${className}`}>{name.charAt(0)}</span>} />
    : <span className={`pg-display grid place-items-center bg-[var(--accent)] text-[var(--on-accent)] ${className}`}>{name.charAt(0)}</span>;
}

function Header({ c, t }: { c: C; t: MenuTemplate }) {
  const cover = s(c.cover);
  const name = s(c.name) || "Dein Lokal";
  const sub = s(c.subtitle);
  const subEl = sub ? <p className="mn-in mt-2 text-[15px] leading-relaxed text-[var(--pg-muted)]" style={{ animationDelay: "110ms" }}>{sub}</p> : null;

  switch (t.header) {
    case "editorial":
      return (
        <header className="px-5 pt-10">
          <div className="mn-in flex items-center justify-between border-b border-[var(--pg-fg)] pb-2 text-[12px] font-medium"><span>Speisekarte</span><span>{new Date().getFullYear()}</span></div>
          <Title size={3.4} className="mt-6">{name}</Title>
          {subEl}
          {cover && <SmartImg src={cover} width={1280} eager className="mn-cover mt-7 aspect-[4/3] w-full object-cover" />}
          <Actions c={c} />
        </header>
      );
    case "frame":
      return (
        <header className="px-6 pt-10 text-center">
          <Logo c={c} className="mx-auto size-16 rounded-full text-2xl" />
          <p className="mn-in mt-4 text-[var(--accent)]">✦ ✦ ✦</p>
          <Title size={2.8} center className="mt-2">{name}</Title>
          {sub && <p className="mn-in mx-auto mt-2 max-w-xs text-[15px] italic text-[var(--pg-muted)]">{sub}</p>}
          <Actions c={c} center />
        </header>
      );
    case "bento":
      return (
        <header className="px-4 pt-6">
          <div className="grid grid-cols-3 gap-2.5">
            <div className="mn-tile mn-in col-span-2 row-span-2 flex flex-col justify-end overflow-hidden p-4" style={{ minHeight: 190 }}>
              {cover && <SmartImg src={cover} width={960} eager className="absolute inset-0 size-full object-cover" />}
              {cover && <span className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />}
              <span className={`relative ${cover ? "text-white" : ""}`}><span className="pg-display block leading-[1.02]" style={{ fontSize: "calc(1.9rem * var(--pg-display-scale))" }}>{name}</span>{sub && <span className="mt-1 block text-[13px] opacity-80">{sub}</span>}</span>
            </div>
            <div className="mn-tile mn-in grid place-items-center p-3" style={{ animationDelay: "60ms" }}><Logo c={c} className="size-14 rounded-2xl text-2xl" /></div>
            {s(c.phone) ? <a href={`tel:${s(c.phone).replace(/[^\d+]/g, "")}`} className="mn-tile mn-tile-accent mn-in flex flex-col justify-between p-3 text-[13px] font-semibold" style={{ animationDelay: "120ms" }}><Phone className="size-5" /> Anrufen</a> : <div className="mn-tile" />}
            {s(c.address) && <a href={mapsUrl(s(c.address))} target="_blank" rel="noopener" className="mn-tile mn-in col-span-2 flex items-center gap-2 p-3 text-[13px] font-medium" style={{ animationDelay: "180ms" }}><MapPin className="size-4 shrink-0" /> <span className="truncate">{s(c.address)}</span></a>}
            {s(c.hours) && <div className="mn-tile mn-in flex flex-col justify-between p-3 text-[12px]" style={{ animationDelay: "240ms" }}><Clock className="size-4" /><span className="line-clamp-2 text-[var(--pg-muted)]">{s(c.hours).split("\n")[0]}</span></div>}
          </div>
        </header>
      );
    case "hero":
      return (
        <header className="relative">
          <div className="relative h-[360px] overflow-hidden bg-[var(--accent-2)]">
            {cover && <SmartImg src={cover} width={1280} eager className="mn-cover size-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--pg-bg)] via-[var(--pg-bg)]/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 px-5 pb-2">
              <Logo c={c} className="mn-in mb-4 size-14 rounded-2xl text-2xl shadow-lg" />
              <Title size={3}>{name}</Title>
              {subEl}
            </div>
          </div>
          <div className="px-5"><Actions c={c} /></div>
        </header>
      );
    case "gradient":
      return (
        <header className="relative overflow-hidden px-5 pb-10 pt-14 text-white">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--accent),var(--accent-2))]" />
          <div className="absolute -right-16 -top-16 size-64 rounded-full bg-white/15 blur-2xl mn-float" />
          <div className="relative">
            <Logo c={c} className="mn-in size-14 rounded-2xl border-2 border-white/40 text-2xl" />
            <Title size={2.8} className="mt-5">{name}</Title>
            {sub && <p className="mn-in mt-2 text-[15px] text-white/85">{sub}</p>}
            <div className="mn-in mt-5 flex gap-2 text-[14px]">
              {s(c.phone) && <a href={`tel:${s(c.phone).replace(/[^\d+]/g, "")}`} className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 font-semibold text-black"><Phone className="size-4" /> Anrufen</a>}
              {s(c.address) && <a href={mapsUrl(s(c.address))} target="_blank" rel="noopener" className="inline-flex h-10 items-center gap-2 rounded-full bg-white/20 px-4 font-semibold backdrop-blur"><MapPin className="size-4" /> Route</a>}
            </div>
          </div>
        </header>
      );
    case "split":
      return (
        <header className="px-5 pt-10">
          <div className="grid grid-cols-[1fr_auto] items-start gap-4">
            <div>
              <p className="mn-in text-[13px] font-semibold text-[var(--accent)]">Speisekarte</p>
              <Title size={2.9} className="mt-2">{name}</Title>
              {subEl}
            </div>
            <Logo c={c} className="mn-in size-16 text-2xl" />
          </div>
          {cover && <SmartImg src={cover} width={1280} eager className="mn-cover mt-6 aspect-[16/9] w-full object-cover" />}
          <Actions c={c} />
        </header>
      );
    case "shop": {
      const words = name.split(/\s+/);
      const last = words.length > 1 ? words.pop() : null;
      return (
        <header>
          <div className="flex items-center gap-3 border-b border-[var(--pg-line)] px-5 py-3">
            <Logo c={c} className="size-10 rounded-full text-lg" />
            <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">{name}</span>
            {s(c.phone) && <a href={`tel:${s(c.phone).replace(/[^\d+]/g, "")}`} className="mn-cta inline-flex h-9 items-center gap-1.5 px-4 text-[13px] font-semibold"><Phone className="size-3.5" /> Bestellen</a>}
          </div>
          {cover && (
            <div className="px-5 pt-5">
              <SmartImg src={cover} width={1280} eager className="mn-cover aspect-[16/8] w-full rounded-[calc(var(--pg-radius)+4px)] object-cover" />
            </div>
          )}
          <div className="px-6 pt-9 text-center">
            <Title size={2.6} center>{words.join(" ")}{last && <> <span className="text-[var(--accent)]">{last}</span></>}</Title>
            {sub && <p className="mn-in mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-[var(--pg-muted)]" style={{ animationDelay: "110ms" }}>{sub}</p>}
            <Actions c={c} center />
          </div>
        </header>
      );
    }
    case "minimal":
      return (
        <header className="px-5 pt-14">
          <Title size={2}>{name}</Title>
          {subEl}
          <Actions c={c} />
        </header>
      );
    case "monogram":
      return (
        <header className="relative px-6 pb-4 pt-14 text-center">
          {cover && <div className="absolute inset-0 opacity-20"><SmartImg src={cover} width={1280} eager className="size-full object-cover" /><div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--pg-bg)]" /></div>}
          <div className="relative">
            <div className="mn-in mx-auto grid size-20 place-items-center rounded-full border border-[var(--accent)] text-[var(--accent)]"><span className="pg-display text-4xl">{name.charAt(0)}</span></div>
            <Title size={2.6} center className="mt-6">{name}</Title>
            <div className="mn-in mx-auto mt-4 flex max-w-[200px] items-center gap-3 text-[var(--accent)]"><span className="h-px flex-1 bg-current opacity-50" /><span className="text-xs">✦</span><span className="h-px flex-1 bg-current opacity-50" /></div>
            {sub && <p className="mn-in pg-display mt-3 text-[18px] italic text-[var(--pg-muted)]">{sub}</p>}
            <Actions c={c} center />
          </div>
        </header>
      );
    default:
      return (
        <header>
          {cover && (
            <div className="relative h-56 overflow-hidden bg-[var(--pg-soft)]">
              <SmartImg src={cover} width={1280} eager className="mn-cover size-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--pg-bg)] to-transparent" />
            </div>
          )}
          <div className={`relative px-5 ${cover ? "-mt-8" : "pt-10"}`}>
            {s(c.logo) && <Logo c={c} className="mn-in size-[72px] rounded-[calc(var(--pg-radius)*0.6+8px)] border-4 border-[var(--pg-bg)] shadow-md" />}
            <Title className="mt-4">{name}</Title>
            {subEl}
            <Actions c={c} />
          </div>
        </header>
      );
  }
}

// ───────── category navigation ─────────

function Nav({ t, sections, active, searching, setSearching, query, setQuery }: { t: MenuTemplate; sections: MenuSectionData[]; active: number; searching: boolean; setSearching: (v: boolean) => void; query: string; setQuery: (v: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [bar, setBar] = useState<{ left: number; width: number } | null>(null);
  useEffect(() => {
    const nav = ref.current;
    const tab = nav?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
    if (!nav || !tab) return;
     
    setBar({ left: tab.offsetLeft, width: tab.offsetWidth });
    nav.scrollTo({ left: tab.offsetLeft - nav.clientWidth / 2 + tab.clientWidth / 2, behavior: "smooth" });
  }, [active, sections, searching]);
  const go = (i: number) => document.getElementById(sectionId(i))?.scrollIntoView({ behavior: "smooth", block: "start" });
  const kind: NavKind = t.nav;
  const tabClass = (i: number) => {
    const on = i === active;
    switch (kind) {
      case "pills": return `h-9 rounded-full px-4 text-[14px] font-medium transition ${on ? "bg-[var(--accent)] text-[var(--on-accent)]" : "bg-[var(--pg-soft)] text-[var(--pg-muted)]"}`;
      case "boxed": return `h-9 rounded-[calc(var(--pg-radius)*0.5+4px)] border px-3.5 text-[14px] font-semibold transition ${on ? "border-[var(--pg-fg)] bg-[var(--pg-fg)] text-[var(--pg-bg)]" : "border-[var(--pg-line)] text-[var(--pg-muted)]"}`;
      case "chips": return `h-10 rounded-full border px-4 text-[14px] font-semibold transition ${on ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)] shadow-[0_8px_20px_-10px_var(--accent)]" : "border-[var(--pg-line)] bg-[var(--pg-card)] text-[var(--pg-fg)]"}`;
      case "numbered": return `h-12 text-[14px] transition ${on ? "font-semibold text-[var(--pg-fg)]" : "text-[var(--pg-muted)]"}`;
      default: return `h-12 text-[15px] transition ${on ? "font-semibold text-[var(--pg-fg)]" : "text-[var(--pg-muted)]"}`;
    }
  };
  const lined = kind === "underline" || kind === "numbered";
  return (
    <nav className={`mn-nav sticky top-0 z-20 mt-8 ${lined ? "border-b border-[var(--pg-line)]" : "py-2.5"} bg-[color-mix(in_srgb,var(--pg-bg)_92%,transparent)] backdrop-blur-md`}>
      {searching ? (
        <div className="flex h-12 items-center gap-2 px-5">
          <Search className="size-4 text-[var(--pg-muted)]" />
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Gericht suchen" className="min-w-0 flex-1 bg-transparent py-1 text-[15px] outline-none placeholder:text-[var(--pg-muted)]" />
          <button type="button" onClick={() => { setQuery(""); setSearching(false); }} aria-label="Suche schließen" className="grid size-8 place-items-center"><X className="size-4" /></button>
        </div>
      ) : (
        <div className="flex items-center">
          <div ref={ref} className={`relative flex flex-1 items-center overflow-x-auto px-5 [scrollbar-width:none] ${lined ? "gap-6" : "gap-2"}`}>
            {sections.map((sec, i) => (
              <button key={i} type="button" data-tab={i} onClick={() => go(i)} className={`shrink-0 ${tabClass(i)}`}>
                {kind === "numbered" && <span className="mr-1.5 font-mono text-[11px] text-[var(--accent)]">{pad2(i + 1)}</span>}
                {sec.title}
              </button>
            ))}
            {lined && bar && <span className="mn-bar absolute bottom-0 h-[2px] rounded-full bg-[var(--accent)]" style={{ left: bar.left, width: bar.width }} />}
          </div>
          <button type="button" onClick={() => setSearching(true)} aria-label="Suchen" className="grid size-12 shrink-0 place-items-center text-[var(--pg-muted)] hover:text-[var(--pg-fg)]"><Search className="size-[18px]" /></button>
        </div>
      )}
    </nav>
  );
}

// ───────── section headings ─────────

function Heading({ kind, title, note, index, count, padded }: { kind: HeadingKind; title: string; note: string; index: number; count: number; padded: boolean }) {
  const size = (r: number) => ({ fontSize: `calc(${r}rem * var(--pg-display-scale))` });
  const noteEl = note ? <p className="mt-1 text-[14px] text-[var(--pg-muted)]">{note}</p> : null;
  const wrap = (child: React.ReactNode, cls = "") => <div data-reveal className={`${padded ? "px-5" : ""} ${cls}`}>{child}{noteEl}</div>;
  switch (kind) {
    case "numbered":
      return wrap(<div className="flex items-baseline gap-3 border-b border-[var(--pg-line)] pb-3"><span className="font-mono text-[13px] text-[var(--accent)]">{pad2(index + 1)}</span><h2 className="pg-display" style={size(1.9)}>{title}</h2><span className="ml-auto text-[12px] text-[var(--pg-muted)]">{count}</span></div>);
    case "lines":
      return wrap(<div className="flex items-center gap-4 text-[var(--accent)]"><span className="h-px flex-1 bg-current opacity-40" /><h2 className="pg-display shrink-0 text-[var(--pg-fg)]" style={size(1.7)}>{title}</h2><span className="h-px flex-1 bg-current opacity-40" /></div>, "text-center");
    case "index":
      return wrap(<div className="flex items-end gap-4"><span className="pg-display leading-[0.8] text-[var(--accent)]" style={size(3.6)}>{pad2(index + 1)}</span><div className="pb-1"><h2 className="pg-display leading-none" style={size(1.6)}>{title}</h2><p className="mt-1 text-[12px] text-[var(--pg-muted)]">{count} {count === 1 ? "Gericht" : "Gerichte"}</p></div></div>);
    case "accent": {
      const words = title.trim().split(/\s+/);
      const last = words.length > 1 ? words.pop() : null;
      return wrap(<h2 className="pg-display text-center leading-[1.05]" style={size(2)}>{words.join(" ")}{last && <> <span className="text-[var(--accent)]">{last}</span></>}</h2>, "text-center");
    }
    case "serif-italic":
      return wrap(<h2 className="pg-display italic" style={size(2)}>{title}</h2>);
    default:
      return wrap(<h2 className="pg-display" style={size(1.75)}>{title}</h2>);
  }
}

// ───────── dishes ─────────

function Badges({ it, center }: { it: MenuItemData; center?: boolean }) {
  if (!it.badges.length && !it.soldOut) return null;
  return (
    <div className={`mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[12px] font-medium ${center ? "justify-center" : ""}`}>
      {it.soldOut && <span>Ausverkauft</span>}
      {it.badges.map((b) => {
        const def = BADGES[b];
        if (!def) return null;
        const Icon = def.icon;
        return <span key={b} className={`inline-flex items-center gap-1 ${def.tone === "green" ? "mn-green" : def.tone === "red" ? "mn-red" : "text-[var(--accent)]"}`}><Icon className="size-3.5" /> {def.label}</span>;
      })}
    </div>
  );
}

function Variants({ it, center }: { it: MenuItemData; center?: boolean }) {
  const v = it.variants.filter((x) => x.label || x.price);
  if (!v.length) return null;
  return (
    <div className={`mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] ${center ? "justify-center" : ""}`}>
      {v.map((x, k) => <span key={k}><span className="text-[var(--pg-muted)]">{x.label}</span> <span className="font-semibold tabular-nums">{money(x.price)}</span></span>)}
    </div>
  );
}

const sup = (it: MenuItemData) => (it.tags ? <sup className="ml-1 text-[10px] font-normal text-[var(--pg-muted)]">{it.tags}</sup> : null);

function Details({ it, open, photo }: { it: MenuItemData; open: boolean; photo?: boolean }) {
  const al = allergenList(it.tags);
  if (!al.length && !(photo && it.image)) return null;
  return (
    <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
      <div className="overflow-hidden">
        {photo && it.image && <SmartImg src={it.image} width={1080} className="mt-3 aspect-[16/10] w-full rounded-[calc(var(--pg-radius)*0.7+4px)] object-cover" />}
        {al.length > 0 && <p className="mt-2 text-[12px] text-[var(--pg-muted)]">Enthält: {al.map((a) => ALLERGENS[a]).join(", ")}</p>}
      </div>
    </div>
  );
}

/** Photo or a designed placeholder (initial on the second accent). */
function Photo({ it, width, className }: { it: MenuItemData; width: number; className: string }) {
  const fb = <span className={`pg-display grid place-items-center bg-[var(--accent-2)] text-[var(--pg-muted)] ${className}`}><span className="text-[2.2em] opacity-60">{it.name.charAt(0)}</span></span>;
  return it.image ? <SmartImg src={it.image} width={width} className={`object-cover ${className}`} fallback={fb} /> : fb;
}

interface ItemsProps { kind: ItemKind; items: MenuItemData[]; sectionIndex: number; open: string | null; setOpen: (k: string | null) => void }

function Items({ kind, items, sectionIndex, open, setOpen }: ItemsProps) {
  const toggle = (id: string) => setOpen(open === id ? null : id);
  const reveal = (n: number) => ({ "data-reveal": true, style: { "--i": n } as React.CSSProperties });
  const keyOf = (j: number) => itemKey(sectionIndex, j);

  switch (kind) {
    case "leader":
      return (
        <ul className="mt-5 space-y-5">
          {items.map((it, j) => (
            <li key={j} id={`it-${keyOf(j)}`} {...reveal(j)} className={it.soldOut ? "opacity-50" : ""}>
              <button type="button" onClick={() => toggle(keyOf(j))} className="block w-full text-left">
                <span className="flex items-baseline gap-2"><span className="text-[16px] font-semibold">{it.name}{sup(it)}</span><span className="mb-1 flex-1 border-b border-dotted border-[var(--pg-muted)]/50" />{priceOf(it) && !it.variants.length && <span className="font-semibold tabular-nums">{money(it.price)}</span>}</span>
                {it.description && <span className="mt-0.5 block text-[14px] italic leading-relaxed text-[var(--pg-muted)]">{it.description}</span>}
                <Badges it={it} /><Variants it={it} /><Details it={it} open={open === keyOf(j)} photo />
              </button>
            </li>
          ))}
        </ul>
      );
    case "centered":
      return (
        <ul className="mt-6 space-y-8">
          {items.map((it, j) => (
            <li key={j} id={`it-${keyOf(j)}`} {...reveal(j)} className={`text-center ${it.soldOut ? "opacity-50" : ""}`}>
              <button type="button" onClick={() => toggle(keyOf(j))} className="block w-full">
                <p className="pg-display text-[21px] leading-snug">{it.name}{sup(it)}</p>
                {it.description && <p className="pg-display mx-auto mt-1 max-w-xs text-[16px] italic text-[var(--pg-muted)]">{it.description}</p>}
                {!it.variants.length && it.price && <p className="mt-2 text-[15px] tabular-nums text-[var(--accent)]">{money(it.price)}</p>}
                <Badges it={it} center /><Variants it={it} center /><Details it={it} open={open === keyOf(j)} photo />
              </button>
            </li>
          ))}
        </ul>
      );
    case "grid":
      return (
        <div className="mt-5 grid grid-cols-2 gap-3">
          {items.map((it, j) => (
            <button key={j} id={`it-${keyOf(j)}`} type="button" onClick={() => toggle(keyOf(j))} {...reveal(j % 2)} className={`mn-card group overflow-hidden text-left ${open === keyOf(j) ? "col-span-2" : ""} ${it.soldOut ? "opacity-50" : ""}`}>
              <span className="block overflow-hidden"><Photo it={it} width={600} className={`w-full transition duration-500 group-hover:scale-105 ${open === keyOf(j) ? "aspect-[16/10]" : "aspect-square"}`} /></span>
              <span className="block p-3">
                <span className="block text-[15px] font-semibold leading-snug">{it.name}{sup(it)}</span>
                {open === keyOf(j) && it.description && <span className="mt-1 block text-[14px] text-[var(--pg-muted)]">{it.description}</span>}
                {priceOf(it) && <span className="mt-1 block text-[14px] font-semibold tabular-nums text-[var(--accent)]">{money(priceOf(it))}</span>}
                <Badges it={it} /><Details it={it} open={open === keyOf(j)} />
              </span>
            </button>
          ))}
        </div>
      );
    case "masonry":
      return (
        <div className="mt-5 columns-2 gap-3 [column-fill:_balance]">
          {items.map((it, j) => (
            <button key={j} id={`it-${keyOf(j)}`} type="button" onClick={() => toggle(keyOf(j))} {...reveal(j % 2)} className={`group relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-[calc(var(--pg-radius)*0.8+4px)] text-left ${it.soldOut ? "opacity-50" : ""}`}>
              <Photo it={it} width={600} className={`w-full transition duration-700 group-hover:scale-105 ${j % 3 === 0 ? "aspect-[3/4]" : "aspect-square"}`} />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 pt-12 text-white">
                <span className="block text-[15px] font-semibold leading-snug">{it.name}</span>
                {priceOf(it) && <span className="mt-1 inline-block rounded-full bg-white/90 px-2 py-0.5 text-[12px] font-semibold tabular-nums text-black">{money(priceOf(it))}</span>}
              </span>
            </button>
          ))}
        </div>
      );
    case "carousel":
      return (
        <div className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-2 [scrollbar-width:none]">
          {items.map((it, j) => (
            <button key={j} id={`it-${keyOf(j)}`} type="button" onClick={() => toggle(keyOf(j))} {...reveal(j)} className={`group w-[72%] shrink-0 snap-start text-left ${it.soldOut ? "opacity-50" : ""}`}>
              <span className="block overflow-hidden rounded-[calc(var(--pg-radius)*0.8+4px)]"><Photo it={it} width={800} className="aspect-[4/5] w-full transition duration-700 group-hover:scale-105" /></span>
              <span className="mt-3 flex items-baseline gap-2"><span className="flex-1 text-[16px] font-semibold">{it.name}</span>{priceOf(it) && <span className="text-[15px] font-semibold tabular-nums text-[var(--accent)]">{money(priceOf(it))}</span>}</span>
              {it.description && <span className="mt-0.5 line-clamp-2 block text-[14px] text-[var(--pg-muted)]">{it.description}</span>}
              <Badges it={it} />
            </button>
          ))}
        </div>
      );
    case "shop":
      return (
        <div className="mt-6 grid grid-cols-2 gap-3">
          {items.map((it, j) => (
            <button key={j} id={`it-${keyOf(j)}`} type="button" onClick={() => toggle(keyOf(j))} {...reveal(j % 2)} className={`mn-shop group flex flex-col items-center p-3 pb-4 text-center ${it.soldOut ? "opacity-50" : ""}`}>
              <span className="mn-shop-img block w-full overflow-hidden"><Photo it={it} width={600} className="aspect-square w-full transition duration-500 group-hover:scale-[1.04]" /></span>
              <span className="mt-3 block text-[16px] font-bold leading-tight" style={{ fontFamily: "var(--pg-display)" }}>{it.name}{sup(it)}</span>
              {it.description && <span className="mt-1 line-clamp-2 block text-[12.5px] leading-snug text-[var(--pg-muted)]">{it.description}</span>}
              {priceOf(it) && <span className="mt-2 block text-[16px] font-bold tabular-nums text-[var(--accent)]">{it.variants.length && !it.price ? "ab " : ""}{money(priceOf(it))}</span>}
              <Badges it={it} center />
              <Details it={it} open={open === keyOf(j)} />
            </button>
          ))}
        </div>
      );
    case "shoplist":
      return (
        <ul className="mt-5 space-y-3">
          {items.map((it, j) => (
            <li key={j} id={`it-${keyOf(j)}`} {...reveal(j)} className={it.soldOut ? "opacity-50" : ""}>
              <button type="button" onClick={() => toggle(keyOf(j))} className="mn-shop flex w-full items-center gap-4 p-3 text-left">
                <span className="mn-shop-img block size-[92px] shrink-0 overflow-hidden"><Photo it={it} width={320} className="size-full" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-bold leading-snug" style={{ fontFamily: "var(--pg-display)" }}>{it.name}{sup(it)}</span>
                  {it.description && <span className="mt-0.5 line-clamp-2 block text-[13px] leading-snug text-[var(--pg-muted)]">{it.description}</span>}
                  <span className="mt-2 flex items-center gap-3">
                    {priceOf(it) && <span className="whitespace-nowrap text-[15px] font-bold tabular-nums">{it.variants.length && !it.price ? "ab " : ""}{money(priceOf(it))}</span>}
                    <Badges it={it} />
                  </span>
                  <Variants it={it} /><Details it={it} open={open === keyOf(j)} />
                </span>
                <span className="grid size-9 shrink-0 place-items-center self-end rounded-full bg-[var(--accent)] text-[var(--on-accent)]"><Plus className={`size-4 transition ${open === keyOf(j) ? "rotate-45" : ""}`} /></span>
              </button>
            </li>
          ))}
        </ul>
      );
    case "circle":
      return (
        <ul className="mt-5 space-y-4">
          {items.map((it, j) => (
            <li key={j} id={`it-${keyOf(j)}`} {...reveal(j)} className={it.soldOut ? "opacity-50" : ""}>
              <button type="button" onClick={() => toggle(keyOf(j))} className="mn-card flex w-full items-center gap-4 p-3 text-left">
                <Photo it={it} width={240} className="size-20 shrink-0 rounded-full" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-semibold">{it.name}{sup(it)}</span>
                  {it.description && <span className="mt-0.5 line-clamp-2 block text-[13px] text-[var(--pg-muted)]">{it.description}</span>}
                  <Badges it={it} /><Variants it={it} /><Details it={it} open={open === keyOf(j)} />
                </span>
                {!it.variants.length && it.price && <span className="shrink-0 rounded-full bg-[var(--accent)] px-3 py-1.5 text-[13px] font-semibold tabular-nums text-[var(--on-accent)]">{money(it.price)}</span>}
              </button>
            </li>
          ))}
        </ul>
      );
    case "pricecol":
      return (
        <ul className="mt-5 divide-y divide-[var(--pg-line)] border-y border-[var(--pg-line)]">
          {items.map((it, j) => (
            <li key={j} id={`it-${keyOf(j)}`} {...reveal(j)} className={it.soldOut ? "opacity-50" : ""}>
              <button type="button" onClick={() => toggle(keyOf(j))} className="grid w-full grid-cols-[1fr_auto] gap-4 py-4 text-left">
                <span className="min-w-0">
                  <span className="block text-[16px] font-semibold">{it.name}{sup(it)}</span>
                  {it.description && <span className="mt-0.5 block text-[14px] text-[var(--pg-muted)]">{it.description}</span>}
                  <Badges it={it} /><Variants it={it} /><Details it={it} open={open === keyOf(j)} photo />
                </span>
                <span className="pg-display self-start tabular-nums text-[var(--accent)]" style={{ fontSize: "calc(1.7rem * var(--pg-display-scale))", lineHeight: 1 }}>{!it.variants.length && it.price ? it.price.replace(/,00$/, "") : ""}</span>
              </button>
            </li>
          ))}
        </ul>
      );
    case "bento":
      return (
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          {items.map((it, j) => {
            const big = j % 3 === 0;
            return (
              <button key={j} id={`it-${keyOf(j)}`} type="button" onClick={() => toggle(keyOf(j))} {...reveal(j % 2)} className={`mn-tile group relative overflow-hidden text-left ${big ? "col-span-2" : ""} ${it.soldOut ? "opacity-50" : ""}`}>
                {big && <Photo it={it} width={960} className="aspect-[16/9] w-full transition duration-700 group-hover:scale-105" />}
                <span className="block p-3.5">
                  <span className="flex items-baseline gap-2"><span className="flex-1 text-[15px] font-semibold leading-snug">{it.name}{sup(it)}</span>{priceOf(it) && <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[12px] font-semibold tabular-nums text-[var(--on-accent)]">{money(priceOf(it))}</span>}</span>
                  {it.description && <span className="mt-1 line-clamp-2 block text-[13px] text-[var(--pg-muted)]">{it.description}</span>}
                  <Badges it={it} /><Details it={it} open={open === keyOf(j)} />
                </span>
              </button>
            );
          })}
        </div>
      );
    case "mono":
      return (
        <ul className="mt-4">
          {items.map((it, j) => (
            <li key={j} id={`it-${keyOf(j)}`} {...reveal(j)} className={`border-t border-[var(--pg-line)] ${it.soldOut ? "opacity-50" : ""}`}>
              <button type="button" onClick={() => toggle(keyOf(j))} className="grid w-full grid-cols-[1fr_auto] gap-6 py-3.5 text-left">
                <span className="min-w-0">
                  <span className="block text-[15px] font-medium">{it.name}{sup(it)}</span>
                  {it.description && <span className="mt-0.5 block text-[13px] text-[var(--pg-muted)]">{it.description}</span>}
                  <Variants it={it} /><Details it={it} open={open === keyOf(j)} photo />
                </span>
                <span className="font-mono text-[13px] tabular-nums">{!it.variants.length ? money(it.price) : ""}</span>
              </button>
            </li>
          ))}
        </ul>
      );
    default:
      return (
        <ul className="mt-2 divide-y divide-[var(--pg-line)]">
          {items.map((it, j) => (
            <li key={j} id={`it-${keyOf(j)}`} {...reveal(j)} className={it.soldOut ? "opacity-50" : ""}>
              <button type="button" onClick={() => toggle(keyOf(j))} className="flex w-full gap-4 py-4 text-left">
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2"><span className="text-[16px] font-semibold leading-snug">{it.name}{sup(it)}</span>{!it.variants.length && it.price && <span className="ml-auto shrink-0 text-[15px] font-semibold tabular-nums">{money(it.price)}</span>}</span>
                  {it.description && <span className="mt-1 block text-[14px] leading-relaxed text-[var(--pg-muted)]">{it.description}</span>}
                  <Badges it={it} /><Variants it={it} /><Details it={it} open={open === keyOf(j)} />
                </span>
                {it.image && <Photo it={it} width={320} className="size-[88px] shrink-0 rounded-[calc(var(--pg-radius)*0.6+4px)]" />}
              </button>
            </li>
          ))}
        </ul>
      );
  }
}
