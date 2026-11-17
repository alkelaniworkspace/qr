"use client";

import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, Loader2, Lock, MoreHorizontal, Pause, Play, RotateCcw, Trash2, Unlock } from "lucide-react";
import { codeAction, type CodeAction } from "@/app/admin/actions";
import { cn } from "@/lib/cn";

export function CodeRowActions({ id, status, archived, deleted, locked }: { id: string; status: "active" | "paused"; archived: boolean; deleted: boolean; locked: boolean }) {
  const [open, setOpen] = useState(false);
  const [ask, setAsk] = useState<null | "lock" | "purge">(null);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const run = (a: CodeAction, r = "") => start(async () => {
    const e = await codeAction(id, a, r);
    setErr(e);
    if (!e) { setOpen(false); setAsk(null); }
  });
  const item = "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium hover:bg-hi/[0.07]";
  return (
    <div className="relative">
      <button type="button" onClick={() => { setOpen(!open); setAsk(null); setErr(null); }} className="grid size-9 place-items-center rounded-xl text-dim hover:bg-hi/[0.07] hover:text-fg" aria-label="Aktionen">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
      </button>
      {open && (
        <>
          <button className="fixed inset-0 z-10 cursor-default" aria-hidden tabIndex={-1} onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-30 w-64 rounded-2xl border border-edge-strong bg-elevated p-1.5 text-left shadow-lift animate-rise">
            {deleted ? (
              <>
                <button className={item} onClick={() => run("restore")}><RotateCcw className="size-4" /> Wiederherstellen</button>
                {ask === "purge" ? (
                  <div className="p-2">
                    <p className="mb-2 text-xs text-dim">Code und Statistik sind danach für immer weg.</p>
                    <button className="w-full rounded-xl bg-rose px-3 py-2 text-sm font-bold text-white" onClick={() => run("purge")}>Endgültig löschen</button>
                  </div>
                ) : <button className={cn(item, "text-rose hover:bg-rose/10")} onClick={() => setAsk("purge")}><Trash2 className="size-4" /> Endgültig löschen</button>}
              </>
            ) : (
              <>
                <button className={item} onClick={() => run(status === "active" ? "pause" : "resume")}>{status === "active" ? <><Pause className="size-4" /> Pausieren</> : <><Play className="size-4" /> Aktivieren</>}</button>
                {locked ? (
                  <button className={item} onClick={() => run("unlock")}><Unlock className="size-4" /> Sperre aufheben</button>
                ) : ask === "lock" ? (
                  <div className="p-2">
                    <input autoFocus value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Grund, z. B. Spam" className="mb-2 h-9 w-full rounded-lg border border-edge bg-surface px-2.5 text-sm outline-none" />
                    <button className="w-full rounded-xl bg-rose px-3 py-2 text-sm font-bold text-white" onClick={() => run("lock", reason)}>Sperren</button>
                  </div>
                ) : <button className={item} onClick={() => setAsk("lock")}><Lock className="size-4" /> Sperren (Nutzer kann nicht entsperren)</button>}
                <button className={item} onClick={() => run(archived ? "unarchive" : "archive")}>{archived ? <><ArchiveRestore className="size-4" /> Aus Archiv holen</> : <><Archive className="size-4" /> Archivieren</>}</button>
                <div className="my-1 h-px bg-edge" />
                <button className={cn(item, "text-rose hover:bg-rose/10")} onClick={() => run("trash")}><Trash2 className="size-4" /> In den Papierkorb</button>
              </>
            )}
            {err && <p className="m-1.5 rounded-xl bg-rose/10 px-3 py-2 text-xs text-rose">{err}</p>}
          </div>
        </>
      )}
    </div>
  );
}
