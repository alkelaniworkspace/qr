import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, Mail, QrCode, ScanLine } from "lucide-react";
import { requireAdmin, type AdminCode, type AdminUser } from "@/lib/admin";
import { Avatar, PlanBadge, ProviderBadge, ago, dtf, nf } from "@/components/admin/bits";
import { CodeTable } from "@/components/admin/code-table";
import { UserPanel } from "@/components/admin/user-panel";

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase, user: me } = await requireAdmin();
  const [{ data: rows }, { data: codes }, { data: trash }] = await Promise.all([
    supabase.rpc("admin_user", { p_user: id } as never),
    supabase.rpc("admin_codes", { p_filter: "all", p_user: id, p_limit: 200 } as never),
    supabase.rpc("admin_codes", { p_filter: "trash", p_user: id, p_limit: 200 } as never),
  ]);
  const u = (rows as AdminUser[] | null)?.[0];
  if (!u) notFound();
  const all = [...((codes ?? []) as AdminCode[]), ...((trash ?? []) as AdminCode[])];
  const gift = u.plan_source === "gift" && u.effective_plan !== "free";

  return (
    <div className="mt-6 animate-rise">
      <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm font-semibold text-dim hover:text-fg"><ArrowLeft className="size-4" /> Alle Nutzer</Link>
      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-6">
          <div className="card relative overflow-hidden p-6">
            <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-lime/10 blur-3xl" />
            <div className="relative flex flex-wrap items-center gap-4">
              <Avatar name={u.full_name} email={u.email} className="size-16 text-2xl" />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-display text-3xl leading-tight">
                  {u.full_name || u.email.split("@")[0]}
                  {u.role === "admin" && <span className="rounded-lg bg-lime px-2 py-0.5 font-sans text-[12px] font-bold text-night">Admin</span>}
                  {u.suspended_at && <span className="rounded-lg bg-rose px-2 py-0.5 font-sans text-[12px] font-bold text-white">Gesperrt</span>}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-dim"><Mail className="size-3.5" /> {u.email} <ProviderBadge provider={u.provider} />{!u.email_confirmed && <span className="text-gold">nicht bestätigt</span>}</p>
              </div>
              <PlanBadge plan={u.effective_plan} gift={gift} until={u.plan_until} />
            </div>
            <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                [CalendarDays, "Registriert", dtf.format(new Date(u.created_at))],
                [Clock, "Zuletzt angemeldet", ago(u.last_sign_in_at)],
                [QrCode, "Codes", `${u.codes} (${u.dynamic_codes}/${u.dynamic_limit ?? "∞"} dynamisch)`],
                [ScanLine, "Scans", nf.format(u.scans)],
              ].map(([I, k, v]) => {
                const Icon = I as typeof Clock;
                return (
                  <div key={k as string} className="rounded-2xl bg-hi/[0.04] p-3.5">
                    <p className="flex items-center gap-1.5 text-[12px] text-faint"><Icon className="size-3.5" /> {k as string}</p>
                    <p className="mt-1 text-sm font-semibold">{v as string}</p>
                  </div>
                );
              })}
            </div>
            {(gift || u.plan_note) && (
              <p className="relative mt-4 rounded-xl bg-gold/10 px-4 py-2.5 text-[13px]">
                {gift && <>Geschenkter Tarif <b className="capitalize">{u.plan}</b>{u.plan_until ? ` bis ${dtf.format(new Date(u.plan_until))}` : ", unbegrenzt"}. </>}
                {u.plan_note && <span className="text-dim">Notiz: {u.plan_note}</span>}
              </p>
            )}
          </div>

          <div>
            <p className="mb-3 text-[15px] font-semibold">Codes von diesem Nutzer <span className="text-faint">· {all.length}</span></p>
            <CodeTable codes={all} showOwner={false} />
          </div>
        </div>
        <UserPanel id={u.id} self={u.id === me.id} role={u.role} suspended={!!u.suspended_at} suspendedReason={u.suspended_reason} plan={u.plan} effectivePlan={u.effective_plan} gift={gift} codeLimit={u.code_limit ?? null} used={u.dynamic_codes} />
      </div>
    </div>
  );
}
