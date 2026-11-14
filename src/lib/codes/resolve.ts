import type { CodeTypeId } from "./types";
import { mapsUrl } from "./payload";

const s = (v: unknown) => String(v ?? "").trim();

/**
 * Where a scan of a dynamic code goes. Returns a URL to redirect to, or null
 * when the code shows a hosted page (/p/[slug]).
 */
export function resolveRedirect(type: CodeTypeId, c: Record<string, unknown>, userAgent: string): string | null {
  switch (type) {
    case "url":
      return s(c.url) || null;
    case "location":
      return mapsUrl(s(c.address));
    case "app": {
      if (/iPhone|iPad|iPod/i.test(userAgent) && s(c.iosUrl)) return s(c.iosUrl);
      if (/Android/i.test(userAgent) && s(c.androidUrl)) return s(c.androidUrl);
      return s(c.fallbackUrl) || null;
    }
    default:
      return null;
  }
}
