import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireAdmin, ACTION_LABEL, type AdminOverview, type AdminUser, type AuditRow } from "@/lib/admin";
import { CODE_TYPES } from "@/lib/codes/types";
import { Avatar, Bars, Kpi, PlanBadge, ProviderBadge, ago, nf } from "@/components/admin/bits";

export default async function AdminOverviewPage() {
  const { supabase } = await requireAdmin();
  const [{ data: o }, { data: users }, { data: log }] = await Promise.all([
    supabase.rpc("admin_overview"),
    supabase.rpc("admin_users", { p_limit: 6 } as never),
    supabase.rpc("admin_audit_log", { p_limit: 6 } as never),
  ]);
  const ov = (o ?? {}) as AdminOverview;
  const plans = ["free", "start", "pro", "business"];
  const totalUsers = Math.max(1, ov.users ?? 0);

  return (
    <div className="mt-8 animate-rise space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Nutzer" value={ov.users ?? 0} sub={`+${ov.users_7d ?? 0} diese Woche · +${ov.users_30d ?? 0} in 30 Tagen`} tone="lime" />
        <Kpi label="Aktiv in 7 Tagen" value={ov.active_7d ?? 0} sub="mindestens einmal angemeldet" />
        <Kpi label="Codes" value={ov.codes ?? 0} sub={`${nf.format(ov.codes_dynamic ?? 0)} dynamisch · ${nf.format(ov.codes_guest ?? 0)} von Gästen`} />
        <Kpi label="Scans heute" value={ov.scans_today ?? 0} sub={`${nf.format(ov.scans_7d ?? 0)} in 7 Tagen · ${nf.format(ov.scans_total ?? 0)} gesamt`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Bars values={ov.signups_series ?? []} label="Neue Nutzer, 30 Tage" />
        <Bars values={ov.scans_series ?? []} label="Scans, 30 Tage" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <p className="text-[13px] font-medium text-dim">Tarife</p>
          <div className="mt-4 space-y-3">
            {plans.map((p) => {
              const n = ov.plans?.[p] ?? 0;
              return (
                <div key={p}>
                  <div className="flex items-center justify-between text-sm"><PlanBadge plan={p} /><span className="font-semibold tabular-nums">{n}</span></div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-hi/[0.06]"><div className="h-full rounded-full bg-fg/70" style={{ width: `${(n / totalUsers) * 100}%` }} /></div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 border-t border-edge pt-4 text-sm">
            <span className="text-dim">Geschenkt</span><span className="text-right font-semibold">{ov.gifts ?? 0}</span>
            <span className="text-dim">Gesperrt</span><span className="text-right font-semibold text-rose">{ov.suspended ?? 0}</span>
            <span className="text-dim">Pausierte Codes</span><span className="text-right font-semibold">{ov.codes_paused ?? 0}</span>
            <span className="text-dim">Im Papierkorb</span><span className="text-right font-semibold">{ov.codes_trash ?? 0}</span>
          </div>
        </div>

        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-dim">Neueste Nutzer</p>
            <Link href="/admin/users" className="inline-flex items-center gap-1 text-[13px] font-semibold text-dim hover:text-fg">Alle <ArrowRight className="size-3.5" /></Link>
          </div>
          <div className="mt-3 divide-y divide-edge">
            {((users ?? []) as AdminUser[]).map((u) => (
              <Link key={u.id} href={`/admin/users/${u.id}`} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-hi/[0.04]">
                <Avatar name={u.full_name} email={u.email} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{u.full_name || u.email.split("@")[0]}</span>
                  <span className="block truncate text-[12.5px] text-faint">{u.email}</span>
                </span>
                <span className="hidden sm:block"><ProviderBadge provider={u.provider} /></span>
                <PlanBadge plan={u.effective_plan} gift={u.plan_source === "gift" && u.effective_plan !== "free"} />
                <span className="hidden w-28 text-right text-[12.5px] text-faint md:block">{ago(u.created_at)}</span>
              </Link>
            ))}
            {!users?.length && <p className="py-8 text-center text-sm text-dim">Noch keine Nutzer.</p>}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <p className="text-[13px] font-medium text-dim">Beliebteste Typen</p>
          <div className="mt-4 space-y-2.5">
            {(ov.types ?? []).slice(0, 7).map((t) => (
              <div key={t.type} className="flex items-center justify-between text-sm"><span>{CODE_TYPES[t.type as keyof typeof CODE_TYPES]?.label ?? t.type}</span><span className="font-semibold tabular-nums">{t.n}</span></div>
            ))}
          </div>
        </div>
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-dim">Letzte Aktionen</p>
            <Link href="/admin/log" className="inline-flex items-center gap-1 text-[13px] font-semibold text-dim hover:text-fg">Protokoll <ArrowRight className="size-3.5" /></Link>
          </div>
          <div className="mt-3 space-y-2">
            {((log ?? []) as AuditRow[]).map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl bg-hi/[0.03] px-3 py-2.5 text-sm">
                <span className="rounded-lg bg-hi/[0.07] px-2 py-0.5 text-[12px] font-semibold">{ACTION_LABEL[a.action] ?? a.action}</span>
                <span className="min-w-0 flex-1 truncate text-dim">{a.target_email ?? a.target_code ?? ""}</span>
                <span className="text-[12px] text-faint">{ago(a.created_at)}</span>
              </div>
            ))}
            {!log?.length && <p className="py-6 text-center text-sm text-dim">Noch keine Aktionen.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
