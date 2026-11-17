import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, ExternalLink, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CODE_TYPES } from "@/lib/codes/types";
import { qrData } from "@/lib/codes/payload";
import type { CodeStats, QrCodeRow } from "@/lib/codes/model";
import { renderQrSvg } from "@/lib/qr/render";
import { normalizeStyle } from "@/lib/qr/style";
import { CodeActions } from "@/components/dashboard/code-actions";
import { PollResults } from "@/components/dashboard/poll-results";
import { RsvpList } from "@/components/dashboard/rsvp-list";
import { Breakdown, HourStrip, ScanSeries } from "@/components/dashboard/charts";
import { CountUp } from "@/components/motion/count-up";
import { TypeIcon } from "@/components/type-icon";
import { ButtonLink } from "@/components/ui/button";
import { env } from "@/lib/env";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Statistik" };

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
      <Link href="/dashboard/codes" className="inline-flex items-center gap-1.5 text-sm font-semibold text-dim hover:text-fg"><ArrowLeft className="size-4" /> Alle Codes</Link>

      {created && (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-brand/40 bg-brand/10 px-4 py-3 text-sm font-semibold text-brand">
          <CheckCircle2 className="size-5 shrink-0" /> Dein Code ist fertig. Lade ihn herunter und teste ihn mit dem Handy.
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="card card-glow relative overflow-hidden p-5">
          <div className="relative overflow-hidden rounded-2xl bg-hi/[0.04] p-4 [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
          <div className="mt-4 flex justify-center">
            <CodeActions id={code.id} name={code.name} svg={svg} status={code.status} dynamic={dynamic} view={code.deleted_at ? "trash" : code.archived_at ? "archived" : "active"} locked={!!code.locked_at} />
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("badge", code.deleted_at || code.locked_at ? "bg-rose text-white" : code.status === "paused" ? "bg-gold text-night" : dynamic ? "bg-brand text-on-brand" : "bg-lime text-night")}>
              {code.deleted_at ? "Im Papierkorb" : code.locked_at ? "Gesperrt" : code.status === "paused" ? "Pausiert" : dynamic ? "Dynamisch" : "Statisch"}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-dim"><TypeIcon name={def.icon} className="size-3.5" /> {def.label}</span>
          </div>
          <h1 className="mt-3 font-display text-5xl leading-[0.95]">{code.name}</h1>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {dynamic && (
              <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-edge bg-surface px-3.5 py-2 font-mono text-[13px] transition hover:border-brand/50">
                {link.replace(/^https?:\/\//, "")} <ExternalLink className="size-3.5" />
              </a>
            )}
            {dynamic && def.hostedPage && (
              <a href={`${env.appUrl}/p/${code.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-edge bg-surface px-3.5 py-2 font-semibold transition hover:border-brand/50">
                Seite ansehen <ExternalLink className="size-3.5" />
              </a>
            )}
            <ButtonLink href={`/dashboard/codes/${code.id}/edit`} variant="secondary" size="sm"><Pencil className="size-3.5" /> Bearbeiten</ButtonLink>
          </div>

          {stats ? (
            <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
              <Kpi label="Scans gesamt" color="text-brand glow-text"><CountUp value={code.scan_count} /></Kpi>
              <Kpi label="Scans 30 Tage" color="text-mint"><CountUp value={stats.total} /></Kpi>
              <Kpi label="Eindeutige Besucher" color="text-gold"><CountUp value={stats.unique} /></Kpi>
              <Kpi label="Letzter Scan" small>{code.last_scanned_at ? dtf.format(new Date(code.last_scanned_at)) : "–"}</Kpi>
            </div>
          ) : (
            <p className="card mt-6 p-5 text-sm text-dim">
              Statische Codes enthalten den Inhalt direkt und laufen nicht über unsere Server. Darum gibt es dafür keine Statistik.
            </p>
          )}
        </div>
      </div>

      {code.type === "event" && dynamic && code.content.rsvp === true && <RsvpList slug={code.slug} className="mt-6" />}
      {code.type === "poll" && dynamic && (
        <PollResults slug={code.slug} options={(code.content.options as { label: string }[]) ?? []} className="mt-6" />
      )}

      {stats && (
        <>
          <Panel title="Scans der letzten 30 Tage" className="mt-6">
            {stats.total === 0 ? (
              <p className="py-10 text-center text-sm text-dim">Noch keine Scans. Scanne den Code einmal mit dem Handy zum Testen.</p>
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
          <p className="mt-4 text-xs text-faint">Datenschutzfreundlich: keine Cookies, keine gespeicherten IP-Adressen.</p>
        </>
      )}
    </div>
  );
}

function Kpi({ label, children, small, color }: { label: string; children: React.ReactNode; small?: boolean; color?: string }) {
  return (
    <div className="card p-5">
      <p className="text-sm font-semibold text-dim">{label}</p>
      <p className={cn("mt-2 font-display leading-none", small ? "text-lg" : "text-4xl", color)}>{children}</p>
    </div>
  );
}

function Panel({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("card p-6", className)}>
      <h2 className="mb-5 font-display text-lg">{title}</h2>
      {children}
    </section>
  );
}
