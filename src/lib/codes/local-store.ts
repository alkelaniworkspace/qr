"use client";

import type { CodeTypeId } from "./types";
import type { PosterSettings } from "@/lib/print/types";

/** Codes saved in this browser (no account needed). */
export interface LocalCode {
  id: string;
  name: string;
  type: CodeTypeId;
  content: Record<string, unknown>;
  style: unknown;
  poster?: PosterSettings;
  createdAt: string;
  updatedAt: string;
}

const KEY = "scanwerk.codes.v1";

export function listLocalCodes(): LocalCode[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as LocalCode[]) : [];
    return Array.isArray(list) ? list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) : [];
  } catch {
    return [];
  }
}

export function getLocalCode(id: string): LocalCode | null {
  return listLocalCodes().find((c) => c.id === id) ?? null;
}

export function saveLocalCode(code: Omit<LocalCode, "createdAt" | "updatedAt"> & { createdAt?: string }): LocalCode {
  const now = new Date().toISOString();
  const list = listLocalCodes().filter((c) => c.id !== code.id);
  const saved: LocalCode = { ...code, createdAt: code.createdAt ?? now, updatedAt: now };
  try {
    localStorage.setItem(KEY, JSON.stringify([saved, ...list]));
  } catch {
    throw new Error("Speicher voll. Lösche alte Codes oder nutze ein kleineres Logo.");
  }
  return saved;
}

export function deleteLocalCode(id: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify(listLocalCodes().filter((c) => c.id !== id)));
  } catch {
    // ignore
  }
}
