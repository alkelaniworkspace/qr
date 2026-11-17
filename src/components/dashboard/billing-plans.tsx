"use client";

import { useState, useTransition } from "react";
import { motion } from "motion/react";
import { ArrowRight, Building2, Check, Crown, Loader2, Mail } from "lucide-react";
import { startCheckout, type BillingResult } from "@/app/dashboard/billing/actions";
import { FOUNDER, PLANS, SALES_EMAIL, euro, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/cn";

const IDS: PlanId[] = ["free", "start", "pro", "business"];
const RANK: Record<PlanId, number> = { free: 0, start: 1, pro: 2, business: 3 };
const founder = (n: number) => Math.round(n * (100 - FOUNDER.discount)) / 100;

export function BillingPlans({ current, interval, paid, trialAvailable }: {
  current: PlanId; interval: "month" | "year" | null; paid: boolean; trialAvailable: boolean;
}) {
  const [yearly, setYearly] = useState(interval ? interval === "year" : true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [, start] = useTransition();

  const choose = (id: PlanId) => {
    setBusy(id);
    setMsg(null);
    start(async () => {
      const r: BillingResult = await startCheckout(id, yearly ? "year" : "month");
      if (r.url) { window.location.assign(r.url); return; }
      setBusy(null);
      setMsg(r.error ? { ok: false, text: r.error } : { ok: true, text: `Dein Tarif ist jetzt ${PLANS[id].label}. Die Differenz wird anteilig verrechnet.` });
    });
  };

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl leading-none">Tarife</h2>
          <p className="mt-2 text-sm text-dim">Jederzeit wechseln oder kündigen. Gedruckte Codes funktionieren immer weiter.</p>
        </div>
        <div role="radiogroup" aria-label="Abrechnung" className="flex rounded-full border border-edge bg-surface p-1 text-[14px] font-semibold">
          {[false, true].map((y) => (
            <button key={String(y)} type="button" role="radio" aria-checked={yearly === y} onClick={() => setYearly(y)} className="relative rounded-full px-5 py-2.5">
              {yearly === y && <motion.span layoutId="bill-toggle" className="absolute inset-0 rounded-full bg-fg" transition={{ type: "spring", stiffness: 340, damping: 30 }} />}
              <span className={cn("relative flex items-center gap-2 whitespace-nowrap", yearly === y ? "text-bg" : "text-dim")}>
                {y ? "Jährlich" : "Monatlich"}
                {y && <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", yearly ? "bg-lime text-night" : "bg-lime/15 text-fg")}>−20 %</span>}
              </span>
            </button>
          ))}
        </div>
      </div>

      {msg && <p className={cn("mt-5 rounded-2xl px-4 py-3 text-sm font-medium animate-rise", msg.ok ? "bg-lime/15" : "bg-rose/10 text-rose")}>{msg.text}</p>}

      <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {IDS.map((id) => {
          const p = PLANS[id];
          const pro = id === "pro";
          const biz = id === "business";
          const dark = pro || biz;
          const isCurrent = id === current && (id === "free" || !paid || (interval === (yearly ? "year" : "month")));
          const sameTierOtherCycle = id === current && paid && !isCurrent;
          const price = yearly ? p.yearly : p.price;
          const up = RANK[id] > RANK[current];
          const label = id === "free"
            ? (current === "free" ? "Aktueller Tarif" : "Im Free-Tarif enthalten")
            : isCurrent ? "Aktueller Tarif"
            : sameTierOtherCycle ? (yearly ? "Auf jährlich wechseln" : "Auf monatlich wechseln")
            : !paid && trialAvailable ? "14 Tage gratis testen"
            : up ? `Upgrade auf ${p.label}` : `Zu ${p.label} wechseln`;
          const disabled = id === "free" || isCurrent || !!busy;
          return (
            <div key={id} className="relative">
              {pro && <div aria-hidden className="pr-ring absolute -inset-[1.5px] rounded-[30px]" />}
              <div className={cn("relative flex h-full flex-col overflow-hidden rounded-[28px] p-6", pro && "pr-spot bg-[#0e0e0f] text-white", biz && "pr-biz text-white", !dark && "card", isCurrent && !dark && "ring-2 ring-lime/60")}>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display text-[22px]">{p.label}</p>
                  {isCurrent ? <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", dark ? "bg-white text-night" : "bg-lime text-night")}>Dein Tarif</span>
                    : pro ? <span className="inline-flex items-center gap-1 rounded-full bg-lime px-2.5 py-1 text-[11px] font-bold text-night"><Crown className="size-3" /> Beliebt</span>
                    : biz ? <span className="inline-flex items-center gap-1 rounded-full bg-[#e2294f] px-2.5 py-1 text-[11px] font-bold text-white"><Building2 className="size-3" /> Filialen</span> : null}
                </div>
                <div className="mt-5 flex items-end gap-1.5">
                  <span className={cn("font-display text-[48px] leading-none tracking-[-0.05em] tabular-nums", pro && "text-lime", biz && "text-[#ff8da2]")}>{euro(price).replace(" €", "")}</span>
                  <span className={cn("mb-1.5 text-[13px]", dark ? "text-white/55" : "text-dim")}>{p.price ? "€ / Monat" : "€ für immer"}</span>
                </div>
                <p className={cn("mt-1.5 min-h-[18px] text-[12.5px]", dark ? "text-white/45" : "text-faint")}>
                  {p.price ? (yearly ? `${euro(p.yearly * 12)} jährlich abgerechnet` : "monatlich kündbar") : "ohne Kreditkarte"}
                </p>
                {p.price > 0 && (
                  <p className={cn("mt-3 flex items-center justify-between rounded-xl px-3 py-2 text-[12.5px]", pro ? "bg-lime/10 text-lime ring-1 ring-lime/30" : biz ? "bg-white/[0.08] text-[#ffb3c1]" : "bg-hi/[0.05] text-dim")}>
                    <span>Gründer-Preis, für immer</span><b className={dark ? "text-white" : "text-fg"}>{euro(founder(price))}</b>
                  </p>
                )}
                <ul className={cn("mt-5 flex-1 space-y-2.5 border-t pt-5 text-[13.5px]", dark ? "border-white/10" : "border-edge")}>
                  {p.features.map((f, k) => (
                    <li key={f} className={cn("flex gap-2.5", dark ? "text-white/85" : "text-fg/85", k === 0 && "font-semibold")}>
                      <span className={cn("mt-0.5 grid size-[17px] shrink-0 place-items-center rounded-full", pro ? "bg-lime text-night" : biz ? "bg-[#e2294f] text-white" : "bg-hi/10")}><Check className="size-3" strokeWidth={3} /></span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  type="button" disabled={disabled} onClick={() => choose(id)}
                  className={cn("group mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full text-[14.5px] font-semibold transition disabled:cursor-default",
                    isCurrent || id === "free" ? (dark ? "bg-white/10 text-white/70" : "bg-hi/[0.06] text-dim")
                      : pro ? "pr-cta" : biz ? "pr-cta-biz" : "border border-edge-strong hover:bg-hi/[0.06]")}
                >
                  {busy === id ? <Loader2 className="size-4 animate-spin" /> : isCurrent ? <Check className="size-4" /> : null}
                  {label}
                  {!disabled && busy !== id && <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-[#e2294f]/30 bg-[#e2294f]/[0.06] px-6 py-5">
        <div>
          <p className="font-semibold">Mehr als 150 Codes oder viele Filialen?</p>
          <p className="text-sm text-dim">Wir machen dir ein Angebot, das zu dir passt.</p>
        </div>
        <a href={`mailto:${SALES_EMAIL}?subject=Angebot%20f%C3%BCr%20Qlick`} className="pr-cta-biz inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold"><Mail className="size-4" /> Angebot anfragen</a>
      </div>
    </section>
  );
}
