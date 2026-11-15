import "server-only";

/**
 * Turns any Google Maps link to a business into Google's direct
 * "write a review" link: https://search.google.com/local/writereview?placeid=...
 *
 * Order of attempts:
 *  1. The link already contains a place id (placeid= / place_id:).
 *  2. Short links (maps.app.goo.gl, goo.gl/maps, g.co) are expanded first.
 *  3. Google Places API "Text Search" with the place name near its coordinates
 *     (needs GOOGLE_MAPS_API_KEY, the most reliable way).
 *  4. Without a key: read the public Maps page and take the place id it
 *     mentions most often.
 */

export interface ReviewLinkResult {
  ok: boolean;
  url?: string;
  placeId?: string;
  name?: string;
  method?: "direct" | "api" | "page";
  message?: string;
}

const PLACE_ID = /^(ChIJ|GhIJ|EhI|Eh)[A-Za-z0-9_-]{10,}$/;
const writeReview = (id: string) => `https://search.google.com/local/writereview?placeid=${id}`;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
// Accepts Google's cookie notice so EU requests get the real page instead of consent.google.com.
const CONSENT = "SOCS=CAESEwgDEgk0ODE3Nzk3MjQaAmRlIAEaBgiA_LyaBg; CONSENT=YES+cb";

function isGoogleHost(host: string) {
  return /(^|\.)google\.[a-z.]+$/.test(host) || ["maps.app.goo.gl", "goo.gl", "g.co", "g.page"].includes(host);
}

async function expand(url: string): Promise<string> {
  let current = url;
  for (let i = 0; i < 6; i++) {
    const res = await fetch(current, { redirect: "manual", headers: { "user-agent": UA, cookie: CONSENT }, signal: AbortSignal.timeout(6000) });
    const loc = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && loc) {
      current = new URL(loc, current).toString();
      continue;
    }
    break;
  }
  return current;
}

function parse(url: string) {
  const u = decodeURIComponent(url);
  const id = u.match(/[?&]placeid=([A-Za-z0-9_-]+)/)?.[1] ?? u.match(/place_id:([A-Za-z0-9_-]+)/)?.[1] ?? u.match(/query_place_id=([A-Za-z0-9_-]+)/)?.[1];
  const name = u.match(/\/maps\/place\/([^/@?]+)/)?.[1]?.replace(/\+/g, " ").trim();
  const at = u.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  const d3 = u.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  const coords = d3 ? { lat: Number(d3[1]), lng: Number(d3[2]) } : at ? { lat: Number(at[1]), lng: Number(at[2]) } : null;
  const q = new URL(url).searchParams.get("q") ?? undefined;
  return { id, name: name || q, coords };
}

async function viaApi(name: string, coords: { lat: number; lng: number } | null, key: string) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: { "content-type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": "places.id,places.displayName" },
    body: JSON.stringify({
      textQuery: name,
      languageCode: "de",
      ...(coords ? { locationBias: { circle: { center: { latitude: coords.lat, longitude: coords.lng }, radius: 300 } } } : {}),
    }),
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { places?: { id: string; displayName?: { text: string } }[] };
  const p = data.places?.[0];
  return p ? { id: p.id, name: p.displayName?.text } : null;
}

async function viaPage(url: string) {
  const res = await fetch(url, { headers: { "user-agent": UA, cookie: CONSENT, "accept-language": "de-DE,de;q=0.9" }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) return null;
  const html = await res.text();
  const counts = new Map<string, number>();
  for (const m of html.matchAll(/ChIJ[A-Za-z0-9_-]{23}/g)) counts.set(m[0], (counts.get(m[0]) ?? 0) + 1);
  const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return best ? best[0] : null;
}

export async function resolveReviewLink(input: string): Promise<ReviewLinkResult> {
  const raw = input.trim();
  if (PLACE_ID.test(raw)) return { ok: true, url: writeReview(raw), placeId: raw, method: "direct" };

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return { ok: false, message: "Das ist kein gültiger Link." };
  }
  if (!isGoogleHost(url.hostname)) return { ok: false, message: "Bitte einen Link aus Google Maps einfügen." };
  if (url.hostname === "search.google.com" && url.pathname.includes("writereview")) return { ok: true, url: url.toString(), method: "direct" };

  try {
    const full = ["maps.app.goo.gl", "goo.gl", "g.co", "g.page"].includes(url.hostname) ? await expand(url.toString()) : url.toString();
    const info = parse(full);
    if (info.id) return { ok: true, url: writeReview(info.id), placeId: info.id, name: info.name, method: "direct" };

    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (key && info.name) {
      const hit = await viaApi(info.name, info.coords, key);
      if (hit) return { ok: true, url: writeReview(hit.id), placeId: hit.id, name: hit.name ?? info.name, method: "api" };
    }

    const fromPage = await viaPage(full);
    if (fromPage) return { ok: true, url: writeReview(fromPage), placeId: fromPage, name: info.name, method: "page" };

    return { ok: false, name: info.name, message: "Ort nicht eindeutig erkannt. Öffne dein Geschäft in Google Maps, tippe auf „Teilen“ und füge diesen Link ein." };
  } catch {
    return { ok: false, message: "Google Maps ist gerade nicht erreichbar. Bitte gleich noch einmal versuchen." };
  }
}
