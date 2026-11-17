import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { requireAdmin, type AdminUser } from "@/lib/admin";
import { Avatar, PlanBadge, ProviderBadge, ago, df, nf } from "@/components/admin/bits";
import { cn } from "@/lib/cn";

const FILTERS = [
  ["all", "Alle"], ["paid", "Zahlend"], ["gift", "Geschenkt"], ["free", "Free"], ["suspended", "Gesperrt"], ["admin", "Admins"],
] as const;
const PAGE = 40;

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string; f?: string; p?: string }> }) {
  const { q = "", f = "all", p = "0" } = await searchParams;
  const page = Math.max(0, Number(p) || 0);
  const { supabase } = await requireAdmin();
  const { data } = await supabase.rpc("admin_users", { p_search: q.trim(), p_filter: f, p_limit: PAGE, p_offset: page * PAGE } as never);
  const users = (data ?? []) as AdminUser[];
  const total = users[0]?.total ?? 0;
  const href = (o: Record<string, string | number>) => {
    const sp = new URLSearchParams({ ...(q ? { q } : {}), ...(f !== "all" ? { f } : {}), ...Object.fromEntries(Object.entries(o).map(([k, v]) => [k, String(v)])) });
    return `/admin/users${sp.size ? `?${sp}` : ""}`;
  };

  return (
    <div className="mt-6 animate-rise">
      <div className="flex flex-wrap items-center gap-3">
        <form className="relative min-w-64 flex-1">
          {f !== "all" && <input type="hidden" name="f" value={f} />}
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <input name="q" defaultValue={q} placeholder="Name oder E-Mail suchen" className="h-11 w-full rounded-xl border border-edge bg-surface pl-11 pr-4 text-sm outline-none placeholder:text-faint focus:border-brand/60" />
        </form>
        <div className="flex flex-wrap gap-1">
          {FILTERS.map(([id, label]) => (
            <Link key={id} href={`/admin/users?${new URLSearchParams({ ...(q ? { q } : {}), ...(id !== "all" ? { f: id } : {}) })}`} className={cn("h-9 rounded-xl px-3.5 text-[13px] font-semibold leading-9 transition", f === id ? "bg-fg text-bg" : "text-dim hover:bg-hi/[0.06] hover:text-fg")}>{label}</Link>
          ))}
        </div>
      </div>

      <div className="card mt-5 overflow-hidden">
        <div className="hidden grid-cols-[minmax(0,2.2fr)_1fr_1.2fr_0.9fr_1fr_1fr] gap-4 border-b border-edge px-5 py-3 text-[12px] font-semibold text-faint lg:grid">
          <span>Nutzer</span><span>Anmeldung</span><span>Tarif</span><span>Codes</span><span>Registriert</span><span>Zuletzt da</span>
        </div>
        {users.map((u) => (
          <Link key={u.id} href={`/admin/users/${u.id}`} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 border-b border-edge px-5 py-3.5 transition last:border-0 hover:bg-hi/[0.03] lg:grid-cols-[minmax(0,2.2fr)_1fr_1.2fr_0.9fr_1fr_1fr]">
            <span className="flex min-w-0 items-center gap-3">
              <Avatar name={u.full_name} email={u.email} />
              <span className="min-w-0">
                <span className="flex items-center gap-2 truncate text-sm font-semibold">
                  {u.full_name || u.email.split("@")[0]}
                  {u.role === "admin" && <span className="rounded-md bg-lime px-1.5 py-px text-[10px] font-bold text-night">Admin</span>}
                  {u.suspended_at && <span className="rounded-md bg-rose px-1.5 py-px text-[10px] font-bold text-white">Gesperrt</span>}
                </span>
                <span className="block truncate text-[12.5px] text-faint">{u.email}{!u.email_confirmed && " · nicht bestätigt"}</span>
              </span>
            </span>
            <span className="hidden lg:block"><ProviderBadge provider={u.provider} /></span>
            <span><PlanBadge plan={u.effective_plan} gift={u.plan_source === "gift" && u.effective_plan !== "free"} until={u.plan_until} /></span>
            <span className="hidden text-sm tabular-nums lg:block">{u.codes} <span className="text-faint">· {nf.format(u.scans)} Scans</span></span>
            <span className="hidden text-[13px] text-dim lg:block">{df.format(new Date(u.created_at))}</span>
            <span className="hidden text-[13px] text-dim lg:block">{ago(u.last_sign_in_at)}</span>
          </Link>
        ))}
        {!users.length && <p className="px-5 py-16 text-center text-dim">Keine Nutzer gefunden.</p>}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-dim">
        <span>{nf.format(total)} Nutzer</span>
        <span className="flex gap-1">
          {page > 0 && <Link href={href({ p: page - 1 })} className="grid size-9 place-items-center rounded-xl border border-edge hover:text-fg"><ChevronLeft className="size-4" /></Link>}
          {(page + 1) * PAGE < total && <Link href={href({ p: page + 1 })} className="grid size-9 place-items-center rounded-xl border border-edge hover:text-fg"><ChevronRight className="size-4" /></Link>}
        </span>
      </div>
    </div>
  );
}
