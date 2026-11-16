"use client";

import "./menu-showcase.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight, Beef, Bike, Cake, Clock, Coffee, CupSoda, Fish, Flame, Heart, IceCreamCone, Leaf, MapPin, MessageCircle, Moon,
  Navigation, Phone, Pizza, Salad, Sandwich, Search, Share2, ShoppingBag, Soup, Sparkles, Star, Sun, Utensils, Wheat, Wine, X, Croissant, Hamburger, Drumstick,
} from "lucide-react";
import type { MenuItemData, MenuSectionData, PromoData, ReviewData } from "@/lib/codes/types";
import { mapsUrl } from "@/lib/codes/payload";
import { openState, parseHours, todayLine, type OpenState } from "@/lib/hours";
import type { MenuTemplate } from "@/lib/menu-templates";
import { isDark, resolveDesign } from "@/lib/page-design";
import { brandOf } from "./brand-icons";
import { SmartImg } from "./smart-img";

/**
 * Showcase menu: a complete restaurant page in the style of a delivery app,
 * without a cart. Cover + profile card, quick actions, promo slider, search,
 * sticky category chips, popular dishes, per-category layouts, dish sheet,
 * reviews, live opening hours, location and a floating call bar.
 * Colours and fonts come from the page design (CSS variables on the shell).
 */

type C = Record<string, unknown>;
const s = (v: unknown) => String(v ?? "").trim();
const money = (p: string) => (p && /\d$/.test(p) ? `${p} €` : p);
const tel = (v: string) => `tel:${v.replace(/[^\d+]/g, "")}`;
const wa = (v: string) => `https://wa.me/${v.replace(/[^\d]/g, "").replace(/^0/, "49")}`;
const fromPrice = (it: MenuItemData) => (it.price ? money(it.price) : it.variants.find((v) => v.price) ? `ab ${money(it.variants.find((v) => v.price)!.price)}` : "");

const BADGES: Record<string, { label: string; icon: typeof Star; tone?: "hot" | "veg" }> = {
  beliebt: { label: "Beliebt", icon: Star, tone: "hot" },
  neu: { label: "Neu", icon: Sparkles },
  vegan: { label: "Vegan", icon: Leaf, tone: "veg" },
  vegetarisch: { label: "Vegetarisch", icon: Leaf, tone: "veg" },
  scharf: { label: "Scharf", icon: Flame, tone: "hot" },
  hausgemacht: { label: "Hausgemacht", icon: Wheat },
};
const ALLERGENS: Record<string, string> = {
  A: "Gluten", B: "Krebstiere", C: "Eier", D: "Fisch", E: "Erdnüsse", F: "Soja", G: "Milch", H: "Schalenfrüchte",
  L: "Sellerie", M: "Senf", N: "Sesam", O: "Sulfite", P: "Lupinen", R: "Weichtiere",
};
const allergens = (tags: string) => tags.toUpperCase().split(/[\s,;]+/).filter((t) => ALLERGENS[t]).map((t) => ALLERGENS[t]);

/** Category icon from its title (German and a few English words). */
const CAT_ICONS: [RegExp, typeof Pizza][] = [
  [/burger|smash/i, Hamburger], [/pizz/i, Pizza], [/pasta|nudel|spaghetti|penne|lasagne/i, Soup], [/salat|salad|bowl|poke/i, Salad],
  [/döner|doner|kebab|dürüm|wrap|sandwich|baguette|toast/i, Sandwich], [/grill|steak|fleisch|schnitzel|teller/i, Beef],
  [/chicken|hähnchen|wings|nugget/i, Drumstick], [/sushi|fisch|fish|meer|maki/i, Fish], [/suppe|soup|curry|ramen/i, Soup],
  [/frühstück|breakfast|brunch|croissant|backwaren|gebäck/i, Croissant], [/dessert|süß|kuchen|torte|nachtisch|waffel/i, Cake],
  [/eis|gelato|ice/i, IceCreamCone], [/kaffee|coffee|espresso|tee|tea|heiß/i, Coffee], [/wein|wine|bier|beer|cocktail|bar|alkohol/i, Wine],
  [/getränk|drink|softdrink|saft|limo|wasser|shake/i, CupSoda], [/vorspeise|snack|beilage|pommes|fingerfood|tapas|mezze/i, Utensils],
];
const catIcon = (title: string) => CAT_ICONS.find(([re]) => re.test(title))?.[1] ?? Utensils;

function normalize(raw: unknown): MenuSectionData[] {
  return ((raw as Partial<MenuSectionData>[]) ?? []).map((sec) => ({
    title: sec.title ?? "",
    note: sec.note ?? "",
    layout: sec.layout ?? "auto",
    items: (sec.items ?? []).map((it: Partial<MenuItemData>) => ({
      name: it.name ?? "", description: it.description ?? "", price: it.price ?? "", tags: it.tags ?? "", image: it.image ?? "",
      soldOut: it.soldOut ?? false, variants: it.variants ?? [], badges: it.badges ?? [],
    })),
  }));
}

type Layout = "list" | "grid" | "cards" | "compact";
function layoutOf(sec: MenuSectionData): Layout {
  if (sec.layout && sec.layout !== "auto") return sec.layout;
  const withPhoto = sec.items.filter((it) => it.image).length;
  if (!withPhoto) return "compact";
  return withPhoto * 2 >= sec.items.length ? "list" : "compact";
}

export function useReveal(root: React.RefObject<HTMLElement | null>, deps: unknown[]) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const nodes = el.querySelectorAll<HTMLElement>(".sc-rv:not(.in)");
    if (typeof IntersectionObserver === "undefined") {
      nodes.forEach((n) => n.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { threshold: 0.08 });
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

const sid = (i: number) => `sc-sec-${i}`;

export function ShowcaseMenu({ c, t }: { c: C; t: MenuTemplate }) {
  const sections = useMemo(() => normalize(c.sections), [c.sections]);
  const promos = ((c.promos as PromoData[]) ?? []).filter((p) => p && s(p.title));
  const reviews = ((c.reviews as ReviewData[]) ?? []).filter((r) => r && s(r.text));
  const name = s(c.name) || "Dein Lokal";
  const phone = s(c.phone);
  const whatsapp = s(c.whatsapp);
  const address = s(c.address);
  const hoursText = s(c.hours);
  const week = useMemo(() => parseHours(hoursText), [hoursText]);

  const rootRef = useRef<HTMLDivElement>(null);
  const actsRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(-1);
  const [query, setQuery] = useState("");
  const [sheet, setSheet] = useState<[number, number] | null>(null);
  const [favs, setFavs] = useState<string[]>([]);
  const [bar, setBar] = useState(false);
  const [dark, setDark] = useState<boolean | null>(null);
  const [now, setNow] = useState<{ state: OpenState | null; line: number } | null>(null);
  useReveal(rootRef, [sections, query]);

  // Opening state is only known in the browser (time zone of the guest).
  useEffect(() => {
    const tick = () => setNow({ state: openState(week), line: todayLine(hoursText) });
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [week, hoursText]);

  // Floating call bar after the action buttons scrolled away; cover parallax.
  useEffect(() => {
    const acts = actsRef.current;
    if (!acts || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setBar(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(acts);
    const onScroll = () => {
      const img = coverRef.current;
      if (img && window.scrollY < 600) img.style.transform = `translateY(${window.scrollY * 0.35}px) scale(${1 + window.scrollY * 0.0006})`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { io.disconnect(); window.removeEventListener("scroll", onScroll); };
  }, []);

  // Scroll spy for the category chips.
  useEffect(() => {
    const els = sections.map((_, i) => document.getElementById(sid(i))).filter(Boolean) as HTMLElement[];
    if (!els.length || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => {
      const v = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (v) setActive(Number(v.target.getAttribute("data-i")));
    }, { rootMargin: "-25% 0px -65% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections, query]);

  const q = query.trim().toLowerCase();
  const match = (it: MenuItemData) => !q || `${it.name} ${it.description} ${it.badges.join(" ")}`.toLowerCase().includes(q);
  const popular = useMemo(() => {
    const all = sections.flatMap((sec, i) => sec.items.map((it, j) => ({ it, i, j })));
    const pick = all.filter((x) => x.it.badges.includes("beliebt") && !x.it.soldOut);
    const list = pick.length >= 2 ? pick : all.filter((x) => x.it.image && !x.it.soldOut);
    return list.slice(0, 8);
  }, [sections]);
  const socials = (["instagram", "tiktok", "facebook"] as const).map((k) => s(c[k])).filter(Boolean);
  const toggleFav = (k: string) => setFavs((f) => (f.includes(k) ? f.filter((x) => x !== k) : [...f, k]));
  const rating = s(c.rating).replace(".", ",");
  const ratingNum = Number(rating.replace(",", "."));

  const goto = (i: number) => {
    setActive(i);
    document.getElementById(sid(i))?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const share = () => {
    if (typeof navigator !== "undefined" && navigator.share) navigator.share({ title: name, url: location.href }).catch(() => {});
    else navigator.clipboard?.writeText(location.href).catch(() => {});
  };

  return (
    <div ref={rootRef} className="sc -mx-5 -mt-8" data-hero={t.hero ?? "card"}>
      {/* ───── header ───── */}
      <div className={`sc-cover ${s(c.cover) ? "" : "sc-cover-art"}`}>
        <div ref={coverRef} className="sc-cover-img">{s(c.cover) && <SmartImg src={s(c.cover)} width={1280} eager />}</div>
        <div className="sc-top">
          <span />
          <div>
            <button type="button" className="sc-glass" aria-label="Hell oder dunkel" onClick={() => setDark(toggleTheme(rootRef.current))}>
              {(dark ?? isDark(resolveDesign(c).bg)) ? <Sun className="size-[19px]" /> : <Moon className="size-[19px]" />}
            </button>
            <button type="button" className="sc-glass" aria-label="Teilen" onClick={share}><Share2 className="size-[19px]" /></button>
          </div>
        </div>
        {t.hero === "full" && (
          <div className="sc-full">
            <Logo c={c} className="sc-logo-sm" />
            <h1 className="pg-display">{name}</h1>
            {s(c.subtitle) && <p>{s(c.subtitle)}</p>}
          </div>
        )}
      </div>

      <div className="sc-prof sc-rv">
        {t.hero !== "full" && (
          <>
            <Logo c={c} className="sc-logo" />
            <h1 className="pg-display">{name}</h1>
            {s(c.subtitle) && <p className="sc-sub">{s(c.subtitle)}</p>}
          </>
        )}
        {(rating || now?.state) && (
          <div className="sc-meta">
            {rating && <a href={s(c.reviewUrl) || "#sc-reviews"} className="sc-rate"><Star className="size-4" />{rating}{s(c.ratingCount) && <span>({s(c.ratingCount)})</span>}</a>}
            {now?.state && <span className={`sc-open ${now.state.open ? "" : "off"}`}><i />{now.state.label}</span>}
          </div>
        )}
        {(s(c.delivery) || s(c.pickup) || s(c.orderUrl)) && (
          <div className="sc-chips">
            {s(c.delivery) && <div className="sc-chip"><Bike /><div>Lieferung<small>{s(c.delivery)}</small></div></div>}
            {s(c.pickup) && <div className="sc-chip"><ShoppingBag /><div>Abholung<small>{s(c.pickup)}</small></div></div>}
            {s(c.orderUrl) && <a href={s(c.orderUrl)} target="_blank" rel="noopener" className="sc-chip"><Utensils /><div>Online<small>bestellen →</small></div></a>}
          </div>
        )}
        <div ref={actsRef} className="sc-acts">
          {phone && <a className="sc-act pri" href={tel(phone)}><Phone className="size-5" />Anrufen</a>}
          {whatsapp && <a className="sc-act" href={wa(whatsapp)} target="_blank" rel="noopener" aria-label="WhatsApp"><MessageCircle className="size-5" /></a>}
          {address && <a className="sc-act" href={mapsUrl(address)} target="_blank" rel="noopener" aria-label="Route"><Navigation className="size-5" /></a>}
          {(rating || reviews.length > 0) && <a className="sc-act" href="#sc-reviews" aria-label="Bewertungen"><Star className="size-5" /></a>}
          {!phone && !whatsapp && !address && hoursText && <a className="sc-act pri" href="#sc-hours"><Clock className="size-5" />Öffnungszeiten</a>}
        </div>
      </div>

      {promos.length > 0 && <Promos promos={promos} />}

      {/* ───── search + categories ───── */}
      <div className="sc-nav">
        <label className="sc-search"><Search className="size-[18px]" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Gericht suchen" />{query && <button type="button" onClick={() => setQuery("")} aria-label="Suche löschen"><X className="size-4" /></button>}</label>
        <Chips sections={sections} active={active} onGo={goto} />
      </div>

      {!q && popular.length >= 2 && (
        <section className="sc-pop-wrap">
          <Head title="Beliebt" note="Was unsere Gäste am liebsten bestellen" right={`${popular.length} Gerichte`} />
          <div className="sc-hs">
            {popular.map(({ it, i, j }, k) => (
              <div key={`${i}-${j}`} role="button" tabIndex={0} className="sc-pop sc-rv" style={{ "--d": `${k * 0.06}s` } as React.CSSProperties} onClick={() => setSheet([i, j])} onKeyDown={(e) => e.key === "Enter" && setSheet([i, j])}>
                {k === 0 && <span className="sc-tag">Top</span>}
                {it.badges.includes("neu") && k > 0 && <span className="sc-tag alt">Neu</span>}
                <div className="sc-pop-ph"><Photo it={it} width={400} /></div>
                <b>{it.name}</b>
                <small>{sections[i].title}</small>
                <div className="sc-pop-bt">
                  <span className="sc-price">{fromPrice(it)}</span>
                  <button type="button" className={`sc-fav ${favs.includes(`${i}-${j}`) ? "on" : ""}`} aria-label="Merken" onClick={(e) => { e.stopPropagation(); toggleFav(`${i}-${j}`); }}><Heart className="size-[17px]" /></button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {sections.map((sec, i) => {
        const items = sec.items.map((it, j) => ({ it, j })).filter(({ it }) => match(it));
        if (q && !items.length) return null;
        const lay = layoutOf(sec);
        return (
          <section key={i} id={sid(i)} data-i={i} className="sc-sec">
            <Head title={sec.title} note={sec.note} right={`${sec.items.length} ${sec.items.length === 1 ? "Gericht" : "Gerichte"}`} />
            {lay === "grid" && (
              <div className="sc-grid">
                {items.map(({ it, j }, k) => (
                  <div key={j} role="button" tabIndex={0} className={`sc-gt sc-rv ${it.soldOut ? "out" : ""}`} style={{ "--d": `${(k % 2) * 0.06}s` } as React.CSSProperties} onClick={() => setSheet([i, j])} onKeyDown={(e) => e.key === "Enter" && setSheet([i, j])}>
                    <div className="sc-im"><Photo it={it} width={500} />{it.badges[0] && <Badge b={it.badges[0]} />}</div>
                    <div className="sc-tx"><b>{it.name}</b>{it.description && <p>{it.description}</p>}
                      {it.variants.filter((v) => v.price).length > 0 ? (
                        <div className="sc-sz">{it.variants.filter((v) => v.price).slice(0, 3).map((v, n) => <span key={n}>{v.label}<em>{v.price}</em></span>)}</div>
                      ) : <span className="sc-price">{money(it.price)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {lay === "cards" && (
              <div className="sc-hs">
                {items.map(({ it, j }, k) => (
                  <div key={j} role="button" tabIndex={0} className={`sc-dc sc-rv ${it.soldOut ? "out" : ""}`} style={{ "--d": `${k * 0.06}s` } as React.CSSProperties} onClick={() => setSheet([i, j])} onKeyDown={(e) => e.key === "Enter" && setSheet([i, j])}>
                    <Photo it={it} width={700} />
                    {it.soldOut && <span className="sc-so">Heute ausverkauft</span>}
                    <div className="sc-tx"><b>{it.name}</b>{it.description && <p>{it.description}</p>}<span className="sc-pc">{fromPrice(it)}</span></div>
                  </div>
                ))}
              </div>
            )}
            {lay === "compact" && (
              <div className="sc-compact sc-rv">
                {items.map(({ it, j }) => (
                  <div key={j} role="button" tabIndex={0} className={`sc-cr ${it.soldOut ? "out" : ""}`} onClick={() => setSheet([i, j])} onKeyDown={(e) => e.key === "Enter" && setSheet([i, j])}>
                    <span className="sc-ic">{it.image ? <Photo it={it} width={160} /> : (() => { const I = catIcon(sec.title); return <I className="size-5" />; })()}</span>
                    <span className="sc-cr-t"><b>{it.name}</b>{(it.description || it.variants.length > 0) && <small>{it.description || it.variants.map((v) => `${v.label} ${v.price}`).join(" · ")}</small>}</span>
                    <span className="sc-cr-p">{it.soldOut ? "aus" : fromPrice(it)}</span>
                  </div>
                ))}
              </div>
            )}
            {lay === "list" && (
              <div className="sc-list">
                {items.map(({ it, j }) => (
                  <div key={j} role="button" tabIndex={0} className={`sc-it sc-rv ${it.soldOut ? "out" : ""}`} onClick={() => setSheet([i, j])} onKeyDown={(e) => e.key === "Enter" && setSheet([i, j])}>
                    <div className="sc-tx">
                      <b>{it.name}</b>
                      {it.description && <p>{it.description}</p>}
                      <div className="sc-ft"><span className="sc-price">{fromPrice(it)}</span>{it.badges.slice(0, 2).map((b) => <Badge key={b} b={b} />)}</div>
                    </div>
                    {it.image && <div className="sc-im"><Photo it={it} width={300} /></div>}
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
      {q && sections.every((sec) => !sec.items.some(match)) && <p className="sc-empty">Nichts gefunden für „{query}“.</p>}

      {(rating || reviews.length > 0) && <Reviews rating={rating} ratingNum={ratingNum} count={s(c.ratingCount)} url={s(c.reviewUrl)} reviews={reviews} />}

      {hoursText && (
        <section id="sc-hours" className="sc-sec">
          <Head title="Öffnungszeiten" note={now?.state ? (now.state.open ? `Jetzt geöffnet, ${now.state.label.split("· ")[1]}` : now.state.label.replace("Geschlossen · ", "Gerade geschlossen, ")) : undefined} />
          <div className="sc-card sc-rv">
            {hoursText.split("\n").map((l) => l.trim()).filter(Boolean).map((l, k) => {
              const m = l.match(/^(.*?)(\d.*)$/);
              return <div key={k} className={`sc-hr ${now?.line === k ? "td" : ""}`}><span>{m ? m[1].replace(/[:\s]+$/, "") : l}</span><span>{m ? m[2] : ""}</span></div>;
            })}
          </div>
        </section>
      )}

      {address && (
        <section className="sc-sec">
          <Head title="So findest du uns" />
          <div className="sc-card sc-rv">
            <a className="sc-map" href={mapsUrl(address)} target="_blank" rel="noopener" aria-label="Karte öffnen"><MapArt /><span className="sc-pin"><MapPin className="size-6" /></span></a>
            <div className="sc-addr"><div><b>{address.split(",")[0]}</b>{address.includes(",") && <small>{address.split(",").slice(1).join(",").trim()}</small>}</div><a className="sc-rbtn" href={mapsUrl(address)} target="_blank" rel="noopener"><Navigation className="size-4" />Route</a></div>
          </div>
        </section>
      )}

      <footer className="sc-foot sc-rv">
        {socials.length > 0 && <div className="sc-soc">{socials.map((u) => <a key={u} href={u} target="_blank" rel="noopener" aria-label={brandOf(u).name}>{brandOf(u).icon}</a>)}</div>}
        {s(c.footer) && <p className="whitespace-pre-line">{s(c.footer)}</p>}
        {(() => {
          const used = Array.from(new Set(sections.flatMap((sec) => sec.items.flatMap((it) => it.tags.toUpperCase().split(/[\s,;]+/).filter((x) => ALLERGENS[x]))))).sort();
          return used.length ? <p className="sc-alg-note">Allergene: {used.map((a) => `${a} ${ALLERGENS[a]}`).join(" · ")}</p> : null;
        })()}
      </footer>

      {(phone || whatsapp) && (
        <div className={`sc-bb ${bar ? "on" : ""}`}>
          {phone ? <a className="sc-call" href={tel(phone)}><Phone className="size-5" />Anrufen &amp; bestellen</a> : <a className="sc-call" href={wa(whatsapp)} target="_blank" rel="noopener"><MessageCircle className="size-5" />Per WhatsApp bestellen</a>}
          {phone && whatsapp && <a className="sc-wa" href={wa(whatsapp)} target="_blank" rel="noopener" aria-label="WhatsApp"><MessageCircle className="size-5" /></a>}
        </div>
      )}

      {sheet && <Sheet it={sections[sheet[0]]?.items[sheet[1]]} section={sections[sheet[0]]?.title ?? ""} phone={phone} whatsapp={whatsapp} root={rootRef} onClose={() => setSheet(null)} />}
    </div>
  );
}

// ───────── light / dark switch ─────────

const DARK = { "--pg-bg": "#0f0d0c", "--pg-card": "#1b1817", "--pg-fg": "#f7f2ee", "--pg-muted": "#9a908a", "--pg-line": "rgba(255,255,255,.09)", "--pg-soft": "rgba(255,255,255,.05)" };
const LIGHT = { "--pg-bg": "#f8f4ef", "--pg-card": "#ffffff", "--pg-fg": "#1c1412", "--pg-muted": "#8b807a", "--pg-line": "rgba(28,20,18,.09)", "--pg-soft": "rgba(28,20,18,.05)" };
const saved = new WeakMap<HTMLElement, Record<string, string>>();

/** Flips the page between its own colours and the opposite brightness. Returns true when dark is shown. */
export function toggleTheme(root: HTMLElement | null): boolean | null {
  const pg = root?.closest(".pg") as HTMLElement | null;
  if (!pg) return null;
  const orig = saved.get(pg);
  if (orig) {
    for (const [k, v] of Object.entries(orig)) pg.style.setProperty(k, v);
    saved.delete(pg);
    return pg.style.colorScheme === "dark";
  }
  const keep: Record<string, string> = { "color-scheme": pg.style.colorScheme, "--accent-2": pg.style.getPropertyValue("--accent-2") };
  for (const k of Object.keys(DARK)) keep[k] = pg.style.getPropertyValue(k);
  saved.set(pg, keep);
  const toDark = pg.style.colorScheme !== "dark";
  const pal = toDark ? DARK : LIGHT;
  for (const [k, v] of Object.entries(pal)) pg.style.setProperty(k, v);
  pg.style.setProperty("--accent-2", `color-mix(in srgb, var(--accent) ${toDark ? 16 : 10}%, ${pal["--pg-card"]})`);
  pg.style.colorScheme = toDark ? "dark" : "light";
  return toDark;
}

// ───────── pieces ─────────

function Logo({ c, className }: { c: C; className: string }) {
  const name = s(c.name) || "L";
  const fb = <span className={`${className} sc-logo-fb pg-display`}>{name.charAt(0)}</span>;
  return s(c.logo) ? <span className={className}><SmartImg src={s(c.logo)} width={240} eager fallback={fb} /></span> : fb;
}

function Photo({ it, width }: { it: MenuItemData; width: number }) {
  const fb = <span className="sc-ph-fb pg-display">{it.name.charAt(0)}</span>;
  return it.image ? <SmartImg src={it.image} width={width} fallback={fb} /> : fb;
}

function Badge({ b }: { b: string }) {
  const def = BADGES[b];
  if (!def) return null;
  const I = def.icon;
  return <span className={`sc-bd ${def.tone ?? ""}`}><I />{def.label}</span>;
}

export function Head({ title, note, right }: { title: string; note?: string; right?: string }) {
  return (
    <div className="sc-hd sc-rv">
      <div><h2 className="pg-display">{title}</h2>{note && <p>{note}</p>}</div>
      {right && <span>{right}</span>}
    </div>
  );
}

function Chips({ sections, active, onGo }: { sections: MenuSectionData[]; active: number; onGo: (i: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const nav = ref.current;
    const el = nav?.querySelector<HTMLElement>(`[data-c="${active}"]`);
    if (nav && el) nav.scrollTo({ left: el.offsetLeft - 16, behavior: "smooth" });
  }, [active]);
  return (
    <div ref={ref} className="sc-cats">
      {sections.map((sec, i) => {
        const I = catIcon(sec.title);
        return <button key={i} type="button" data-c={i} className={`sc-ct ${i === active ? "on" : ""}`} onClick={() => onGo(i)}><span><I /></span>{sec.title || "Kategorie"}</button>;
      })}
    </div>
  );
}

function Promos({ promos }: { promos: PromoData[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (promos.length < 2) return;
    const id = window.setInterval(() => {
      const el = track.current;
      if (!el || document.hidden) return;
      const w = (el.firstElementChild as HTMLElement | null)?.offsetWidth ?? 0;
      const next = (Math.round(el.scrollLeft / (w + 12)) + 1) % promos.length;
      el.scrollTo({ left: next * (w + 12), behavior: "smooth" });
    }, 4500);
    return () => window.clearInterval(id);
  }, [promos.length]);
  return (
    <div className="sc-promos sc-rv">
      <div ref={track} className="sc-track" onScroll={(e) => { const el = e.currentTarget; const w = (el.firstElementChild as HTMLElement | null)?.offsetWidth ?? 1; setIdx(Math.round(el.scrollLeft / (w + 12))); }}>
        {promos.map((p, k) => (
          <div key={k} className={`sc-slide v${k % 3}`}>
            {p.kicker && <small>{p.kicker}</small>}
            <h3 className="pg-display">{p.title}</h3>
            {p.text && <p>{p.text}</p>}
            {p.tag && <span className="sc-pill">{p.tag}</span>}
            {p.image && <span className="sc-slide-img"><SmartImg src={p.image} width={500} /></span>}
          </div>
        ))}
      </div>
      {promos.length > 1 && <div className="sc-dots">{promos.map((_, k) => <i key={k} className={k === idx ? "on" : ""} />)}</div>}
    </div>
  );
}

export function Stars({ n, size = 15 }: { n: number; size?: number }) {
  return <span className="sc-stars">{[0, 1, 2, 3, 4].map((k) => <Star key={k} style={{ width: size, height: size, opacity: k < Math.round(n) ? 1 : 0.25 }} />)}</span>;
}

export function Reviews({ rating, ratingNum, count, url, reviews }: { rating: string; ratingNum: number; count: string; url: string; reviews: ReviewData[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(rating ? "0,0" : "");
  useEffect(() => {
    const el = ref.current;
    if (!el || !rating || typeof IntersectionObserver === "undefined") {
      setShown(rating);
      return;
    }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      el.classList.add("in");
      let start = 0;
      const step = (ts: number) => {
        start ||= ts;
        const k = Math.min(1, (ts - start) / 1100);
        setShown((ratingNum * (1 - (1 - k) ** 3)).toFixed(1).replace(".", ","));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [rating, ratingNum]);
  // A plausible distribution for the bars when only the average is known.
  const dist = ratingNum >= 4.5 ? [82, 12, 4, 1, 1] : ratingNum >= 4 ? [64, 22, 8, 3, 3] : [45, 25, 15, 8, 7];
  return (
    <section id="sc-reviews" className="sc-sec">
      <Head title="Bewertungen" note="Was unsere Gäste sagen" right={url ? "Google" : undefined} />
      {rating && (
        <div ref={ref} className="sc-rvc sc-rv">
          <div className="sc-big"><b>{shown}</b><Stars n={ratingNum} />{count && <small>{count} Bewertungen</small>}</div>
          <div className="sc-bars">{dist.map((w, k) => <div key={k}>{5 - k}<i style={{ "--w": `${w}%` } as React.CSSProperties} /></div>)}</div>
        </div>
      )}
      {reviews.length > 0 && (
        <div className="sc-hs" style={{ marginTop: 12 }}>
          {reviews.map((r, k) => (
            <div key={k} className="sc-rc sc-rv" style={{ "--d": `${k * 0.06}s` } as React.CSSProperties}>
              <div className="sc-who"><span className="sc-av" style={{ background: ["var(--accent)", "var(--pg-fg)", "#f5a524", "#6a52e0"][k % 4] }}>{r.name.charAt(0)}</span><div><b>{r.name}</b>{r.when && <small>{r.when}</small>}</div></div>
              <Stars n={r.stars ?? 5} />
              <p>{r.text}</p>
            </div>
          ))}
        </div>
      )}
      {url && <a className="sc-gl sc-rv" href={url} target="_blank" rel="noopener">Alle Bewertungen auf Google <ArrowRight className="size-4" /></a>}
    </section>
  );
}

function Sheet({ it, section, phone, whatsapp, root, onClose }: { it?: MenuItemData; section: string; phone: string; whatsapp: string; root: React.RefObject<HTMLDivElement | null>; onClose: () => void }) {
  const opts = it ? (it.variants.filter((v) => v.label || v.price).length ? it.variants.filter((v) => v.label || v.price) : [{ label: "Portion", price: it.price }]) : [];
  const [pick, setPick] = useState(opts.length > 1 ? 1 : 0);
  const [on, setOn] = useState(false);
  const [vars, setVars] = useState<React.CSSProperties>();
  useEffect(() => {
    // The sheet lives outside the page (portal), so it takes over the page's colour variables.
    const pg = root.current?.closest(".pg") as HTMLElement | null;
    const id = requestAnimationFrame(() => {
      if (pg) setVars(Object.fromEntries([...pg.style].filter((k) => k.startsWith("--")).map((k) => [k, pg.style.getPropertyValue(k)])) as React.CSSProperties);
      setOn(true);
    });
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => { cancelAnimationFrame(id); document.body.style.overflow = prev; window.removeEventListener("keydown", esc); };
  }, [onClose, root]);
  if (!it || typeof document === "undefined") return null;
  const close = () => { setOn(false); window.setTimeout(onClose, 300); };
  const al = allergens(it.tags);
  return createPortal(
    <div className={`pg sc-sheet ${on ? "on" : ""}`} style={vars}>
      <div className="sc-bk" onClick={close} />
      <div className="sc-pn" role="dialog" aria-label={it.name}>
        <div className={`sc-hero ${it.image ? "" : "noimg"}`}>
          <span className="sc-grab" />
          <button type="button" className="sc-glass sc-x" onClick={close} aria-label="Schließen"><X className="size-5" /></button>
          <Photo it={it} width={1000} />
        </div>
        <div className="sc-bo">
          <small className="sc-sec-name">{section}</small>
          <div className="sc-tp"><h3 className="pg-display">{it.name}</h3><span key={pick} className="sc-price big">{money(opts[pick]?.price ?? "")}</span></div>
          {it.description && <p className="sc-d">{it.description}</p>}
          {(it.badges.length > 0 || it.soldOut) && <div className="sc-bds">{it.soldOut && <span className="sc-bd hot">Heute ausverkauft</span>}{it.badges.map((b) => <Badge key={b} b={b} />)}</div>}
          {opts.length > 1 && (
            <>
              <h4>Größe wählen</h4>
              <div className="sc-opts">{opts.map((v, k) => <button key={k} type="button" className={`sc-opt ${k === pick ? "on" : ""}`} onClick={() => setPick(k)}><b>{v.label || `Option ${k + 1}`}</b><small>{money(v.price)}</small></button>)}</div>
            </>
          )}
          {al.length > 0 && (<><h4>Allergene</h4><div className="sc-alg">{al.map((a) => <span key={a}>{a}</span>)}</div></>)}
          {(phone || whatsapp) && (
            <div className="sc-cta">
              {phone && <a className="c1" href={tel(phone)}><Phone className="size-5" />Anrufen &amp; bestellen</a>}
              {whatsapp && <a className={phone ? "c2" : "c1"} href={`${wa(whatsapp)}?text=${encodeURIComponent(`Hallo, ich möchte bestellen: ${it.name}${opts.length > 1 ? ` (${opts[pick].label})` : ""}`)}`} target="_blank" rel="noopener"><MessageCircle className="size-5" />WhatsApp</a>}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function MapArt() {
  return (
    <svg viewBox="0 0 400 170" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="400" height="170" fill="var(--pg-soft)" />
      <path d="M-10 128 C 90 100, 160 150, 260 118 S 380 90 420 104" stroke="#9cc3e6" strokeOpacity=".5" strokeWidth="16" fill="none" />
      <g stroke="var(--pg-card)" strokeWidth="9" fill="none" strokeLinecap="round"><path d="M-10 60 H420" /><path d="M120 -10 V180" /><path d="M290 -10 L250 180" /><path d="M-10 20 L180 90 L420 40" /></g>
      <g fill="var(--pg-line)"><rect x="20" y="70" width="80" height="34" rx="6" /><rect x="140" y="12" width="60" height="38" rx="6" /><rect x="300" y="70" width="70" height="30" rx="6" /><rect x="215" y="6" width="56" height="30" rx="6" /></g>
      <circle cx="200" cy="80" r="44" fill="var(--accent)" opacity=".1" />
    </svg>
  );
}
