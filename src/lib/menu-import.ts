import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { MenuItemData, MenuSectionData } from "@/lib/codes/types";

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
  source: "jsonld" | "embedded" | "ai" | "text";
}

export type ImportResult = { ok: true; menu: ImportedMenu } | { ok: false; message: string };

type J = Record<string, unknown>;
const isObj = (v: unknown): v is J => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : typeof v === "number" ? String(v) : "");
const https = (v: unknown) => {
  const s = str(Array.isArray(v) ? v[0] : isObj(v) ? (v.url ?? v.contentUrl) : v);
  return /^https:\/\/[^\s"'<>]+$/.test(s) ? s.slice(0, 600) : "";
};

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
  item.image = https(o.image ?? o.imageUrl ?? o.images ?? o.photo ?? o.picture);

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
    logo: https(restaurant?.logo),
    cover: https(restaurant?.image),
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
{"name":"","phone":"","address":"","sections":[{"title":"","items":[{"name":"","description":"","price":"7,50","sizes":[{"label":"","price":""}],"allergens":"A, G, 3","vegan":false,"vegetarian":false,"spicy":false}]}]}
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
export { fromJsonLd, fromEmbedded, extractBlobs };

export function fromText(text: string): ImportedMenu | null {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  const sections: MenuSectionData[] = [];
  let current: MenuSectionData | null = null;
  const priceRe = /(?:€\s*)?(\d{1,3}(?:[.,]\d{2}))\s*(?:€|eur|euro)?\s*$/i;
  for (const line of lines) {
    const m = line.match(priceRe);
    if (m) {
      if (!current) {
        current = { title: "Karte", note: "", items: [] };
        sections.push(current);
      }
      const before = line.slice(0, m.index).replace(/[.\-–—_·\s]+$/, "").trim();
      const nameMatch = before.match(/^(?:\d+[.)]?\s+)?(.+?)(?:\s*[(\[]([A-Z0-9,\s]+)[)\]])?$/);
      const item = emptyItem();
      item.name = (nameMatch?.[1] ?? before).slice(0, 120);
      item.tags = (nameMatch?.[2] ?? "").replace(/\s+/g, " ").trim();
      item.price = formatPrice(parseFloat(m[1].replace(",", ".")));
      if (item.name) current.items.push(item);
    } else if (current && current.items.length && line.length > 25 && !current.items.at(-1)!.description) {
      current.items.at(-1)!.description = line.slice(0, 300);
    } else if (line.length <= 40) {
      current = { title: line.replace(/[:\s]+$/, ""), note: "", items: [] };
      sections.push(current);
    }
  }
  const filled = sections.filter((s) => s.items.length);
  return filled.length ? { sections: filled, source: "text" } : null;
}

// ───────── fetching (with SSRF guard) ─────────
function privateIp(ip: string): boolean {
  if (isIP(ip) === 6) return /^(::1|fc|fd|fe80|::ffff:(10|127|192\.168|169\.254|172\.(1[6-9]|2\d|3[01]))\.)/i.test(ip) || ip === "::";
  const [a, b] = ip.split(".").map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
}

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
        accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        "accept-language": "de-DE,de;q=0.9,en;q=0.7",
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

export async function importMenu(input: { url?: string; text?: string }): Promise<ImportResult> {
  if (input.text?.trim()) {
    const text = input.text.slice(0, 120000);
    const menu = (await fromAi(text)) ?? fromText(text);
    return menu ? { ok: true, menu } : { ok: false, message: "In diesem Text wurden keine Gerichte mit Preisen gefunden." };
  }
  if (!input.url?.trim()) return { ok: false, message: "Bitte einen Link einfügen." };
  const page = await fetchPage(input.url.trim());
  if ("error" in page) {
    return {
      ok: false,
      message: page.error === "BLOCKED"
        ? "Diese Seite blockiert automatische Abrufe. Öffne die Speisekarte im Browser, markiere alles (Strg+A), kopiere es und füge es unten als Text ein."
        : page.error,
    };
  }
  const { ld, embedded } = extractBlobs(page.html);
  const base = { name: meta(page.html, "og:site_name") || "", cover: https(meta(page.html, "og:image")) };
  const menu = fromJsonLd(ld) ?? fromEmbedded([...embedded, ...ld]) ?? (await fromAi(pageText(page.html), page.url)) ?? fromText(pageText(page.html));
  if (!menu) {
    return { ok: false, message: "Auf dieser Seite wurde keine Speisekarte erkannt. Kopiere den Text der Karte und füge ihn unten ein." };
  }
  return { ok: true, menu: { ...base, ...Object.fromEntries(Object.entries(menu).filter(([, v]) => v)) } as ImportedMenu };
}
