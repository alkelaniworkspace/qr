"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Check, Crown } from "lucide-react";
import { FOUNDER, PLANS, euro, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/cn";

const HIGHLIGHT: Record<PlanId, { metric: string; unit: string }> = {
  free: { metric: "3", unit: "dynamische Codes" },
  start: { metric: "15", unit: "dynamische Codes" },
  pro: { metric: "100", unit: "dynamische Codes" },
  business: { metric: "∞", unit: "dynamische Codes" },
};

const founder = (n: number) => Math.round(n * (100 - FOUNDER.discount)) / 100;

/** Billing toggle + the four plan cards. Pro is the hero card. */
export function PricingPlans() {
  const [yearly, setYearly] = useState(true);
  const ids = Object.keys(PLANS) as PlanId[];

  return (
    <div>
      <div className="flex justify-center">
        <div role="radiogroup" aria-label="Abrechnung" className="relative inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1 text-[14px] font-semibold">
          {[false, true].map((y) => (
            <button key={String(y)} type="button" role="radio" aria-checked={yearly === y} onClick={() => setYearly(y)} className="relative rounded-full px-5 py-2.5">
              {yearly === y && <motion.span layoutId="pr-billing" className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,var(--pr-a),var(--pr-b))]" transition={{ type: "spring", stiffness: 320, damping: 30 }} />}
              <span className={cn("relative flex items-center gap-2", yearly === y ? "text-[#1a0d05]" : "text-white/60")}>
                {y ? "Jährlich" : "Monatlich"}
                {y && <span className={cn("rounded-full px-2 py-0.5 text-[11px]", yearly ? "bg-black/15" : "bg-white/10 text-[var(--pr-b)]")}>2 Monate gratis</span>}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-14 grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ids.map((id, i) => {
          const p = PLANS[id];
          const hero = id === "pro";
          const price = yearly ? p.yearly : p.price;
          const h = HIGHLIGHT[id];
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.07, type: "spring", stiffness: 110, damping: 18 }}
              className={cn("relative", hero && "xl:-my-4")}
            >
              {hero && <div aria-hidden className="pr-ring absolute -inset-px rounded-[29px]" />}
              <div className={cn(
                "relative flex h-full flex-col rounded-[28px] border p-7",
                hero ? "border-transparent bg-[#140c08] shadow-[0_40px_120px_-40px_rgb(255_122_61/0.55)] xl:py-11" : "border-white/[0.08] bg-white/[0.025]",
              )}>
                {hero && (
                  <span className="absolute -top-3.5 left-7 inline-flex items-center gap-1.5 rounded-full bg-[linear-gradient(135deg,var(--pr-a),var(--pr-b))] px-3 py-1 text-[12px] font-bold text-[#1a0d05]">
                    <Crown className="size-3.5" /> Am beliebtesten
                  </span>
                )}
                <div className="flex items-baseline justify-between">
                  <p className="pr-display text-[22px] text-white">{p.label}</p>
                  <p className="text-[13px] text-white/45">{p.tagline}</p>
                </div>

                <div className="mt-7 flex items-end gap-2">
                  <motion.span key={`${id}${yearly}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("pr-display text-[54px] leading-none tabular-nums", hero ? "pr-gradient-text" : "text-white")}>
                    {euro(price).replace(" €", "")}
                  </motion.span>
                  <span className="mb-1.5 text-[14px] text-white/50">{p.price ? "€ / Monat" : "€ für immer"}</span>
                </div>
                <p className="mt-2 min-h-[20px] text-[13px] text-white/45">
                  {p.price ? (yearly ? `${euro(p.yearly * 12)} jährlich, statt ${euro(p.price * 12)}` : "monatlich kündbar") : "ohne Kreditkarte"}
                </p>
                {p.price > 0 && (
                  <p className="mt-3 rounded-xl border border-[var(--pr-a)]/25 bg-[var(--pr-a)]/[0.07] px-3 py-2 text-[12.5px] text-[var(--pr-b)]">
                    Gründer-Preis: <b className="font-semibold tabular-nums">{euro(founder(price))}</b> / Monat, für immer
                  </p>
                )}

                <div className="mt-6 flex items-baseline gap-2 border-t border-white/[0.07] pt-6">
                  <span className="pr-display text-[30px] leading-none text-white">{h.metric}</span>
                  <span className="text-[14px] text-white/55">{h.unit}</span>
                </div>
                <ul className="mt-5 flex-1 space-y-3 text-[14px]">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-3 text-white/80">
                      <span className={cn("mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full", hero ? "bg-[var(--pr-a)] text-[#1a0d05]" : "bg-white/10 text-white")}><Check className="size-3" strokeWidth={3} /></span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={p.price ? `/signup?plan=${id}` : "/studio"}
                  className={cn(
                    "group mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full text-[15px] font-semibold transition",
                    hero ? "pr-cta text-[#1a0d05]" : "border border-white/12 bg-white/[0.04] text-white hover:bg-white/[0.09]",
                  )}
                >
                  {p.price ? "14 Tage gratis testen" : "Kostenlos starten"}
                  <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
