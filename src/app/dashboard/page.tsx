import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Plus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CODE_TYPES, TYPE_ORDER, getType } from "@/lib/codes/types";
import { qrData } from "@/lib/codes/payload";
import type { QrCodeRow } from "@/lib/codes/model";
import { renderQrSvg } from "@/lib/qr/render";
import { normalizeStyle } from "@/lib/qr/style";
import { CodeActions } from "@/components/dashboard/code-actions";
import { TypeIcon } from "@/components/type-icon";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Meine Codes" };

const nf = new Intl.NumberFormat("de-DE");
const df = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short", year: "numeric" });

interface Summary { codes: number; dynamic: number; scans_total: number; scans_7d: number; scans_prev_7d: number }

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; status?: string }> }) {
  const { q = "", type = "", status = "" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("qr_codes")
    .select("id, name, slug, type, mode, content, style, status, scan_count, last_scanned_at, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (q) query = query.ilike("name", `%${q.replace(/[%_]/g, "")}%`);
  if (type && getType(type)) query = query.eq("type", type);
  if (status === "active" || status === "paused") query = query.eq("status", status);

  const [{ data: codes }, { data: summaryRaw }] = await Promise.all([query, supabase.rpc("dashboard_summary")]);
  const list = (codes ?? []) as QrCodeRow[];
  const summary = (summaryRaw ?? { codes: 0, dynamic: 0, scans_total: 0, scans_7d: 0, scans_prev_7d: 0 }) as Summary;
  const trend = summary.scans_prev_7d ? Math.round(((summary.scans_7d - summary.scans_prev_7d) / summary.scans_prev_7d) * 100) : null;
  const filtered = Boolean(q || type || status);

  return (
    <div className="animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Übersicht</p>
          <h1 className="mt-1 font-display text-5xl">Meine Codes</h1>
        </div>
        <ButtonLink href="/dashboard/new" variant="gold" size="lg"><Plus className="size-4" /> Neuer Code</ButtonLink>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Codes" value={nf.format(summary.codes)} sub={`${summary.dynamic} dynamisch`} />
        <Stat label="Scans gesamt" value={nf.format(summary.scans_total)} />
        <Stat
          label="Scans 7 Tage"
          value={nf.format(summary.scans_7d)}
          sub={
            trend === null ? "Noch kein Vergleich" : (
              <span className={cn("inline-flex items-center gap-0.5", trend >= 0 ? "text-success" : "text-danger")}>
                {trend >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                {Math.abs(trend)} % zur Vorwoche
              </span>
            )
          }
        />
        <Stat label="Versprechen" value="∞" sub="Codes laufen für immer" dark />
      </div>

      {(summary.codes > 0 || filtered) && (
        <form className="mt-10 flex flex-wrap items-center gap-2">
          <label className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input name="q" defaultValue={q} placeholder="Codes durchsuchen …" className="h-10 w-full rounded-full border border-line bg-white pl-10 pr-4 text-sm outline-none focus:border-ink/40" />
          </label>
          <select name="type" defaultValue={type} className="h-10 rounded-full border border-line bg-white px-4 text-sm">
            <option value="">Alle Typen</option>
            {TYPE_ORDER.map((t) => <option key={t} value={t}>{CODE_TYPES[t].label}</option>)}
          </select>
          <select name="status" defaultValue={status} className="h-10 rounded-full border border-line bg-white px-4 text-sm">
            <option value="">Alle Status</option>
            <option value="active">Aktiv</option>
            <option value="paused">Pausiert</option>
          </select>
          <button className="h-10 rounded-full bg-ink px-5 text-sm text-paper">Filtern</button>
          {filtered && <Link href="/dashboard" className="px-2 text-sm text-muted hover:text-ink">Zurücksetzen</Link>}
        </form>
      )}

      {list.length === 0 ? (
        filtered ? (
          <p className="mt-16 text-center text-muted">Keine Codes gefunden.</p>
        ) : (
          <EmptyState />
        )
      ) : (
        <ul className="mt-6 space-y-3">
          {list.map((code) => {
            const def = CODE_TYPES[code.type];
            const svg = renderQrSvg(qrData(code), normalizeStyle(code.style), { size: 640, id: `c-${code.slug}` });
            const dynamic = code.mode === "dynamic";
            return (
              <li key={code.id} className="group flex flex-col gap-4 rounded-3xl border border-line bg-white p-4 transition hover:shadow-soft sm:flex-row sm:items-center sm:p-5">
                <Link href={dynamic ? `/dashboard/codes/${code.id}` : `/dashboard/codes/${code.id}/edit`} className="flex min-w-0 flex-1 items-center gap-5">
                  <span className="grid size-24 shrink-0 place-items-center rounded-2xl bg-sand/70 p-2.5 [&>svg]:h-auto [&>svg]:max-h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 text-xs text-muted">
                      <TypeIcon name={def.icon} className="size-3.5" /> {def.label}
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", dynamic ? "bg-gold-soft/30 text-gold" : "bg-sand text-muted")}>
                        {dynamic ? "Dynamisch" : "Statisch"}
                      </span>
                      {code.status === "paused" && <span className="rounded-full bg-warn/10 px-2 py-0.5 text-[11px] font-medium text-warn">Pausiert</span>}
                    </span>
                    <span className="mt-1 block truncate text-lg font-medium group-hover:underline group-hover:underline-offset-4">{code.name}</span>
                    <span className="mt-0.5 block text-xs text-muted">Erstellt am {df.format(new Date(code.created_at))}</span>
                  </span>
                </Link>
                <div className="flex items-center justify-between gap-6 sm:justify-end">
                  {dynamic && (
                    <div className="text-right">
                      <p className="font-display text-3xl leading-none tabular-nums">{nf.format(code.scan_count)}</p>
                      <p className="mt-1 text-xs text-muted">Scans</p>
                    </div>
                  )}
                  <CodeActions id={code.id} name={code.name} svg={svg} status={code.status} dynamic={dynamic} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value, sub, dark }: { label: string; value: string; sub?: React.ReactNode; dark?: boolean }) {
  return (
    <div className={cn("rounded-3xl border p-5", dark ? "border-ink bg-ink text-paper" : "border-line bg-white")}>
      <p className={cn("text-xs", dark ? "text-paper/60" : "text-muted")}>{label}</p>
      <p className={cn("mt-2 font-display text-4xl leading-none tabular-nums", dark && "text-gold-soft")}>{value}</p>
      {sub && <p className={cn("mt-2 text-xs", dark ? "text-paper/60" : "text-muted")}>{sub}</p>}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-10 rounded-[32px] border border-dashed border-line bg-white/60 px-6 py-16 text-center">
      <p className="font-display text-4xl">Dein erster Code wartet.</p>
      <p className="mx-auto mt-2 max-w-md text-muted">Speisekarte, Visitenkarte, Google-Bewertungen oder einfach ein Link. In zwei Minuten gestaltet.</p>
      <ButtonLink href="/dashboard/new" variant="primary" size="lg" className="mt-6"><Plus className="size-4" /> Code erstellen</ButtonLink>
    </div>
  );
}
