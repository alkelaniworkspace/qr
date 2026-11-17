import { requireAdmin, ACTION_LABEL, type AuditRow } from "@/lib/admin";
import { dtf } from "@/components/admin/bits";
import { cn } from "@/lib/cn";

function tone(a: string) {
  if (a.includes("suspend") && !a.includes("unsuspend")) return "bg-rose";
  if (a === "code.lock" || a === "code.purge" || a === "code.trash") return "bg-rose";
  if (a.startsWith("plan.gift")) return "bg-lime";
  if (a === "code.pause") return "bg-gold";
  return "bg-hi/30";
}

function detail(d: Record<string, unknown>) {
  const out: string[] = [];
  if (d.plan) out.push(`Tarif ${String(d.plan)}`);
  if (d.until) out.push(`bis ${dtf.format(new Date(String(d.until)))}`);
  if (d.reason) out.push(`Grund: ${String(d.reason)}`);
  if (d.note) out.push(`Notiz: ${String(d.note)}`);
  if (d.role) out.push(`Rolle ${String(d.role)}`);
  return out.join(" · ");
}

export default async function AdminLogPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.rpc("admin_audit_log", { p_limit: 300 } as never);
  const rows = (data ?? []) as AuditRow[];
  return (
    <div className="mt-6 animate-rise">
      <p className="text-sm text-dim">Jede Admin-Aktion wird hier festgehalten: wer, was, wann.</p>
      <div className="card mt-5 overflow-hidden">
        {rows.map((r) => (
          <div key={r.id} className="flex items-start gap-4 border-b border-edge px-5 py-3.5 last:border-0">
            <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", tone(r.action))} />
            <div className="min-w-0 flex-1">
              <p className="text-sm"><b className="font-semibold">{ACTION_LABEL[r.action] ?? r.action}</b>{(r.target_code || r.target_email) && <span className="text-dim"> · {r.target_code ?? r.target_email}</span>}</p>
              {detail(r.details ?? {}) && <p className="mt-0.5 text-[12.5px] text-dim">{detail(r.details ?? {})}</p>}
            </div>
            <div className="shrink-0 text-right text-[12px] text-faint">
              <p>{dtf.format(new Date(r.created_at))}</p>
              <p>{r.admin_email}</p>
            </div>
          </div>
        ))}
        {!rows.length && <p className="px-5 py-16 text-center text-dim">Noch keine Aktionen.</p>}
      </div>
    </div>
  );
}
