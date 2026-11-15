"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, X } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Date (and optional time) picker in the site's design system.
 * Value format matches the native inputs: "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm".
 */

const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const TIMES = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`);

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function parse(v: string): { date: Date | null; time: string } {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(v || "");
  if (!m) return { date: null, time: "" };
  return { date: new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])), time: m[4] ? `${m[4]}:${m[5]}` : "" };
}

function label(v: string, withTime: boolean) {
  const { date, time } = parse(v);
  if (!date) return "";
  const d = `${WEEKDAYS[date.getDay()]}, ${date.getDate()}. ${MONTHS[date.getMonth()].slice(0, 3)}${date.getMonth() === 4 ? "" : "."} ${date.getFullYear()}`;
  return withTime && time ? `${d} · ${time} Uhr` : d;
}

export function DateTimeField({ id, value, onChange, withTime = true, placeholder, invalid }: { id?: string; value: string; onChange: (v: string) => void; withTime?: boolean; placeholder?: string; invalid?: boolean }) {
  const auto = useId();
  const fieldId = id ?? auto;
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const { date, time } = parse(value);
  const [view, setView] = useState(() => {
    const base = date ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const commit = (d: Date | null, t: string) => {
    if (!d) return onChange("");
    onChange(withTime ? `${ymd(d)}T${t || "19:00"}` : ymd(d));
  };

  const today = useMemo(() => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; }, []);
  const cells = useMemo(() => {
    const first = (view.getDay() + 6) % 7; // Monday first
    const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    return Array.from({ length: Math.ceil((first + days) / 7) * 7 }, (_, i) => {
      const n = i - first + 1;
      return n >= 1 && n <= days ? new Date(view.getFullYear(), view.getMonth(), n) : null;
    });
  }, [view]);

  const quick = useMemo(() => {
    const t = new Date(today);
    const tomorrow = new Date(t); tomorrow.setDate(t.getDate() + 1);
    const sat = new Date(t); sat.setDate(t.getDate() + ((6 - t.getDay() + 7) % 7 || 7));
    const week = new Date(t); week.setDate(t.getDate() + 7);
    return [["Heute", t], ["Morgen", tomorrow], ["Samstag", sat], ["In 1 Woche", week]] as const;
  }, [today]);

  const timeList = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open || !withTime) return;
    const el = timeList.current?.querySelector<HTMLElement>("[data-on]");
    el?.scrollIntoView({ block: "center" });
  }, [open, withTime]);

  return (
    <div ref={root} className="relative">
      <button
        id={fieldId}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => { if (date) setView(new Date(date.getFullYear(), date.getMonth(), 1)); setOpen((o) => !o); }}
        className={cn(
          "group flex h-12 w-full items-center gap-3 rounded-2xl border bg-surface px-3.5 text-left text-[15px] transition",
          open ? "border-brand ring-4 ring-brand/15" : invalid ? "border-rose" : "border-edge hover:border-edge-strong",
        )}
      >
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-xl transition", value ? "bg-brand text-on-brand" : "bg-hi/[0.06] text-dim group-hover:text-fg")}>
          <CalendarDays className="size-4" />
        </span>
        <span className={cn("min-w-0 flex-1 truncate", value ? "font-medium text-fg" : "text-faint")}>{value ? label(value, withTime) : placeholder ?? (withTime ? "Datum und Uhrzeit wählen" : "Datum wählen")}</span>
        {value && (
          <span role="button" tabIndex={0} aria-label="Leeren" onClick={(e) => { e.stopPropagation(); onChange(""); }} onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onChange(""); } }}
            className="grid size-7 place-items-center rounded-lg text-faint hover:bg-hi/[0.06] hover:text-fg"><X className="size-3.5" /></span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Datum wählen"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.2, 0.7, 0.2, 1] }}
            className={cn("absolute left-0 top-[calc(100%+8px)] z-50 origin-top-left overflow-hidden rounded-[22px] border border-edge-strong bg-solid shadow-[0_30px_80px_-30px_rgb(0_0_0/0.55)]", withTime ? "w-[min(560px,calc(100vw-40px))]" : "w-[min(340px,calc(100vw-40px))]")}
          >
            <div className="flex gap-1.5 overflow-x-auto border-b border-edge p-2.5 [scrollbar-width:none]">
              {quick.map(([l, d]) => (
                <button key={l} type="button" onClick={() => { setView(new Date(d.getFullYear(), d.getMonth(), 1)); commit(d, time); }}
                  className={cn("shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition", date && ymd(date) === ymd(d) ? "border-brand bg-brand text-on-brand" : "border-edge text-dim hover:border-edge-strong hover:text-fg")}>
                  {l}
                </button>
              ))}
            </div>
            <div className={cn("grid", withTime && "sm:grid-cols-[1fr_150px]")}>
              <div className="p-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <button type="button" aria-label="Vorheriger Monat" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))} className="grid size-9 place-items-center rounded-xl text-dim hover:bg-hi/[0.06] hover:text-fg"><ChevronLeft className="size-4" /></button>
                  <AnimatePresence mode="wait">
                    <motion.p key={view.toISOString()} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.14 }} className="font-display text-[16px]">
                      {MONTHS[view.getMonth()]} {view.getFullYear()}
                    </motion.p>
                  </AnimatePresence>
                  <button type="button" aria-label="Nächster Monat" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))} className="grid size-9 place-items-center rounded-xl text-dim hover:bg-hi/[0.06] hover:text-fg"><ChevronRight className="size-4" /></button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-faint">
                  {DAYS.map((d) => <span key={d} className="py-1">{d}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {cells.map((d, i) => {
                    if (!d) return <span key={i} />;
                    const sel = !!date && ymd(d) === ymd(date);
                    const isToday = ymd(d) === ymd(today);
                    const past = d < today;
                    return (
                      <button key={i} type="button" onClick={() => commit(d, time)}
                        className={cn(
                          "relative grid aspect-square place-items-center rounded-xl text-[14px] tabular-nums transition",
                          sel ? "bg-brand font-bold text-on-brand shadow-[0_0_20px_-6px_rgb(var(--glow)/0.9)]" : past ? "text-faint/60 hover:bg-hi/[0.05]" : "text-fg hover:bg-hi/[0.07]",
                        )}>
                        {d.getDate()}
                        {isToday && !sel && <span className="absolute bottom-1.5 size-1 rounded-full bg-lime-ink" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              {withTime && (
                <div className="border-t border-edge sm:border-l sm:border-t-0">
                  <p className="flex items-center gap-1.5 px-3.5 pt-3.5 text-[12px] font-semibold text-dim"><Clock className="size-3.5" /> Uhrzeit</p>
                  <div ref={timeList} className="mt-2 grid max-h-[272px] grid-cols-3 gap-1 overflow-y-auto px-2.5 pb-3 [scrollbar-width:thin] sm:grid-cols-1">
                    {TIMES.map((t) => {
                      const on = t === (time || "");
                      return (
                        <button key={t} type="button" data-on={on || undefined} onClick={() => commit(date ?? today, t)}
                          className={cn("rounded-xl px-3 py-2 text-[14px] tabular-nums transition", on ? "bg-brand font-bold text-on-brand" : "text-dim hover:bg-hi/[0.07] hover:text-fg")}>
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-edge px-3.5 py-2.5">
              <span className="truncate text-[12px] text-faint">{value ? label(value, withTime) : "Noch nichts gewählt"}</span>
              <button type="button" onClick={() => setOpen(false)} className="btn-cta rounded-full px-4 py-1.5 text-[13px] font-semibold">Fertig</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
