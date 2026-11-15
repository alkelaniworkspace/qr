"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Building2, Check, Crown, Mail, Sparkles } from "lucide-react";
import { FOUNDER, PLANS, QUOTE_FROM, SALES_EMAIL, euro, type PlanId } from "@/lib/plans";
import { useLang, useT } from "@/components/i18n/lang-provider";
import { cn } from "@/lib/cn";

const IDS = Object.keys(PLANS) as PlanId[];
const founder = (n: number) => Math.round(n * (100 - FOUNDER.discount)) / 100;
/** Slider stops: dense where most businesses are, then bigger steps. */
const STOPS = [1, 2, 5, 10, 15, 20, 30, 40, 50, 75, 100, 150, QUOTE_FROM];

type Fit = PlanId | "quote";
function planFor(n: number): Fit {
  return IDS.find((id) => PLANS[id].dynamic >= n) ?? "quote";
}

/** Billing toggle, the four plan cards and the "how many codes" calculator. */
export function PricingPlans() {
  const T = useT();
  const [yearly, setYearly] = useState(true);
  const [step, setStep] = useState(4);
  const need = STOPS[step];
  const fit = planFor(need);

  return (
    <div>
      <div className="flex justify-center">
        <BillingToggle yearly={yearly} setYearly={setYearly} />
      </div>

      <div className="mt-16 grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-4">
        {IDS.map((id, i) => <PlanCard key={id} id={id} index={i} yearly={yearly} fits={fit === id} />)}
      </div>

      <Calculator step={step} setStep={setStep} need={need} fit={fit} yearly={yearly} />

      <p className="mt-5 text-center text-[13px] text-faint">
        {T("Mehr als 150 dynamische Codes, mehrere Marken oder eine Agentur?", "More than 150 dynamic codes, several brands or an agency?")}{" "}
        <a href={`mailto:${SALES_EMAIL}?subject=${encodeURIComponent("Angebot / Quote")}`} className="font-semibold text-fg underline decoration-edge-strong underline-offset-4 hover:decoration-fg">{T("Angebot anfragen", "Request a quote")}</a>
      </p>
    </div>
  );
}

function BillingToggle({ yearly, setYearly }: { yearly: boolean; setYearly: (v: boolean) => void }) {
  const T = useT();
  return (
    <div role="radiogroup" aria-label={T("Abrechnung", "Billing")} className="card relative inline-flex items-center !rounded-full p-1.5 text-[14px] font-semibold">
      {[false, true].map((y) => (
        <button key={String(y)} type="button" role="radio" aria-checked={yearly === y} onClick={() => setYearly(y)} className="relative rounded-full px-6 py-3">
          {yearly === y && <motion.span layoutId="pr-billing" className="absolute inset-0 rounded-full bg-[#0e0e0f] shadow-[0_0_0_1px_rgb(189_251_4/0.35),0_10px_30px_-12px_rgb(189_251_4/0.6)]" transition={{ type: "spring", stiffness: 320, damping: 30 }} />}
          <span className={cn("relative flex items-center gap-2 whitespace-nowrap", yearly === y ? "text-white" : "text-dim")}>
            {y ? T("Jährlich", "Yearly") : T("Monatlich", "Monthly")}
            {y && <span className="rounded-full bg-lime px-2 py-0.5 text-[11px] font-bold text-[#0a0a0b]">−20 %</span>}
          </span>
        </button>
      ))}
    </div>
  );
}

function PlanCard({ id, index, yearly, fits }: { id: PlanId; index: number; yearly: boolean; fits: boolean }) {
  const T = useT();
  const lang = useLang();
  const p = PLANS[id];
  const pro = id === "pro";
  const biz = id === "business";
  const dark = pro || biz;
  const price = yearly ? p.yearly : p.price;
  const features = lang === "en" ? p.featuresEn : p.features;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: index * 0.07, type: "spring", stiffness: 110, damping: 18 }}
      className={cn("relative", pro && "order-first md:order-none xl:-my-5")}
    >
      {pro && <div aria-hidden className="pr-ring absolute -inset-[1.5px] rounded-[30px]" />}
      <div className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-[28px] p-7 transition duration-300",
        pro && "pr-spot bg-[#0e0e0f] text-white xl:py-12",
        biz && "pr-biz text-white",
        !dark && "card card-light",
        fits && "pr-fits",
      )}>
        <span aria-hidden className="pr-sheen" />
        <div className="absolute -top-px left-7 flex gap-2">
          {pro && <span className="inline-flex items-center gap-1.5 rounded-b-xl bg-lime px-3 py-1 text-[12px] font-bold text-[#0a0a0b] shadow-[0_0_24px_-4px_rgb(189_251_4/0.8)]"><Crown className="size-3.5" /> {T("Am beliebtesten", "Most popular")}</span>}
          {biz && <span className="inline-flex items-center gap-1.5 rounded-b-xl bg-[#e2294f] px-3 py-1 text-[12px] font-bold text-white shadow-[0_0_24px_-4px_rgb(226_41_79/0.8)]"><Building2 className="size-3.5" /> {T("Für Filialen", "For chains")}</span>}
          <AnimatePresence>
            {fits && (
              <motion.span initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className={cn("inline-flex items-center gap-1 rounded-b-xl px-3 py-1 text-[12px] font-bold", dark ? "bg-white text-[#0a0a0b]" : "bg-fg text-bg")}>
                <Sparkles className="size-3.5" /> {T("Passt zu dir", "Your fit")}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-4 flex items-baseline justify-between gap-3">
          <p className="font-display text-[22px]">{p.label}</p>
          <p className={cn("text-[13px]", dark ? "text-white/55" : "text-faint")}>{lang === "en" ? p.taglineEn : p.tagline}</p>
        </div>

        <div className="mt-6 flex items-end gap-2">
          <motion.span key={`${id}${yearly}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={cn("font-display text-[58px] leading-none tracking-[-0.05em] tabular-nums", pro && "text-lime [text-shadow:0_0_40px_rgb(189_251_4/0.45)]", biz && "text-[#ff8da2] [text-shadow:0_0_40px_rgb(226_41_79/0.55)]")}>
            {euro(price).replace(" €", "")}
          </motion.span>
          <span className={cn("mb-2 text-[14px]", dark ? "text-white/55" : "text-dim")}>{p.price ? T("€ / Monat", "€ / month") : T("€ für immer", "€ forever")}</span>
        </div>
        <p className={cn("mt-2 min-h-[20px] text-[13px]", dark ? "text-white/45" : "text-faint")}>
          {p.price ? (yearly ? T(`${euro(p.yearly * 12)} jährlich, statt ${euro(p.price * 12)}`, `${euro(p.yearly * 12)} per year instead of ${euro(p.price * 12)}`) : T("monatlich kündbar", "cancel monthly")) : T("ohne Kreditkarte, ohne Ablauf", "no credit card, never expires")}
        </p>
        {p.price > 0 ? (
          <p className={cn("mt-4 flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-[13px]",
            pro ? "bg-lime/10 text-lime ring-1 ring-lime/30" : biz ? "bg-white/[0.07] text-[#ffb3c1] ring-1 ring-[#e2294f]/40" : "bg-hi/[0.05] text-dim")}>
            <span>{T("Gründer-Preis, für immer", "Founder price, forever")}</span>
            <b className={cn("font-semibold tabular-nums", dark ? "text-white" : "text-fg")}>{euro(founder(price))}</b>
          </p>
        ) : <p className="mt-4 rounded-2xl bg-hi/[0.05] px-3.5 py-2.5 text-[13px] text-dim">{T("Statische Codes: unbegrenzt", "Static codes: unlimited")}</p>}

        <ul className={cn("mt-7 flex-1 space-y-3 border-t pt-6 text-[14px]", dark ? "border-white/10" : "border-edge")}>
          {features.map((f, k) => (
            <li key={f} className={cn("flex gap-3", dark ? "text-white/85" : "text-fg/85", k === 0 && "font-semibold")}>
              <span className={cn("mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full", pro ? "bg-lime text-[#0a0a0b]" : biz ? "bg-[#e2294f] text-white" : "bg-hi/10")}><Check className="size-3" strokeWidth={3} /></span>
              {f}
            </li>
          ))}
        </ul>

        <Link
          href={p.price ? `/signup?plan=${id}` : "/studio"}
          className={cn(
            "group mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full text-[15px] font-semibold transition",
            pro ? "pr-cta" : biz ? "pr-cta-biz" : "border border-edge-strong hover:bg-hi/[0.06]",
          )}
        >
          {p.price ? T("14 Tage gratis testen", "Try 14 days free") : T("Kostenlos starten", "Start for free")}
          <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
        </Link>
      </div>
    </motion.div>
  );
}

function Calculator({ step, setStep, need, fit, yearly }: { step: number; setStep: (n: number) => void; need: number; fit: Fit; yearly: boolean }) {
  const T = useT();
  const last = STOPS.length - 1;
  const pct = (step / last) * 100;
  const quote = fit === "quote";
  const red = fit === "business";
  const plan = quote ? null : PLANS[fit];
  const price = plan ? (yearly ? plan.yearly : plan.price) : 0;
  const label = (n: number) => (n === QUOTE_FROM ? "150+" : String(n));

  return (
    <div className={cn("pr-calc relative mt-6 grid overflow-hidden rounded-[28px] border lg:grid-cols-[1.45fr_1fr]", red ? "pr-calc-red" : quote ? "pr-calc-gold" : "")}>
      {/* left: the ruler */}
      <div className="relative p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full border border-edge-strong text-[13px] font-bold">1</span>
          <div>
            <p className="text-[18px] font-semibold leading-tight">{T("Wie viele dynamische Codes brauchst du?", "How many dynamic codes do you need?")}</p>
            <p className="mt-1 text-[14px] text-dim">{T("Ein Code pro Tisch, Aufsteller, Flyer oder Filiale. Statische Codes zählen nicht.", "One code per table, display, flyer or branch. Static codes don't count.")}</p>
          </div>
        </div>

        <div className="mt-9 select-none px-[17px]">
          {/* ticks */}
          <div aria-hidden className="relative h-6">
            {STOPS.map((_, i) => {
              const left = (i / last) * 100;
              const on = i <= step;
              return (
                <span key={i}>
                  <span className={cn("absolute bottom-0 w-[3px] -translate-x-1/2 rounded-full transition-colors duration-300", on ? "h-6 pr-tick-on" : "h-4 bg-hi/20")} style={{ left: `${left}%` }} />
                  {i < last && [1, 2, 3].map((m) => {
                    const l = left + (m / 4) * (100 / last);
                    const lit = l <= pct;
                    return <span key={m} className={cn("absolute bottom-0 h-2.5 w-[2px] -translate-x-1/2 rounded-full transition-colors duration-300", lit ? "pr-tick-on opacity-70" : "bg-hi/12")} style={{ left: `${l}%` }} />;
                  })}
                </span>
              );
            })}
          </div>
        </div>
        <input
          type="range" min={0} max={last} step={1} value={step} onChange={(e) => setStep(Number(e.target.value))}
          aria-label={T("Anzahl dynamischer Codes", "Number of dynamic codes")} aria-valuetext={label(need)}
          className="pr-slider mt-3 w-full" style={{ "--p": `${pct}%` } as React.CSSProperties}
        />
        <div className="mt-3 px-[17px]">
          <div className="relative h-8 text-[13px]">
            {STOPS.map((n, i) => (
              <button key={i} type="button" onClick={() => setStep(i)} tabIndex={-1}
                className={cn("absolute top-0 -translate-x-1/2 rounded-lg px-1.5 py-1 tabular-nums transition", i === step ? "pr-stop-on font-bold" : "text-faint hover:text-fg", i % 2 === 1 && i !== step && "max-sm:hidden")}
                style={{ left: `${(i / last) * 100}%` }}>
                {label(n)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* right: result */}
      <div className="relative border-t border-edge p-6 sm:p-8 lg:border-l lg:border-t-0">
        <span aria-hidden className="pr-calc-glow" />
        <AnimatePresence mode="wait">
          <motion.div key={String(fit) + yearly} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="relative">
            <p className="text-[13px] text-dim">{quote ? T("Dein Angebot", "Your offer") : T("Dein Tarif", "Your plan")}</p>
            {quote ? (
              <>
                <p className="pr-gold-text mt-2 font-display text-[46px] leading-none tracking-[-0.04em]">{T("Individuell", "Custom")}</p>
                <p className="mt-3 text-[14px] text-dim">{T("Ab 150 Codes: Mengenpreis, eigene Domain, Rechnung, persönliche Einrichtung.", "From 150 codes: volume pricing, custom domain, invoicing, personal onboarding.")}</p>
                <a href={`mailto:${SALES_EMAIL}?subject=${encodeURIComponent(T("Angebot für mehr als 150 QR-Codes", "Quote for more than 150 QR codes"))}`} className="pr-cta-gold mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold">
                  <Mail className="size-4" /> {T("Angebot anfragen", "Request a quote")}
                </a>
              </>
            ) : (
              <>
                <p className="mt-2 flex items-end gap-3">
                  <span className={cn("font-display text-[64px] leading-none tracking-[-0.05em] tabular-nums", red ? "text-[#e2294f] [text-shadow:0_0_36px_rgb(226_41_79/0.35)]" : "pr-calc-price")}>{euro(price).replace(" €", "")}</span>
                  <span className="mb-2 text-[14px] text-dim">{price ? T("€ / Monat", "€ / month") : T("€ für immer", "€ forever")}</span>
                </p>
                <p className="mt-3 text-[14px] text-dim">
                  <b className="font-semibold text-fg">{plan!.label}</b>{" · "}
                  {T(`bis ${plan!.dynamic} dynamische Codes`, `up to ${plan!.dynamic} dynamic codes`)}
                  {price > 0 && ` · ${euro(Math.round((price / Math.max(need, 1)) * 100) / 100)} ${T("pro Code", "per code")}`}
                </p>
                <Link href={plan!.price ? `/signup?plan=${fit}` : "/studio"} className={cn("mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold", red ? "pr-cta-biz" : "pr-cta")}>
                  {plan!.price ? T("14 Tage gratis testen", "Try 14 days free") : T("Kostenlos starten", "Start for free")} <ArrowRight className="size-4" />
                </Link>
              </>
            )}
            <p className="mt-4 text-center text-[12px] text-faint">{T("Alle Preise inkl. MwSt. · Monatlich kündbar", "All prices incl. VAT · Cancel monthly")}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
