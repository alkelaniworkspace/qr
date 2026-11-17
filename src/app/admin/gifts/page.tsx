import { requireAdmin, type AdminGrant } from "@/lib/admin";
import { GiftForm } from "@/components/admin/gift-form";
import { GrantRevoke } from "@/components/admin/grant-revoke";
import { PlanBadge, ago, dtf } from "@/components/admin/bits";

export default async function AdminGiftsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.rpc("admin_grants");
  const grants = (data ?? []) as AdminGrant[];
  return (
    <div className="mt-6 animate-rise space-y-10">
      <div>
        <h2 className="text-xl font-bold">Tarif verschenken</h2>
        <p className="mt-1 text-sm text-dim">An jede E-Mail-Adresse, auch an Personen ohne Konto.</p>
        <div className="mt-5"><GiftForm /></div>
      </div>

      <div>
        <h2 className="text-xl font-bold">Offene Geschenke <span className="text-faint">· {grants.length}</span></h2>
        <p className="mt-1 text-sm text-dim">Diese Personen haben noch kein Konto. Das Geschenk wird aktiv, sobald sie sich registrieren.</p>
        <div className="card mt-5 overflow-hidden">
          {grants.map((g) => (
            <div key={g.id} className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-edge px-5 py-3.5 last:border-0">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{g.email}</p>
                <p className="text-[12.5px] text-faint">
                  {g.until ? `bis ${dtf.format(new Date(g.until))}` : g.months ? `${g.months} ${g.months === 1 ? "Monat" : "Monate"} ab Registrierung` : "unbegrenzt"}
                  {" · "}{g.code_limit === -1 ? "unbegrenzt Codes" : g.code_limit !== null ? `${g.code_limit} Codes` : "Codes wie im Tarif"}
                  {g.note && ` · ${g.note}`}
                </p>
              </div>
              <PlanBadge plan={g.plan} gift />
              <span className="text-[12.5px] text-faint">{ago(g.created_at)}</span>
              <GrantRevoke id={g.id} />
            </div>
          ))}
          {!grants.length && <p className="px-5 py-12 text-center text-sm text-dim">Keine offenen Geschenke.</p>}
        </div>
      </div>
    </div>
  );
}
