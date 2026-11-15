import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { CODE_TYPES } from "@/lib/codes/types";
import { qrData } from "@/lib/codes/payload";
import type { QrCodeRow } from "@/lib/codes/model";
import { renderQrSvg } from "@/lib/qr/render";
import { normalizeStyle } from "@/lib/qr/style";
import { CodeActions } from "./code-actions";
import { TypeIcon } from "@/components/type-icon";
import { cn } from "@/lib/cn";

const nf = new Intl.NumberFormat("de-DE");
const df = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short", year: "numeric" });

type Row = Pick<QrCodeRow, "id" | "name" | "slug" | "type" | "mode" | "content" | "style" | "status" | "scan_count" | "created_at">;

/** One code as a card: badge, preview, name, scans, actions. */
export function CodeCard({ code }: { code: Row }) {
  const def = CODE_TYPES[code.type];
  const dynamic = code.mode === "dynamic";
  const svg = renderQrSvg(qrData(code), normalizeStyle(code.style), { size: 640, id: `c-${code.slug}` });
  const href = dynamic ? `/dashboard/codes/${code.id}` : `/dashboard/codes/${code.id}/edit`;
  const accent = code.status === "paused" ? "border-l-gold" : dynamic ? "border-l-brand" : "border-l-navy-bright";

  return (
    <div className={cn("card group relative flex flex-col overflow-visible border-l-[3px] p-5 transition duration-300 hover:-translate-y-1 hover:border-white/20", accent)}>
      <div className="flex items-center justify-between gap-2">
        {code.status === "paused" ? (
          <span className="badge bg-gold text-bg">Pausiert</span>
        ) : dynamic ? (
          <span className="badge bg-brand text-on-brand">Dynamisch</span>
        ) : (
          <span className="badge bg-navy text-white">Statisch</span>
        )}
        <CodeActions id={code.id} name={code.name} svg={svg} status={code.status} dynamic={dynamic} compact />
      </div>
      <Link href={href} className="mt-4 flex items-center gap-4">
        <span className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/[0.04] p-2 transition group-hover:scale-[1.04] [&>svg]:h-auto [&>svg]:max-h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
        <span className="min-w-0">
          <span className="block truncate font-display text-lg uppercase leading-tight">{code.name}</span>
          <span className="mt-1 flex items-center gap-1.5 text-xs text-dim"><TypeIcon name={def.icon} className="size-3.5" /> {def.label}</span>
          <span className="mt-0.5 block text-xs text-faint">{df.format(new Date(code.created_at))}</span>
        </span>
      </Link>
      <div className="mt-4 flex items-end justify-between border-t border-edge pt-4">
        {dynamic ? (
          <div>
            <p className="font-display text-3xl leading-none tabular-nums">{nf.format(code.scan_count)}</p>
            <p className="mt-1 text-xs text-dim">Scans</p>
          </div>
        ) : (
          <p className="text-xs text-dim">Inhalt steckt im Code</p>
        )}
        <Link href={href} className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.06] px-3 py-2 text-xs font-bold uppercase tracking-wide transition hover:bg-brand hover:text-on-brand">
          {dynamic ? <><BarChart3 className="size-3.5" /> Statistik</> : "Bearbeiten"}
        </Link>
      </div>
    </div>
  );
}
