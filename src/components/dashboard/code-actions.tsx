"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Archive, ArchiveRestore, BarChart3, Download, Loader2, MoreHorizontal, Pause, Pencil, Play, RotateCcw, Trash2 } from "lucide-react";
import { archiveCode, deleteCode, restoreCode, setCodeStatus, trashCode } from "@/app/dashboard/actions";
import { downloadPng, downloadSvg } from "@/lib/qr/export";
import { cn } from "@/lib/cn";

export type CodeView = "active" | "archived" | "trash";

interface Props {
  id: string;
  name: string;
  svg: string;
  status: "active" | "paused";
  dynamic: boolean;
  compact?: boolean;
  view?: CodeView;
  locked?: boolean;
}

export function CodeActions({ id, name, svg, status, dynamic, compact, view = "active", locked }: Props) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<string | null>) => start(async () => {
    const err = await fn();
    setMsg(err);
    if (!err) setOpen(false);
  });

  const item = "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-fg/90 hover:bg-hi/[0.07]";
  const trash = view === "trash";

  return (
    <div className="relative flex items-center gap-1.5">
      {!compact && !trash && (
        <>
          <Link href={`/dashboard/codes/${id}/edit`} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-edge-strong bg-elevated px-4 text-xs font-bold transition hover:border-hi/30">
            <Pencil className="size-3.5" /> Bearbeiten
          </Link>
          <button onClick={() => downloadPng(svg, name, 2048)} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand px-4 text-xs font-bold text-on-brand shadow-[0_3px_0_var(--color-brand-shadow)] transition hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none">
            <Download className="size-3.5" /> PNG
          </button>
        </>
      )}
      <button
        onClick={() => { setOpen(!open); setConfirm(false); setMsg(null); }}
        className="grid size-9 place-items-center rounded-xl text-dim transition hover:bg-hi/[0.07] hover:text-fg"
        aria-label="Weitere Aktionen"
        aria-expanded={open}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
      </button>
      {open && (
        <>
          <button className="fixed inset-0 z-10 cursor-default" aria-hidden tabIndex={-1} onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-30 w-60 rounded-2xl border border-edge-strong bg-elevated p-1.5 shadow-lift animate-rise">
            {trash ? (
              <>
                <button className={item} onClick={() => run(() => restoreCode(id))}><RotateCcw className="size-4" /> Wiederherstellen</button>
                <div className="my-1 h-px bg-edge" />
                {confirm ? (
                  <div className="p-2">
                    <p className="mb-2 text-xs text-dim">Der Code und seine Statistik sind danach für immer weg.</p>
                    <button className="w-full rounded-xl bg-rose px-3 py-2 text-sm font-bold text-white hover:bg-rose/90" onClick={() => run(() => deleteCode(id))}>Endgültig löschen</button>
                  </div>
                ) : (
                  <button className={cn(item, "text-rose hover:bg-rose/10")} onClick={() => setConfirm(true)}><Trash2 className="size-4" /> Endgültig löschen</button>
                )}
              </>
            ) : (
              <>
                {compact && <Link href={`/dashboard/codes/${id}/edit`} className={item}><Pencil className="size-4" /> Bearbeiten</Link>}
                {dynamic && <Link href={`/dashboard/codes/${id}`} className={item}><BarChart3 className="size-4" /> Statistik</Link>}
                <button className={item} onClick={() => { downloadPng(svg, name, 2048); setOpen(false); }}><Download className="size-4" /> PNG (2048 px)</button>
                <button className={item} onClick={() => { downloadSvg(svg, name); setOpen(false); }}><Download className="size-4" /> SVG (Vektor)</button>
                {dynamic && !locked && (
                  <button className={item} onClick={() => run(() => setCodeStatus(id, status === "active" ? "paused" : "active"))}>
                    {status === "active" ? <><Pause className="size-4" /> Pausieren</> : <><Play className="size-4" /> Aktivieren</>}
                  </button>
                )}
                {view === "archived"
                  ? <button className={item} onClick={() => run(() => archiveCode(id, false))}><ArchiveRestore className="size-4" /> Aus dem Archiv holen</button>
                  : <button className={item} onClick={() => run(() => archiveCode(id, true))}><Archive className="size-4" /> Archivieren</button>}
                <div className="my-1 h-px bg-edge" />
                {confirm ? (
                  <div className="p-2">
                    <p className="mb-2 text-xs text-dim">{dynamic ? "Der Code funktioniert ab sofort nicht mehr. Im Papierkorb kannst du ihn 30 Tage lang wiederherstellen." : "Der Code landet 30 Tage im Papierkorb."}</p>
                    <button className="w-full rounded-xl bg-rose px-3 py-2 text-sm font-bold text-white hover:bg-rose/90" onClick={() => run(() => trashCode(id))}>In den Papierkorb</button>
                  </div>
                ) : (
                  <button className={cn(item, "text-rose hover:bg-rose/10")} onClick={() => setConfirm(true)}><Trash2 className="size-4" /> Löschen</button>
                )}
              </>
            )}
            {msg && <p className="m-1.5 rounded-xl bg-rose/10 px-3 py-2 text-xs text-rose">{msg}</p>}
          </div>
        </>
      )}
    </div>
  );
}
