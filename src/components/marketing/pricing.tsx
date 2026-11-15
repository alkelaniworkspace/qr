"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Check, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { FOUNDER, PLANS, euro, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/cn";

export function Pricing() {
  const [yearly, setYearly] = useState(true);
  return (
    <div>
      <div className="flex flex-col items-center gap-4">
        <div className="relative inline-flex rounded-full border border-edge bg-hi/5 p-1 text-sm font-semibold">
          {[false, true].map((y) => (
            <button key={String(y)} type="button" onClick={() => setYearly(y)} className="relative rounded-full px-5 py-2">
              {yearly === y && <motion.span layoutId="billing" className="absolute inset-0 rounded-full bg-brand" transition={{ type: "spring", stiffness: 300, damping: 28 }} />}
              <span className={cn("relative", yearly === y ? "text-on-brand" : "text-dim")}>{y ? "Jährlich · 2 Monate gratis" : "Monatlich"}</span>
            </button>
          ))}
        </div>
        <p className="flex items-center gap-2 rounded-full border border-lime/40 bg-lime/10 px-4 py-1.5 text-sm">
          <Sparkles className="size-4 text-lime-ink" /> Gründer-Angebot: Die ersten {FOUNDER.seats} Kunden zahlen für immer {FOUNDER.discount} % weniger.
        </p>
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(Object.keys(PLANS) as PlanId[]).map((id, i) => {
          const p = PLANS[id];
          const featured = id === "pro";
          const price = yearly ? p.yearly : p.price;
          return (
            <motion.div key={id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, type: "spring", stiffness: 120, damping: 18 }}
              className={cn("card relative flex h-full flex-col p-7", featured && "border-edge-strong shadow-[0_30px_80px_-40px_rgb(var(--glow)/0.6)]")}>
              {featured && <span className="badge absolute -top-3 left-7 bg-lime text-night">Am beliebtesten</span>}
              <p className="font-display text-xl">{p.label}</p>
              <p className="text-sm text-dim">{p.tagline}</p>
              <div className="mt-6 flex items-end gap-1.5">
                <motion.span key={`${id}${yearly}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="font-display text-5xl tabular-nums">{euro(price)}</motion.span>
                <span className="mb-1.5 text-sm text-dim">{p.price ? "/ Monat" : "für immer"}</span>
              </div>
              {yearly && p.price > 0 && <p className="mt-1 text-xs text-faint">jährlich {euro(p.yearly * 12)} statt {euro(p.price * 12)}</p>}
              <ul className="mt-7 flex-1 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0" /> <span className="text-fg/90">{f}</span></li>
                ))}
              </ul>
              <ButtonLink href={p.price ? `/signup?plan=${id}` : "/studio"} variant={featured ? "primary" : "secondary"} className="mt-8 w-full">
                {p.price ? "14 Tage gratis testen" : "Kostenlos starten"}
              </ButtonLink>
            </motion.div>
          );
        })}
      </div>
      <p className="mt-6 text-center text-xs text-faint">Alle Preise inkl. MwSt. Monatlich kündbar. Gedruckte Codes funktionieren auch nach einer Kündigung weiter.</p>
    </div>
  );
}
