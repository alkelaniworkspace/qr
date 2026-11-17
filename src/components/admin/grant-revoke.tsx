"use client";

import { useState, useTransition } from "react";
import { Loader2, X } from "lucide-react";
import { revokeGrant } from "@/app/admin/actions";

export function GrantRevoke({ id }: { id: string }) {
  const [ask, setAsk] = useState(false);
  const [pending, start] = useTransition();
  if (ask) {
    return (
      <span className="flex items-center gap-1.5">
        <button type="button" onClick={() => start(async () => { await revokeGrant(id); })} className="rounded-lg bg-rose px-3 py-1.5 text-[12.5px] font-bold text-white">
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : "Zurückziehen"}
        </button>
        <button type="button" onClick={() => setAsk(false)} className="rounded-lg px-2 py-1.5 text-[12.5px] text-dim hover:text-fg">Abbrechen</button>
      </span>
    );
  }
  return (
    <button type="button" onClick={() => setAsk(true)} className="grid size-8 place-items-center rounded-lg text-dim hover:bg-rose/10 hover:text-rose" aria-label="Geschenk zurückziehen" title="Zurückziehen">
      <X className="size-4" />
    </button>
  );
}
