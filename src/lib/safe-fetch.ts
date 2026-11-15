import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export function privateIp(ip: string): boolean {
  if (isIP(ip) === 6) return /^(::1|fc|fd|fe80|::ffff:(10|127|192\.168|169\.254|172\.(1[6-9]|2\d|3[01]))\.)/i.test(ip) || ip === "::";
  const [a, b] = ip.split(".").map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
}

/**
 * fetch() for user-supplied URLs: only http(s), never private/internal
 * addresses (checked again on every redirect hop), bounded redirects.
 */
export async function safeFetch(input: string, init: RequestInit & { timeoutMs?: number } = {}, hops = 4): Promise<Response | null> {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }
  for (let i = 0; i <= hops; i++) {
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const addrs = await lookup(url.hostname, { all: true }).catch(() => []);
    if (!addrs.length || addrs.some((a) => privateIp(a.address))) return null;
    const res = await fetch(url, { ...init, redirect: "manual", signal: AbortSignal.timeout(init.timeoutMs ?? 12000) }).catch(() => null);
    if (!res) return null;
    const loc = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && loc) {
      url = new URL(loc, url);
      continue;
    }
    return res;
  }
  return null;
}
