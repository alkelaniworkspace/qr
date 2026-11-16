"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { STARTERS, STARTER_CATEGORIES, type Starter, type StarterCategory } from "@/lib/templates";
import { TypeIcon } from "@/components/type-icon";
import { cn } from "@/lib/cn";
import { LiveThumb } from "./live-thumb";

/** "Mit Vorlage starten": live phone previews with demo photos, filtered by category. */
export function StarterGallery({ onPick }: { onPick: (st: Starter) => void }) {
  const [cat, setCat] = useState<StarterCategory | "all">("all");
  const list = STARTERS.filter((s) => cat === "all" || s.category === cat);
  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="vorlagen" className="scroll-mt-24 font-display text-2xl sm:text-3xl">Mit Vorlage starten</h2>
          <p className="mt-1 text-sm text-dim">Fertige Seite mit passendem QR-Design. Die Fotos sind nur Beispiele, du setzt deine eigenen ein.</p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-2xl border border-edge bg-surface p-1">
          {[{ id: "all" as const, label: "Alle" }, ...STARTER_CATEGORIES].map((c) => (
            <button key={c.id} type="button" onClick={() => setCat(c.id)} className={cn("h-9 rounded-xl px-3.5 text-[13px] font-semibold transition", cat === c.id ? "bg-fg text-bg" : "text-dim hover:text-fg")}>
              {c.label} <span className="ml-0.5 opacity-50">{c.id === "all" ? STARTERS.length : STARTERS.filter((s) => s.category === c.id).length}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {list.map((st, i) => (
          <div key={st.id} role="button" tabIndex={0} onClick={() => onPick(st)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(st); } }}
            style={{ animationDelay: `${i * 40}ms` }}
            className="group cursor-pointer animate-rise">
            <div className="relative overflow-hidden rounded-[26px] border-[5px] border-[#16181b] bg-black shadow-[0_24px_50px_-28px_rgba(0,0,0,.6)] transition duration-500 group-hover:-translate-y-1.5 group-hover:shadow-[0_34px_60px_-26px_rgba(0,0,0,.65)]">
              <LiveThumb type={st.type} content={st.preview} className="aspect-[3/4] w-full" />
              <span className="absolute inset-x-3 bottom-3 flex translate-y-3 items-center justify-center gap-2 rounded-2xl bg-lime py-3 text-[13.5px] font-bold text-night opacity-0 shadow-lg transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                Vorlage nutzen <ArrowRight className="size-4" />
              </span>
            </div>
            <div className="mt-3 flex items-start gap-2.5 px-1">
              <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-hi/[0.07] text-fg"><TypeIcon name={st.icon} className="size-4" /></span>
              <span className="min-w-0">
                <span className="block truncate text-[14.5px] font-semibold">{st.name}</span>
                <span className="block truncate text-[12.5px] text-faint">{st.hint}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
