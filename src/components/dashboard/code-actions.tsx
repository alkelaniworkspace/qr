"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { BarChart3, Download, Loader2, MoreHorizontal, Pause, Pencil, Play, Trash2 } from "lucide-react";
import { deleteCode, setCodeStatus } from "@/app/dashboard/actions";
import { downloadPng, downloadSvg } from "@/lib/qr/export";
import { cn } from "@/lib/cn";

interface Props {
  id: string;
  name: string;
  svg: string;
  status: "active" | "paused";
  dynamic: boolean;
  compact?: boolean;
}

export function CodeActions({ id, name, svg, status, dynamic, compact }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, start] = useTransition();

  const item = "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-fg/90 hover:bg-white/[0.07]";

  return (
    <div className="relative flex items-center gap-1.5">
      {!compact && (
        <>
          <Link href={`/dashboard/codes/${id}/edit`} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-edge-strong bg-elevated px-4 text-xs font-bold uppercase tracking-wide transition hover:border-white/30">
            <Pencil className="size-3.5" /> Bearbeiten
          </Link>
          <button onClick={() => downloadPng(svg, name, 2048)} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-lime px-4 text-xs font-bold uppercase tracking-wide text-on-lime shadow-[0_3px_0_#7fa000] transition hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none">
            <Download className="size-3.5" /> PNG
          </button>
        </>
      )}
      <button
        onClick={() => { setOpen(!open); setConfirmDelete(false); }}
        className="grid size-9 place-items-center rounded-xl text-dim transition hover:bg-white/[0.07] hover:text-fg"
        aria-label="Weitere Aktionen"
        aria-expanded={open}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
      </button>
      {open && (
        <>
          <button className="fixed inset-0 z-10 cursor-default" aria-hidden tabIndex={-1} onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-30 w-56 rounded-2xl border border-edge-strong bg-elevated p-1.5 shadow-lift animate-rise">
            {compact && (
              <Link href={`/dashboard/codes/${id}/edit`} className={item}><Pencil className="size-4" /> Bearbeiten</Link>
            )}
            {dynamic && <Link href={`/dashboard/codes/${id}`} className={item}><BarChart3 className="size-4" /> Statistik</Link>}
            <button className={item} onClick={() => { downloadPng(svg, name, 2048); setOpen(false); }}><Download className="size-4" /> PNG (2048 px)</button>
            <button className={item} onClick={() => { downloadSvg(svg, name); setOpen(false); }}><Download className="size-4" /> SVG (Vektor)</button>
            {dynamic && (
              <button
                className={item}
                onClick={() => start(async () => { await setCodeStatus(id, status === "active" ? "paused" : "active"); setOpen(false); })}
              >
                {status === "active" ? <><Pause className="size-4" /> Pausieren</> : <><Play className="size-4" /> Aktivieren</>}
              </button>
            )}
            <div className="my-1 h-px bg-edge" />
            {confirmDelete ? (
              <div className="p-2">
                <p className="mb-2 text-xs text-dim">{dynamic ? "Gedruckte Codes führen danach ins Leere." : "Code wirklich löschen?"}</p>
                <button
                  className="w-full rounded-xl bg-rose px-3 py-2 text-sm font-bold text-white hover:bg-rose/90"
                  onClick={() => start(async () => { await deleteCode(id); setOpen(false); })}
                >
                  Endgültig löschen
                </button>
              </div>
            ) : (
              <button className={cn(item, "text-rose hover:bg-rose/10")} onClick={() => setConfirmDelete(true)}><Trash2 className="size-4" /> Löschen</button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
