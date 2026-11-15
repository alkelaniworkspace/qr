"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Clock, Flame, Leaf, MapPin, Phone, Search, Sparkles, Star, Wheat, X } from "lucide-react";
import type { MenuItemData, MenuSectionData } from "@/lib/codes/types";
import { mapsUrl } from "@/lib/codes/payload";

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

function sectionId(i: number) {
  return `kat-${i}`;
}

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

export function MenuPage({ c }: { c: C }) {
  const sections = useMemo(() => normalize(c.sections), [c.sections]);
  const layout = s(c.layout) || "cards";
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

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

  // Keep the active pill in view inside the horizontal nav.
  useEffect(() => {
    // Scroll only the pill bar, never the page.
    const nav = navRef.current;
    const pill = nav?.querySelector<HTMLElement>(`[data-pill="${active}"]`);
    if (nav && pill) nav.scrollTo({ left: pill.offsetLeft - nav.clientWidth / 2 + pill.clientWidth / 2, behavior: "smooth" });
  }, [active]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? sections.map((sec) => ({ ...sec, items: sec.items.filter((it) => `${it.name} ${it.description}`.toLowerCase().includes(q)) }))
    : sections;
  const usedAllergens = Array.from(new Set(sections.flatMap((sec) => sec.items.flatMap((it) => it.tags.toUpperCase().split(/[\s,;]+/).filter((t) => ALLERGENS[t]))))).sort();
  const hours = s(c.hours);
  const cover = s(c.cover);
  const logo = s(c.logo);

  return (
    <div className="-mx-5 -mt-8">
      {/* Hero */}
      <header className="relative">
        <div className="relative h-44 overflow-hidden bg-[var(--accent)]">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="size-full object-cover" />
          ) : (
            <div className="size-full bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.25),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(0,0,0,0.25),transparent_50%)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--pg-bg)] via-transparent to-transparent" />
        </div>
        <div className="relative -mt-14 px-5 text-center">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="mx-auto size-24 rounded-[28px] border-4 border-[var(--pg-bg)] bg-[var(--pg-card)] object-cover shadow-lg" />
          ) : (
            <div className="mx-auto grid size-24 place-items-center rounded-[28px] border-4 border-[var(--pg-bg)] bg-[var(--accent)] font-display text-4xl text-[var(--on-accent)] shadow-lg">
              {s(c.name).slice(0, 1) || "?"}
            </div>
          )}
          <h1 className="mt-3 font-display text-4xl leading-none">{s(c.name)}</h1>
          {s(c.subtitle) && <p className="mt-2 text-[var(--pg-muted)]">{s(c.subtitle)}</p>}
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
            {s(c.phone) && (
              <a href={`tel:${s(c.phone).replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 py-2 font-semibold text-[var(--on-accent)]">
                <Phone className="size-4" /> Anrufen
              </a>
            )}
            {s(c.address) && (
              <a href={mapsUrl(s(c.address))} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-full border border-[var(--pg-line)] bg-[var(--pg-card)] px-4 py-2 font-semibold">
                <MapPin className="size-4" /> Route
              </a>
            )}
          </div>
          {hours && (
            <details className="mx-auto mt-3 max-w-xs text-sm text-[var(--pg-muted)]">
              <summary className="inline-flex cursor-pointer list-none items-center gap-1.5"><Clock className="size-4" /> Öffnungszeiten</summary>
              <p className="mt-2 whitespace-pre-line">{hours}</p>
            </details>
          )}
        </div>
      </header>

      {/* Sticky category bar */}
      <nav className="sticky top-0 z-20 mt-6 border-y border-[var(--pg-line)] bg-[var(--pg-bg)]/95 backdrop-blur">
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
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${i === active ? "bg-[var(--accent)] text-[var(--on-accent)]" : "bg-[var(--pg-soft)] text-[var(--pg-fg)]/80"}`}
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

      <div className="space-y-10 px-5 pt-6">
        {filtered.map((sec, i) =>
          sec.items.length === 0 && q ? null : (
            <section key={i} id={sectionId(i)} data-index={i} className="scroll-mt-16">
              <h2 className={`font-display text-3xl ${layout === "elegant" ? "text-center" : ""}`}>{sec.title}</h2>
              {sec.note && <p className={`mt-1 text-sm text-[var(--pg-muted)] ${layout === "elegant" ? "text-center" : ""}`}>{sec.note}</p>}
              <div className="mt-4">
                {layout === "grid" ? (
                  <div className="grid grid-cols-2 gap-3">{sec.items.map((it, j) => <GridItem key={j} it={it} />)}</div>
                ) : layout === "list" ? (
                  <ul className="space-y-5">{sec.items.map((it, j) => <ListItem key={j} it={it} />)}</ul>
                ) : layout === "elegant" ? (
                  <ul className="space-y-7">{sec.items.map((it, j) => <ElegantItem key={j} it={it} />)}</ul>
                ) : (
                  <ul className="space-y-3">{sec.items.map((it, j) => <CardItem key={j} it={it} />)}</ul>
                )}
              </div>
            </section>
          ),
        )}
        {q && filtered.every((sec) => sec.items.length === 0) && <p className="py-10 text-center text-[var(--pg-muted)]">Nichts gefunden für „{query}“.</p>}
      </div>

      {(usedAllergens.length > 0 || s(c.footer)) && (
        <footer className="mx-5 mt-12 border-t border-[var(--pg-line)] pt-6 text-xs leading-relaxed text-[var(--pg-muted)]">
          {usedAllergens.length > 0 && (
            <p className="mb-3">
              <b className="text-[var(--pg-fg)]">Allergene:</b> {usedAllergens.map((a) => `${a} ${ALLERGENS[a]}`).join(" · ")}
            </p>
          )}
          {s(c.footer) && <p className="whitespace-pre-line">{s(c.footer)}</p>}
        </footer>
      )}
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

function CardItem({ it }: { it: MenuItemData }) {
  return (
    <li className={`flex gap-3 rounded-2xl border border-[var(--pg-line)] bg-[var(--pg-card)] p-3 ${it.soldOut ? "opacity-55" : ""}`}>
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-snug">{it.name}{allergenNote(it)}</p>
        {it.description && <p className="mt-0.5 text-sm leading-snug text-[var(--pg-muted)]">{it.description}</p>}
        <Badges it={it} />
        <Prices it={it} />
      </div>
      {it.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={it.image} alt="" loading="lazy" className="size-24 shrink-0 rounded-xl object-cover" />
      )}
    </li>
  );
}

function GridItem({ it }: { it: MenuItemData }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-[var(--pg-line)] bg-[var(--pg-card)] ${it.soldOut ? "opacity-55" : ""}`}>
      {it.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={it.image} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
      ) : (
        <div className="grid aspect-[4/3] place-items-center bg-[var(--pg-soft)] font-display text-3xl text-[var(--accent)]">{it.name.slice(0, 1)}</div>
      )}
      <div className="p-2.5">
        <p className="text-sm font-semibold leading-snug">{it.name}{allergenNote(it)}</p>
        <Badges it={it} />
        <Prices it={it} />
      </div>
    </div>
  );
}

function ListItem({ it }: { it: MenuItemData }) {
  const single = !it.variants.length;
  return (
    <li className={it.soldOut ? "opacity-55" : ""}>
      <div className="flex items-baseline gap-2">
        <span className="font-medium">{it.name}{allergenNote(it)}</span>
        <span className="mb-1 flex-1 border-b border-dotted border-[var(--pg-muted)]/40" />
        {single && it.price && <span className="font-medium tabular-nums">{money(it.price)}</span>}
      </div>
      {it.description && <p className="mt-0.5 text-sm leading-relaxed text-[var(--pg-muted)]">{it.description}</p>}
      <Badges it={it} />
      {!single && <Prices it={it} />}
    </li>
  );
}

function ElegantItem({ it }: { it: MenuItemData }) {
  return (
    <li className={`text-center ${it.soldOut ? "opacity-55" : ""}`}>
      <p className="text-sm font-semibold uppercase tracking-[0.18em]">{it.name}{allergenNote(it)}</p>
      {it.description && <p className="mx-auto mt-1 max-w-xs text-sm italic leading-relaxed text-[var(--pg-muted)]">{it.description}</p>}
      <Badges it={it} center />
      <Prices it={it} align="center" />
    </li>
  );
}
