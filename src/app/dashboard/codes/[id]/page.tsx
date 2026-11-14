import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CODE_TYPES } from "@/lib/codes/types";
import { qrData } from "@/lib/codes/payload";
import type { CodeStats, QrCodeRow } from "@/lib/codes/model";
import { renderQrSvg } from "@/lib/qr/render";
import { normalizeStyle } from "@/lib/qr/style";
import { CodeActions } from "@/components/dashboard/code-actions";
import { Breakdown, HourStrip, ScanSeries } from "@/components/dashboard/charts";
import { TypeIcon } from "@/components/type-icon";
import { env } from "@/lib/env";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Statistik" };

const nf = new Intl.NumberFormat("de-DE");
const dtf = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Berlin" });

export default async function CodePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data } = await supabase.from("qr_codes").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const code = data as QrCodeRow;
  const def = CODE_TYPES[code.type];
  const link = qrData(code);
  const svg = renderQrSvg(link, normalizeStyle(code.style), { size: 640, id: "detail" });
  const dynamic = code.mode === "dynamic";

  const { data: statsRaw } = dynamic ? await supabase.rpc("code_stats", { p_code_id: id, p_days: 30 }) : { data: null };
  const stats = statsRaw as CodeStats | null;

  return (
    <div className="animate-rise">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="size-4" /> Alle Codes</Link>

      {created && (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
          <CheckCircle2 className="size-5 shrink-0" /> Dein Code ist fertig. Lade ihn herunter und teste ihn mit deinem Handy.
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="rounded-[28px] border border-line bg-white p-5 shadow-soft">
          <div className="rounded-2xl bg-sand/60 p-5 [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
          <div className="mt-4 flex justify-center">
            <CodeActions id={code.id} name={code.name} svg={svg} status={code.status} dynamic={dynamic} />
          </div>
        </div>

        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs text-muted">
            <TypeIcon name={def.icon} className="size-3.5" /> {def.label} · {dynamic ? "Dynamisch" : "Statisch"}
            {code.status === "paused" && <span className="rounded-full bg-warn/10 px-2 py-0.5 font-medium text-warn">Pausiert</span>}
          </p>
          <h1 className="mt-1 font-display text-5xl leading-tight">{code.name}</h1>
          {dynamic && (
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 font-mono text-[13px] hover:border-ink/30">
                {link.replace(/^https?:\/\//, "")} <ExternalLink className="size-3.5" />
              </a>
              {def.hostedPage && (
                <a href={`${env.appUrl}/p/${code.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 hover:border-ink/30">
                  Seite ansehen <ExternalLink className="size-3.5" />
                </a>
              )}
            </div>
          )}

          {stats ? (
            <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
              <Kpi label="Scans gesamt" value={nf.format(code.scan_count)} />
              <Kpi label="Scans 30 Tage" value={nf.format(stats.total)} />
              <Kpi label="Eindeutige Besucher" value={nf.format(stats.unique)} />
              <Kpi label="Letzter Scan" value={code.last_scanned_at ? dtf.format(new Date(code.last_scanned_at)) : "–"} small />
            </div>
          ) : (
            <p className="mt-6 rounded-2xl border border-line bg-white p-5 text-sm text-muted">
              Statische Codes enthalten den Inhalt direkt und laufen nicht über unsere Server. Darum gibt es dafür keine Statistik.
            </p>
          )}
        </div>
      </div>

      {stats && (
        <>
          <Panel title="Scans der letzten 30 Tage" className="mt-6">
            {stats.total === 0 ? (
              <p className="py-10 text-center text-sm text-muted">Noch keine Scans. Scanne den Code einmal mit deinem Handy zum Testen.</p>
            ) : (
              <ScanSeries series={stats.series} />
            )}
          </Panel>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Panel title="Tageszeit"><HourStrip hours={stats.hours} /></Panel>
            <Panel title="Geräte"><Breakdown items={stats.devices} total={stats.total} /></Panel>
            <Panel title="Betriebssystem"><Breakdown items={stats.os} total={stats.total} /></Panel>
            <Panel title="Städte"><Breakdown items={stats.cities} total={stats.total} /></Panel>
          </div>
          <p className="mt-4 text-xs text-muted">Datenschutzfreundlich: keine Cookies, keine gespeicherten IP-Adressen.</p>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="rounded-3xl border border-line bg-white p-5">
      <p className="text-xs text-muted">{label}</p>
      <p className={cn("mt-2 font-display leading-none tabular-nums", small ? "text-xl" : "text-4xl")}>{value}</p>
    </div>
  );
}

function Panel({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-3xl border border-line bg-white p-6", className)}>
      <h2 className="mb-5 text-sm font-medium">{title}</h2>
      {children}
    </section>
  );
}
