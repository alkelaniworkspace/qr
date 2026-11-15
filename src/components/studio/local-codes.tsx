"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Download, PenLine, Plus, Printer, Trash2 } from "lucide-react";
import { deleteLocalCode, listLocalCodes, type LocalCode } from "@/lib/codes/local-store";
import { CODE_TYPES } from "@/lib/codes/types";
import { staticPayload } from "@/lib/codes/payload";
import { renderQrSvg } from "@/lib/qr/render";
import { normalizeStyle } from "@/lib/qr/style";
import { shortLink } from "@/lib/env";
import { downloadPng } from "@/lib/qr/export";
import { ButtonLink } from "@/components/ui/button";
import { TypeIcon } from "@/components/type-icon";

function svgFor(c: LocalCode, size: number) {
  try {
    const data = c.dynamic ? shortLink(c.dynamic.slug) : staticPayload(c.type, c.content, c.name);
    return renderQrSvg(data, normalizeStyle(c.style), { size, id: `l${c.id}` });
  } catch {
    return "";
  }
}

const noop = () => () => {};

export function LocalCodes() {
  const client = useSyncExternalStore(noop, () => true, () => false);
  const [, setVersion] = useState(0);
  const [confirm, setConfirm] = useState<string | null>(null);
  const codes: LocalCode[] | null = client ? listLocalCodes() : null;

  function remove(id: string) {
    deleteLocalCode(id);
    setVersion((v) => v + 1);
    setConfirm(null);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl leading-none sm:text-6xl">
            Meine <span className="text-brand glow-text">Codes</span>
          </h1>
          <p className="mt-3 max-w-xl text-dim">Gespeichert in diesem Browser, ohne Konto. Die Codes selbst funktionieren überall und für immer.</p>
        </div>
        <ButtonLink href="/studio" size="lg" className="shine"><Plus className="size-4" /> Neuer Code</ButtonLink>
      </div>

      {codes && codes.length === 0 && (
        <div className="card mt-10 grid place-items-center px-6 py-20 text-center">
          <p className="font-display text-2xl">Noch keine Codes</p>
          <p className="mt-2 text-dim">In 4 Schritten zum fertigen Code und Poster.</p>
          <ButtonLink href="/studio" className="mt-6"><Plus className="size-4" /> Ersten Code erstellen</ButtonLink>
        </div>
      )}

      {codes && codes.length > 0 && (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {codes.map((c) => {
            const def = CODE_TYPES[c.type];
            const svg = svgFor(c, 260);
            return (
              <article key={c.id} className="card group flex flex-col p-4 transition hover:border-brand/40">
                <Link href={`/studio?edit=${c.id}`} className="grid aspect-square place-items-center rounded-2xl bg-bg/70 p-6">
                  <div className="w-full max-w-[200px] transition duration-300 group-hover:scale-[1.03] [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
                </Link>
                <div className="mt-4 flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-elevated text-brand"><TypeIcon name={def.icon} className="size-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{c.name}</p>
                    <p className="flex items-center gap-1.5 text-xs text-faint">{c.dynamic ? <span className="badge bg-brand text-on-brand">Dynamisch</span> : <span className="badge bg-hi/10 text-dim">Statisch</span>} {def.label} · {new Date(c.updatedAt).toLocaleDateString("de-DE")}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-1.5">
                  <Link href={`/studio?edit=${c.id}`} title="Bearbeiten" className="grid h-10 place-items-center rounded-xl border border-edge text-dim hover:border-hi/25 hover:text-fg"><PenLine className="size-4" /></Link>
                  <Link href={`/studio?edit=${c.id}&step=4`} title="Drucken" className="grid h-10 place-items-center rounded-xl border border-edge text-dim hover:border-hi/25 hover:text-fg"><Printer className="size-4" /></Link>
                  <button type="button" title="PNG laden" onClick={() => downloadPng(svgFor(c, 1024), c.name, 2048)} className="grid h-10 place-items-center rounded-xl border border-edge text-dim hover:border-hi/25 hover:text-fg"><Download className="size-4" /></button>
                  {confirm === c.id ? (
                    <button type="button" onClick={() => remove(c.id)} className="h-10 rounded-xl bg-rose text-[11px] font-bold uppercase text-night">Löschen?</button>
                  ) : (
                    <button type="button" title="Löschen" onClick={() => setConfirm(c.id)} className="grid h-10 place-items-center rounded-xl border border-edge text-dim hover:border-rose/50 hover:text-rose"><Trash2 className="size-4" /></button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
