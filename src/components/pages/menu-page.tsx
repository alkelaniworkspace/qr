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
import { menuStyle, type MenuStyle } from "@/lib/menu-styles";

type C = Record<string, unknown>;
const s = (v: unknown) => String(v ?? "").trim();
const money = (p: string) => (p && /\d$/.test(p) ? `${p} €` : p);

const BADGES: Record<string, { label: string; icon?: typeof Star }> = {
  beliebt: { label: "Beliebt", icon: Star },
  neu: { label: "Neu", icon: Sparkles },
  vegan: { label: "Vegan", icon: Leaf },
  vegetarisch: { label: "Vegetarisch", icon: Leaf },
  scharf: { label: "Scharf", icon: Flame },
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

/** Marks [data-reveal] elements with data-in (an attribute React does not manage, so re-renders keep it) as they scroll into view. Without JS everything stays visible. */
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
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    el.querySelectorAll("[data-reveal]:not([data-in])").forEach((n) => io.observe(n));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function MenuPage({ c }: { c: C }) {
  const sections = useMemo(() => normalize(c.sections), [c.sections]);
  const st = menuStyle(c.style);
  const layout = s(c.layout) || st.layout;
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useReveal(rootRef, [sections, query, layout, st.id]);

  // The root class is set from code too; keep it when React re-renders the className.
  // Highlight the category currently on screen.
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

  // Keep the active pill in view inside the horizontal nav (never scroll the page).
  useEffect(() => {
    const nav = navRef.current;
    const pill = nav?.querySelector<HTMLElement>(`[data-pill="${active}"]`);
    if (nav && pill) nav.scrollTo({ left: pill.offsetLeft - nav.clientWidth / 2 + pill.clientWidth / 2, behavior: "smooth" });
  }, [active]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? sections.map((sec) => ({ ...sec, items: sec.items.filter((it) => `${it.name} ${it.description}`.toLowerCase().includes(q)) }))
    : sections;
  const usedAllergens = Array.from(new Set(sections.flatMap((sec) => sec.items.flatMap((it) => allergenList(it.tags))))).sort();

  // Recommendations: dishes marked popular/new, then dishes with photos.
  const highlights = useMemo(() => {
    const all = sections.flatMap((sec, i) => sec.items.map((it, j) => ({ it, key: itemKey(i, j) }))).filter((x) => !x.it.soldOut && x.it.name);
    const score = (x: (typeof all)[number]) => (x.it.badges.includes("beliebt") ? 3 : 0) + (x.it.badges.includes("neu") ? 2 : 0) + (x.it.image ? 1 : 0);
    return all.filter((x) => score(x) >= 2 || (x.it.image && score(x) >= 1)).sort((a, b) => score(b) - score(a)).slice(0, 8);
  }, [sections]);

  const jumpTo = (key: string) => {
    setOpen(key);
    requestAnimationFrame(() => document.getElementById(`it-${key}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };

  const vars = { "--mp-display": st.display, "--mp-radius": `${st.radius}px`, "--mp-hscale": String(st.headingScale) } as React.CSSProperties;
  const itemFont = st.id === "bistro" || st.id === "fine" || st.id === "trattoria";

  return (
    <div ref={rootRef} className="mp mp-js -mx-5 -mt-8" data-style={st.id} style={vars}>
      <noscript><style>{".mp.mp-js [data-reveal]{opacity:1;transform:none}"}</style></noscript>
      <Hero c={c} st={st} />
      <Actions c={c} st={st} />

      {highlights.length >= 2 && !q && (
        <section className="mt-8" aria-label="Empfehlungen">
          <p className="px-5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--pg-muted)]">{st.id === "street" ? "Must eat" : "Empfehlungen"}</p>
          <div className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-2 [scrollbar-width:none]">
            {highlights.map(({ it, key }, n) => (
              <button
                key={key}
                type="button"
                onClick={() => jumpTo(key)}
                data-reveal
                style={{ "--i": n } as React.CSSProperties}
                className="mp-card group relative w-40 shrink-0 snap-start overflow-hidden border border-[var(--pg-line)] bg-[var(--pg-card)] text-left"
              >
                <Photo it={it} st={st} className="aspect-[4/5] w-full" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-10 text-white">
                  <span className={`block text-sm font-semibold leading-tight ${itemFont ? "mp-display" : ""}`}>{it.name}</span>
                  <span className="mt-1 block text-xs font-semibold tabular-nums opacity-90">{money(it.price || it.variants[0]?.price || "")}</span>
                </span>
                {it.badges[0] && BADGES[it.badges[0]] && <span className="absolute left-2 top-2 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--on-accent)]">{BADGES[it.badges[0]].label}</span>}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Sticky category bar */}
      <nav className="sticky top-0 z-20 mt-6 border-y border-[var(--pg-line)] bg-[var(--pg-bg)]/90 backdrop-blur-md">
        {searching ? (
          <div className="flex items-center gap-2 px-4 py-2.5">
            <Search className="size-4 text-[var(--pg-muted)]" />
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Gericht suchen …" className="min-w-0 flex-1 bg-transparent py-1 outline-none placeholder:text-[var(--pg-muted)]" />
            <button type="button" onClick={() => { setQuery(""); setSearching(false); }} aria-label="Suche schließen"><X className="size-5" /></button>
          </div>
        ) : (
          <div className="flex items-center">
            <div ref={navRef} className="flex flex-1 gap-1.5 overflow-x-auto px-4 py-2.5 [scrollbar-width:none]">
              {sections.map((sec, i) => (
                <button
                  key={i}
                  type="button"
                  data-pill={i}
                  onClick={() => document.getElementById(sectionId(i))?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className={`mp-pill shrink-0 px-4 py-2 text-sm font-semibold transition-all duration-300 ${st.uppercase ? "uppercase tracking-wide" : ""} ${i === active ? "bg-[var(--accent)] text-[var(--on-accent)] shadow-[0_6px_16px_-8px_var(--accent)]" : "bg-[var(--pg-soft)] text-[var(--pg-fg)]/80"}`}
                >
                  {sec.title}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setSearching(true)} aria-label="Suchen" className="grid size-11 shrink-0 place-items-center border-l border-[var(--pg-line)]">
              <Search className="size-4" />
            </button>
          </div>
        )}
      </nav>

      <div className="space-y-12 px-5 pt-8">
        {filtered.map((sec, i) =>
          sec.items.length === 0 && q ? null : (
            <section key={i} id={sectionId(i)} data-index={i} className="scroll-mt-16">
              <Heading st={st} title={sec.title} note={sec.note} center={layout === "elegant"} />
              <div className="mt-5">
                {layout === "grid" ? (
                  <div className="grid grid-cols-2 gap-3">
                    {sec.items.map((it, j) => <GridItem key={j} it={it} st={st} n={j} id={itemKey(i, j)} open={open === itemKey(i, j)} onToggle={setOpen} itemFont={itemFont} />)}
                  </div>
                ) : (
                  <ul className={layout === "list" ? "space-y-5" : layout === "elegant" ? "space-y-8" : "space-y-3"}>
                    {sec.items.map((it, j) => {
                      const p = { it, st, n: j, id: itemKey(i, j), open: open === itemKey(i, j), onToggle: setOpen, itemFont };
                      return layout === "list" ? <ListItem key={j} {...p} /> : layout === "elegant" ? <ElegantItem key={j} {...p} /> : <CardItem key={j} {...p} />;
                    })}
                  </ul>
                )}
              </div>
            </section>
          ),
        )}
        {q && filtered.every((sec) => sec.items.length === 0) && <p className="py-10 text-center text-[var(--pg-muted)]">Nichts gefunden für „{query}“.</p>}
      </div>

      {(usedAllergens.length > 0 || s(c.footer)) && (
        <footer className="mx-5 mt-14 border-t border-[var(--pg-line)] pt-6 text-xs leading-relaxed text-[var(--pg-muted)]">
          {usedAllergens.length > 0 && (
            <p className="mb-3"><b className="text-[var(--pg-fg)]">Allergene:</b> {usedAllergens.map((a) => `${a} ${ALLERGENS[a]}`).join(" · ")}</p>
          )}
          {s(c.footer) && <p className="whitespace-pre-line">{s(c.footer)}</p>}
        </footer>
      )}

      {/* Order bar: stays at the bottom of the screen while scrolling through the menu */}
      {(s(c.phone) || s(c.address)) && (
        <div className="mp-orderbar sticky bottom-3 z-20 mx-5 mt-10 flex gap-2 rounded-full border border-[var(--pg-line)] bg-[var(--pg-card)]/90 p-1.5 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.45)] backdrop-blur-md mp-rise">
          {s(c.phone) && (
            <a href={`tel:${s(c.phone).replace(/[^\d+]/g, "")}`} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--accent)] text-sm font-semibold text-[var(--on-accent)] transition active:scale-[0.97]">
              <Phone className="size-4" /> Bestellen
            </a>
          )}
          {s(c.address) && (
            <a href={mapsUrl(s(c.address))} target="_blank" rel="noopener" className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full text-sm font-semibold transition hover:bg-[var(--pg-soft)] active:scale-[0.97]">
              <MapPin className="size-4" /> Route
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ───────── hero ─────────

function Monogram({ c, className = "" }: { c: C; className?: string }) {
  const logo = s(c.logo);
  if (logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logo} alt="" referrerPolicy="no-referrer" className={`object-cover ${className}`} />;
  }
  return <div className={`grid place-items-center bg-[var(--accent)] text-[var(--on-accent)] mp-display ${className}`}>{s(c.name).slice(0, 1) || "?"}</div>;
}

function Cover({ c, className = "", fallback }: { c: C; className?: string; fallback: React.ReactNode }) {
  const cover = s(c.cover);
  if (!cover) return <>{fallback}</>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={cover} alt="" referrerPolicy="no-referrer" className={`size-full object-cover mp-kenburns ${className}`} />;
}

function Hero({ c, st }: { c: C; st: MenuStyle }) {
  const name = s(c.name);
  const sub = s(c.subtitle);

  if (st.hero === "overlay") {
    const pattern = st.id === "trattoria"
      ? "bg-[repeating-conic-gradient(var(--accent)_0_25%,#fbf8f1_0_50%)] bg-[length:36px_36px] opacity-90"
      : "bg-[radial-gradient(circle_at_30%_20%,color-mix(in_srgb,var(--accent)_55%,transparent),transparent_55%),radial-gradient(circle_at_80%_90%,color-mix(in_srgb,var(--accent)_35%,#000),transparent_60%)] bg-[var(--pg-fg)]";
    return (
      <header className="relative h-[340px] overflow-hidden">
        <Cover c={c} fallback={<div className={`size-full ${pattern}`} />} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 p-6 text-white">
          <Monogram c={c} className="mp-pop size-16 rounded-2xl border-2 border-white/80 text-3xl shadow-lg" />
          <h1 className="mp-display mp-rise mt-4 text-[44px] leading-[0.95]" style={{ animationDelay: "120ms" }}>{name}</h1>
          {sub && <p className="mp-rise mt-2 max-w-xs text-[15px] text-white/80" style={{ animationDelay: "240ms" }}>{sub}</p>}
        </div>
      </header>
    );
  }

  if (st.hero === "soft") {
    return (
      <header className="px-4 pt-4 text-center">
        <div className="relative h-56 overflow-hidden rounded-[28px] bg-[var(--pg-soft)]">
          <Cover c={c} fallback={
            <div className="size-full bg-[radial-gradient(circle_at_20%_30%,color-mix(in_srgb,var(--accent)_35%,transparent),transparent_45%),radial-gradient(circle_at_80%_70%,#f2c9a8,transparent_50%),radial-gradient(circle_at_60%_10%,#fff3e6,transparent_40%)]">
              <span className="mp-float absolute left-[18%] top-[30%] size-14 rounded-full bg-white/50 blur-[2px]" />
              <span className="mp-float absolute right-[16%] top-[18%] size-8 rounded-full bg-white/60" style={{ animationDelay: "1.2s" }} />
            </div>
          } />
        </div>
        <Monogram c={c} className="mp-pop relative mx-auto -mt-12 size-24 rounded-full border-[5px] border-[var(--pg-bg)] text-4xl shadow-[0_14px_30px_-14px_rgba(0,0,0,0.45)]" />
        <h1 className="mp-display mp-rise mt-2 text-[58px] leading-[0.9] text-[var(--pg-fg)]">{name}</h1>
        {sub && <p className="mp-rise mx-auto mt-1 max-w-xs text-[15px] text-[var(--pg-muted)]" style={{ animationDelay: "150ms" }}>{sub}</p>}
      </header>
    );
  }

  if (st.hero === "bold") {
    const band = `${sub || name} ✶ `.repeat(8);
    return (
      <header className="relative overflow-hidden bg-black pb-10">
        <div className="absolute inset-0 opacity-45">
          <Cover c={c} className="grayscale-[30%]" fallback={<div className="size-full bg-[repeating-linear-gradient(-45deg,#151515_0_18px,#0d0d0d_18px_36px)]" />} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-black" />
        <div className="relative px-6 pt-16">
          <Monogram c={c} className="mp-pop size-14 rounded-lg text-3xl" />
          <h1 className="mp-display mp-rise mt-5 break-words text-[84px] uppercase leading-[0.82] text-[var(--accent)]" style={{ animationDelay: "100ms" }}>{name}</h1>
        </div>
        <div className="relative mt-8 -rotate-2 overflow-hidden bg-[var(--accent)] py-2 text-[var(--on-accent)] shadow-[0_10px_30px_-10px_var(--accent)]">
          <div className="mp-marquee flex w-max whitespace-nowrap">
            <span className="mp-display px-2 text-2xl uppercase tracking-wide">{band}</span>
            <span className="mp-display px-2 text-2xl uppercase tracking-wide" aria-hidden>{band}</span>
          </div>
        </div>
      </header>
    );
  }

  if (st.hero === "centered") {
    return (
      <header className="relative overflow-hidden px-6 pb-6 pt-14 text-center">
        {s(c.cover) && (
          <div className="absolute inset-0 opacity-25">
            <Cover c={c} fallback={null} />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--pg-bg)]/70 to-[var(--pg-bg)]" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-4 border border-[var(--pg-line)]" />
        <div className="relative">
          <div className="mp-pop mx-auto grid size-20 place-items-center rounded-full border border-[var(--accent)] p-1.5">
            <Monogram c={c} className="size-full rounded-full !bg-transparent text-4xl !text-[var(--accent)]" />
          </div>
          <h1 className="mp-display mp-rise mt-6 text-[46px] font-medium uppercase leading-none tracking-[0.12em]" style={{ animationDelay: "120ms" }}>{name}</h1>
          <div className="mp-rise mx-auto mt-4 flex max-w-[220px] items-center gap-3 text-[var(--accent)]" style={{ animationDelay: "220ms" }}>
            <span className="h-px flex-1 bg-current opacity-60" /> <span className="text-xs">✦</span> <span className="h-px flex-1 bg-current opacity-60" />
          </div>
          {sub && <p className="mp-display mp-rise mt-3 text-xl italic text-[var(--pg-muted)]" style={{ animationDelay: "300ms" }}>{sub}</p>}
        </div>
      </header>
    );
  }

  // classic
  return (
    <header className="relative">
      <div className="relative h-48 overflow-hidden bg-[var(--accent)]">
        <Cover c={c} fallback={<div className="size-full bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.25),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(0,0,0,0.25),transparent_50%)]" />} />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--pg-bg)] via-transparent to-transparent" />
      </div>
      <div className="relative -mt-14 px-5 text-center">
        <Monogram c={c} className="mp-pop mx-auto size-24 rounded-[28px] border-4 border-[var(--pg-bg)] text-4xl shadow-lg" />
        <h1 className="mp-display mp-rise mt-3 text-4xl leading-none">{name}</h1>
        {sub && <p className="mp-rise mt-2 text-[var(--pg-muted)]" style={{ animationDelay: "120ms" }}>{sub}</p>}
      </div>
    </header>
  );
}

function Actions({ c, st }: { c: C; st: MenuStyle }) {
  const hours = s(c.hours);
  if (!s(c.phone) && !s(c.address) && !hours) return null;
  const left = st.hero === "overlay" || st.hero === "bold";
  return (
    <div className={`mp-rise mt-5 px-5 ${left ? "" : "text-center"}`} style={{ animationDelay: "320ms" }}>
      <div className={`flex flex-wrap gap-2 text-sm ${left ? "" : "justify-center"}`}>
        {s(c.phone) && (
          <a href={`tel:${s(c.phone).replace(/[^\d+]/g, "")}`} className="mp-pill inline-flex items-center gap-1.5 bg-[var(--accent)] px-4 py-2 font-semibold text-[var(--on-accent)] transition active:scale-95">
            <Phone className="size-4" /> Anrufen
          </a>
        )}
        {s(c.address) && (
          <a href={mapsUrl(s(c.address))} target="_blank" rel="noopener" className="mp-pill inline-flex items-center gap-1.5 border border-[var(--pg-line)] bg-[var(--pg-card)] px-4 py-2 font-semibold transition active:scale-95">
            <MapPin className="size-4" /> Route
          </a>
        )}
      </div>
      {hours && (
        <details className={`group mt-3 text-sm text-[var(--pg-muted)] ${left ? "" : "mx-auto max-w-xs"}`}>
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5"><Clock className="size-4" /> Öffnungszeiten <ChevronDown className="size-3.5 transition group-open:rotate-180" /></summary>
          <p className="mt-2 whitespace-pre-line">{hours}</p>
        </details>
      )}
    </div>
  );
}

// ───────── section headings ─────────

function Heading({ st, title, note, center }: { st: MenuStyle; title: string; note: string; center: boolean }) {
  const size = { fontSize: `calc(1.875rem * var(--mp-hscale))` };
  const noteEl = note ? <p className={`mt-1.5 text-sm text-[var(--pg-muted)] ${center || st.heading === "lines" ? "text-center" : ""}`}>{note}</p> : null;
  switch (st.heading) {
    case "ornament":
      return (
        <div data-reveal>
          <div className="flex items-center gap-3">
            <h2 className="mp-display shrink-0 italic leading-none" style={size}>{title}</h2>
            <span className="h-px flex-1 bg-[var(--pg-line)]" />
            <Wheat className="size-4 text-[var(--accent)]" />
          </div>
          {noteEl}
        </div>
      );
    case "script":
      return (
        <div data-reveal className={center ? "text-center" : ""}>
          <h2 className="mp-display inline-block -rotate-1 leading-none text-[var(--accent)]" style={size}>{title}</h2>
          {noteEl}
        </div>
      );
    case "block":
      return (
        <div data-reveal>
          <h2 className="mp-display relative inline-block uppercase leading-none" style={size}>
            <span className="relative z-10">{title}</span>
            <span className="mp-grow absolute -inset-x-1 bottom-0.5 z-0 h-[38%] origin-left bg-[var(--accent)]/90" />
          </h2>
          {noteEl}
        </div>
      );
    case "lines":
      return (
        <div data-reveal>
          <div className="flex items-center gap-4 text-[var(--accent)]">
            <span className="mp-grow h-px flex-1 origin-right bg-current opacity-50" />
            <h2 className="mp-display shrink-0 italic leading-none text-[var(--pg-fg)]" style={size}>{title}</h2>
            <span className="mp-grow h-px flex-1 origin-left bg-current opacity-50" />
          </div>
          {noteEl}
        </div>
      );
    case "underline":
      return (
        <div data-reveal className={center ? "text-center" : ""}>
          <h2 className="mp-display inline-block italic leading-none" style={size}>{title}</h2>
          <svg viewBox="0 0 120 10" className={`mp-draw mt-1.5 h-2.5 w-24 text-[var(--accent)] ${center ? "mx-auto" : ""}`} aria-hidden>
            <path d="M2 6 C 20 1, 30 9, 48 5 S 80 1, 96 6 S 112 8, 118 4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" pathLength={1} />
          </svg>
          {noteEl}
        </div>
      );
    default:
      return (
        <div data-reveal className={center ? "text-center" : ""}>
          <h2 className="mp-display leading-tight" style={size}>{title}</h2>
          {noteEl}
        </div>
      );
  }
}

// ───────── items ─────────

interface ItemProps { it: MenuItemData; st: MenuStyle; n: number; id: string; open: boolean; onToggle: (k: string | null) => void; itemFont: boolean }

function Photo({ it, st, className = "" }: { it: MenuItemData; st: MenuStyle; className?: string }) {
  if (it.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={it.image} alt="" referrerPolicy="no-referrer" loading="lazy" className={`object-cover transition duration-500 group-hover:scale-105 ${className}`} />;
  }
  return (
    <div className={`grid place-items-center bg-[radial-gradient(circle_at_30%_25%,color-mix(in_srgb,var(--accent)_28%,var(--pg-soft)),var(--pg-soft)_70%)] ${className}`}>
      <span className={`mp-display text-5xl text-[var(--accent)] opacity-80 ${st.uppercase ? "uppercase" : ""}`}>{it.name.slice(0, 1)}</span>
    </div>
  );
}

function Badges({ it, center }: { it: MenuItemData; center?: boolean }) {
  if (!it.badges.length && !it.soldOut) return null;
  return (
    <div className={`mt-1.5 flex flex-wrap gap-1 ${center ? "justify-center" : ""}`}>
      {it.soldOut && <span className="rounded-full bg-[var(--pg-fg)] px-2 py-0.5 text-[11px] font-semibold text-[var(--pg-bg)]">Ausverkauft</span>}
      {it.badges.map((b) => {
        const def = BADGES[b];
        if (!def) return null;
        const Icon = def.icon;
        return (
          <span key={b} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${b === "scharf" ? "bg-[#ef4444]/15 text-[#dc2626]" : b === "vegan" || b === "vegetarisch" ? "bg-[#16a34a]/15 text-[#15803d]" : "bg-[var(--accent)]/15 text-[var(--accent)]"}`}>
            {Icon && <Icon className="size-3" />} {def.label}
          </span>
        );
      })}
    </div>
  );
}

function Prices({ it, align = "left" }: { it: MenuItemData; align?: "left" | "center" }) {
  const variants = it.variants.filter((v) => v.label || v.price);
  if (variants.length) {
    return (
      <div className={`mt-2 flex flex-wrap gap-1.5 ${align === "center" ? "justify-center" : ""}`}>
        {variants.map((v, k) => (
          <span key={k} className="rounded-lg border border-[var(--pg-line)] px-2 py-1 text-xs">
            {v.label && <span className="text-[var(--pg-muted)]">{v.label} </span>}
            <b className="tabular-nums">{money(v.price)}</b>
          </span>
        ))}
      </div>
    );
  }
  return it.price ? <p className="mt-1.5 font-semibold tabular-nums text-[var(--accent)]">{money(it.price)}</p> : null;
}

const allergenNote = (it: MenuItemData) => (it.tags ? <sup className="ml-1 text-[10px] font-normal text-[var(--pg-muted)]">{it.tags}</sup> : null);

/** Expandable detail: large photo (when the layout hides it) and allergens in words. */
function Details({ it, open, showPhoto }: { it: MenuItemData; open: boolean; showPhoto: boolean }) {
  const al = allergenList(it.tags);
  if (!al.length && !(showPhoto && it.image)) return null;
  return (
    <div className={`grid transition-[grid-template-rows,opacity] duration-400 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
      <div className="overflow-hidden">
        {showPhoto && it.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={it.image} alt="" referrerPolicy="no-referrer" loading="lazy" className="mp-card mt-3 aspect-[16/10] w-full object-cover" />
        )}
        {al.length > 0 && <p className="mt-2 text-xs text-[var(--pg-muted)]"><b className="font-semibold text-[var(--pg-fg)]">Enthält:</b> {al.map((a) => ALLERGENS[a]).join(", ")}</p>}
      </div>
    </div>
  );
}

const expandable = (it: MenuItemData) => allergenList(it.tags).length > 0 || !!it.image;

function CardItem({ it, n, id, open, onToggle, itemFont }: ItemProps) {
  const can = expandable(it);
  return (
    <li id={`it-${id}`} data-reveal style={{ "--i": n } as React.CSSProperties} className={`mp-card group border bg-[var(--pg-card)] p-3 transition-all duration-300 ${open ? "border-[var(--accent)] shadow-[0_16px_34px_-22px_var(--accent)]" : "border-[var(--pg-line)]"} ${it.soldOut ? "opacity-55" : ""}`}>
      <button type="button" disabled={!can} onClick={() => onToggle(open ? null : id)} aria-expanded={can ? open : undefined} className="flex w-full gap-3 text-left">
        <div className="min-w-0 flex-1">
          <p className={`font-semibold leading-snug ${itemFont ? "mp-display text-[17px]" : ""}`}>{it.name}{allergenNote(it)}</p>
          {it.description && <p className="mt-0.5 text-sm leading-snug text-[var(--pg-muted)]">{it.description}</p>}
          <Badges it={it} />
          <Prices it={it} />
        </div>
        {it.image && (
          <span className="mp-card relative size-24 shrink-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={it.image} alt="" referrerPolicy="no-referrer" loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-110" />
          </span>
        )}
      </button>
      <Details it={it} open={open} showPhoto={false} />
    </li>
  );
}

function GridItem({ it, st, n, id, open, onToggle, itemFont }: ItemProps) {
  return (
    <div id={`it-${id}`} data-reveal style={{ "--i": n % 2 } as React.CSSProperties} className={`mp-card group overflow-hidden border bg-[var(--pg-card)] transition-all duration-300 ${open ? "col-span-2 border-[var(--accent)]" : "border-[var(--pg-line)]"} ${it.soldOut ? "opacity-55" : ""}`}>
      <button type="button" onClick={() => onToggle(open ? null : id)} aria-expanded={open} className="block w-full text-left">
        <div className="relative overflow-hidden">
          <Photo it={it} st={st} className={`w-full ${open ? "aspect-[16/10]" : "aspect-[4/3]"}`} />
          {(it.price || it.variants[0]) && st.id === "street" && (
            <span className="absolute bottom-2 right-2 rounded-md bg-[var(--accent)] px-2 py-0.5 font-[family-name:var(--mp-display)] text-lg leading-tight text-[var(--on-accent)]">{money(it.price || it.variants[0].price)}</span>
          )}
        </div>
        <div className="p-3">
          <p className={`text-sm font-semibold leading-snug ${itemFont ? "mp-display text-base" : ""} ${st.uppercase ? "mp-display text-xl font-normal uppercase tracking-wide" : ""}`}>{it.name}{allergenNote(it)}</p>
          {open && it.description && <p className="mt-1 text-sm leading-snug text-[var(--pg-muted)]">{it.description}</p>}
          <Badges it={it} />
          {!(st.id === "street" && !it.variants.length) && <Prices it={it} />}
          <Details it={it} open={open} showPhoto={false} />
        </div>
      </button>
    </div>
  );
}

function ListItem({ it, n, id, open, onToggle, itemFont }: ItemProps) {
  const single = !it.variants.length;
  const can = expandable(it);
  return (
    <li id={`it-${id}`} data-reveal style={{ "--i": n } as React.CSSProperties} className={it.soldOut ? "opacity-55" : ""}>
      <button type="button" disabled={!can} onClick={() => onToggle(open ? null : id)} aria-expanded={can ? open : undefined} className="block w-full text-left">
        <div className="flex items-baseline gap-2">
          {it.image && <span className="mt-0.5 size-2 shrink-0 self-center rounded-full bg-[var(--accent)]" title="Mit Foto" />}
          <span className={`font-medium ${itemFont ? "mp-display text-[18px]" : ""}`}>{it.name}{allergenNote(it)}</span>
          <span className="mb-1 flex-1 border-b border-dotted border-[var(--pg-muted)]/40" />
          {single && it.price && <span className="font-medium tabular-nums">{money(it.price)}</span>}
        </div>
        {it.description && <p className="mt-0.5 text-sm leading-relaxed text-[var(--pg-muted)]">{it.description}</p>}
        <Badges it={it} />
        {!single && <Prices it={it} />}
        <Details it={it} open={open} showPhoto />
      </button>
    </li>
  );
}

function ElegantItem({ it, n, id, open, onToggle, itemFont }: ItemProps) {
  const can = expandable(it);
  return (
    <li id={`it-${id}`} data-reveal style={{ "--i": n } as React.CSSProperties} className={`text-center ${it.soldOut ? "opacity-55" : ""}`}>
      <button type="button" disabled={!can} onClick={() => onToggle(open ? null : id)} aria-expanded={can ? open : undefined} className="block w-full">
        <p className={`font-semibold uppercase tracking-[0.18em] ${itemFont ? "mp-display text-lg font-medium" : "text-sm"}`}>{it.name}{allergenNote(it)}</p>
        {it.description && <p className={`mx-auto mt-1 max-w-xs italic leading-relaxed text-[var(--pg-muted)] ${itemFont ? "mp-display text-[17px]" : "text-sm"}`}>{it.description}</p>}
        <Badges it={it} center />
        <Prices it={it} align="center" />
        <Details it={it} open={open} showPhoto />
      </button>
    </li>
  );
}
