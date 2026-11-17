"use client";

import { useState, useTransition } from "react";
import { Ban, Check, Crown, Gift, Loader2, RotateCcw, ShieldCheck, ShieldOff } from "lucide-react";
import { giftPlan, setRole, suspendUser } from "@/app/admin/actions";
import { cn } from "@/lib/cn";

const PLANS = [
  { id: "start", label: "Start", hint: "15 dynamische Codes" },
  { id: "pro", label: "Pro", hint: "50 dynamische Codes" },
  { id: "business", label: "Business", hint: "150 dynamische Codes" },
];
const DURATIONS = [
  { id: "1m", label: "1 Monat", months: 1 },
  { id: "3m", label: "3 Monate", months: 3 },
  { id: "6m", label: "6 Monate", months: 6 },
  { id: "12m", label: "1 Jahr", months: 12 },
  { id: "forever", label: "Unbegrenzt", months: 0 },
  { id: "date", label: "Bis Datum", months: -1 },
];

function addMonths(m: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + m);
  d.setHours(23, 59, 59, 0);
  return d.toISOString();
}

export function UserPanel({ id, self, role, suspended, suspendedReason, plan, gift }: {
  id: string; self: boolean; role: "user" | "admin"; suspended: boolean; suspendedReason: string | null; plan: string; gift: boolean;
}) {
  const [pick, setPick] = useState("pro");
  const [dur, setDur] = useState("1m");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<string | null>, ok: string) => start(async () => {
    const err = await fn();
    setMsg(err ? { ok: false, text: err } : { ok: true, text: ok });
  });
  const until = () => {
    const d = DURATIONS.find((x) => x.id === dur)!;
    if (d.months === 0) return null;
    if (d.months === -1) return date ? new Date(`${date}T23:59:59`).toISOString() : null;
    return addMonths(d.months);
  };
  const chip = (on: boolean) => cn("rounded-xl border px-3 py-2 text-left text-[13px] font-semibold transition", on ? "border-lime bg-lime/10 text-fg ring-1 ring-lime/40" : "border-edge text-dim hover:border-edge-strong hover:text-fg");

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <p className="flex items-center gap-2 text-[15px] font-semibold"><Gift className="size-4 text-lime" /> Tarif verschenken</p>
        <p className="mt-1 text-[13px] text-dim">Gilt sofort. Nach Ablauf fällt das Konto automatisch auf Free zurück, die Codes bleiben erhalten.</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {PLANS.map((p) => (
            <button key={p.id} type="button" onClick={() => setPick(p.id)} className={chip(pick === p.id)}>
              <span className="block">{p.label}</span><span className="block text-[11px] font-medium text-faint">{p.hint}</span>
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {DURATIONS.map((d) => <button key={d.id} type="button" onClick={() => setDur(d.id)} className={cn(chip(dur === d.id), "py-1.5")}>{d.label}</button>)}
        </div>
        {dur === "date" && <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-3 h-11 w-full rounded-xl border border-edge bg-surface px-3 text-sm outline-none focus:border-brand/60" />}
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Notiz (nur intern), z. B. Pilotkunde, Freund, Gewinnspiel" className="mt-3 h-11 w-full rounded-xl border border-edge bg-surface px-3 text-sm outline-none placeholder:text-faint focus:border-brand/60" />
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={pending || (dur === "date" && !date)} onClick={() => run(() => giftPlan(id, pick, until(), note), "Tarif verschenkt.")} className="btn-cta inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-bold disabled:opacity-50">
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Crown className="size-4" />} Verschenken
          </button>
          {(plan !== "free" || gift) && (
            <button type="button" disabled={pending} onClick={() => run(() => giftPlan(id, "free", null, ""), "Auf Free zurückgesetzt.")} className="inline-flex h-11 items-center gap-2 rounded-xl border border-edge px-4 text-sm font-semibold text-dim hover:text-fg">
              <RotateCcw className="size-4" /> Auf Free setzen
            </button>
          )}
        </div>
      </div>

      <div className="card p-5">
        <p className="flex items-center gap-2 text-[15px] font-semibold"><Ban className="size-4 text-rose" /> Konto sperren</p>
        <p className="mt-1 text-[13px] text-dim">Gesperrt: keine neuen Codes, alle Codes zeigen eine Pause-Seite. Nichts wird gelöscht.</p>
        {suspended ? (
          <>
            <p className="mt-3 rounded-xl bg-rose/10 px-3 py-2 text-[13px] text-rose">Gesperrt{suspendedReason ? `: ${suspendedReason}` : ""}</p>
            <button type="button" disabled={pending} onClick={() => run(() => suspendUser(id, false, ""), "Konto entsperrt.")} className="mt-3 inline-flex h-11 items-center gap-2 rounded-xl bg-fg px-5 text-sm font-bold text-bg">
              <Check className="size-4" /> Entsperren
            </button>
          </>
        ) : (
          <>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Grund (sieht der Nutzer)" className="mt-3 h-11 w-full rounded-xl border border-edge bg-surface px-3 text-sm outline-none placeholder:text-faint focus:border-brand/60" disabled={self} />
            <button type="button" disabled={pending || self} onClick={() => run(() => suspendUser(id, true, reason), "Konto gesperrt.")} className="mt-3 inline-flex h-11 items-center gap-2 rounded-xl bg-rose px-5 text-sm font-bold text-white disabled:opacity-40">
              <Ban className="size-4" /> Sperren
            </button>
          </>
        )}
      </div>

      <div className="card p-5">
        <p className="flex items-center gap-2 text-[15px] font-semibold"><ShieldCheck className="size-4" /> Rolle</p>
        <p className="mt-1 text-[13px] text-dim">Admins sehen diese Verwaltung und können alles ändern.</p>
        <button type="button" disabled={pending || self} onClick={() => run(() => setRole(id, role === "admin" ? "user" : "admin"), role === "admin" ? "Admin-Rechte entfernt." : "Ist jetzt Admin.")} className="mt-3 inline-flex h-11 items-center gap-2 rounded-xl border border-edge px-4 text-sm font-semibold disabled:opacity-40">
          {role === "admin" ? <><ShieldOff className="size-4" /> Admin-Rechte entfernen</> : <><ShieldCheck className="size-4" /> Zum Admin machen</>}
        </button>
      </div>

      {msg && <p className={cn("rounded-xl px-4 py-3 text-sm font-semibold", msg.ok ? "bg-lime/15 text-fg" : "bg-rose/10 text-rose")}>{msg.text}</p>}
    </div>
  );
}
