"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { submitCancellation, type CancelState } from "@/app/kuendigen/actions";
import { cn } from "@/lib/cn";

const input = "h-12 w-full rounded-xl border border-edge bg-surface px-4 text-[15px] outline-none placeholder:text-faint focus:border-brand/60";

export function CancelForm() {
  const [state, action, pending] = useActionState<CancelState, FormData>(submitCancellation, undefined);
  const [kind, setKind] = useState<"ordentlich" | "ausserordentlich">("ordentlich");
  const [when, setWhen] = useState<"next" | "date">("next");

  if (state?.done) {
    return (
      <div className="card p-8 animate-rise">
        <CheckCircle2 className="size-10 text-lime" strokeWidth={1.6} />
        <p className="mt-4 text-xl font-bold">Kündigung eingegangen</p>
        <p className="mt-2 text-sm text-dim">Eingang: {state.done.at}. Die Bestätigung ist unterwegs an <b className="text-fg">{state.done.email}</b>.</p>
        {state.done.until && <p className="mt-3 rounded-xl bg-hi/[0.05] px-4 py-3 text-sm">{state.done.plan} endet am <b>{state.done.until}</b>. Danach läuft dein Konto kostenlos weiter.</p>}
      </div>
    );
  }

  const chip = (on: boolean) => cn("flex-1 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition", on ? "border-lime bg-lime/10 ring-1 ring-lime/40" : "border-edge text-dim hover:text-fg");
  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="text-[13px] font-semibold">Vor- und Nachname</span><input name="name" required autoComplete="name" className={cn(input, "mt-2")} /></label>
        <label className="block"><span className="text-[13px] font-semibold">E-Mail deines Kontos</span><input name="email" type="email" required autoComplete="email" className={cn(input, "mt-2")} /></label>
      </div>
      <div>
        <p className="text-[13px] font-semibold">Art der Kündigung</p>
        <input type="hidden" name="kind" value={kind} />
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={() => setKind("ordentlich")} className={chip(kind === "ordentlich")}>Ordentlich<span className="block text-[12px] font-normal text-faint">zum Ende des Zeitraums</span></button>
          <button type="button" onClick={() => setKind("ausserordentlich")} className={chip(kind === "ausserordentlich")}>Außerordentlich<span className="block text-[12px] font-normal text-faint">aus wichtigem Grund</span></button>
        </div>
      </div>
      {kind === "ausserordentlich" && (
        <label className="block animate-rise"><span className="text-[13px] font-semibold">Grund</span><textarea name="reason" rows={3} required className="mt-2 w-full resize-none rounded-xl border border-edge bg-surface px-4 py-3 text-[15px] outline-none focus:border-brand/60" /></label>
      )}
      <div>
        <p className="text-[13px] font-semibold">Zeitpunkt</p>
        <input type="hidden" name="when" value={when} />
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={() => setWhen("next")} className={chip(when === "next")}>Nächstmöglicher Zeitpunkt</button>
          <button type="button" onClick={() => setWhen("date")} className={chip(when === "date")}>Zu einem Datum</button>
        </div>
        {when === "date" && <input type="date" name="date" required className={cn(input, "mt-2 animate-rise")} />}
      </div>
      {state?.error && <p className="rounded-xl border border-rose/30 bg-rose/10 px-4 py-3 text-sm text-rose">{state.error}</p>}
      <button type="submit" disabled={pending} className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-rose py-3.5 text-[16px] font-bold text-white transition hover:brightness-110 disabled:opacity-60">
        {pending && <Loader2 className="size-4 animate-spin" />} Jetzt kündigen
      </button>
      <p className="text-center text-[12.5px] text-faint">Mit Klick auf „Jetzt kündigen“ geht deine Kündigung verbindlich bei uns ein.</p>
    </form>
  );
}
