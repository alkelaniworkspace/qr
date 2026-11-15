import { shortLink } from "@/lib/env";
import type { CodeMode, CodeTypeId } from "./types";
import { normalizeUrl } from "./types";
import { buildVCard } from "./vcard";
import { pageLink } from "./page-link";

const s = (v: unknown) => String(v ?? "").trim();
const wifiEsc = (v: string) => v.replace(/([\;,:"])/g, "\\$1");

export function mapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/** What a static code contains. Tolerant of half-filled content (live preview). */
export function staticPayload(type: CodeTypeId, c: Record<string, unknown>, name?: string): string {
  switch (type) {
    case "url":
      return normalizeUrl(s(c.url)) || "https://";
    case "vcard":
      return buildVCard(c);
    case "location":
      return mapsUrl(s(c.address));
    case "wifi": {
      const enc = s(c.encryption) || "WPA";
      const pw = enc === "nopass" ? "" : `P:${wifiEsc(s(c.password))};`;
      return `WIFI:T:${enc};S:${wifiEsc(s(c.ssid))};${pw}${c.hidden ? "H:true;" : ""};`;
    }
    case "email": {
      const q = new URLSearchParams();
      if (s(c.subject)) q.set("subject", s(c.subject));
      if (s(c.body)) q.set("body", s(c.body));
      const qs = q.toString().replace(/\+/g, "%20");
      return `mailto:${s(c.to)}${qs ? `?${qs}` : ""}`;
    }
    case "sms":
      return `SMSTO:${s(c.phone)}:${s(c.message)}`;
    case "phone":
      return `tel:${s(c.phone).replace(/\s+/g, "")}`;
    case "text":
      return s(c.text) || " ";
    case "review":
      // Static review codes open Google's review dialog directly, no page in between.
      return s(c.googleUrl) || pageLink(type, c);
    default:
      // Page types and app links: the page travels inside the code (/v#...).
      return pageLink(type, c, name);
  }
}

export function qrData(code: { mode: CodeMode; type: CodeTypeId; slug: string; content: Record<string, unknown> }): string {
  return code.mode === "dynamic" ? shortLink(code.slug) : staticPayload(code.type, code.content);
}
