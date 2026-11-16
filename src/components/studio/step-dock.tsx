"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Eye, X } from "lucide-react";
import { cn } from "@/lib/cn";

const LABELS = ["Typ", "Inhalt", "Design", "Druck"];

/**
 * Step bar at the bottom of the editor column: back, the four steps (click to
 * jump), and a big next button. Sticks to the bottom of the window while you
 * scroll the form, never covers the live preview. On phones it also opens the
 * preview as a bottom sheet.
 */
export function StepDock({ step, reached, canOpen, onStep, backLabel, nextLabel, onBack, onNext, nextDisabled, preview }: {
  step: number;
  reached: number;
  canOpen: (s: number) => boolean;
  onStep: (s: number) => void;
  backLabel: string;
  nextLabel: string;
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  preview: React.ReactNode;
}) {
  const [sheet, setSheet] = useState(false);
  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSheet(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheet]);

  return (
    <>
      <div className="sticky bottom-3 z-30 mt-8 sm:bottom-5">
        <div className="studio-bar flex items-center gap-2 rounded-[26px] border border-edge-strong p-2 shadow-lift sm:gap-3">
          <button type="button" onClick={onBack} aria-label={backLabel} title={`Zurück: ${backLabel}`}
            className="grid size-[52px] shrink-0 place-items-center rounded-[18px] bg-hi/[0.06] text-dim transition hover:bg-hi/10 hover:text-fg">
            <ArrowLeft className="size-5" />
          </button>

          <ol className="hidden min-w-0 flex-1 items-center gap-1.5 md:flex">
            {LABELS.map((label, i) => {
              const n = i + 1;
              const active = n === step;
              const done = n < step || (n <= reached && n !== step);
              return (
                <li key={label} className={cn("flex items-center gap-1.5", active ? "min-w-0 flex-1" : "flex-none")}>
                  <button type="button" disabled={!canOpen(n)} onClick={() => onStep(n)} title={label}
                    className={cn("flex h-11 min-w-0 items-center gap-2 rounded-2xl transition disabled:cursor-default",
                      active ? "flex-1 bg-fg pl-1.5 pr-3.5 text-bg" : "px-1.5 hover:bg-hi/[0.06]")}>
                    <span className={cn("grid size-8 shrink-0 place-items-center rounded-full text-[13px] font-bold",
                      active ? "bg-lime text-night" : done ? "bg-lime/90 text-night" : "border border-edge-strong text-faint")}>
                      {done && !active ? <Check className="size-4" strokeWidth={3} /> : n}
                    </span>
                    {active && <span className="min-w-0 leading-tight"><span className="block text-[11px] font-medium opacity-60">Schritt {n} von 4</span><span className="block truncate text-[14px] font-bold">{label}</span></span>}
                  </button>
                  {i < 3 && <span className={cn("h-[2px] w-4 shrink-0 rounded-full", n < step ? "bg-lime" : "bg-hi/15")} />}
                </li>
              );
            })}
          </ol>

          <div className="flex min-w-0 flex-1 items-center md:hidden">
            <button type="button" onClick={() => setSheet(true)} className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[18px] bg-hi/[0.06] text-[14px] font-semibold text-fg lg:hidden">
              <Eye className="size-4" /> Vorschau
            </button>
          </div>

          <button type="button" onClick={onNext} disabled={nextDisabled}
            className="btn-cta shine group flex h-[52px] shrink-0 items-center justify-center gap-2.5 rounded-[18px] px-5 text-[15px] font-bold disabled:opacity-40 sm:px-6">
            <span className="sm:hidden">Weiter</span><span className="hidden sm:inline">{nextLabel}</span>
            <span className="grid size-7 place-items-center rounded-full bg-night/10 transition group-hover:translate-x-0.5"><ArrowRight className="size-4" /></span>
          </button>
        </div>
      </div>

      {typeof document !== "undefined" && createPortal(<AnimatePresence>
        {sheet && (
          <>
            <motion.div key="bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheet(false)} className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm lg:hidden" />
            <motion.div key="sheet" role="dialog" aria-label="Vorschau"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 280, damping: 32 }}
              className="fixed inset-x-0 bottom-0 z-50 flex h-[92vh] flex-col rounded-t-[28px] border-t border-edge-strong bg-solid p-4 pb-6 lg:hidden">
              <div className="mx-auto mb-3 h-1.5 w-12 shrink-0 rounded-full bg-hi/20" />
              <button type="button" onClick={() => setSheet(false)} aria-label="Schließen" className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-xl border border-edge text-dim"><X className="size-4" /></button>
              <div className="mx-auto min-h-0 w-full max-w-sm flex-1">{preview}</div>
            </motion.div>
          </>
        )}
      </AnimatePresence>, document.body)}
    </>
  );
}
