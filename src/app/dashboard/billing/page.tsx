import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { getSessionUser } from "@/lib/supabase/server";
import { getQuota } from "@/lib/codes/quota";
import { PLANS, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Tarif" };

export default async function BillingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const quota = await getQuota(user.id);
  const pct = Math.min(100, Math.round((quota.used / quota.limit) * 100));

  return (
    <div className="animate-rise">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Konto</p>
      <h1 className="mt-1 font-display text-5xl">Dein Tarif</h1>

      <div className="mt-8 rounded-3xl border border-line bg-white p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted">Aktueller Tarif</p>
            <p className="font-display text-4xl">{PLANS[quota.plan].label}</p>
          </div>
          <p className="text-sm text-muted">{quota.used} von {quota.limit} dynamischen Codes genutzt</p>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-sand">
          <div className={cn("h-full rounded-full", pct >= 100 ? "bg-danger" : "bg-gold")} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(Object.keys(PLANS) as PlanId[]).map((id) => {
          const p = PLANS[id];
          const current = id === quota.plan;
          return (
            <div key={id} className={cn("flex flex-col rounded-3xl border p-6", current ? "border-ink bg-ink text-paper" : "border-line bg-white")}>
              <p className="text-sm font-medium">{p.label}</p>
              <p className="mt-3 font-display text-5xl">{p.price} €<span className="font-sans text-sm opacity-60"> / Monat</span></p>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2"><Check className={cn("mt-0.5 size-4 shrink-0", current ? "text-gold-soft" : "text-gold")} /> {f}</li>
                ))}
              </ul>
              <button disabled className={cn("mt-6 h-11 rounded-full text-sm font-medium", current ? "bg-white/10 text-paper/70" : "border border-line text-muted")}>
                {current ? "Aktueller Tarif" : "Online-Zahlung folgt"}
              </button>
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-sm text-muted">Egal welcher Tarif: Deine gedruckten Codes funktionieren für immer, auch nach einer Kündigung.</p>
    </div>
  );
}
