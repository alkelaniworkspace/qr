"use client";

import { useEffect, useState } from "react";

/** Days / hours / minutes until an event starts; "Läuft jetzt" while it runs. */
export function Countdown({ start, end }: { start: string; end?: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- time is only known in the browser
    setNow(Date.now());
    const iv = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(iv);
  }, []);
  if (now === null) return null;
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : s + 3 * 3600_000;
  if (isNaN(s)) return null;
  if (now >= e) return <p className="pg-in text-center text-sm font-semibold text-[var(--pg-muted)]">Diese Veranstaltung ist vorbei.</p>;
  if (now >= s) return <p className="pg-in flex items-center justify-center gap-2 text-sm font-semibold"><span className="size-2 animate-pulse rounded-full bg-[var(--accent)]" /> Läuft gerade</p>;
  const diff = s - now;
  const parts = [
    [Math.floor(diff / 86400_000), "Tage"],
    [Math.floor((diff % 86400_000) / 3600_000), "Std."],
    [Math.floor((diff % 3600_000) / 60_000), "Min."],
  ] as const;
  return (
    <div className="pg-in grid grid-cols-3 gap-2">
      {parts.map(([v, l]) => (
        <div key={l} className="pg-card px-2 py-3 text-center">
          <p className="pg-display tabular-nums" style={{ fontSize: "calc(2rem * var(--pg-display-scale))" }}>{v}</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--pg-muted)]">{l}</p>
        </div>
      ))}
    </div>
  );
}

const DAYS = ["so", "mo", "di", "mi", "do", "fr", "sa"];

/** Opening hours, one line per day or range ("Mo–Fr 9–18 Uhr"); today's line is highlighted. */
export function Hours({ lines }: { lines: string[] }) {
  const [today, setToday] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- weekday is only known in the browser
    setToday(new Date().getDay());
  }, []);
  const matches = (line: string) => {
    if (today === null) return false;
    const l = line.toLowerCase().replace(/[.:]/g, "");
    const range = l.match(/^(so|mo|di|mi|do|fr|sa)\w*\s*[-–bis ]+\s*(so|mo|di|mi|do|fr|sa)/);
    if (range) {
      let a = DAYS.indexOf(range[1]);
      const b = DAYS.indexOf(range[2]);
      for (let k = 0; k < 7; k++) {
        if (a === today) return true;
        if (a === b) break;
        a = (a + 1) % 7;
      }
      return false;
    }
    return DAYS.some((d, i) => i === today && new RegExp(`^${d}\\b|^${d}[a-z]*\\b`).test(l));
  };
  return (
    <ul className="space-y-1.5 text-[15px]">
      {lines.map((l) => {
        const on = matches(l);
        return (
          <li key={l} className={`flex items-center gap-2 rounded-[calc(var(--pg-radius)*0.5)] px-2 py-1 ${on ? "bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] font-semibold" : "text-[var(--pg-muted)]"}`}>
            {on && <span className="size-1.5 rounded-full bg-[var(--accent)]" />}
            {l}
            {on && <span className="ml-auto text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">Heute</span>}
          </li>
        );
      })}
    </ul>
  );
}

/** "Gültig bis …", "Nur noch 3 Tage", or "Abgelaufen" (needs the current date, so client-side). */
export function CouponValidity({ date }: { date: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the current date is only known in the browser
    setNow(Date.now());
  }, []);
  const until = new Date(`${date}T23:59:59`);
  if (isNaN(until.getTime())) return null;
  const expired = now !== null && until.getTime() < now;
  const days = now !== null ? Math.ceil((until.getTime() - now) / 86400_000) : null;
  const label = expired
    ? `Abgelaufen am ${until.toLocaleDateString("de-DE")}`
    : days !== null && days <= 14
      ? `Nur noch ${days} ${days === 1 ? "Tag" : "Tage"} gültig`
      : `Gültig bis ${until.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}`;
  return (
    <p className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${expired ? "bg-red-500/15 text-red-600" : "bg-[var(--pg-soft)]"}`}>
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
      {label}
    </p>
  );
}
