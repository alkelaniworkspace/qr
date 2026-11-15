"use client";

import { useEffect, useState } from "react";
import { BarChart3, Download, RefreshCw, Trophy } from "lucide-react";
import { cn } from "@/lib/cn";

type Tally = { total: number; counts: number[] };

/**
 * Live results for the owner of a poll code: signed-in owners are recognised
 * by their session, guest owners by their private edit token.
 */
export function PollResults({ slug, options, token, className }: { slug: string; options: { label: string }[]; token?: string | null; className?: string }) {
  const [tally, setTally] = useState<Tally | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "hidden">("loading");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch(`/api/poll/${slug}`, { cache: "no-store", headers: token ? { "x-edit-token": token } : {} })
        .then((r) => r.json())
        .then((d) => {
          if (!alive) return;
          if (d.results) {
            setTally(d.results);
            setState("ok");
          } else setState("hidden");
        })
        .catch(() => alive && setState("hidden"));
    load();
    const iv = setInterval(load, 10000);
    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, [slug, token, tick]);

  const total = tally?.total ?? 0;
  const counts = tally?.counts ?? [];
  const max = Math.max(1, ...counts);
  const lead = counts.length ? counts.indexOf(Math.max(...counts)) : -1;

  function csv() {
    const rows = [["Antwort", "Stimmen", "Prozent"], ...options.map((o, i) => [o.label, String(counts[i] ?? 0), total ? `${Math.round(((counts[i] ?? 0) / total) * 100)} %` : "0 %"])];
    const blob = new Blob(["﻿" + rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(";")).join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `abstimmung-${slug}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  return (
    <div className={cn("card p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-display text-lg"><BarChart3 className="size-5" /> Ergebnisse</p>
        <div className="flex items-center gap-1">
          <span className="mr-1 inline-flex items-center gap-1.5 text-xs text-faint"><span className="size-1.5 animate-pulse-dot rounded-full bg-mint" /> live</span>
          <button type="button" onClick={() => setTick((t) => t + 1)} aria-label="Aktualisieren" className="grid size-8 place-items-center rounded-full text-faint hover:bg-hi/5 hover:text-fg"><RefreshCw className="size-3.5" /></button>
          {total > 0 && <button type="button" onClick={csv} aria-label="Als CSV herunterladen" className="grid size-8 place-items-center rounded-full text-faint hover:bg-hi/5 hover:text-fg"><Download className="size-3.5" /></button>}
        </div>
      </div>
      {state === "hidden" ? (
        <p className="mt-3 text-sm text-dim">Ergebnisse sind gerade nicht abrufbar.</p>
      ) : (
        <>
          <p className="mt-1 text-sm text-dim">{state === "loading" ? "Lade …" : `${total} ${total === 1 ? "Stimme" : "Stimmen"}`}</p>
          <ul className="mt-4 space-y-3">
            {options.map((o, i) => {
              const n = counts[i] ?? 0;
              const p = total ? Math.round((n / total) * 100) : 0;
              return (
                <li key={i}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-1.5 font-semibold"><span className="truncate">{o.label || `Antwort ${i + 1}`}</span>{i === lead && n > 0 && <Trophy className="size-3.5 shrink-0 text-gold" />}</span>
                    <span className="shrink-0 tabular-nums text-dim">{n} · <b className="text-fg">{p} %</b></span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-hi/10">
                    <div className={cn("h-full rounded-full transition-[width] duration-700 ease-out", i === lead && n > 0 ? "bg-brand" : "bg-brand/45")} style={{ width: `${(n / max) * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
