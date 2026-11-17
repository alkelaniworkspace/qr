import type { Metadata } from "next";
import Link from "next/link";
import { Archive, FolderOpen, Plus, Search, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CODE_TYPES, TYPE_ORDER, getType } from "@/lib/codes/types";
import type { QrCodeRow } from "@/lib/codes/model";
import { CodeCard } from "@/components/dashboard/code-card";
import type { CodeView } from "@/components/dashboard/code-actions";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Meine Codes" };

const select = "h-11 rounded-xl border border-edge bg-surface px-4 text-sm font-semibold text-fg outline-none focus:border-brand/60";
const VIEWS: { id: CodeView; label: string; icon: typeof Archive }[] = [
  { id: "active", label: "Aktiv", icon: FolderOpen },
  { id: "archived", label: "Archiv", icon: Archive },
  { id: "trash", label: "Papierkorb", icon: Trash2 },
];

export default async function CodesPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; status?: string; view?: string }> }) {
  const { q = "", type = "", status = "", view: rawView = "active" } = await searchParams;
  const view: CodeView = rawView === "archived" || rawView === "trash" ? rawView : "active";
  const supabase = await createClient();
  let query = supabase
    .from("qr_codes")
    .select("id, name, slug, type, mode, content, style, status, scan_count, created_at, deleted_at, locked_at")
    .order(view === "trash" ? "deleted_at" : "created_at", { ascending: false })
    .limit(300);
  if (view === "trash") query = query.not("deleted_at", "is", null);
  else if (view === "archived") query = query.is("deleted_at", null).not("archived_at", "is", null);
  else query = query.is("deleted_at", null).is("archived_at", null);
  if (q) query = query.ilike("name", `%${q.replace(/[%_]/g, "")}%`);
  if (type && getType(type)) query = query.eq("type", type);
  if (status === "active" || status === "paused") query = query.eq("status", status);
  if (status === "dynamic" || status === "static") query = query.eq("mode", status);

  const count = (f: (b: ReturnType<typeof base>) => ReturnType<typeof base>) => f(base());
  const base = () => supabase.from("qr_codes").select("id", { count: "exact", head: true });
  const [{ data }, a, ar, tr] = await Promise.all([
    query,
    count((b) => b.is("deleted_at", null).is("archived_at", null)),
    count((b) => b.is("deleted_at", null).not("archived_at", "is", null)),
    count((b) => b.not("deleted_at", "is", null)),
  ]);
  const counts: Record<CodeView, number> = { active: a.count ?? 0, archived: ar.count ?? 0, trash: tr.count ?? 0 };
  const codes = (data ?? []) as QrCodeRow[];
  const filtered = Boolean(q || type || status);

  return (
    <div className="animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-dim">Übersicht</p>
          <h1 className="mt-1 font-display text-5xl leading-none">Meine Codes</h1>
        </div>
        <ButtonLink href="/studio"><Plus className="size-4" /> Neuer Code</ButtonLink>
      </div>

      <nav className="mt-8 inline-flex flex-wrap gap-1 rounded-2xl border border-edge bg-surface p-1">
        {VIEWS.map((v) => (
          <Link key={v.id} href={v.id === "active" ? "/dashboard/codes" : `/dashboard/codes?view=${v.id}`}
            className={cn("inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition", view === v.id ? "bg-fg text-bg" : "text-dim hover:text-fg")}>
            <v.icon className="size-4" /> {v.label}
            <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", view === v.id ? "bg-bg/15" : "bg-hi/[0.07]")}>{counts[v.id]}</span>
          </Link>
        ))}
      </nav>

      {view === "trash" && (
        <p className="mt-4 max-w-2xl text-sm text-dim">Codes im Papierkorb funktionieren nicht mehr. Du kannst sie 30 Tage lang wiederherstellen, danach werden sie mit ihrer Statistik endgültig gelöscht.</p>
      )}
      {view === "archived" && (
        <p className="mt-4 max-w-2xl text-sm text-dim">Archivierte Codes funktionieren weiter, sie sind nur aus deiner Hauptliste raus. Praktisch für alte Aktionen und Events.</p>
      )}

      <form className="mt-5 flex flex-wrap items-center gap-2">
        {view !== "active" && <input type="hidden" name="view" value={view} />}
        <label className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <input name="q" defaultValue={q} placeholder="Codes durchsuchen" className="h-11 w-full rounded-xl border border-edge bg-surface pl-11 pr-4 text-sm text-fg outline-none placeholder:text-faint focus:border-brand/60" />
        </label>
        <select name="type" defaultValue={type} className={select} aria-label="Typ">
          <option value="">Alle Typen</option>
          {TYPE_ORDER.map((t) => <option key={t} value={t}>{CODE_TYPES[t].label}</option>)}
        </select>
        <select name="status" defaultValue={status} className={select} aria-label="Status">
          <option value="">Alle</option>
          <option value="dynamic">Dynamisch</option>
          <option value="static">Statisch</option>
          <option value="active">Aktiv</option>
          <option value="paused">Pausiert</option>
        </select>
        <button className="h-11 rounded-xl bg-hi/[0.07] px-5 text-sm font-bold transition hover:bg-brand hover:text-on-brand">Filtern</button>
        {filtered && <Link href={view === "active" ? "/dashboard/codes" : `/dashboard/codes?view=${view}`} className="px-2 text-sm text-dim hover:text-fg">Zurücksetzen</Link>}
      </form>

      {codes.length === 0 ? (
        <div className="card mt-6 px-6 py-16 text-center">
          <p className="font-display text-3xl">{filtered ? "Nichts gefunden" : view === "trash" ? "Papierkorb ist leer" : view === "archived" ? "Archiv ist leer" : "Noch keine Codes"}</p>
          <p className="mt-2 text-dim">{filtered ? "Ändere die Filter oder suche nach einem anderen Namen." : view === "active" ? "Erstelle deinen ersten Code in zwei Minuten." : "Hier ist gerade nichts."}</p>
          {!filtered && view === "active" && <ButtonLink href="/studio" className="mt-6"><Plus className="size-4" /> Code erstellen</ButtonLink>}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {codes.map((c) => <CodeCard key={c.id} code={c} view={view} />)}
        </div>
      )}
    </div>
  );
}
