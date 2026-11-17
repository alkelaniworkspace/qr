import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { requireAdmin, type AdminCode } from "@/lib/admin";
import { nf } from "@/components/admin/bits";
import { CodeTable } from "@/components/admin/code-table";
import { cn } from "@/lib/cn";

const FILTERS = [
  ["all", "Alle"], ["dynamic", "Dynamisch"], ["paused", "Pausiert"], ["locked", "Gesperrt"], ["archived", "Archiv"], ["guest", "Gäste"], ["trash", "Papierkorb"],
] as const;
const PAGE = 50;

export default async function AdminCodesPage({ searchParams }: { searchParams: Promise<{ q?: string; f?: string; p?: string }> }) {
  const { q = "", f = "all", p = "0" } = await searchParams;
  const page = Math.max(0, Number(p) || 0);
  const { supabase } = await requireAdmin();
  const { data } = await supabase.rpc("admin_codes", { p_search: q.trim(), p_filter: f, p_limit: PAGE, p_offset: page * PAGE } as never);
  const codes = (data ?? []) as AdminCode[];
  const total = codes[0]?.total ?? 0;
  const qs = (o: Record<string, string>) => { const sp = new URLSearchParams(o); return `/admin/codes${sp.size ? `?${sp}` : ""}`; };
  const base = { ...(q ? { q } : {}), ...(f !== "all" ? { f } : {}) };

  return (
    <div className="mt-6 animate-rise">
      <div className="flex flex-wrap items-center gap-3">
        <form className="relative min-w-64 flex-1">
          {f !== "all" && <input type="hidden" name="f" value={f} />}
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <input name="q" defaultValue={q} placeholder="Name, Kurzlink oder E-Mail suchen" className="h-11 w-full rounded-xl border border-edge bg-surface pl-11 pr-4 text-sm outline-none placeholder:text-faint focus:border-brand/60" />
        </form>
        <div className="flex flex-wrap gap-1">
          {FILTERS.map(([id, label]) => (
            <Link key={id} href={qs({ ...(q ? { q } : {}), ...(id !== "all" ? { f: id } : {}) })} className={cn("h-9 rounded-xl px-3.5 text-[13px] font-semibold leading-9 transition", f === id ? "bg-fg text-bg" : "text-dim hover:bg-hi/[0.06] hover:text-fg")}>{label}</Link>
          ))}
        </div>
      </div>
      {f === "trash" && <p className="mt-4 rounded-2xl bg-rose/[0.07] px-4 py-3 text-[13px] text-dim">Gelöschte Codes bleiben 30 Tage hier und werden danach automatisch endgültig entfernt. Bis dahin kannst du sie wiederherstellen.</p>}
      {f === "locked" && <p className="mt-4 rounded-2xl bg-hi/[0.04] px-4 py-3 text-[13px] text-dim">Gesperrte Codes zeigen Besuchern eine Pause-Seite. Nur Admins können die Sperre aufheben.</p>}
      <div className="mt-5"><CodeTable codes={codes} /></div>
      <div className="mt-4 flex items-center justify-between text-sm text-dim">
        <span>{nf.format(total)} Codes</span>
        <span className="flex gap-1">
          {page > 0 && <Link href={qs({ ...base, p: String(page - 1) })} className="grid size-9 place-items-center rounded-xl border border-edge hover:text-fg"><ChevronLeft className="size-4" /></Link>}
          {(page + 1) * PAGE < total && <Link href={qs({ ...base, p: String(page + 1) })} className="grid size-9 place-items-center rounded-xl border border-edge hover:text-fg"><ChevronRight className="size-4" /></Link>}
        </span>
      </div>
    </div>
  );
}
