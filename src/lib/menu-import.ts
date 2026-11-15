import "server-only";
import { lookup } from "node:dns/promises";
import type { MenuItemData, MenuSectionData } from "@/lib/codes/types";
import { fromDom } from "./menu-dom";
import { privateIp } from "./safe-fetch";

/**
 * Imports a menu from any web page: delivery platforms (Lieferando, Wolt, …),
 * restaurant websites, or pasted text. Strategies, in order:
 *  1. schema.org JSON-LD (Restaurant / Menu / MenuSection / MenuItem)
 *  2. embedded app state (__NEXT_DATA__, application/json, window.__STATE__)
 *     walked generically for "category with products" shapes
 *  3. Claude, when ANTHROPIC_API_KEY is set (any page, any layout)
 *  4. plain-text heuristics ("Name …… 7,50")
 */

export interface ImportedMenu {
  name?: string;
  logo?: string;
  cover?: string;
  phone?: string;
  address?: string;
  sections: MenuSectionData[];
  source: "jsonld" | "embedded" | "dom" | "ai" | "text";
}

export type ImportResult = { ok: true; menu: ImportedMenu } | { ok: false; message: string; blocked?: boolean };

type J = Record<string, unknown>;
const isObj = (v: unknown): v is J => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : typeof v === "number" ? String(v) : "");
// ───────── images ─────────
const IMAGE_KEYS = ["image", "imageUrl", "image_url", "imageURL", "images", "photo", "photoUrl", "photos", "picture", "pictureUrl", "img", "imgUrl", "imageSrc", "thumbnail", "thumbnailUrl", "thumb", "media", "mainImage", "heroImage", "coverImage", "assets"];
const URL_KEYS = ["url", "src", "href", "contentUrl", "original", "large", "full", "medium", "path", "uri", "imageUrl", "default", "sizes", "formats", "variants"];

/** First image-like string inside any common shape: "…", ["…"], [{url}], {src}, {sizes:{large}} … (not validated yet). */
function rawImage(v: unknown, depth = 0): string {
  if (depth > 4 || v == null) return "";
  if (typeof v === "string") return v.trim();
  if (Array.isArray(v)) {
    for (const x of v) {
      const r = rawImage(x, depth + 1);
      if (r) return r;
    }
    return "";
  }
  if (isObj(v)) {
    for (const k of URL_KEYS) {
      const r = rawImage(v[k], depth + 1);
      if (r) return r;
    }
    for (const k of IMAGE_KEYS) {
      const r = rawImage(v[k], depth + 1);
      if (r) return r;
    }
  }
  return "";
}

function itemImage(o: J): string {
  for (const k of IMAGE_KEYS) {
    const r = rawImage(o[k]);
    if (r) return r;
  }
  return "";
}

const NOT_A_DISH = /(logo|icon|sprite|favicon|placeholder|blank|spacer|pixel|tracking|avatar|badge|flag|payment|paypal|visa|mastercard|loader|spinner|emoji|arrow|social|facebook|instagram|twitter|tiktok|whatsapp|\.svg(\?|$)|\.gif(\?|$))/i;

/** Turns any image reference into an absolute https URL, or "" if unusable. */
export function resolveImage(raw: string, base?: string): string {
  let v = raw.trim().replace(/&amp;/g, "&");
  if (!v || /^(data|blob|javascript):/i.test(v)) return "";
  // srcset: take the largest candidate
  if (/\s\d+(w|x)\s*(,|$)/.test(v)) {
    const best = v.split(",").map((c) => c.trim().split(/\s+/)).map(([u, d]) => ({ u, n: parseFloat(d ?? "1") || 1 })).sort((a, b) => b.n - a.n)[0];
    v = best?.u ?? "";
  }
  // size templates used by delivery platforms
  v = v.replace(/\{(w|width|size|imageWidth)\}/gi, "800").replace(/\{(h|height|imageHeight)\}/gi, "600").replace(/\{[a-z_]+\}/gi, "").replace(/%s/g, "800");
  if (v.startsWith("//")) v = `https:${v}`;
  try {
    const u = new URL(v, base);
    if (u.protocol === "http:") u.protocol = "https:";
    if (u.protocol !== "https:") return "";
    const out = u.toString();
    if (out.length > 600 || /[\s"'<>]/.test(out) || NOT_A_DISH.test(u.pathname)) return "";
    return out;
  } catch {
    return "";
  }
}

const decodeEntities = (s: string) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

/** All <img>/<source>/background images in the HTML with their position. */
function htmlImages(html: string, base: string): { at: number; url: string; small: boolean }[] {
  const out: { at: number; url: string; small: boolean }[] = [];
  const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}\\s*=\\s*["']([^"']+)["']`, "i"))?.[1] ?? "";
  for (const m of html.matchAll(/<(img|source)\b[^>]*>/gi)) {
    const tag = m[0];
    const cand = attr(tag, "data-qlick-src") || attr(tag, "data-srcset") || attr(tag, "srcset") || attr(tag, "data-src") || attr(tag, "data-lazy-src") || attr(tag, "data-original") || attr(tag, "data-lazy") || attr(tag, "src");
    const url = resolveImage(cand, base);
    if (!url) continue;
    const w = parseInt(attr(tag, "width") || "0", 10);
    const h = parseInt(attr(tag, "height") || "0", 10);
    out.push({ at: m.index!, url, small: (w > 0 && w < 64) || (h > 0 && h < 64) || /\b(logo|icon)\b/i.test(attr(tag, "alt") + attr(tag, "class")) });
  }
  // background images resolved by the browser capture (computed CSS, not visible in the markup)
  for (const m of html.matchAll(/\sdata-qlick-bg\s*=\s*["']([^"']+)["']/gi)) {
    const url = resolveImage(decodeEntities(m[1]), base);
    if (url) out.push({ at: m.index!, url, small: false });
  }
  for (const m of html.matchAll(/background(?:-image)?\s*:\s*url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
    const url = resolveImage(decodeEntities(m[1]), base);
    if (url) out.push({ at: m.index!, url, small: false });
  }
  return out.filter((i) => !i.small).sort((a, b) => a.at - b.at);
}

/**
 * Restaurant websites rarely put images into structured data. For every dish
 * still without a photo, find its name in the HTML and take the closest image
 * in the same card. Images that would land on many dishes (logo, banner) are dropped.
 */
function attachHtmlImages(menu: ImportedMenu, html: string, base: string) {
  const imgs = htmlImages(html, base);
  if (!imgs.length) return;
  const lower = decodeEntities(html).toLowerCase();
  const dishes: { item: MenuItemData; at: number }[] = [];
  let from = 0;
  // Photos already assigned (structured data, page structure) are taken.
  const taken = new Set(menu.sections.flatMap((sec) => sec.items.map((it) => it.image)).filter(Boolean));
  for (const section of menu.sections) {
    for (const item of section.items) {
      const needle = item.name.toLowerCase().slice(0, 60);
      if (needle.length < 3) continue;
      // menus are in page order: search after the previous dish first, then anywhere
      let at = lower.indexOf(needle, from);
      if (at < 0) at = lower.indexOf(needle);
      if (at < 0) continue;
      from = at + needle.length;
      dishes.push({ item, at });
    }
  }
  // One photo per dish and one dish per photo, closest pairs first.
  // Images above the name (card layout) count as closer than images below it.
  const pairs: { d: number; dish: number; img: number }[] = [];
  // Every dish counts as a boundary, but only dishes without a photo get one.
  dishes.forEach((dish, di) => !dish.item.image && imgs.forEach((img, ii) => {
    if (taken.has(img.url)) return;
    const d = img.at < dish.at ? (dish.at - img.at) * 0.8 : (img.at - dish.at) * 1.25;
    if (d >= 1800) return;
    // same card only: no other dish name between the photo and this dish
    const lo = Math.min(img.at, dish.at);
    const hi = Math.max(img.at, dish.at);
    if (dishes.some((o, oi) => oi !== di && o.at > lo && o.at < hi)) return;
    pairs.push({ d, dish: di, img: ii });
  }));
  pairs.sort((x, y) => x.d - y.d);
  const usedDish = new Set<number>();
  const usedImg = new Set<string>();
  const picks: { item: MenuItemData; url: string }[] = [];
  for (const p of pairs) {
    const url = imgs[p.img].url;
    if (usedDish.has(p.dish) || usedImg.has(url)) continue;
    usedDish.add(p.dish);
    usedImg.add(url);
    picks.push({ item: dishes[p.dish].item, url });
  }
  // A single match on a long menu is usually a banner, not a dish photo.
  if (dishes.length >= 4 && picks.length < 2) return;
  for (const p of picks) p.item.image = p.url;
}

// ───────── allergens → German menu letters ─────────
const ALLERGEN_WORDS: [RegExp, string][] = [
  [/glut|weizen|wheat|getreide|cereal/i, "A"], [/krebs|crust/i, "B"], [/\bei(er)?\b|egg/i, "C"], [/fisch|fish/i, "D"],
  [/erdnu|peanut/i, "E"], [/soja|soy/i, "F"], [/milch|lakto|lacto|milk|dairy/i, "G"], [/schalenfr|nüsse|nuss|nut/i, "H"],
  [/sellerie|celery/i, "L"], [/senf|mustard/i, "M"], [/sesam/i, "N"], [/sulfit|schwefel|sulph|sulfite/i, "O"],
  [/lupin/i, "P"], [/weichtier|mollus/i, "R"],
];

function allergenCodes(v: unknown): string {
  const words: string[] = [];
  const add = (x: unknown) => {
    if (typeof x === "string") words.push(x);
    else if (isObj(x)) words.push(str(x.name ?? x.title ?? x.label ?? x.code ?? x.id));
  };
  if (Array.isArray(v)) v.forEach(add);
  else add(v);
  const codes = new Set<string>();
  for (const w of words) {
    if (/^[A-PR]$/i.test(w.trim())) {
      codes.add(w.trim().toUpperCase());
      continue;
    }
    if (/^\d{1,2}$/.test(w.trim())) {
      codes.add(w.trim());
      continue;
    }
    for (const [re, code] of ALLERGEN_WORDS) if (re.test(w)) codes.add(code);
  }
  return Array.from(codes).sort().join(", ");
}

// ───────── prices ─────────
function formatPrice(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

function readPrice(v: unknown, keyHint = ""): string {
  if (typeof v === "number" && isFinite(v) && v > 0) {
    const cents = /cent|minor/i.test(keyHint) || (Number.isInteger(v) && v >= 100 && v < 100000 && !/euro/i.test(keyHint));
    return formatPrice(cents ? v / 100 : v);
  }
  if (typeof v === "string") {
    const m = v.replace(/\s/g, "").match(/(\d+(?:[.,]\d{1,2})?)/);
    if (m) return formatPrice(parseFloat(m[1].replace(",", ".")));
  }
  if (isObj(v)) {
    for (const k of ["price", "amount", "value", "delivery", "pickup", "default", "priceInCents", "unitPrice", "minor", "deliveryPrice", "lowPrice"]) {
      if (k in v) {
        const p = readPrice(v[k], k);
        if (p) return p;
      }
    }
  }
  if (Array.isArray(v) && v.length) return readPrice(v[0], keyHint);
  return "";
}

function itemPrice(o: J): string {
  for (const k of ["price", "priceInCents", "prices", "basePrice", "offers", "priceRange", "displayPrice", "amount"]) {
    if (k in o) {
      const p = readPrice(o[k], k);
      if (p) return p;
    }
  }
  return "";
}

const emptyItem = (): MenuItemData => ({ name: "", description: "", price: "", tags: "", image: "", variants: [], badges: [], soldOut: false });

function toItem(o: J): MenuItemData | null {
  const name = str(o.name ?? o.title ?? o.productName ?? o.label);
  if (!name || name.length > 120) return null;
  const item = emptyItem();
  item.name = name;
  item.description = str(o.description ?? o.desc ?? o.subtitle ?? o.shortDescription).slice(0, 300);
  item.image = itemImage(o);

  // sizes / variants
  const variants = (o.variants ?? o.sizes ?? o.options ?? (isObj(o.offers) ? null : o.offers)) as unknown;
  if (Array.isArray(variants) && variants.length > 1) {
    item.variants = variants
      .filter(isObj)
      .slice(0, 8)
      .map((v) => ({ label: str(v.name ?? v.title ?? v.label ?? v.size).slice(0, 40), price: itemPrice(v) }))
      .filter((v) => v.price);
    if (item.variants.length < 2) item.variants = [];
  }
  if (!item.variants.length) item.price = itemPrice(o) || (Array.isArray(variants) && isObj(variants[0]) ? itemPrice(variants[0]) : "");

  item.tags = allergenCodes(o.allergens ?? o.allergenes ?? o.allergenInfo ?? o.additives ?? o.foodAllergens ?? []);
  const diet = JSON.stringify(o.suitableForDiet ?? o.dietary ?? o.labels ?? o.tags ?? "").toLowerCase();
  if (/vegan/.test(diet)) item.badges.push("vegan");
  else if (/vegetari/.test(diet)) item.badges.push("vegetarisch");
  if (/spicy|scharf|hot/.test(diet)) item.badges.push("scharf");
  if (/popular|beliebt|bestseller/.test(diet)) item.badges.push("beliebt");
  return item.price || item.variants.length || item.description ? item : null;
}

// ───────── 1. JSON-LD ─────────
function fromJsonLd(blobs: unknown[]): ImportedMenu | null {
  const nodes: J[] = [];
  const collect = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(collect);
    else if (isObj(v)) {
      nodes.push(v);
      Object.values(v).forEach(collect);
    }
  };
  blobs.forEach(collect);
  const type = (n: J) => [n["@type"]].flat().map(String).join(" ");
  const restaurant = nodes.find((n) => /Restaurant|FoodEstablishment|CafeOrCoffeeShop|Bakery|BarOrPub|FastFood/.test(type(n)));
  const sectionsRaw = nodes.filter((n) => /MenuSection/.test(type(n)));
  const sections: MenuSectionData[] = [];
  for (const s of sectionsRaw) {
    const items = [s.hasMenuItem].flat().filter(isObj).map(toItem).filter(Boolean) as MenuItemData[];
    if (items.length) sections.push({ title: str(s.name) || "Karte", note: str(s.description).slice(0, 160), items });
  }
  if (!sections.length) {
    const loose = nodes.filter((n) => /MenuItem/.test(type(n))).map(toItem).filter(Boolean) as MenuItemData[];
    if (loose.length) sections.push({ title: "Karte", note: "", items: loose });
  }
  if (!sections.length) return null;
  const addr = restaurant?.address;
  return {
    name: str(restaurant?.name),
    logo: rawImage(restaurant?.logo),
    cover: rawImage(restaurant?.image),
    phone: str(restaurant?.telephone),
    address: isObj(addr) ? [str(addr.streetAddress), [str(addr.postalCode), str(addr.addressLocality)].filter(Boolean).join(" ")].filter(Boolean).join(", ") : str(addr),
    sections,
    source: "jsonld",
  };
}

// ───────── 2. embedded app state ─────────
const LIST_KEYS = ["items", "products", "dishes", "menuItems", "productIds", "itemIds", "entries", "articles", "meals", "children"];

function fromEmbedded(blobs: unknown[]): ImportedMenu | null {
  // Index every object that has an id, so categories that only list ids can be resolved.
  const byId = new Map<string, J>();
  const walk = (v: unknown, depth: number, fn: (o: J) => void) => {
    if (depth > 40) return;
    if (Array.isArray(v)) v.forEach((x) => walk(x, depth + 1, fn));
    else if (isObj(v)) {
      fn(v);
      for (const x of Object.values(v)) {
        // dictionaries keyed by id: { "123": { name, price } }
        if (isObj(x) && !Array.isArray(x)) {
          for (const [id, entry] of Object.entries(x)) if (isObj(entry) && (entry.name || entry.title)) byId.set(id, entry);
        }
        walk(x, depth + 1, fn);
      }
    }
  };
  blobs.forEach((b) => walk(b, 0, (o) => {
    const id = str(o.id ?? o.productId ?? o.uuid ?? o._id);
    if (id && (o.name || o.title)) byId.set(id, o);
  }));

  const sections: MenuSectionData[] = [];
  const seen = new Set<string>();
  blobs.forEach((b) => walk(b, 0, (o) => {
    const title = str(o.name ?? o.title ?? o.categoryName ?? o.label);
    if (!title || title.length > 80) return;
    for (const key of LIST_KEYS) {
      const list = o[key];
      if (!Array.isArray(list) || !list.length) continue;
      const resolved = list.map((x) => (typeof x === "string" || typeof x === "number" ? byId.get(String(x)) : isObj(x) ? x : undefined)).filter(isObj);
      const items = resolved.map(toItem).filter(Boolean) as MenuItemData[];
      if (items.length >= 1 && items.filter((i) => i.price || i.variants.length).length >= Math.ceil(items.length / 2)) {
        const sig = title + "|" + items.map((i) => i.name).join("|");
        if (seen.has(sig)) return;
        seen.add(sig);
        sections.push({ title, note: str(o.description).slice(0, 160), items: items.slice(0, 120) });
        return;
      }
    }
  }));

  const counted = sections;
  const total = counted.reduce((n, s) => n + s.items.length, 0);
  if (total < 2) return null;
  return { sections: counted.slice(0, 40), source: "embedded" };
}

// ───────── 3. Claude ─────────
async function fromAi(text: string, url?: string): Promise<ImportedMenu | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const prompt = `Extract the restaurant menu from this ${url ? `web page (${url})` : "text"}. Return ONLY JSON:
{"name":"","phone":"","address":"","sections":[{"title":"","items":[{"name":"","description":"","price":"7,50","image":"","sizes":[{"label":"","price":""}],"allergens":"A, G, 3","vegan":false,"vegetarian":false,"spicy":false}]}]}
Images appear in the text as [Bild: URL]. Put the photo that belongs to a dish (usually right before or after its name) into "image", copied exactly; leave it empty when unsure. Never use logos, icons or banners.
Keep the original language. Prices with comma decimals, no currency sign. Allergens as the letters/numbers printed on the menu, or mapped to German letters (A Gluten, B Krebstiere, C Ei, D Fisch, E Erdnuss, F Soja, G Milch, H Nüsse, L Sellerie, M Senf, N Sesam, O Sulfite, P Lupinen, R Weichtiere). Skip anything that is not a dish or drink.

${text.slice(0, 90000)}`;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5", max_tokens: 16000, messages: [{ role: "user", content: prompt }] }),
    signal: AbortSignal.timeout(55000),
  }).catch(() => null);
  if (!res?.ok) return null;
  const data = (await res.json().catch(() => null)) as { content?: { type: string; text?: string }[] } | null;
  const raw = data?.content?.find((c) => c.type === "text")?.text ?? "";
  const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
  let parsed: J;
  try {
    parsed = JSON.parse(json) as J;
  } catch {
    return null;
  }
  const sections: MenuSectionData[] = [];
  for (const s of [parsed.sections].flat().filter(isObj)) {
    const items: MenuItemData[] = [];
    for (const it of [s.items].flat().filter(isObj)) {
      const item = emptyItem();
      item.name = str(it.name).slice(0, 120);
      if (!item.name) continue;
      item.description = str(it.description).slice(0, 300);
      item.image = str(it.image);
      const sizes = [it.sizes].flat().filter(isObj).map((v) => ({ label: str(v.label).slice(0, 40), price: readPrice(v.price) })).filter((v) => v.price);
      if (sizes.length > 1) item.variants = sizes.slice(0, 8);
      else item.price = readPrice(it.price);
      item.tags = str(it.allergens).slice(0, 80);
      if (it.vegan) item.badges.push("vegan");
      else if (it.vegetarian) item.badges.push("vegetarisch");
      if (it.spicy) item.badges.push("scharf");
      items.push(item);
    }
    if (items.length) sections.push({ title: str(s.title).slice(0, 80) || "Karte", note: "", items });
  }
  if (!sections.length) return null;
  return { name: str(parsed.name), phone: str(parsed.phone), address: str(parsed.address), sections, source: "ai" };
}

// ───────── 4. plain text ─────────
export { fromJsonLd, fromEmbedded, extractBlobs, finishImages, fromDom };

const NOISE = /^(schmeckt mir!?|merken!?|bild lädt noch.*|item info|produktinfo|hinzufügen|add|\+|in den warenkorb|mehr anzeigen|einem gaumenfreund.*|.*gaumenfreunde.*|klassisch sortiert|speisekarte filtern|zuletzt aktualisiert.*|beliebt|popular|from|ab|vegetarisch|vegan)$/i;
const PRICE_ONLY = /^(?:ab\s+|from\s+)?(?:€\s*)?(\d{1,3}(?:[.,]\d{2}))\s*(?:€|eur|euro)?$/i;
const PRICE_END = /(?:ab\s+|from\s+)?(?:€\s*)?(\d{1,3}(?:[.,]\d{2}))\s*(?:€|eur|euro)?\s*$/i;
const SIZE_HEADER = /^([\wÄÖÜäöüß.Ø ]{1,14})(\s*\/\s*[\wÄÖÜäöüß.Ø ]{1,14}){1,4}$/;

function splitName(raw: string): { name: string; tags: string } {
  const m = raw.replace(/[.\-–—_·\s]+$/, "").trim().match(/^(?:\d+[.)]?\s+)?(.+?)(?:\s*[(\[]([A-Z0-9,\s]+)[)\]])?$/);
  return { name: (m?.[1] ?? raw).slice(0, 120), tags: (m?.[2] ?? "").replace(/\s+/g, " ").trim() };
}

/** Parses menus copied from web pages or PDFs: "Name … 7,50", or name / description / price on separate lines. */
export function fromText(text: string): ImportedMenu | null {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\s+/g, " ").trim()).filter((l) => l && l !== "€" && !NOISE.test(l));
  const sections: MenuSectionData[] = [];
  let section: MenuSectionData | null = null;
  let sizes: string[] = [];
  let pendingSizes: string[] | null = null;
  let buffer: string[] = [];
  let item: MenuItemData | null = null;
  let prices: string[] = [];

  const open = (title: string) => {
    section = { title: title.replace(/[:\s]+$/, "").slice(0, 80), note: "", items: [] };
    sections.push(section);
    sizes = pendingSizes ?? [];
    pendingSizes = null;
  };
  const finish = () => {
    if (item && prices.length) {
      if (prices.length > 1) item.variants = prices.slice(0, 8).map((p, i) => ({ label: sizes[i] ?? `Größe ${i + 1}`, price: p }));
      else item.price = prices[0];
      if (!section) open("Karte");
      section!.items.push(item);
    }
    item = null;
    prices = [];
  };
  const start = (lead: string[]) => {
    // lead = lines before the price: [..., category?, name, description?]
    let nameIdx = lead.length - 1;
    const last = lead[nameIdx];
    if (lead.length >= 2 && (last.length > 32 || last.includes(",") || /^(mit|with|aus|und|in|auf|dazu|serviert)\b/i.test(last) || /^[a-zäöü]/.test(last) || /[(\[][A-Z0-9,\s]+[)\]]\s*$/.test(lead[nameIdx - 1]))) nameIdx -= 1;
    for (let i = nameIdx - 1; i >= 0; i--) {
      if (lead[i].length <= 40 && !SIZE_HEADER.test(lead[i])) {
        open(lead[i]);
        break;
      }
    }
    const { name, tags } = splitName(lead[nameIdx]);
    item = emptyItem();
    item.name = name;
    item.tags = tags;
    item.description = lead.slice(nameIdx + 1).join(" ").slice(0, 300);
  };

  for (const line of lines) {
    const only = line.match(PRICE_ONLY);
    if (only) {
      const p = formatPrice(parseFloat(only[1].replace(",", ".")));
      if (!item && buffer.length) {
        start(buffer);
        buffer = [];
      }
      if (item) prices.push(p);
      continue;
    }
    if (item && prices.length) finish();
    if (SIZE_HEADER.test(line) && line.includes("/")) {
      const labels = line.split("/").map((x) => x.trim());
      if (buffer.length) pendingSizes = labels;
      else sizes = labels;
      continue;
    }
    const end = line.match(PRICE_END);
    if (end && end.index! > 2) {
      if (buffer.length) {
        const title = buffer.filter((l) => l.length <= 40).at(-1);
        if (title) open(title);
        buffer = [];
      }
      const { name, tags } = splitName(line.slice(0, end.index));
      item = emptyItem();
      item.name = name;
      item.tags = tags;
      prices = [formatPrice(parseFloat(end[1].replace(",", ".")))];
      finish();
      continue;
    }
    // a description line right after an inline-priced dish
    const lastItem = (section as MenuSectionData | null)?.items.at(-1);
    if (!buffer.length && lastItem && !lastItem.description && line.length > 25) {
      lastItem.description = line.slice(0, 300);
      continue;
    }
    buffer.push(line);
    if (buffer.length > 6) buffer.shift();
  }
  finish();
  const filled = sections.filter((x) => x.items.length);
  return filled.length ? { sections: filled, source: "text" } : null;
}

// ───────── fetching (with SSRF guard) ─────────

async function fetchPage(input: string): Promise<{ html: string; url: string } | { error: string }> {
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    return { error: "Das ist kein gültiger Link." };
  }
  for (let hop = 0; hop < 5; hop++) {
    if (url.protocol !== "https:" && url.protocol !== "http:") return { error: "Nur http(s)-Links." };
    const addrs = await lookup(url.hostname, { all: true }).catch(() => []);
    if (!addrs.length) return { error: "Diese Adresse ist nicht erreichbar." };
    if (addrs.some((a) => privateIp(a.address))) return { error: "Diese Adresse ist nicht erlaubt." };
    const res = await fetch(url, {
      redirect: "manual",
      headers: {
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "accept-language": "de-DE,de;q=0.9,en;q=0.7",
        "accept-encoding": "gzip, deflate, br",
        "cache-control": "no-cache",
        pragma: "no-cache",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
      },
      signal: AbortSignal.timeout(15000),
    }).catch(() => null);
    if (!res) return { error: "Die Seite hat nicht geantwortet." };
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      url = new URL(res.headers.get("location")!, url);
      continue;
    }
    if (res.status === 403 || res.status === 429 || res.status === 503) return { error: "BLOCKED" };
    if (!res.ok) return { error: `Die Seite antwortet mit Fehler ${res.status}.` };
    const reader = res.body?.getReader();
    if (!reader) return { error: "Leere Antwort." };
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 8 * 1024 * 1024) break;
      chunks.push(value);
    }
    return { html: new TextDecoder().decode(Buffer.concat(chunks)), url: url.toString() };
  }
  return { error: "Zu viele Weiterleitungen." };
}

function extractBlobs(html: string): { ld: unknown[]; embedded: unknown[] } {
  const ld: unknown[] = [];
  const embedded: unknown[] = [];
  const tryParse = (s: string) => {
    try {
      return JSON.parse(s.trim());
    } catch {
      return undefined;
    }
  };
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    const v = tryParse(m[1]);
    if (v !== undefined) ld.push(v);
  }
  for (const m of html.matchAll(/<script[^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    const v = tryParse(m[1]);
    if (v !== undefined) embedded.push(v);
  }
  for (const m of html.matchAll(/window\.(?:__[A-Z_]+__|__NUXT__|__APOLLO_STATE__)\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/g)) {
    const v = tryParse(m[1]);
    if (v !== undefined) embedded.push(v);
  }
  return { ld, embedded };
}

/** Page text for the AI, with dish photos kept as [Bild: URL] markers. */
function pageTextWithImages(html: string, base: string): string {
  const marked = html.replace(/<img\b[^>]*>/gi, (tag) => {
    const a = (n: string) => tag.match(new RegExp(`\\s${n}\\s*=\\s*["']([^"']+)["']`, "i"))?.[1] ?? "";
    const url = resolveImage(a("data-qlick-src") || a("data-srcset") || a("srcset") || a("data-src") || a("data-lazy-src") || a("data-original") || a("src"), base);
    return url ? `\n[Bild: ${url}]\n` : " ";
  });
  return pageText(marked);
}

function pageText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<(br|\/p|\/div|\/li|\/h\d|\/tr)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&euro;/g, "€").replace(/&#8364;/g, "€")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n");
}

function meta(html: string, prop: string): string {
  const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i"));
  return m ? m[1] : "";
}

/** Makes every image absolute + https, then fills gaps from the page HTML. */
function finishImages(menu: ImportedMenu, html?: string, base?: string) {
  for (const section of menu.sections) for (const item of section.items) item.image = item.image ? resolveImage(item.image, base) : "";
  if (menu.logo) menu.logo = resolveImage(menu.logo, base);
  if (menu.cover) menu.cover = resolveImage(menu.cover, base);
  if (html && base) attachHtmlImages(menu, html, base);
}

/** Runs every extraction strategy on a page's HTML (fetched by us, or captured in the user's browser). */
export async function importFromHtml(html: string, url: string): Promise<ImportResult> {
  const { ld, embedded } = extractBlobs(html);
  const base = { name: meta(html, "og:site_name") || "", cover: resolveImage(decodeEntities(meta(html, "og:image")), url) };
  const dom = (): ImportedMenu | null => {
    const d = fromDom(html);
    return d ? { sections: d.sections, source: "dom" } : null;
  };
  // Every structured source may see only part of the page: take the richest one.
  const size = (m: ImportedMenu | null) => (m ? m.sections.reduce((n, sec) => n + sec.items.length, 0) : 0);
  const structured = [fromJsonLd(ld), fromEmbedded([...embedded, ...ld]), dom()].reduce<ImportedMenu | null>((best, m) => (size(m) > size(best) ? m : best), null);
  const menu = structured ?? (await fromAi(pageTextWithImages(html, url), url)) ?? fromText(pageText(html));
  if (!menu) {
    return { ok: false, message: "Auf dieser Seite wurde keine Speisekarte erkannt. Öffne direkt die Seite mit den Gerichten und versuche es noch einmal." };
  }
  finishImages(menu, html, url);
  return { ok: true, menu: { ...base, ...Object.fromEntries(Object.entries(menu).filter(([, v]) => v)) } as ImportedMenu };
}

export async function importMenu(input: { url?: string; text?: string; html?: string }): Promise<ImportResult> {
  if (input.html?.trim()) {
    let base = "https://example.invalid/";
    try {
      base = new URL(input.url?.trim() || base).toString();
    } catch {
      /* relative images then stay unresolved */
    }
    return importFromHtml(input.html, base);
  }
  if (input.text?.trim()) {
    const text = input.text.slice(0, 120000);
    const menu = (await fromAi(text)) ?? fromText(text);
    if (menu) finishImages(menu);
    return menu ? { ok: true, menu } : { ok: false, message: "In diesem Text wurden keine Gerichte mit Preisen gefunden." };
  }
  if (!input.url?.trim()) return { ok: false, message: "Bitte einen Link einfügen." };
  const page = await fetchPage(input.url.trim());
  if ("error" in page) {
    return page.error === "BLOCKED"
      ? { ok: false, blocked: true, message: "Diese Seite lässt keine automatischen Abrufe zu. Hol die Karte stattdessen über deinen Browser (Tab „Aus dem Browser“): alle Gerichte und Fotos, in 10 Sekunden." }
      : { ok: false, message: page.error };
  }
  return importFromHtml(page.html, page.url);
}
