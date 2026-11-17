"use client";

import { useState, useTransition } from "react";
import { Check, Clock, Gift, Infinity as Inf, Loader2, Mail, Send } from "lucide-react";
import { giftByEmail, type GiftResult } from "@/app/admin/actions";
import { PLANS, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/cn";

const PLAN_IDS: PlanId[] = ["start", "pro", "business"];
const DURATIONS = [
  { id: "1", label: "1 Monat", months: 1 },
  { id: "3", label: "3 Monate", months: 3 },
  { id: "6", label: "6 Monate", months: 6 },
  { id: "12", label: "1 Jahr", months: 12 },
  { id: "forever", label: "Unbegrenzt", months: 0 },
  { id: "date", label: "Bis Datum", months: -1 },
];
const CARD: Record<string, string> = {
  start: "bg-lime text-night",
  pro: "bg-[#111] text-white ring-1 ring-lime/40 shadow-[0_0_60px_-12px_rgb(200_255_46/0.45)]",
  business: "bg-[#c8102e] text-white",
};
const SUB: Record<string, string> = { start: "text-night/65", pro: "text-white/55", business: "text-white/70" };
const CHIP: Record<string, string> = { start: "bg-night text-lime", pro: "bg-lime text-night", business: "bg-white text-[#c8102e]" };
const dateFmt = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric" });

export function GiftForm() {
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<PlanId>("pro");
  const [dur, setDur] = useState("3");
  const [date, setDate] = useState("");
  const [limitMode, setLimitMode] = useState<"plan" | "custom" | "unlimited">("plan");
  const [custom, setCustom] = useState("100");
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
  const [notify, setNotify] = useState(true);
  const [result, setResult] = useState<(GiftResult & { email: string }) | null>(null);
  const [pending, start] = useTransition();

  const d = DURATIONS.find((x) => x.id === dur)!;
  const months = d.months > 0 ? d.months : null;
  const until = d.months === -1 && date ? new Date(`${date}T23:59:59`).toISOString() : null;
  const limit = limitMode === "plan" ? null : limitMode === "unlimited" ? -1 : Math.max(0, Math.floor(Number(custom) || 0));
  const durLabel = until ? `bis ${dateFmt.format(new Date(until))}` : months ? d.label : d.months === 0 ? "unbegrenzt" : "Datum wählen";
  const codesLabel = limit === -1 ? "unbegrenzt" : String(limit ?? PLANS[plan].dynamic);
  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) && (d.months !== -1 || !!date);

  const submit = () => start(async () => {
    const r = await giftByEmail({ email, plan, months, until, limit, note, message, notify });
    setResult({ ...r, email: email.trim().toLowerCase() });
    if (!r.error) { setEmail(""); setMessage(""); setNote(""); }
  });

  const chip = (on: boolean) => cn("rounded-xl border px-3 py-2 text-[13px] font-semibold transition", on ? "border-lime bg-lime/10 text-fg ring-1 ring-lime/40" : "border-edge text-dim hover:border-edge-strong hover:text-fg");
  const input = "h-11 w-full rounded-xl border border-edge bg-surface px-3.5 text-sm outline-none placeholder:text-faint focus:border-brand/60";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="card space-y-6 p-6">
        <div>
          <label className="text-[13px] font-semibold" htmlFor="gift-email">E-Mail-Adresse</label>
          <div className="relative mt-2">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <input id="gift-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="kunde@restaurant.de" className={cn(input, "pl-10")} />
          </div>
          <p className="mt-1.5 text-[12.5px] text-faint">Hat die Person schon ein Konto, gilt das Geschenk sofort. Sonst wird es bei der Registrierung mit dieser Adresse aktiv.</p>
        </div>

        <div>
          <p className="text-[13px] font-semibold">Tarif</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {PLAN_IDS.map((p) => (
              <button key={p} type="button" onClick={() => setPlan(p)} className={cn(chip(plan === p), "py-3 text-left")}>
                <span className="flex items-center gap-2"><span className={cn("size-2.5 rounded-full", p === "start" ? "bg-lime" : p === "pro" ? "bg-fg" : "bg-[#e2294f]")} />{PLANS[p].label}</span>
                <span className="mt-0.5 block text-[11.5px] font-medium text-faint">{PLANS[p].dynamic} dynamische Codes</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[13px] font-semibold">Laufzeit</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {DURATIONS.map((x) => <button key={x.id} type="button" onClick={() => setDur(x.id)} className={chip(dur === x.id)}>{x.label}</button>)}
          </div>
          {dur === "date" && <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={cn(input, "mt-2.5")} />}
          {months && <p className="mt-1.5 text-[12.5px] text-faint">Zählt ab dem Tag, an dem das Geschenk aktiv wird.</p>}
        </div>

        <div>
          <p className="text-[13px] font-semibold">Dynamische QR-Codes</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <button type="button" onClick={() => setLimitMode("plan")} className={chip(limitMode === "plan")}>Wie im Tarif ({PLANS[plan].dynamic})</button>
            <button type="button" onClick={() => setLimitMode("custom")} className={chip(limitMode === "custom")}>Eigene Anzahl</button>
            <button type="button" onClick={() => setLimitMode("unlimited")} className={cn(chip(limitMode === "unlimited"), "inline-flex items-center gap-1.5")}><Inf className="size-4" /> Unbegrenzt</button>
          </div>
          {limitMode === "custom" && (
            <input type="number" min={0} max={100000} value={custom} onChange={(e) => setCustom(e.target.value)} className="mt-2.5 h-11 w-40 rounded-xl border border-edge bg-surface px-3.5 text-sm outline-none focus:border-brand/60" aria-label="Anzahl dynamischer Codes" />
          )}
        </div>

        <div>
          <label className="text-[13px] font-semibold" htmlFor="gift-msg">Persönliche Nachricht <span className="font-normal text-faint">(optional, steht in der E-Mail)</span></label>
          <textarea id="gift-msg" value={message} onChange={(e) => setMessage(e.target.value)} rows={3} maxLength={400} placeholder="Danke, dass du Qlick von Anfang an testest!" className="mt-2 w-full resize-none rounded-xl border border-edge bg-surface px-3.5 py-3 text-sm outline-none placeholder:text-faint focus:border-brand/60" />
        </div>

        <div>
          <label className="text-[13px] font-semibold" htmlFor="gift-note">Interne Notiz <span className="font-normal text-faint">(sieht nur der Admin)</span></label>
          <input id="gift-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="z. B. Pilotkunde, Gewinnspiel, Partner" className={cn(input, "mt-2")} />
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-hi/[0.04] p-4">
          <span className={cn("relative h-6 w-11 shrink-0 rounded-full transition", notify ? "bg-lime" : "bg-hi/20")}>
            <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", notify ? "left-[22px]" : "left-0.5")} />
          </span>
          <input type="checkbox" className="sr-only" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
          <span className="text-sm"><b className="font-semibold">Geschenk-E-Mail senden</b><span className="block text-[12.5px] text-dim">Von info@qlickqr.com, im Qlick-Design.</span></span>
        </label>

        <button type="button" disabled={!valid || pending} onClick={submit} className="btn-cta inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-bold disabled:opacity-40">
          {pending ? <Loader2 className="size-4 animate-spin" /> : notify ? <Send className="size-4" /> : <Gift className="size-4" />}
          {notify ? "Verschenken und E-Mail senden" : "Verschenken"}
        </button>

        {result && (
          result.error
            ? <p className="rounded-xl bg-rose/10 px-4 py-3 text-sm font-semibold text-rose">{result.error}</p>
            : <p className="flex items-start gap-2.5 rounded-xl bg-lime/15 px-4 py-3 text-sm animate-rise">
                {result.status === "applied" ? <Check className="mt-0.5 size-4 shrink-0" /> : <Clock className="mt-0.5 size-4 shrink-0" />}
                <span>
                  <b className="font-semibold">{result.status === "applied" ? "Aktiviert." : "Wartet auf Registrierung."}</b>{" "}
                  {result.status === "applied" ? `${result.email} hat das Geschenk ab sofort.` : `Sobald sich ${result.email} registriert, ist das Geschenk aktiv.`}
                  {notify && (result.mailed ? " Die E-Mail ist raus." : " Die E-Mail konnte nicht gesendet werden.")}
                </span>
              </p>
        )}
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-3 text-[13px] font-semibold text-dim">So sieht es die Person</p>
        <div className="rounded-[28px] bg-[#f4f4f0] p-5 text-[#111]">
          <p className="text-[22px] font-extrabold leading-tight tracking-[-0.02em]">Ein Geschenk für dich</p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-[#3d3d3a]">Du bekommst <b>Qlick {PLANS[plan].label}</b> geschenkt.{email.trim() ? "" : " Gib links eine E-Mail ein."}</p>
          <div className={cn("mt-4 rounded-[20px] p-5 transition-colors duration-300", CARD[plan])}>
            <span className={cn("inline-block rounded-full px-2.5 py-1 text-[11px] font-bold", CHIP[plan])}>Geschenk</span>
            <p className="mt-3 text-[30px] font-extrabold leading-none tracking-[-0.03em]">Qlick {PLANS[plan].label}</p>
            <p className={cn("mt-1.5 text-[12.5px]", SUB[plan])}>Alle {PLANS[plan].label}-Funktionen, ohne Kosten.</p>
            <div className="mt-4 divide-y divide-current/15 text-[13px]">
              {[["Laufzeit", durLabel], ["Dynamische QR-Codes", codesLabel], ["Preis", "0,00 €"]].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 first:border-t first:border-current/15"><span className={SUB[plan]}>{k}</span><b>{v}</b></div>
              ))}
            </div>
          </div>
          {message.trim() && <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-[13px] italic leading-relaxed text-[#3d3d3a]">„{message.trim()}“</p>}
          <div className="mt-4 rounded-full bg-[#c8ff2e] py-3 text-center text-[13.5px] font-bold">Geschenk aktivieren</div>
        </div>
      </div>
    </div>
  );
}
