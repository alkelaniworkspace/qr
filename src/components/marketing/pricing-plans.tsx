"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Check, Crown, Sparkles } from "lucide-react";
import { FOUNDER, PLANS, euro, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/cn";

const IDS = Object.keys(PLANS) as PlanId[];
const founder = (n: number) => Math.round(n * (100 - FOUNDER.discount)) / 100;
const STEPS = [1, 3, 5, 10, 15, 25, 50, 100, 150, 250];

/** Smallest plan that covers `n` dynamic codes. */
function planFor(n: number): PlanId {
  return IDS.find((id) => PLANS[id].dynamic === null || PLANS[id].dynamic >= n) ?? "business";
}

/** "Which plan fits?" slider, billing toggle and the four plan cards. Pro is the spotlight card. */
export function PricingPlans() {
  const [yearly, setYearly] = useState(true);
  const [step, setStep] = useState(4);
  const need = STEPS[step];
  const fit = planFor(need);

  return (
    <div>
      {/* finder + billing */}
      <div className="mx-auto grid max-w-4xl gap-3 md:grid-cols-[1fr_auto]">
        <div className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:gap-6">
          <div className="shrink-0">
            <p className="text-[13px] text-dim">Wie viele dynamische Codes brauchst du?</p>
            <p className="mt-1 flex items-baseline gap-2"><span className="font-display text-[34px] leading-none tabular-nums">{need === 250 ? "250+" : need}</span><span className="text-[14px] text-dim">→ <b className="font-semibold text-fg">{PLANS[fit].label}</b> passt</span></p>
          </div>
          <input
            type="range" min={0} max={STEPS.length - 1} value={step} onChange={(e) => setStep(Number(e.target.value))}
            aria-label="Anzahl dynamischer Codes" className="pr-range w-full" style={{ "--p": `${(step / (STEPS.length - 1)) * 100}%` } as React.CSSProperties}
          />
        </div>
        <div role="radiogroup" aria-label="Abrechnung" className="card relative inline-flex items-center self-stretch p-1.5 text-[14px] font-semibold">
          {[false, true].map((y) => (
            <button key={String(y)} type="button" role="radio" aria-checked={yearly === y} onClick={() => setYearly(y)} className="relative h-full flex-1 rounded-[18px] px-5 py-3">
              {yearly === y && <motion.span layoutId="pr-billing" className="absolute inset-0 rounded-[18px] bg-[#0e0e0f] shadow-[0_0_0_1px_rgb(189_251_4/0.35),0_10px_30px_-12px_rgb(189_251_4/0.6)]" transition={{ type: "spring", stiffness: 320, damping: 30 }} />}
              <span className={cn("relative flex items-center justify-center gap-2 whitespace-nowrap", yearly === y ? "text-white" : "text-dim")}>
                {y ? "Jährlich" : "Monatlich"}
                {y && <span className="rounded-full bg-lime px-2 py-0.5 text-[11px] font-bold text-[#0a0a0b]">−20 %</span>}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* plans */}
      <div className="mt-16 grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-4">
        {IDS.map((id, i) => {
          const p = PLANS[id];
          const hero = id === "pro";
          const fits = id === fit;
          const price = yearly ? p.yearly : p.price;
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.07, type: "spring", stiffness: 110, damping: 18 }}
              className={cn("relative", hero && "order-first md:order-none xl:-my-5")}
            >
              {hero && <div aria-hidden className="pr-ring absolute -inset-[1.5px] rounded-[30px]" />}
              <div className={cn(
                "relative flex h-full flex-col rounded-[28px] p-7 transition duration-300",
                hero ? "pr-spot bg-[#0e0e0f] text-white xl:py-12" : "card",
                fits && !hero && "outline outline-2 outline-offset-2 outline-lime",
              )}>
                <div className="absolute -top-3.5 left-7 flex gap-2">
                  {hero && <span className="inline-flex items-center gap-1.5 rounded-full bg-lime px-3 py-1 text-[12px] font-bold text-[#0a0a0b] shadow-[0_0_24px_-4px_rgb(189_251_4/0.8)]"><Crown className="size-3.5" /> Am beliebtesten</span>}
                  {fits && <motion.span layoutId="pr-fit" className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-bold", hero ? "bg-white text-[#0a0a0b]" : "bg-fg text-bg")}><Sparkles className="size-3.5" /> Passt zu dir</motion.span>}
                </div>

                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-display text-[22px]">{p.label}</p>
                  <p className={cn("text-[13px]", hero ? "text-white/50" : "text-faint")}>{p.tagline}</p>
                </div>

                <div className="mt-7 flex items-end gap-2">
                  <motion.span key={`${id}${yearly}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("font-display text-[58px] leading-none tracking-[-0.05em] tabular-nums", hero && "text-lime [text-shadow:0_0_40px_rgb(189_251_4/0.45)]")}>
                    {euro(price).replace(" €", "")}
                  </motion.span>
                  <span className={cn("mb-2 text-[14px]", hero ? "text-white/55" : "text-dim")}>{p.price ? "€ / Monat" : "€ für immer"}</span>
                </div>
                <p className={cn("mt-2 min-h-[20px] text-[13px]", hero ? "text-white/45" : "text-faint")}>
                  {p.price ? (yearly ? `${euro(p.yearly * 12)} jährlich, statt ${euro(p.price * 12)}` : "monatlich kündbar") : "ohne Kreditkarte, ohne Ablauf"}
                </p>
                {p.price > 0 ? (
                  <p className={cn("mt-4 flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-[13px]", hero ? "bg-lime/10 text-lime ring-1 ring-lime/30" : "bg-hi/[0.05] text-dim")}>
                    <span>Gründer-Preis, für immer</span>
                    <b className={cn("font-semibold tabular-nums", hero ? "text-lime" : "text-fg")}>{euro(founder(price))}</b>
                  </p>
                ) : <p className="mt-4 rounded-2xl bg-hi/[0.05] px-3.5 py-2.5 text-[13px] text-dim">Statische Codes: unbegrenzt</p>}

                <ul className={cn("mt-7 flex-1 space-y-3 border-t pt-6 text-[14px]", hero ? "border-white/10" : "border-edge")}>
                  {p.features.map((f, k) => (
                    <li key={f} className={cn("flex gap-3", hero ? "text-white/85" : "text-fg/85", k === 0 && "font-semibold")}>
                      <span className={cn("mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full", hero ? "bg-lime text-[#0a0a0b]" : "bg-hi/10")}><Check className="size-3" strokeWidth={3} /></span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={p.price ? `/signup?plan=${id}` : "/studio"}
                  className={cn(
                    "group mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full text-[15px] font-semibold transition",
                    hero ? "pr-cta" : "border border-edge-strong hover:bg-hi/[0.06]",
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
