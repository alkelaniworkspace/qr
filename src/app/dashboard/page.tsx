import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { CODE_TYPES, type CodeTypeId } from "@/lib/codes/types";
import type { QrCodeRow } from "@/lib/codes/model";
import { getQuota } from "@/lib/codes/quota";
import { CodeCard } from "@/components/dashboard/code-card";
import { Sparkline } from "@/components/marketing/sparkline";
import { CountUp } from "@/components/motion/count-up";
import { TypeIcon } from "@/components/type-icon";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Heute" };

interface Summary { codes: number; dynamic: number; scans_total: number; scans_7d: number; scans_prev_7d: number; scans_today: number; series: number[] }
const QUICK: CodeTypeId[] = ["menu", "review", "vcard", "url", "links", "wifi"];

export default async function TodayPage() {
  const user = await getSessionUser();
  const supabase = await createClient();
  const [{ data: summaryRaw }, { data: recent }, { data: profile }, quota] = await Promise.all([
    supabase.rpc("dashboard_summary"),
    supabase.from("qr_codes").select("id, name, slug, type, mode, content, style, status, scan_count, created_at").order("created_at", { ascending: false }).limit(6),
    supabase.from("profiles").select("full_name").eq("id", user!.id).maybeSingle(),
    getQuota(user!.id),
  ]);
  const s = (summaryRaw ?? { codes: 0, dynamic: 0, scans_total: 0, scans_7d: 0, scans_prev_7d: 0, scans_today: 0, series: [] }) as Summary;
  const codes = (recent ?? []) as QrCodeRow[];
  const trend = s.scans_prev_7d ? Math.round(((s.scans_7d - s.scans_prev_7d) / s.scans_prev_7d) * 100) : null;
  const name = (profile?.full_name || user!.email.split("@")[0]).split(" ")[0];
  const weekday = new Intl.DateTimeFormat("de-DE", { weekday: "long", timeZone: "Europe/Berlin" }).format(new Date());
  const date = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", timeZone: "Europe/Berlin" }).format(new Date());
  const pct = isFinite(quota.limit) ? Math.min(100, Math.round((quota.used / quota.limit) * 100)) : 0;

  return (
    <div className="animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-dim">Hallo {name}</p>
          <h1 className="mt-1 font-display text-5xl leading-none sm:text-6xl">
            Heute, <span className="text-brand glow-text">{weekday}</span>
          </h1>
          <p className="mt-2 text-sm text-dim">{date} · {s.codes} {s.codes === 1 ? "Code" : "Codes"} im Einsatz</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-edge bg-hi/5 px-3.5 py-1.5 text-xs font-semibold text-lime-ink">
          <span className="size-2 rounded-full bg-mint" /> {s.dynamic} dynamische Codes live
        </span>
      </div>

      {/* KPIs */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card card-glow p-5">
          <p className="text-sm font-semibold text-dim">Scans heute</p>
          <p className="mt-2 font-display text-5xl text-brand glow-text"><CountUp value={s.scans_today} /></p>
          <Sparkline points={s.series.length ? s.series : [0, 0]} className="mt-3 h-10 w-full" />
        </div>
        <div className="card p-5">
          <p className="text-sm font-semibold text-dim">Scans 7 Tage</p>
          <p className="mt-2 font-display text-5xl text-mint"><CountUp value={s.scans_7d} /></p>
          <p className="mt-3 text-xs">
            {trend === null ? <span className="text-faint">Noch kein Vergleich zur Vorwoche</span> : (
              <span className={cn("inline-flex items-center gap-1 font-semibold", trend >= 0 ? "text-mint" : "text-rose")}>
                {trend >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}{Math.abs(trend)} % zur Vorwoche
              </span>
            )}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm font-semibold text-dim">Dynamische Codes</p>
          <p className="mt-2 font-display text-5xl">{quota.used}<span className="text-2xl text-faint">/{isFinite(quota.limit) ? quota.limit : "∞"}</span></p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-hi/[0.06]">
            <div className="h-full rounded-full bg-gold transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="card p-5">
          <p className="text-sm font-semibold text-dim">Scans gesamt</p>
          <p className="mt-2 font-display text-5xl text-fg"><CountUp value={s.scans_total} /></p>
          <p className="mt-3 text-xs text-faint">Seit dem ersten Code</p>
        </div>
      </div>

      {/* Quick create */}
      <div className="mt-10 flex items-center gap-3">
        <h2 className="font-display text-2xl">Schnell erstellen</h2>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {QUICK.map((t) => (
          <Link key={t} href={`/dashboard/new?type=${t}`} className="card group flex flex-col items-start gap-3 p-4 transition hover:-translate-y-1 hover:border-brand/50">
            <span className="grid size-10 place-items-center rounded-xl bg-elevated text-brand transition group-hover:bg-brand group-hover:text-on-brand">
              <TypeIcon name={CODE_TYPES[t].icon} className="size-5" />
            </span>
            <span className="text-sm font-bold">{CODE_TYPES[t].label}</span>
          </Link>
        ))}
      </div>

      {/* Recent */}
      <div className="mt-12 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-3 font-display text-2xl">
          Zuletzt erstellt <span className="badge bg-brand text-on-brand">{s.codes}</span>
        </h2>
        {s.codes > 0 && <Link href="/dashboard/codes" className="inline-flex items-center gap-1.5 text-sm font-semibold text-dim hover:text-brand">Alle Codes <ArrowRight className="size-4" /></Link>}
      </div>
      {codes.length === 0 ? (
        <div className="card mt-4 px-6 py-16 text-center">
          <p className="font-display text-4xl">Dein erster Code wartet.</p>
          <p className="mx-auto mt-3 max-w-md text-dim">Speisekarte, Visitenkarte, Google-Bewertungen oder ein Link. In zwei Minuten gestaltet.</p>
          <ButtonLink href="/dashboard/new" size="lg" className="mt-8 shine"><Plus className="size-4" /> Code erstellen</ButtonLink>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {codes.map((c) => <CodeCard key={c.id} code={c} />)}
        </div>
      )}
    </div>
  );
}
