import { deflateSync, inflateSync, strFromU8, strToU8 } from "fflate";
import { env } from "@/lib/env";
import type { CodeTypeId } from "./types";

/**
 * "Page inside the code": a hosted page without any server. The page content
 * is compressed into the URL fragment (/v#...). The fragment never reaches a
 * server, so this works with no database and keeps the content private.
 * Once accounts are live, dynamic codes replace this with short links.
 */

export interface PagePayload {
  t: CodeTypeId;
  n?: string;
  c: Record<string, unknown>;
}

function toB64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  const b64 = typeof btoa === "function" ? btoa(bin) : Buffer.from(bin, "binary").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = typeof atob === "function" ? atob(b64) : Buffer.from(b64, "base64").toString("binary");
  return Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
}

/** Drops empty strings and empty arrays so the code stays as small as possible. */
function prune(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(prune);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v === "" || v === null || v === undefined) continue;
      out[k] = prune(v);
    }
    return out;
  }
  return value;
}

export function encodePage(payload: PagePayload): string {
  const json = JSON.stringify(prune(payload));
  return toB64Url(deflateSync(strToU8(json), { level: 9 }));
}

export function decodePage(fragment: string): PagePayload | null {
  try {
    const json = strFromU8(inflateSync(fromB64Url(fragment.replace(/^#/, ""))));
    const p = JSON.parse(json) as PagePayload;
    return p && typeof p === "object" && typeof p.t === "string" ? { ...p, c: p.c ?? {} } : null;
  } catch {
    return null;
  }
}

export function pageLink(type: CodeTypeId, content: Record<string, unknown>, name?: string): string {
  return `${env.appUrl}/v#${encodePage({ t: type, n: name, c: content })}`;
}
