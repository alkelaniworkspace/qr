"use client";

import { useState, useTransition } from "react";
import { CreditCard, Loader2, RotateCcw, X } from "lucide-react";
import { openPortal, setCancel } from "@/app/dashboard/billing/actions";
import { cn } from "@/lib/cn";

export function PortalButton({ label = "Zahlungsdaten verwalten", className }: { label?: string; className?: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col gap-2">
      <button type="button" disabled={pending} onClick={() => start(async () => { const r = await openPortal(); if (r.url) window.location.assign(r.url); else setErr(r.error ?? null); })}
        className={cn("inline-flex h-11 items-center gap-2 rounded-xl border border-edge-strong px-4 text-sm font-semibold transition hover:bg-hi/[0.06]", className)}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />} {label}
      </button>
      {err && <span className="text-[12.5px] text-rose">{err}</span>}
    </span>
  );
}

export function CancelSubscription({ planLabel, endsAt, canceled }: { planLabel: string; endsAt: string | null; canceled: boolean }) {
  const [ask, setAsk] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const run = (cancel: boolean) => start(async () => { const r = await setCancel(cancel); if (r.error) setErr(r.error); else setAsk(false); });

  if (canceled) {
    return (
      <button type="button" disabled={pending} onClick={() => run(false)} className="btn-cta inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-bold">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />} Abo fortsetzen
      </button>
    );
  }
  return (
    <div>
      {!ask ? (
        <button type="button" onClick={() => setAsk(true)} className="text-sm font-semibold text-dim underline-offset-4 hover:text-rose hover:underline">Abo kündigen</button>
      ) : (
        <div className="rounded-2xl border border-rose/30 bg-rose/[0.06] p-5 animate-rise">
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold">Wirklich kündigen?</p>
            <button type="button" onClick={() => setAsk(false)} aria-label="Schließen" className="text-dim hover:text-fg"><X className="size-4" /></button>
          </div>
          <ul className="mt-2 space-y-1 text-sm text-dim">
            <li>• {planLabel} läuft weiter bis {endsAt ?? "zum Ende des Zeitraums"}. Bis dahin ändert sich nichts.</li>
            <li>• Danach wechselt dein Konto in den Free-Tarif. Es wird nichts mehr abgebucht.</li>
            <li>• Deine Codes bleiben erhalten. Dynamische Codes über dem Free-Limit kannst du nicht mehr neu anlegen.</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => setAsk(false)} className="btn-cta inline-flex h-10 items-center rounded-xl px-4 text-sm font-bold">{planLabel} behalten</button>
            <button type="button" disabled={pending} onClick={() => run(true)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose/40 px-4 text-sm font-semibold text-rose hover:bg-rose/10">
              {pending && <Loader2 className="size-4 animate-spin" />} Zum Ende kündigen
            </button>
          </div>
        </div>
      )}
      {err && <p className="mt-2 text-[12.5px] text-rose">{err}</p>}
    </div>
  );
}
