import "server-only";
import { parse, type HTMLElement, type Node } from "node-html-parser";
import type { MenuItemData, MenuSectionData } from "@/lib/codes/types";

/**
 * Structure-based menu extraction for rendered pages (websites, delivery
 * platforms captured in the browser). No AI, no guessing from lines:
 *
 *  1. every element whose text holds a price is a candidate
 *  2. its "card" is the largest ancestor that still holds only that dish's
 *     price(s): stop climbing as soon as the parent contains another dish
 *  3. inside the card: name (heading / bold / title-like class / first line),
 *     description (the rest), photo (img or captured background), sizes
 *  4. category: the closest heading before the card that is not inside a card
 */

const PRICE = /(?:€\s*)?(\d{1,3}(?:[.,]\d{2}))\s*(?:€|eur\b|euro\b)|€\s*(\d{1,3}(?:[.,]\d{2}))/gi;
const SKIP = new Set(["script", "style", "noscript", "svg", "template", "iframe", "head", "button", "select", "option", "nav", "footer"]);
const NAME_CLASS = /(name|title|heading|headline|dish|product-?name|item-?name)/i;
const ALLERGEN_TAIL = /\s*[(\[]\s*([A-R0-9](?:\s*,\s*[A-R0-9]{1,2})*)\s*[)\]]\s*$/;

const clean = (s: string) => s.replace(/ /g, " ").replace(/\s+/g, " ").trim();
const formatPrice = (raw: string) => parseFloat(raw.replace(",", ".")).toFixed(2).replace(".", ",");

function prices(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(PRICE)) out.push(formatPrice(m[1] ?? m[2]));
  return out;
}

function textOf(el: HTMLElement): string {
  return clean(el.structuredText ?? el.text);
}

function isEl(n: Node): n is HTMLElement {
  return n.nodeType === 1;
}

function imageOf(el: HTMLElement): string {
  const img = el.querySelector("img");
  if (img) {
    const a = (k: string) => img.getAttribute(k) ?? "";
    const v = a("data-qlick-src") || a("data-srcset") || a("srcset") || a("data-src") || a("data-lazy-src") || a("data-original") || a("src");
    if (v && !v.startsWith("data:")) return v;
  }
  const bg = el.getAttribute("data-qlick-bg") ? el : el.querySelector("[data-qlick-bg]");
  if (bg) return bg.getAttribute("data-qlick-bg") ?? "";
  const styled = el.querySelector('[style*="url("]');
  const m = styled?.getAttribute("style")?.match(/url\(\s*["']?([^"')]+)["']?\s*\)/);
  return m && !m[1].startsWith("data:") ? m[1] : "";
}

/** Short visible text blocks of an element, in order (one per leaf-ish element). */
function lines(el: HTMLElement): string[] {
  return (el.structuredText ?? el.text).split("\n").map(clean).filter(Boolean);
}

function pickName(card: HTMLElement): string {
  const candidates = [
    ...card.querySelectorAll("h1,h2,h3,h4,h5,h6"),
    ...card.querySelectorAll("[class]").filter((e) => NAME_CLASS.test(e.getAttribute("class") ?? "") && e.childNodes.length <= 3),
    ...card.querySelectorAll("strong,b,dt"),
  ];
  for (const c of candidates) {
    const t = textOf(c);
    if (t && t.length <= 90 && !prices(t).length && /[a-zäöüß]/i.test(t)) return t;
  }
  const plain = lines(card).find((l) => l.length <= 90 && !prices(l).length && /[a-zäöüß]{2}/i.test(l));
  if (plain) return plain;
  // "Gemischter Salat …… 6,50 €": the name is the text before the price
  for (const l of lines(card)) {
    const before = l.split(PRICE)[0]?.replace(/[.·…_\-–—\s]+$/, "").trim() ?? "";
    if (before.length >= 3 && before.length <= 90 && /[a-zäöüß]{2}/i.test(before)) return before;
  }
  return "";
}

export interface DomMenu {
  sections: MenuSectionData[];
}

export function fromDom(html: string): DomMenu | null {
  const root = parse(html, { comment: false, blockTextElements: { script: false, style: false, noscript: false, pre: true } });
  root.querySelectorAll([...SKIP].join(",")).forEach((e) => e.remove());

  // 1. leaf elements that carry a price
  const priceEls: HTMLElement[] = [];
  const walk = (el: HTMLElement) => {
    let childHas = false;
    for (const c of el.childNodes) {
      if (isEl(c) && prices(c.text).length) {
        childHas = true;
        walk(c);
      }
    }
    if (!childHas && prices(el.text).length) priceEls.push(el);
  };
  walk(root);
  if (priceEls.length < 2) return null;

  // 2. climb to the card: largest ancestor whose price count equals the dish's own
  const cards: HTMLElement[] = [];
  const seen = new Set<HTMLElement>();
  for (const p of priceEls) {
    let card = p;
    let own = prices(card.text).length;
    while (card.parentNode && card.parentNode !== root) {
      const parent = card.parentNode as HTMLElement;
      const n = prices(parent.text).length;
      if (n === own) {
        card = parent;
        continue;
      }
      // Grow over the size options of ONE dish ("Ø 26 cm 8,90 €" rows):
      // at most one name inside, every price-carrying child is a short row.
      const priceKids = parent.childNodes.filter((c): c is HTMLElement => isEl(c) && prices(c.text).length > 0);
      const shortRows = priceKids.length > 1 && priceKids.every((c) => clean(c.text).length <= 32);
      if (n <= 8 && shortRows && nameCount(parent) <= 1 && parent.querySelectorAll("img").length <= 1) {
        card = parent;
        own = n;
        continue;
      }
      break;
    }
    if (!seen.has(card)) {
      seen.add(card);
      cards.push(card);
    }
  }
  // drop cards nested in other cards
  const top = cards.filter((c) => !cards.some((o) => o !== c && isAncestor(o, c)));

  // 3. headings outside cards = categories, in document order
  const order = new Map<HTMLElement, number>();
  let i = 0;
  const index = (el: HTMLElement) => {
    order.set(el, i++);
    for (const c of el.childNodes) if (isEl(c)) index(c);
  };
  index(root);
  const inCard = (el: HTMLElement) => top.some((c) => c === el || isAncestor(c, el));
  const headings = root.querySelectorAll("h1,h2,h3,h4,[role=heading]").filter((h) => !inCard(h) && textOf(h).length > 0 && textOf(h).length <= 60 && !prices(textOf(h)).length);

  const sections: MenuSectionData[] = [];
  let current: MenuSectionData | null = null;
  const sorted = [...top].sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
  for (const card of sorted) {
    const at = order.get(card) ?? 0;
    let title = "";
    for (const h of headings) {
      const ho = order.get(h) ?? 0;
      if (ho < at) title = textOf(h);
      else break;
    }
    title = title || "Karte";
    if (!current || current.title !== title) {
      current = sections.find((s) => s.title === title) ?? null;
      if (!current) {
        current = { title: title.slice(0, 80), note: "", items: [] };
        sections.push(current);
      }
    }

    let name = pickName(card);
    if (!name) continue;
    let tags = "";
    const al = name.match(ALLERGEN_TAIL);
    if (al) {
      tags = al[1].replace(/\s+/g, " ");
      name = name.replace(ALLERGEN_TAIL, "");
    }
    const allLines = lines(card);
    const ps = prices(textOf(card));
    const descLines = allLines.filter((l) => l !== name && !l.startsWith(name) && !prices(l).length && l.length > 2 && !/^(\+|hinzufügen|in den warenkorb|add|bestellen|merken)$/i.test(l));
    let description = descLines.join(" ").slice(0, 300);
    const descAl = description.match(ALLERGEN_TAIL);
    if (descAl && !tags) {
      tags = descAl[1].replace(/\s+/g, " ");
      description = description.replace(ALLERGEN_TAIL, "");
    }

    const item: MenuItemData = { name: name.slice(0, 120), description, price: "", tags, image: imageOf(card), variants: [], badges: [], soldOut: /ausverkauft|sold out|nicht verfügbar/i.test(textOf(card)) };
    if (ps.length > 1) {
      // label = text right before each price, e.g. "Ø 26 cm 8,90 €"
      const labels: string[] = [];
      for (const l of allLines) {
        const lp = prices(l);
        if (lp.length === 1) labels.push(clean(l.replace(PRICE, "")).replace(/[:\-–]+$/, "").slice(0, 40));
      }
      item.variants = ps.slice(0, 8).map((p, k) => ({ label: labels[k] || `Größe ${k + 1}`, price: p }));
    } else item.price = ps[0] ?? "";
    current.items.push(item);
  }

  const filled = sections.filter((s) => s.items.length);
  const total = filled.reduce((n, s) => n + s.items.length, 0);
  return total >= 2 ? { sections: filled.slice(0, 40) } : null;
}

/** Name-like elements (headings, bold, title classes) that are not just a price. */
function nameCount(el: HTMLElement): number {
  const els = [...el.querySelectorAll("h1,h2,h3,h4,h5,h6,strong,b,dt"), ...el.querySelectorAll("[class]").filter((e) => NAME_CLASS.test(e.getAttribute("class") ?? ""))];
  return new Set(els.filter((e) => { const t = clean(e.text); return t.length > 1 && !prices(t).length; }).map((e) => clean(e.text))).size;
}

function isAncestor(a: HTMLElement, b: HTMLElement): boolean {
  let n = b.parentNode as HTMLElement | null;
  while (n) {
    if (n === a) return true;
    n = n.parentNode as HTMLElement | null;
  }
  return false;
}
