"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { Globe, Lock, PenLine, Printer, Smartphone, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/cn";

const STEPS = [
  { icon: Printer, title: "Einmal drucken", text: "Code auf Tisch, Fenster oder Flyer." },
  { icon: PenLine, title: "Jederzeit ändern", text: "Preise, Inhalt, sogar den Typ." },
  { icon: Smartphone, title: "Gäste sehen es sofort", text: "Gleicher Code. Neuer Inhalt." },
];

/** Auto-playing story: printed code stays, content behind it changes. */
export function ForeverStory({ qrSvg }: { qrSvg: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const [step, setStep] = useState(0);
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const t = setInterval(() => {
      setStep((s) => {
        if (s === 2) setRound((r) => r + 1);
        return (s + 1) % 3;
      });
    }, 2600);
    return () => clearInterval(t);
  }, [inView]);

  const menu = round % 2 === 0; // alternates: website → menu, then price change
  const price = round % 2 === 0 ? "8,90 €" : "9,50 €";

  return (
    <div ref={ref} className="grid gap-10 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-center">
      <ol className="space-y-3">
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <button type="button" onClick={() => setStep(i)} className={cn("card relative w-full overflow-hidden p-5 text-left transition duration-500", step === i ? "border-edge-strong" : "opacity-50 hover:opacity-80")}>
              <div className="flex items-center gap-3">
                <span className={cn("grid size-10 place-items-center rounded-xl transition", step === i ? "bg-brand text-on-brand" : "bg-hi/10")}><s.icon className="size-5" /></span>
                <div>
                  <p className="font-semibold">{s.title}</p>
                  <p className="text-sm text-dim">{s.text}</p>
                </div>
              </div>
              {step === i && inView && (
                <motion.span key={`${round}-${i}`} className="absolute bottom-0 left-0 h-0.5 bg-lime" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 2.6, ease: "linear" }} />
              )}
            </button>
          </li>
        ))}
      </ol>

      <div className="card relative h-[460px] overflow-hidden rounded-[32px] p-6 sm:h-[520px]">
        {/* the printed table tent: never changes */}
        <motion.div
          className="absolute left-[6%] top-1/2 w-[38%] -translate-y-1/2"
          animate={{ scale: step === 0 ? 1.06 : 0.94, opacity: step === 1 ? 0.55 : 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        >
          <div className="rounded-[22px] bg-white p-4 shadow-lift">
            <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-[#191919]">Tisch 7</p>
            <div className="mt-2 [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            <p className="mt-2 text-center text-sm font-bold text-[#191919]">Scan für die Karte</p>
          </div>
          <div className="mx-auto h-3 w-[86%] rounded-b-xl bg-black/30 blur-sm" />
          <motion.p className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-dim" animate={{ opacity: step === 2 ? 1 : 0.6 }}>
            <Lock className="size-3.5 text-lime-ink" /> Gedruckt. Bleibt so.
          </motion.p>
        </motion.div>

        {/* editor panel */}
        <AnimatePresence>
          {step === 1 && (
            <motion.div
              className="card absolute right-[6%] top-[12%] w-[46%] rounded-2xl p-4"
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 140, damping: 18 }}
            >
              <p className="text-xs font-semibold text-dim">Inhalt bearbeiten</p>
              <div className="mt-3 flex gap-1.5 rounded-full bg-hi/5 p-1 text-xs font-semibold">
                <span className={cn("flex-1 rounded-full px-2 py-1.5 text-center transition", !menu && "bg-brand text-on-brand")}><Globe className="mr-1 inline size-3" />Website</span>
                <motion.span className={cn("flex-1 rounded-full px-2 py-1.5 text-center", menu && "bg-brand text-on-brand")} layout><UtensilsCrossed className="mr-1 inline size-3" />Karte</motion.span>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-edge px-3 py-2 text-sm"><span>Pizza Margherita</span>
                  <motion.span key={price} initial={{ backgroundColor: "rgba(189,251,4,0.6)" }} animate={{ backgroundColor: "rgba(189,251,4,0)" }} transition={{ duration: 1.4 }} className="rounded px-1 font-semibold tabular-nums">{price}</motion.span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-edge px-3 py-2 text-sm"><span>Döner im Brot</span><span className="tabular-nums text-dim">7,50 €</span></div>
              </div>
              <motion.div className="mt-3 rounded-full bg-brand py-2 text-center text-xs font-semibold text-on-brand" initial={{ scale: 1 }} animate={{ scale: [1, 0.94, 1] }} transition={{ delay: 1.4, duration: 0.4 }}>Veröffentlichen</motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* the guest's phone */}
        <motion.div
          className="absolute right-[8%] top-1/2 w-[40%] max-w-[230px]"
          animate={{ y: step === 2 ? "-50%" : "-40%", opacity: step === 1 ? 0 : 1, rotate: step === 2 ? -3 : 0 }}
          transition={{ type: "spring", stiffness: 110, damping: 18 }}
        >
          <div className="overflow-hidden rounded-[30px] border-[6px] border-[#0b0b0b] bg-white shadow-lift">
            <div className="h-5 bg-[#0b0b0b]" />
            <AnimatePresence mode="wait">
              <motion.div key={`${menu}-${price}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="h-[300px] p-3 text-[#191919] sm:h-[340px]">
                {menu ? (
                  <>
                    <div className="h-14 rounded-xl bg-[#191919]" />
                    <p className="mt-2 text-center text-sm font-bold">Dili Grill</p>
                    <div className="mt-2 flex gap-1"><span className="rounded-full bg-[#191919] px-2 py-0.5 text-[9px] text-white">Pizza</span><span className="rounded-full bg-[#eee] px-2 py-0.5 text-[9px]">Döner</span></div>
                    {[["Pizza Margherita", price], ["Diavolo", "9,90 €"], ["Döner im Brot", "7,50 €"]].map(([n, p]) => (
                      <div key={n} className="mt-2 flex justify-between rounded-lg border border-[#eee] px-2 py-1.5 text-[10px]"><span>{n}</span><b>{p}</b></div>
                    ))}
                  </>
                ) : (
                  <>
                    <div className="h-24 rounded-xl bg-[#dfded7]" />
                    <p className="mt-3 text-sm font-bold">dili-grill.de</p>
                    <div className="mt-2 space-y-1.5"><div className="h-2 w-full rounded bg-[#eee]" /><div className="h-2 w-4/5 rounded bg-[#eee]" /><div className="h-2 w-3/5 rounded bg-[#eee]" /></div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        <AnimatePresence>
          {step === 2 && (
            <motion.div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-lime px-4 py-2 text-sm font-semibold text-night" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Lock className="size-4" /> Gleicher Code, neuer Inhalt
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
