"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Eye, X } from "lucide-react";
import { cn } from "@/lib/cn";

const LABELS = ["Typ", "Inhalt", "Design", "Druck & Download"];

/**
 * Floating step controls: back, progress, next. Always in view while editing.
 * On phones it also opens the live preview as a bottom sheet.
 */
export function StepDock({ step, backLabel, nextLabel, onBack, onNext, nextDisabled, preview }: {
  step: number;
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
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.1 }}
        className="step-dock fixed inset-x-3 bottom-3 z-40 flex items-center gap-2 rounded-[22px] p-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:gap-3 lg:left-[calc(288px+2rem)] lg:right-auto"
      >
        <button type="button" onClick={onBack} aria-label={backLabel} title={backLabel}
          className="grid size-12 shrink-0 place-items-center rounded-2xl border border-edge text-dim transition hover:border-edge-strong hover:text-fg sm:size-auto sm:h-12 sm:px-4">
          <span className="flex items-center gap-2"><ArrowLeft className="size-4" /><span className="hidden text-[14px] font-semibold sm:inline">{backLabel}</span></span>
        </button>

        <div className="hidden min-w-[170px] px-1 md:block">
          <p className="flex items-baseline gap-1.5 text-[12px] text-faint">Schritt <AnimatePresence mode="wait"><motion.b key={step} initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -6, opacity: 0 }} className="font-semibold text-fg">{step}</motion.b></AnimatePresence> von 4 · {LABELS[step - 1]}</p>
          <div className="mt-1.5 grid grid-cols-4 gap-1">
            {[1, 2, 3, 4].map((n) => (
              <span key={n} className="h-1.5 overflow-hidden rounded-full bg-hi/10">
                <motion.span className="block h-full rounded-full bg-lime shadow-[0_0_10px_rgb(189_251_4/0.7)]" initial={false} animate={{ width: n <= step ? "100%" : "0%" }} transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }} />
              </span>
            ))}
          </div>
        </div>

        <button type="button" onClick={() => setSheet(true)} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-edge text-[14px] font-semibold text-dim transition hover:text-fg lg:hidden sm:flex-none sm:px-4">
          <Eye className="size-4" /> Vorschau
        </button>

        <button type="button" onClick={onNext} disabled={nextDisabled}
          className="btn-cta shine group flex h-12 flex-[1.4] items-center justify-center gap-2 rounded-2xl px-5 text-[14px] font-semibold disabled:opacity-40 sm:flex-none">
          <span className="sm:hidden">Weiter</span><span className="hidden truncate sm:inline">{nextLabel}</span> <ArrowRight className="size-4 shrink-0 transition group-hover:translate-x-0.5" />
        </button>
      </motion.div>

      <AnimatePresence>
        {sheet && (
          <>
            <motion.div key="bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheet(false)} className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm lg:hidden" />
            <motion.div key="sheet" role="dialog" aria-label="Vorschau"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 280, damping: 32 }}
              className={cn("fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-[28px] border-t border-edge-strong bg-solid p-4 pb-8 lg:hidden")}>
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-hi/20" />
              <button type="button" onClick={() => setSheet(false)} aria-label="Schließen" className="absolute right-4 top-4 grid size-9 place-items-center rounded-xl border border-edge text-dim"><X className="size-4" /></button>
              <div className="mx-auto max-w-sm">{preview}</div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
