import { type NextRequest } from "next/server";
import { safeFetch } from "@/lib/safe-fetch";
import { fullSizeUrl } from "@/lib/image-url";

/**
 * Image proxy for photos on external sites (imported menus, poll answers).
 *  - asks the CDN for the full-size version, falls back to the original URL
 *  - sends the image host as referer, so hotlink protection lets it through
 *  - converts to WebP at the requested width (sharp), never upscales
 *  - cached on the CDN for a year: each photo is fetched once
 * Only raster images are served (no SVG: it could carry scripts).
 */
export const runtime = "nodejs";

const MAX_BYTES = 15 * 1024 * 1024;
const WIDTHS = [160, 320, 480, 640, 800, 1080, 1280, 1600];
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";

async function load(url: string): Promise<{ buf: Buffer; type: string } | null> {
  let origin = "";
  try {
    origin = new URL(url).origin + "/";
  } catch {
    return null;
  }
  const res = await safeFetch(url, {
    headers: { "user-agent": UA, accept: "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8", referer: origin, "accept-language": "de-DE,de;q=0.9" },
  });
  if (!res || !res.ok) return null;
  const type = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (!type.startsWith("image/") || type.includes("svg")) return null;
  const len = Number(res.headers.get("content-length") ?? 0);
  if (len > MAX_BYTES) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_BYTES || buf.length < 64) return null;
  return { buf, type };
}

const fail = (status: number) => new Response(null, { status, headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" } });

export async function GET(request: NextRequest) {
  const u = request.nextUrl.searchParams.get("u") ?? "";
  const wanted = Number(request.nextUrl.searchParams.get("w") ?? 800);
  const width = WIDTHS.find((w) => w >= wanted) ?? 1600;
  if (!/^https?:\/\//i.test(u) || u.length > 2000) return fail(400);

  const big = fullSizeUrl(u);
  const img = (big !== u ? await load(big) : null) ?? (await load(u.replace(/^http:/i, "https:"))) ?? (u.startsWith("http:") ? await load(u) : null);
  if (!img) return fail(404);

  let body: Buffer = img.buf;
  let type = img.type;
  try {
    const sharp = (await import("sharp")).default;
    body = await sharp(img.buf, { failOn: "none", animated: false })
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();
    type = "image/webp";
  } catch {
    // sharp unavailable or exotic format: serve the original bytes
  }

  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
