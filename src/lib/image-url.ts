/**
 * Image URL helpers shared by server and browser.
 *
 * Delivery platforms and shop systems serve tiny thumbnails (140-300 px) in
 * their menus. `fullSizeUrl` rewrites the well-known size patterns so we ask
 * the CDN for a large version. The proxy falls back to the original URL if
 * the rewritten one does not exist, so a wrong guess never breaks a photo.
 */

const SIZE_PARAMS = ["w", "width", "imwidth", "imgwidth", "img_width", "maxwidth", "max_width", "mw", "sw", "size", "s"];
const HEIGHT_PARAMS = ["h", "height", "imheight", "maxheight", "max_height", "mh", "sh"];

export function fullSizeUrl(raw: string, target = 1600): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return raw;
  }
  const t = String(target);

  // Query parameters (imgix, Contentful, Wolt image proxy, Next/Image, many CDNs)
  let touched = false;
  for (const k of SIZE_PARAMS) {
    const v = url.searchParams.get(k);
    if (v && /^\d{2,4}$/.test(v) && Number(v) < target) {
      url.searchParams.set(k, t);
      touched = true;
    }
  }
  if (touched) for (const k of HEIGHT_PARAMS) if (/^\d{2,4}$/.test(url.searchParams.get(k) ?? "")) url.searchParams.delete(k);
  for (const k of ["q", "quality"]) {
    const v = url.searchParams.get(k);
    if (v && /^\d{1,2}$/.test(v) && Number(v) < 75) url.searchParams.set(k, "85");
  }

  let path = url.pathname;
  // Cloudinary (Lieferando/Just Eat, many shops): /upload/c_thumb,w_140,h_140/...
  path = path.replace(/\/(upload|fetch|private)\/((?:[a-z]{1,3}_[^/,]+,?)+)\//i, (_, kind: string, tr: string) => {
    const parts = tr.split(",").filter((p) => !/^(w|h|c|g|z|dpr|q)_/.test(p));
    return `/${kind}/${["c_limit", `w_${t}`, "q_auto:good", ...parts].join(",")}/`;
  });
  // WordPress: image-150x150.jpg
  path = path.replace(/-\d{2,4}x\d{2,4}(\.(?:jpe?g|png|webp|avif))$/i, "$1");
  // Shopify: image_200x200.jpg, image_small.jpg, image_200x.jpg
  if (/cdn\.shopify\.com|\/cdn\/shop\//.test(url.href)) path = path.replace(/_(?:\d{2,4}x\d{0,4}|\d{0,4}x\d{2,4}|pico|icon|thumb|small|compact|medium)(@\d+x)?(\.(?:jpe?g|png|webp))$/i, "$2");
  // Generic resize path segments: /w_200,h_200/  /fit-in/200x200/  /resize/200x/
  path = path.replace(/\/(?:fit-in\/)?(\d{2,3})x(\d{2,3})\//, (m, w: string) => (Number(w) < 400 ? `/${t}x0/` : m));
  path = path.replace(/\/w_\d{2,3}(,h_\d{2,3})?\//, `/w_${t}/`);
  url.pathname = path;
  return url.toString();
}

/** Images we host ourselves (or inline) are used as they are. */
export function isOwnImage(url: string): boolean {
  return !url || url.startsWith("data:") || url.startsWith("blob:") || url.startsWith("/") || /\.supabase\.co\/storage\//.test(url);
}

/**
 * Where the browser should load an external photo from: our proxy, which
 * fetches the full-size version, converts it to WebP at the requested width,
 * survives hotlink protection and is cached on the CDN for a year.
 */
export function proxiedImage(url: string, width = 800): string {
  if (isOwnImage(url) || !/^https?:\/\//i.test(url)) return url;
  return `/api/img?w=${width}&u=${encodeURIComponent(url)}`;
}
