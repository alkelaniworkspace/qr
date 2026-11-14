import "server-only";
import { serverEnv } from "@/lib/env";

/**
 * Checks links against Google Safe Browsing before a code is saved, so the
 * platform cannot be used to send people to phishing or malware sites.
 * Without an API key the check is skipped (fail open), never blocking users.
 */
export async function findUnsafeUrls(urls: string[]): Promise<string[]> {
  const key = serverEnv().safeBrowsingKey;
  const list = [...new Set(urls.filter(Boolean))];
  if (!key || list.length === 0) return [];
  try {
    const res = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${key}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        client: { clientId: "scanwerk", clientVersion: "1.0" },
        threatInfo: {
          threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: list.map((url) => ({ url })),
        },
      }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { matches?: { threat: { url: string } }[] };
    return [...new Set((data.matches ?? []).map((m) => m.threat.url))];
  } catch {
    return [];
  }
}

/** Collects every http(s) link anywhere inside a content object. */
export function collectUrls(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string" && /^https?:\/\//i.test(value)) out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => collectUrls(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => collectUrls(v, out));
  return out;
}
