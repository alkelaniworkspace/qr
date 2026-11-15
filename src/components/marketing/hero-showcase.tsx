"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ScanLine } from "lucide-react";

/** The hero: one printed link, many looks. Cycles real QR designs with a soft morph. */
export function HeroShowcase({ designs }: { designs: { id: string; name: string; svg: string }[] }) {
  const [i, setI] = useState(0);
  const [scans, setScans] = useState(1284);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % designs.length), 2400);
    const s = setInterval(() => setScans((n) => n + 1 + Math.floor(Math.random() * 3)), 1300);
    return () => {
      clearInterval(t);
      clearInterval(s);
    };
  }, [designs.length]);
  const d = designs[i];

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[520px]">
      {/* orbit rings */}
      <div className="absolute inset-0 rounded-full border border-edge [animation:spin_40s_linear_infinite]" />
      <div className="absolute inset-[9%] rounded-full border border-dashed border-edge [animation:spin_28s_linear_infinite_reverse]" />
      <div className="absolute left-1/2 top-0 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime shadow-[0_0_24px_4px_rgb(189_251_4/0.6)]" />

      {/* the code */}
      <div className="absolute inset-[18%]">
        <div className="card relative grid size-full place-items-center overflow-hidden rounded-[36px] p-6">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={d.id}
              initial={{ opacity: 0, scale: 0.86, rotate: -6, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, rotate: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.08, rotate: 4, filter: "blur(8px)" }}
              transition={{ type: "spring", stiffness: 160, damping: 20 }}
              className="w-full [&>svg]:h-auto [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: d.svg }}
            />
          </AnimatePresence>
          <motion.div
            className="pointer-events-none absolute inset-x-4 h-0.5 rounded-full bg-fg/80 shadow-[0_0_18px_4px_rgb(var(--glow)/0.35)]"
            animate={{ top: ["12%", "88%", "12%"] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>

      {/* floating glass chips */}
      <motion.div className="card absolute left-0 top-[14%] flex items-center gap-2.5 rounded-2xl px-4 py-3" animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
        <span className="relative flex size-2.5"><span className="absolute inline-flex size-full animate-ping rounded-full bg-mint opacity-60" /><span className="relative inline-flex size-2.5 rounded-full bg-mint" /></span>
        <span className="text-sm font-semibold">Live</span>
        <span className="text-xs text-dim">qlick.codes/r/dili</span>
      </motion.div>

      <motion.div className="card absolute right-0 top-[44%] rounded-2xl px-4 py-3" animate={{ y: [0, 12, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
        <p className="flex items-center gap-1.5 text-xs text-dim"><ScanLine className="size-3.5" /> Scans gesamt</p>
        <motion.p key={scans} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-display text-3xl tabular-nums">{scans.toLocaleString("de-DE")}</motion.p>
      </motion.div>

      <motion.div className="card absolute bottom-[4%] left-[8%] flex items-center gap-3 rounded-2xl px-4 py-3" animate={{ y: [0, -8, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}>
        <span className="grid size-8 place-items-center rounded-full bg-lime text-night"><Check className="size-4" strokeWidth={3} /></span>
        <div className="leading-tight">
          <AnimatePresence mode="wait">
            <motion.p key={d.name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="text-sm font-semibold">{d.name}</motion.p>
          </AnimatePresence>
          <p className="text-xs text-dim">Gleicher Link, neuer Look</p>
        </div>
      </motion.div>
    </div>
  );
}
