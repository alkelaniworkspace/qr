"use client";

import { useEffect, useMemo, useState } from "react";
import { SmartImg } from "./smart-img";
import { BarChart3, Check, Clock, Loader2, Lock, PartyPopper, Trophy } from "lucide-react";

type C = Record<string, unknown>;
type Option = { label: string; image: string };
type Tally = { total: number; counts: number[] };

const s = (v: unknown) => String(v ?? "").trim();
const STORE = "qlick-poll";

function readStore(slug: string): { device: string; choices?: number[] } {
  try {
    const all = JSON.parse(localStorage.getItem(STORE) || "{}") as Record<string, { choices?: number[] }> & { _device?: string };
    let device = all._device as unknown as string;
    if (!device) {
      device = crypto.randomUUID();
      localStorage.setItem(STORE, JSON.stringify({ ...all, _device: device }));
    }
    return { device, choices: all[slug]?.choices };
  } catch {
    return { device: "" };
  }
}

function writeStore(slug: string, choices: number[]) {
  try {
    const all = JSON.parse(localStorage.getItem(STORE) || "{}");
    localStorage.setItem(STORE, JSON.stringify({ ...all, [slug]: { choices } }));
  } catch {
    /* private mode: the server still blocks a second vote */
  }
}

function parseClose(v: string): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * A poll page. With `demo` (studio preview, template cards) nothing is sent:
 * the vote is simulated with sample numbers so the owner sees the full flow.
 */
export function PollPage({ c, slug, demo }: { c: C; slug: string; demo: boolean }) {
  const options = useMemo(() => ((c.options as Option[]) ?? []).filter((o) => o && (s(o.label) || s(o.image))), [c.options]);
  const multiple = c.multiple === true;
  const mode = s(c.results) || "after";
  const closes = parseClose(s(c.closesAt));
  const [now] = useState(() => Date.now());
  const closed = !!closes && closes.getTime() < now;
  const withImages = options.some((o) => o.image);

  const [picked, setPicked] = useState<number[]>([]);
  const [voted, setVoted] = useState<number[] | null>(null);
  const [tally, setTally] = useState<Tally | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [device, setDevice] = useState("");

  // Restore a previous vote and load public results.
  useEffect(() => {
    if (demo) return;
    const st = readStore(slug);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is browser-only
    setDevice(st.device);
    if (st.choices?.length) setVoted(st.choices);
    if (mode === "always" || st.choices?.length || closed) {
      fetch(`/api/poll/${slug}`, { cache: "no-store" }).then((r) => r.json()).then((d) => d.results && setTally(d.results)).catch(() => undefined);
    }
  }, [slug, demo, mode, closed]);

  const toggle = (i: number) => {
    if (voted || closed) return;
    setError(null);
    setPicked((p) => (multiple ? (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]) : [i]));
  };

  async function submit() {
    if (!picked.length) return;
    setBusy(true);
    setError(null);
    if (demo) {
      // sample numbers so the preview shows the result screen
      const counts = options.map((_, i) => (picked.includes(i) ? 1 : 0) + [14, 9, 6, 11, 4, 7, 3, 5, 2, 8, 1, 6][i]);
      await new Promise((r) => setTimeout(r, 450));
      setTally({ total: counts.reduce((a, b) => a + b, 0), counts });
      setVoted(picked);
      setBusy(false);
      return;
    }
    const res = await fetch(`/api/poll/${slug}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ choices: picked, device }),
    }).then((r) => r.json()).catch(() => ({ ok: false, message: "Keine Verbindung. Bitte erneut versuchen." }));
    setBusy(false);
    if (res.ok || res.status === "ALREADY") {
      writeStore(slug, picked);
      setVoted(picked);
      if (res.results) setTally(res.results);
      if (!res.ok) setError(res.message);
      return;
    }
    setError(res.message ?? "Fehler");
  }

  const showResults = !!tally && mode !== "never" && (mode === "always" || !!voted || closed);
  const max = tally ? Math.max(1, ...tally.counts) : 1;
  const leader = tally ? tally.counts.indexOf(Math.max(...tally.counts)) : -1;
  const pct = (i: number) => (tally && tally.total ? Math.round(((tally.counts[i] ?? 0) / tally.total) * 100) : 0);

  return (
    <div className="pb-4">
      <div className="text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-[calc(var(--pg-radius)+8px)] bg-[var(--accent)] text-[var(--on-accent)] shadow-[0_14px_30px_-14px_var(--accent)]">
          <BarChart3 className="size-7" />
        </span>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--pg-muted)]">
          {closed ? "Beendet" : multiple ? "Abstimmung · mehrere Antworten" : "Abstimmung"}
        </p>
        <h1 className="mt-2 pg-display text-[32px] leading-[1.05]">{s(c.question) || "Deine Frage"}</h1>
        {s(c.description) && <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-[var(--pg-muted)]">{s(c.description)}</p>}
        {closes && !closed && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--pg-soft)] px-3 py-1 text-xs font-semibold text-[var(--pg-muted)]">
            <Clock className="size-3.5" /> Läuft bis {closes.toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} Uhr
          </p>
        )}
      </div>

      <div className={`mt-7 ${withImages ? "grid grid-cols-2 gap-3" : "space-y-2.5"}`} role={multiple ? "group" : "radiogroup"} aria-label={s(c.question)}>
        {options.map((o, i) => {
          const sel = (voted ?? picked).includes(i);
          const p = pct(i);
          const win = showResults && i === leader && (tally?.total ?? 0) > 0;
          return (
            <button
              key={i}
              type="button"
              role={multiple ? "checkbox" : "radio"}
              aria-checked={sel}
              onClick={() => toggle(i)}
              disabled={!!voted || closed}
              style={{ animationDelay: `${i * 60}ms` }}
              className={`animate-rise group relative block w-full overflow-hidden rounded-[max(12px,var(--pg-radius))] border text-left transition-all duration-300 active:scale-[0.98] disabled:active:scale-100 ${sel ? "border-[var(--accent)] bg-[var(--pg-card)] shadow-[0_0_0_2px_var(--accent)]" : "border-[var(--pg-line)] bg-[var(--pg-card)]"}`}
            >
              {/* result bar grows behind the content */}
              {showResults && !withImages && (
                <span className="absolute inset-y-0 left-0 bg-[var(--accent)]/15 transition-[width] duration-1000 ease-out" style={{ width: `${(tally!.counts[i] / max) * 100}%` }} />
              )}
              {withImages && (
                <span className="relative block aspect-square overflow-hidden bg-[var(--pg-soft)]">
                  {o.image ? (
                    <SmartImg src={o.image} width={640} className={`size-full object-cover transition duration-500 ${sel ? "scale-105" : "group-hover:scale-105"}`} fallback={<span className="grid size-full place-items-center pg-display text-5xl text-[var(--accent)]">{String.fromCharCode(65 + i)}</span>} />
                  ) : (
                    <span className="grid size-full place-items-center pg-display text-5xl text-[var(--accent)]">{String.fromCharCode(65 + i)}</span>
                  )}
                  {showResults && (
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-2.5 pt-8 text-white">
                      <span className="block pg-display text-2xl tabular-nums leading-none">{p}%</span>
                      <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-white/25"><span className="block h-full rounded-full bg-white transition-[width] duration-1000 ease-out" style={{ width: `${p}%` }} /></span>
                    </span>
                  )}
                </span>
              )}
              <span className={`relative flex items-center gap-3 ${withImages ? "p-3" : "px-4 py-3.5"}`}>
                {!showResults && (
                  <span className={`grid size-6 shrink-0 place-items-center border-2 transition ${multiple ? "rounded-md" : "rounded-full"} ${sel ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)]" : "border-[var(--pg-line)]"}`}>
                    {sel && <Check className="size-3.5" strokeWidth={3} />}
                  </span>
                )}
                <span className="min-w-0 flex-1 font-semibold leading-snug">{s(o.label) || `Antwort ${String.fromCharCode(65 + i)}`}</span>
                {win && <Trophy className="size-4 shrink-0 text-[var(--accent)]" />}
                {showResults && !withImages && <span className="shrink-0 pg-display text-lg tabular-nums">{p}%</span>}
                {showResults && sel && <span className="sr-only">(deine Wahl)</span>}
              </span>
            </button>
          );
        })}
      </div>

      {!voted && !closed && (
        <button
          type="button"
          onClick={submit}
          disabled={!picked.length || busy}
          className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-[max(12px,var(--pg-radius))] bg-[var(--accent)] text-[15px] font-semibold text-[var(--on-accent)] shadow-[0_14px_30px_-16px_var(--accent)] transition active:scale-[0.98] disabled:opacity-40"
        >
          {busy ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-5" />}
          {picked.length ? (multiple && picked.length > 1 ? `${picked.length} Stimmen abgeben` : "Abstimmen") : multiple ? "Antworten wählen" : "Antwort wählen"}
        </button>
      )}

      {error && <p role="alert" className="mt-4 rounded-xl border border-[var(--pg-line)] bg-[var(--pg-soft)] px-4 py-3 text-center text-sm">{error}</p>}

      {voted && (
        <div className="animate-rise mt-6 rounded-[max(12px,var(--pg-radius))] border border-[var(--pg-line)] bg-[var(--pg-card)] p-5 text-center">
          <PartyPopper className="mx-auto size-7 text-[var(--accent)]" />
          <p className="mt-2 font-semibold">Danke für deine Stimme!</p>
          <p className="mt-1 text-sm text-[var(--pg-muted)]">
            {mode === "never" ? "Die Ergebnisse sieht nur der Veranstalter." : tally ? `${tally.total} ${tally.total === 1 ? "Stimme" : "Stimmen"} bisher.` : "Ergebnisse werden geladen …"}
          </p>
        </div>
      )}
      {closed && !voted && (
        <p className="mt-6 flex items-center justify-center gap-2 text-sm text-[var(--pg-muted)]"><Lock className="size-4" /> Die Abstimmung ist beendet{showResults ? ` · ${tally!.total} Stimmen` : ""}.</p>
      )}
      {!voted && !closed && mode === "always" && tally && <p className="mt-3 text-center text-xs text-[var(--pg-muted)]">{tally.total} Stimmen bisher</p>}
    </div>
  );
}
