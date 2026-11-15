import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CODE_TYPES, TYPE_ORDER, getType } from "@/lib/codes/types";
import type { QrCodeRow } from "@/lib/codes/model";
import { CodeCard } from "@/components/dashboard/code-card";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Meine Codes" };

const select = "h-11 rounded-xl border border-edge bg-surface px-4 text-sm font-semibold text-fg outline-none focus:border-brand/60";

export default async function CodesPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; status?: string }> }) {
  const { q = "", type = "", status = "" } = await searchParams;
  const supabase = await createClient();
  let query = supabase
    .from("qr_codes")
    .select("id, name, slug, type, mode, content, style, status, scan_count, created_at")
    .order("created_at", { ascending: false })
    .limit(300);
  if (q) query = query.ilike("name", `%${q.replace(/[%_]/g, "")}%`);
  if (type && getType(type)) query = query.eq("type", type);
  if (status === "active" || status === "paused") query = query.eq("status", status);
  if (status === "dynamic" || status === "static") query = query.eq("mode", status);
  const { data } = await query;
  const codes = (data ?? []) as QrCodeRow[];
  const filtered = Boolean(q || type || status);

  return (
    <div className="animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-dim">Übersicht</p>
          <h1 className="mt-1 font-display text-5xl leading-none">Meine Codes</h1>
        </div>
        <ButtonLink href="/dashboard/new"><Plus className="size-4" /> Neuer Code</ButtonLink>
      </div>

      <form className="mt-8 flex flex-wrap items-center gap-2">
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
        {filtered && <Link href="/dashboard/codes" className="px-2 text-sm text-dim hover:text-fg">Zurücksetzen</Link>}
      </form>

      {codes.length === 0 ? (
        <div className="card mt-6 px-6 py-16 text-center">
          <p className="font-display text-3xl">{filtered ? "Nichts gefunden" : "Noch keine Codes"}</p>
          <p className="mt-2 text-dim">{filtered ? "Ändere die Filter oder suche nach einem anderen Namen." : "Erstelle deinen ersten Code in zwei Minuten."}</p>
          {!filtered && <ButtonLink href="/dashboard/new" className="mt-6"><Plus className="size-4" /> Code erstellen</ButtonLink>}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {codes.map((c) => <CodeCard key={c.id} code={c} />)}
        </div>
      )}
    </div>
  );
}
