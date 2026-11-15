import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { getSessionUser } from "@/lib/supabase/server";
import { getQuota } from "@/lib/codes/quota";
import { PLANS, euro, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Tarif" };

export default async function BillingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const quota = await getQuota(user.id);
  const pct = isFinite(quota.limit) ? Math.min(100, Math.round((quota.used / quota.limit) * 100)) : 0;

  return (
    <div className="animate-rise">
      <p className="text-sm text-dim">Konto</p>
      <h1 className="mt-1 font-display text-5xl leading-none">Dein Tarif</h1>

      <div className="card card-glow mt-8 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-dim">Aktueller Tarif</p>
            <p className="font-display text-5xl text-brand glow-text">{PLANS[quota.plan].label}</p>
          </div>
          <p className="text-sm text-dim">{quota.used} von {isFinite(quota.limit) ? quota.limit : "∞"} dynamischen Codes genutzt</p>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-hi/[0.06]">
          <div className={cn("h-full rounded-full", pct >= 100 ? "bg-rose" : "bg-brand shadow-[0_0_12px_rgb(var(--glow)/0.6)]")} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(Object.keys(PLANS) as PlanId[]).map((id) => {
          const p = PLANS[id];
          const current = id === quota.plan;
          return (
            <div key={id} className={cn("card flex flex-col p-6", current && "card-glow")}>
              <p className="font-display text-lg">{p.label}</p>
              <p className={cn("mt-3 font-display text-5xl", current && "text-brand")}>{euro(p.price)}<span className="font-sans text-sm font-normal text-dim"> / Monat</span></p>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-brand" /> {f}</li>
                ))}
              </ul>
              <button disabled className={cn("mt-6 h-11 rounded-xl text-xs font-bold", current ? "bg-brand/15 text-brand" : "border border-edge text-faint")}>
                {current ? "Aktueller Tarif" : "Online-Zahlung folgt"}
              </button>
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-sm text-dim">Egal welcher Tarif: Deine gedruckten Codes funktionieren für immer, auch nach einer Kündigung.</p>
    </div>
  );
}
