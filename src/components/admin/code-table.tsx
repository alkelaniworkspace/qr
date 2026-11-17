import Link from "next/link";
import { CODE_TYPES } from "@/lib/codes/types";
import type { AdminCode } from "@/lib/admin";
import { TypeIcon } from "@/components/type-icon";
import { trashDaysLeft } from "@/lib/time";
import { ago, nf } from "./bits";
import { CodeRowActions } from "./code-row-actions";

function State({ c }: { c: AdminCode }) {
  if (c.deleted_at) {
    const left = trashDaysLeft(c.deleted_at);
    return <span className="rounded-full bg-rose/15 px-2 py-0.5 text-[11.5px] font-semibold text-rose">Papierkorb · {left} T.</span>;
  }
  if (c.locked_at) return <span className="rounded-full bg-rose px-2 py-0.5 text-[11.5px] font-bold text-white" title={c.locked_reason ?? ""}>Gesperrt</span>;
  if (c.status === "paused") return <span className="rounded-full bg-gold px-2 py-0.5 text-[11.5px] font-bold text-night">Pausiert</span>;
  if (c.archived_at) return <span className="rounded-full bg-hi/[0.08] px-2 py-0.5 text-[11.5px] font-semibold text-dim">Archiv</span>;
  return <span className="rounded-full bg-lime/15 px-2 py-0.5 text-[11.5px] font-semibold text-fg">Aktiv</span>;
}

export function CodeTable({ codes, showOwner = true }: { codes: AdminCode[]; showOwner?: boolean }) {
  return (
    <div className="card overflow-visible">
      <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)_0.8fr_0.9fr_0.9fr_40px] gap-4 border-b border-edge px-5 py-3 text-[12px] font-semibold text-faint lg:grid">
        <span>Code</span><span>{showOwner ? "Besitzer" : "Link"}</span><span>Scans</span><span>Status</span><span>Erstellt</span><span />
      </div>
      {codes.map((c) => {
        const def = CODE_TYPES[c.type as keyof typeof CODE_TYPES];
        return (
          <div key={c.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 border-b border-edge px-5 py-3 last:border-0 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)_0.8fr_0.9fr_0.9fr_40px]">
            <span className="flex min-w-0 items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-hi/[0.06]">{def ? <TypeIcon name={def.icon} className="size-[18px]" /> : null}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{c.name}</span>
                <span className="block truncate text-[12px] text-faint">{def?.label ?? c.type} · {c.mode === "dynamic" ? "dynamisch" : "statisch"}{c.mode === "dynamic" && <> · <a href={`/r/${c.slug}`} target="_blank" rel="noopener" className="underline-offset-2 hover:underline">/r/{c.slug}</a></>}</span>
              </span>
            </span>
            <span className="order-last col-span-2 truncate text-[13px] text-dim lg:order-none lg:col-span-1">
              {showOwner ? (c.user_id ? <Link href={`/admin/users/${c.user_id}`} className="hover:text-fg hover:underline">{c.owner_email}</Link> : <span className="text-faint">Gast (ohne Konto)</span>) : `/r/${c.slug}`}
            </span>
            <span className="hidden text-sm tabular-nums lg:block">{nf.format(c.scan_count)}<span className="block text-[11.5px] text-faint">{c.last_scanned_at ? ago(c.last_scanned_at) : "noch nie"}</span></span>
            <span className="hidden lg:block"><State c={c} /></span>
            <span className="hidden text-[13px] text-dim lg:block">{ago(c.created_at)}</span>
            <span className="flex items-center justify-end gap-2"><span className="lg:hidden"><State c={c} /></span><CodeRowActions id={c.id} status={c.status} archived={!!c.archived_at} deleted={!!c.deleted_at} locked={!!c.locked_at} /></span>
          </div>
        );
      })}
      {!codes.length && <p className="px-5 py-16 text-center text-dim">Keine Codes.</p>}
    </div>
  );
}
