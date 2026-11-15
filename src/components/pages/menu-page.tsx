"use client";

import "@fontsource-variable/fraunces";
import "@fontsource-variable/playfair-display";
import "@fontsource-variable/playfair-display/wght-italic.css";
import "@fontsource/bebas-neue";
import "@fontsource/caveat/600.css";
import "@fontsource/caveat/700.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Clock, Flame, Leaf, MapPin, Phone, Search, Sparkles, Star, Wheat, X } from "lucide-react";
import type { MenuItemData, MenuSectionData } from "@/lib/codes/types";
import { mapsUrl } from "@/lib/codes/payload";
import { resolveDesign } from "@/lib/page-design";
import { SmartImg } from "./smart-img";

/**
 * Restaurant / café menu page. Deliberately calm: one photo at the top,
 * clear typography, text tabs with a sliding underline, simple rows with
 * name, price and an optional photo. Colours and fonts come from the page
 * design; the layout field picks rows, photo cards, a classic price list
 * or a centred fine-dining list.
 */

type C = Record<string, unknown>;
const s = (v: unknown) => String(v ?? "").trim();
const money = (p: string) => (p && /\d$/.test(p) ? `${p} €` : p);

const BADGES: Record<string, { label: string; icon: typeof Star; tone?: string }> = {
  beliebt: { label: "Beliebt", icon: Star },
  neu: { label: "Neu", icon: Sparkles },
  vegan: { label: "Vegan", icon: Leaf, tone: "green" },
  vegetarisch: { label: "Vegetarisch", icon: Leaf, tone: "green" },
  scharf: { label: "Scharf", icon: Flame, tone: "red" },
  hausgemacht: { label: "Hausgemacht", icon: Wheat },
};

/** The 14 EU allergens with the letters German menus commonly use. */
const ALLERGENS: Record<string, string> = {
  A: "Glutenhaltiges Getreide", B: "Krebstiere", C: "Eier", D: "Fisch", E: "Erdnüsse", F: "Soja", G: "Milch/Laktose",
  H: "Schalenfrüchte", L: "Sellerie", M: "Senf", N: "Sesam", O: "Sulfite", P: "Lupinen", R: "Weichtiere",
};
const allergenList = (tags: string) => tags.toUpperCase().split(/[\s,;]+/).filter((t) => ALLERGENS[t]);
const sectionId = (i: number) => `kat-${i}`;
const itemKey = (i: number, j: number) => `${i}-${j}`;

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

/** Marks [data-reveal] elements with data-in when they scroll into view (React leaves the attribute alone). */
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
  const d = resolveDesign(c);
  const layout = s(c.layout) || "cards";
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [bar, setBar] = useState<{ left: number; width: number } | null>(null);

  useReveal(rootRef, [sections, query, layout]);

  // Which category is on screen
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
    return () => io.disconnect();
  }, [sections, query]);

  // Sliding underline under the active tab; keep the tab in view
  useEffect(() => {
    const nav = navRef.current;
    const tab = nav?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
    if (!nav || !tab) return;
     
    setBar({ left: tab.offsetLeft, width: tab.offsetWidth });
    nav.scrollTo({ left: tab.offsetLeft - nav.clientWidth / 2 + tab.clientWidth / 2, behavior: "smooth" });
  }, [active, sections, searching]);

  const q = query.trim().toLowerCase();
  const filtered = q ? sections.map((sec) => ({ ...sec, items: sec.items.filter((it) => `${it.name} ${it.description}`.toLowerCase().includes(q)) })) : sections;
  const usedAllergens = Array.from(new Set(sections.flatMap((sec) => sec.items.flatMap((it) => allergenList(it.tags))))).sort();
  const highlights = useMemo(() => {
    const all = sections.flatMap((sec, i) => sec.items.map((it, j) => ({ it, key: itemKey(i, j) }))).filter((x) => !x.it.soldOut && x.it.name && x.it.image);
    const score = (x: (typeof all)[number]) => (x.it.badges.includes("beliebt") ? 2 : 0) + (x.it.badges.includes("neu") ? 1 : 0);
    return all.sort((a, b) => score(b) - score(a)).slice(0, 6);
  }, [sections]);
  const jumpTo = (key: string) => {
    setOpen(key);
    requestAnimationFrame(() => document.getElementById(`it-${key}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };
  const elegant = layout === "elegant";

  return (
    <div ref={rootRef} className="mn -mx-5 -mt-8" data-font={d.font}>
      <Header c={c} />

      {highlights.length >= 3 && !q && (
        <section className="mt-9" aria-label="Empfehlungen">
          <p className="px-5 text-[15px] font-semibold">Empfehlungen</p>
          <div className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-1 [scrollbar-width:none]">
            {highlights.map(({ it, key }, n) => (
              <button key={key} type="button" onClick={() => jumpTo(key)} data-reveal style={{ "--i": n } as React.CSSProperties} className="group w-36 shrink-0 snap-start text-left">
                <span className="block overflow-hidden rounded-[calc(var(--pg-radius)*0.7+4px)] bg-[var(--pg-soft)]">
                  <SmartImg src={it.image} width={480} className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105" fallback={<span className="block aspect-square" />} />
                </span>
                <span className="mt-2 block truncate text-[14px] font-medium">{it.name}</span>
                <span className="block text-[13px] tabular-nums text-[var(--pg-muted)]">{money(it.price || it.variants[0]?.price || "")}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Category tabs */}
      <nav className="sticky top-0 z-20 mt-8 border-b border-[var(--pg-line)] bg-[var(--pg-bg)]/92 backdrop-blur-md">
        {searching ? (
          <div className="flex h-12 items-center gap-2 px-5">
            <Search className="size-4 text-[var(--pg-muted)]" />
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Gericht suchen" className="min-w-0 flex-1 bg-transparent py-1 text-[15px] outline-none placeholder:text-[var(--pg-muted)]" />
            <button type="button" onClick={() => { setQuery(""); setSearching(false); }} aria-label="Suche schließen" className="grid size-8 place-items-center"><X className="size-4" /></button>
          </div>
        ) : (
          <div className="flex items-center">
            <div ref={navRef} className="relative flex flex-1 gap-6 overflow-x-auto px-5 [scrollbar-width:none]">
              {sections.map((sec, i) => (
                <button
                  key={i}
                  type="button"
                  data-tab={i}
                  onClick={() => document.getElementById(sectionId(i))?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className={`h-12 shrink-0 text-[15px] transition-colors ${i === active ? "font-semibold text-[var(--pg-fg)]" : "text-[var(--pg-muted)]"}`}
                >
                  {sec.title}
                </button>
              ))}
              {bar && <span className="mn-bar absolute bottom-0 h-[2px] rounded-full bg-[var(--accent)]" style={{ left: bar.left, width: bar.width }} />}
            </div>
            <button type="button" onClick={() => setSearching(true)} aria-label="Suchen" className="grid size-12 shrink-0 place-items-center text-[var(--pg-muted)] hover:text-[var(--pg-fg)]">
              <Search className="size-[18px]" />
            </button>
          </div>
        )}
      </nav>

      <div className="px-5">
        {filtered.map((sec, i) =>
          sec.items.length === 0 && q ? null : (
            <section key={i} id={sectionId(i)} data-index={i} className="scroll-mt-14 pt-9">
              <div data-reveal className={elegant ? "text-center" : ""}>
                <h2 className="pg-display" style={{ fontSize: "calc(1.75rem * var(--pg-display-scale))" }}>{sec.title}</h2>
                {sec.note && <p className="mt-1 text-[14px] text-[var(--pg-muted)]">{sec.note}</p>}
              </div>
              {layout === "grid" ? (
                <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-5">
                  {sec.items.map((it, j) => <GridItem key={j} it={it} n={j} id={itemKey(i, j)} open={open === itemKey(i, j)} onToggle={setOpen} />)}
                </div>
              ) : (
                <ul className={`mt-2 ${elegant ? "space-y-7 pt-3" : "divide-y divide-[var(--pg-line)]"}`}>
                  {sec.items.map((it, j) => {
                    const p = { it, n: j, id: itemKey(i, j), open: open === itemKey(i, j), onToggle: setOpen };
                    return elegant ? <ElegantItem key={j} {...p} /> : <RowItem key={j} {...p} classic={layout === "list"} />;
                  })}
                </ul>
              )}
            </section>
          ),
        )}
        {q && filtered.every((sec) => sec.items.length === 0) && <p className="py-12 text-center text-[var(--pg-muted)]">Nichts gefunden für „{query}“.</p>}
      </div>

      {(usedAllergens.length > 0 || s(c.footer)) && (
        <footer className="mx-5 mt-12 border-t border-[var(--pg-line)] pt-6 text-[12px] leading-relaxed text-[var(--pg-muted)]">
          {usedAllergens.length > 0 && <p className="mb-3"><span className="font-semibold text-[var(--pg-fg)]">Allergene:</span> {usedAllergens.map((a) => `${a} ${ALLERGENS[a]}`).join(" · ")}</p>}
          {s(c.footer) && <p className="whitespace-pre-line">{s(c.footer)}</p>}
        </footer>
      )}

      {(s(c.phone) || s(c.address)) && (
        <div className="mp-orderbar sticky bottom-3 z-20 mx-5 mt-10 flex gap-2 rounded-full border border-[var(--pg-line)] bg-[var(--pg-card)]/92 p-1.5 shadow-[0_14px_34px_-18px_rgba(0,0,0,0.4)] backdrop-blur-md">
          {s(c.phone) && (
            <a href={`tel:${s(c.phone).replace(/[^\d+]/g, "")}`} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--accent)] text-[14px] font-semibold text-[var(--on-accent)] transition active:scale-[0.97]">
              <Phone className="size-4" /> Bestellen
            </a>
          )}
          {s(c.address) && (
            <a href={mapsUrl(s(c.address))} target="_blank" rel="noopener" className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full text-[14px] font-semibold transition hover:bg-[var(--pg-soft)] active:scale-[0.97]">
              <MapPin className="size-4" /> Route
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ───────── header ─────────

function Header({ c }: { c: C }) {
  const cover = s(c.cover);
  const logo = s(c.logo);
  const name = s(c.name) || "Dein Lokal";
  const hours = s(c.hours);
  return (
    <header>
      {cover && (
        <div className="relative h-56 overflow-hidden bg-[var(--pg-soft)]">
          <SmartImg src={cover} width={1280} eager className="mn-cover size-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--pg-bg)] to-transparent" />
        </div>
      )}
      <div className={`relative px-5 ${cover ? "-mt-8" : "pt-10"}`}>
        {logo && (
          <SmartImg src={logo} width={240} eager className="mn-in size-[72px] rounded-[calc(var(--pg-radius)*0.6+8px)] border-4 border-[var(--pg-bg)] bg-[var(--pg-card)] object-cover shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)]" />
        )}
        <h1 className="pg-display mn-in mt-4 leading-[1.02]" style={{ fontSize: "calc(2.4rem * var(--pg-display-scale))", animationDelay: "60ms" }}>{name}</h1>
        {s(c.subtitle) && <p className="mn-in mt-2 text-[15px] leading-relaxed text-[var(--pg-muted)]" style={{ animationDelay: "120ms" }}>{s(c.subtitle)}</p>}
        <div className="mn-in mt-5 flex flex-wrap gap-2 text-[14px]" style={{ animationDelay: "180ms" }}>
          {s(c.phone) && (
            <a href={`tel:${s(c.phone).replace(/[^\d+]/g, "")}`} className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--accent)] px-4 font-medium text-[var(--on-accent)] transition active:scale-95">
              <Phone className="size-4" /> Anrufen
            </a>
          )}
          {s(c.address) && (
            <a href={mapsUrl(s(c.address))} target="_blank" rel="noopener" className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--pg-line)] px-4 font-medium transition hover:bg-[var(--pg-soft)] active:scale-95">
              <MapPin className="size-4" /> Route
            </a>
          )}
        </div>
        {hours && (
          <details className="group mt-4 text-[14px] text-[var(--pg-muted)]">
            <summary className="inline-flex cursor-pointer list-none items-center gap-1.5"><Clock className="size-4" /> Öffnungszeiten <ChevronDown className="size-3.5 transition group-open:rotate-180" /></summary>
            <p className="mt-2 whitespace-pre-line leading-relaxed">{hours}</p>
          </details>
        )}
      </div>
    </header>
  );
}

// ───────── items ─────────

interface ItemProps { it: MenuItemData; n: number; id: string; open: boolean; onToggle: (k: string | null) => void }

function Badges({ it, center }: { it: MenuItemData; center?: boolean }) {
  if (!it.badges.length && !it.soldOut) return null;
  return (
    <div className={`mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[12px] font-medium ${center ? "justify-center" : ""}`}>
      {it.soldOut && <span className="text-[var(--pg-fg)]">Ausverkauft</span>}
      {it.badges.map((b) => {
        const def = BADGES[b];
        if (!def) return null;
        const Icon = def.icon;
        return (
          <span key={b} className={`inline-flex items-center gap-1 ${def.tone === "green" ? "text-[#2f7d4a]" : def.tone === "red" ? "text-[#c23b2e]" : "text-[var(--accent)]"}`}>
            <Icon className="size-3.5" /> {def.label}
          </span>
        );
      })}
    </div>
  );
}

function Variants({ it, center }: { it: MenuItemData; center?: boolean }) {
  const v = it.variants.filter((x) => x.label || x.price);
  if (!v.length) return null;
  return (
    <div className={`mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] ${center ? "justify-center" : ""}`}>
      {v.map((x, k) => (
        <span key={k}><span className="text-[var(--pg-muted)]">{x.label}</span> <span className="font-semibold tabular-nums">{money(x.price)}</span></span>
      ))}
    </div>
  );
}

const sup = (it: MenuItemData) => (it.tags ? <sup className="ml-1 text-[10px] font-normal text-[var(--pg-muted)]">{it.tags}</sup> : null);

function Details({ it, open, photo }: { it: MenuItemData; open: boolean; photo: boolean }) {
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

const canOpen = (it: MenuItemData) => allergenList(it.tags).length > 0 || !!it.image;

/** Default row: name + price on one line, description below, photo on the right. */
function RowItem({ it, n, id, open, onToggle, classic }: ItemProps & { classic: boolean }) {
  const single = !it.variants.length;
  const showThumb = !!it.image && !classic;
  return (
    <li id={`it-${id}`} data-reveal style={{ "--i": n } as React.CSSProperties} className={it.soldOut ? "opacity-50" : ""}>
      <button type="button" disabled={!canOpen(it)} onClick={() => onToggle(open ? null : id)} aria-expanded={canOpen(it) ? open : undefined} className="flex w-full gap-4 py-4 text-left">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <p className="min-w-0 text-[16px] font-semibold leading-snug">{it.name}{sup(it)}</p>
            {classic && <span className="mb-1 flex-1 border-b border-dotted border-[var(--pg-muted)]/40" />}
            {single && it.price && <span className={`shrink-0 text-[15px] font-semibold tabular-nums ${classic ? "" : "ml-auto"}`}>{money(it.price)}</span>}
          </div>
          {it.description && <p className="mt-1 text-[14px] leading-relaxed text-[var(--pg-muted)]">{it.description}</p>}
          <Badges it={it} />
          <Variants it={it} />
          <Details it={it} open={open} photo={classic} />
        </div>
        {showThumb && (
          <span className="relative size-[88px] shrink-0 overflow-hidden rounded-[calc(var(--pg-radius)*0.6+4px)] bg-[var(--pg-soft)]">
            <SmartImg src={it.image} width={320} className="size-full object-cover" fallback={<span className="block size-full" />} />
          </span>
        )}
      </button>
    </li>
  );
}

function GridItem({ it, n, id, open, onToggle }: ItemProps) {
  return (
    <div id={`it-${id}`} data-reveal style={{ "--i": n % 2 } as React.CSSProperties} className={`${open ? "col-span-2" : ""} ${it.soldOut ? "opacity-50" : ""}`}>
      <button type="button" onClick={() => onToggle(open ? null : id)} aria-expanded={open} className="group block w-full text-left">
        <span className="block overflow-hidden rounded-[calc(var(--pg-radius)*0.7+4px)] bg-[var(--pg-soft)]">
          {it.image ? (
            <SmartImg src={it.image} width={open ? 1080 : 480} className={`w-full object-cover transition duration-500 group-hover:scale-[1.03] ${open ? "aspect-[16/10]" : "aspect-square"}`} fallback={<span className="block aspect-square" />} />
          ) : (
            <span className="pg-display grid aspect-square place-items-center text-4xl text-[var(--pg-muted)] opacity-40">{it.name.slice(0, 1)}</span>
          )}
        </span>
        <span className="mt-2 flex items-baseline gap-2">
          <span className="min-w-0 flex-1 text-[15px] font-semibold leading-snug">{it.name}{sup(it)}</span>
          {!it.variants.length && it.price && <span className="shrink-0 text-[14px] font-semibold tabular-nums">{money(it.price)}</span>}
        </span>
        {open && it.description && <span className="mt-1 block text-[14px] leading-relaxed text-[var(--pg-muted)]">{it.description}</span>}
        <Badges it={it} />
        <Variants it={it} />
        <Details it={it} open={open} photo={false} />
      </button>
    </div>
  );
}

function ElegantItem({ it, n, id, open, onToggle }: ItemProps) {
  return (
    <li id={`it-${id}`} data-reveal style={{ "--i": n } as React.CSSProperties} className={`text-center ${it.soldOut ? "opacity-50" : ""}`}>
      <button type="button" disabled={!canOpen(it)} onClick={() => onToggle(open ? null : id)} className="block w-full">
        <p className="pg-display text-[20px] leading-snug">{it.name}{sup(it)}</p>
        {it.description && <p className="mx-auto mt-1 max-w-xs text-[14px] italic leading-relaxed text-[var(--pg-muted)]">{it.description}</p>}
        {!it.variants.length && it.price && <p className="mt-1.5 text-[15px] font-semibold tabular-nums text-[var(--accent)]">{money(it.price)}</p>}
        <Badges it={it} center />
        <Variants it={it} center />
        <Details it={it} open={open} photo />
      </button>
    </li>
  );
}
