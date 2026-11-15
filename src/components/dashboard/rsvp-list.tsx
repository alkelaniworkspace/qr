"use client";

import { useEffect, useState } from "react";
import { Download, MailCheck, RefreshCw, Users } from "lucide-react";
import { cn } from "@/lib/cn";

type Row = { name: string; email: string; guests: number; confirmed: boolean; at: string };

/** Organiser view of event registrations (owner session or guest edit token). */
export function RsvpList({ slug, token, className }: { slug: string; token?: string | null; className?: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    const load = () => fetch(`/api/rsvp/${slug}?list=1`, { cache: "no-store", headers: token ? { "x-edit-token": token } : {} })
      .then((r) => r.json()).then((d) => alive && setRows(Array.isArray(d.list) ? d.list : [])).catch(() => alive && setRows([]));
    load();
    const iv = setInterval(load, 15000);
    return () => { alive = false; clearInterval(iv); };
  }, [slug, token, tick]);

  const confirmed = rows?.filter((r) => r.confirmed) ?? [];
  const people = confirmed.reduce((n, r) => n + r.guests, 0);
  const pending = (rows?.length ?? 0) - confirmed.length;

  function csv() {
    const lines = [["Name", "E-Mail", "Personen", "Status", "Angemeldet"], ...(rows ?? []).map((r) => [r.name, r.email, String(r.guests), r.confirmed ? "bestätigt" : "offen", new Date(r.at).toLocaleString("de-DE")])];
    const blob = new Blob(["﻿" + lines.map((l) => l.map((c) => `"${c.replace(/"/g, '""')}"`).join(";")).join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `anmeldungen-${slug}.csv`;
    a.click();
  }

  return (
    <div className={cn("card p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-display text-lg"><Users className="size-5" /> Anmeldungen</p>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setTick((t) => t + 1)} aria-label="Aktualisieren" className="grid size-8 place-items-center rounded-full text-faint hover:bg-hi/5 hover:text-fg"><RefreshCw className="size-3.5" /></button>
          {!!rows?.length && <button type="button" onClick={csv} aria-label="Als CSV herunterladen" className="grid size-8 place-items-center rounded-full text-faint hover:bg-hi/5 hover:text-fg"><Download className="size-3.5" /></button>}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[["Zusagen", people], ["Bestätigt", confirmed.length], ["Offen", pending]].map(([l, v]) => (
          <div key={l} className="rounded-2xl border border-edge bg-bg/40 p-3">
            <p className="font-display text-2xl tabular-nums">{rows ? v : "–"}</p>
            <p className="text-xs text-faint">{l}</p>
          </div>
        ))}
      </div>
      {rows && rows.length > 0 ? (
        <ul className="mt-4 divide-y divide-edge">
          {rows.slice(0, 50).map((r) => (
            <li key={r.email} className="flex items-center gap-3 py-2.5 text-sm">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-hi/[0.07] font-semibold">{(r.name || r.email).charAt(0).toUpperCase()}</span>
              <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{r.name || "Ohne Namen"}</span><span className="block truncate text-xs text-faint">{r.email}</span></span>
              <span className="text-xs text-dim">{r.guests} P.</span>
              <span className={cn("badge", r.confirmed ? "bg-lime text-night" : "bg-hi/10 text-dim")}>{r.confirmed ? <><MailCheck className="size-3" /> bestätigt</> : "offen"}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-dim">{rows ? "Noch keine Anmeldungen." : "Lade …"}</p>
      )}
    </div>
  );
}
