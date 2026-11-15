"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, MailCheck, Minus, Plus, Users } from "lucide-react";

type Stats = { attending: number; capacity: number | null } | null;

/** Animated number: counts up to the target once it is known. */
function CountUp({ value }: { value: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const from = 0;
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / 900);
      setN(Math.round(from + (value - from) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{n}</>;
}

/**
 * Event registration: name, e-mail, number of people. With a mail service the
 * guest confirms by link (double opt-in); the public only ever sees counts.
 */
export function RsvpCard({ slug, demo, showCount }: { slug: string; demo: boolean; showCount: boolean }) {
  const [stats, setStats] = useState<Stats>(demo ? { attending: 23, capacity: 80 } : null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [guests, setGuests] = useState(1);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<"form" | "pending" | "confirmed">("form");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (demo) return;
    if (new URLSearchParams(window.location.search).get("rsvp") === "bestaetigt") setState("confirmed"); // eslint-disable-line react-hooks/set-state-in-effect
    fetch(`/api/rsvp/${slug}`, { cache: "no-store" }).then((r) => r.json()).then((d) => setStats(d.stats ?? null)).catch(() => undefined);
  }, [slug, demo]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    if (demo) {
      await new Promise((r) => setTimeout(r, 500));
      setStats((s) => (s ? { ...s, attending: s.attending + guests } : s));
      setState("confirmed");
      setBusy(false);
      return;
    }
    const res = await fetch(`/api/rsvp/${slug}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, email, guests }) })
      .then((r) => r.json()).catch(() => ({ ok: false, message: "Keine Verbindung. Bitte erneut versuchen." }));
    setBusy(false);
    if (!res.ok) return setError(res.message ?? "Fehler");
    if (res.stats) setStats(res.stats);
    setState(res.state === "pending" ? "pending" : "confirmed");
  }

  const cap = stats?.capacity ?? null;
  const left = cap ? Math.max(0, cap - (stats?.attending ?? 0)) : null;
  const full = left === 0;

  return (
    <div className="pg-card pg-in overflow-hidden" style={{ "--i": 4 } as React.CSSProperties}>
      {showCount && stats && (
        <div className="border-b border-[var(--pg-line)] p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="pg-display tabular-nums" style={{ fontSize: "calc(2.6rem * var(--pg-display-scale))", lineHeight: 1 }}><CountUp value={stats.attending} /></p>
              <p className="mt-1 flex items-center gap-1.5 text-[14px] text-[var(--pg-muted)]"><Users className="size-4" /> {stats.attending === 1 ? "Person ist dabei" : "Personen sind dabei"}</p>
            </div>
            {cap && <p className="text-right text-[13px] text-[var(--pg-muted)]">{full ? "Ausgebucht" : `Noch ${left} von ${cap} Plätzen`}</p>}
          </div>
          {cap && (
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--pg-soft)]">
              <div className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-1000 ease-out" style={{ width: `${Math.min(100, (stats.attending / cap) * 100)}%` }} />
            </div>
          )}
        </div>
      )}
      <div className="p-5">
        {state === "form" && (
          <form onSubmit={submit} className="space-y-3">
            <p className="text-[16px] font-semibold">{full ? "Leider ausgebucht" : "Jetzt anmelden"}</p>
            {!full && (
              <>
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Dein Name" autoComplete="name" className="h-12 w-full rounded-[max(10px,calc(var(--pg-radius)*0.6))] border border-[var(--pg-line)] bg-[var(--pg-bg)] px-4 text-[15px] outline-none focus:border-[var(--accent)]" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required maxLength={254} placeholder="E-Mail" autoComplete="email" className="h-12 w-full rounded-[max(10px,calc(var(--pg-radius)*0.6))] border border-[var(--pg-line)] bg-[var(--pg-bg)] px-4 text-[15px] outline-none focus:border-[var(--accent)]" />
                <div className="flex items-center justify-between rounded-[max(10px,calc(var(--pg-radius)*0.6))] border border-[var(--pg-line)] px-4 py-2">
                  <span className="text-[15px]">Personen</span>
                  <span className="flex items-center gap-3">
                    <button type="button" onClick={() => setGuests((g) => Math.max(1, g - 1))} aria-label="Weniger" className="grid size-8 place-items-center rounded-full bg-[var(--pg-soft)]"><Minus className="size-4" /></button>
                    <span className="w-5 text-center font-semibold tabular-nums">{guests}</span>
                    <button type="button" onClick={() => setGuests((g) => Math.min(10, g + 1))} aria-label="Mehr" className="grid size-8 place-items-center rounded-full bg-[var(--pg-soft)]"><Plus className="size-4" /></button>
                  </span>
                </div>
                <button type="submit" disabled={busy} className="pg-btn">{busy ? <Loader2 className="size-5 animate-spin" /> : null} Anmelden</button>
                <p className="text-[12px] leading-relaxed text-[var(--pg-muted)]">Deine Daten sieht nur der Veranstalter. Öffentlich wird nur die Anzahl gezeigt.</p>
              </>
            )}
            {error && <p role="alert" className="text-[14px] text-red-600">{error}</p>}
          </form>
        )}
        {state === "pending" && (
          <div className="py-2 text-center">
            <MailCheck className="mx-auto size-9 text-[var(--accent)]" />
            <p className="mt-3 font-semibold">Fast geschafft!</p>
            <p className="mt-1 text-[14px] text-[var(--pg-muted)]">Wir haben dir eine E-Mail an <b className="text-[var(--pg-fg)]">{email}</b> geschickt. Bestätige deine Teilnahme mit einem Klick.</p>
          </div>
        )}
        {state === "confirmed" && (
          <div className="py-2 text-center">
            <CheckCircle2 className="mx-auto size-9 text-[var(--accent)]" />
            <p className="mt-3 font-semibold">Du bist dabei!</p>
            <p className="mt-1 text-[14px] text-[var(--pg-muted)]">Speichere den Termin direkt in deinem Kalender.</p>
          </div>
        )}
      </div>
    </div>
  );
}
