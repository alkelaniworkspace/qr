import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env";
import { isBot, parseUserAgent } from "./user-agent";

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

function decode(v: string | null): string | null {
  if (!v) return null;
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

/**
 * Records one scan without storing personal data: the IP is only used inside
 * a salted, daily-rotating hash to count unique visitors, then discarded.
 */
export async function recordScan(codeId: string, h: Headers): Promise<void> {
  const ua = h.get("user-agent") ?? "";
  if (!ua || isBot(ua)) return;

  const ip = (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "").split(",")[0].trim();
  const day = new Date().toISOString().slice(0, 10);
  const visitorHash = await sha256(`${serverEnv().visitorSalt}|${day}|${codeId}|${ip}|${ua}`);
  const { device, os, browser } = parseUserAgent(ua);

  const { error } = await adminClient().rpc("record_scan", {
    p_code_id: codeId,
    p_country: h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry") ?? null,
    p_city: decode(h.get("x-vercel-ip-city")),
    p_device: device,
    p_os: os,
    p_browser: browser,
    p_language: (h.get("accept-language") ?? "").slice(0, 2) || null,
    p_visitor_hash: visitorHash,
  } as never);
  if (error) console.error("record_scan failed", error.message);
}
