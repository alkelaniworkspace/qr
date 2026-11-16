"use client";

import { Check } from "lucide-react";
import type { CodeTypeId } from "@/lib/codes/types";
import { PAGE_LOOKS, compactDesign, resolveDesign, type StoredDesign } from "@/lib/page-design";
import { DEMO_PAGES } from "@/lib/samples";
import { cn } from "@/lib/cn";
import { LiveThumb } from "./live-thumb";

/** Every look as a live preview with demo content and photos. Picking only changes the design. */
export function PageLookPicker({ type, content, onPick }: { type: CodeTypeId; content: Record<string, unknown>; onPick: (d: StoredDesign) => void }) {
  const demo = DEMO_PAGES[type] ?? content;
  const current = resolveDesign(content);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {PAGE_LOOKS.map((look) => {
        const d = resolveDesign({ design: look.design });
        const active = current.preset === d.preset && current.accent === d.accent && current.hero === d.hero && current.bg === d.bg;
        const pick = () => onPick(compactDesign({ ...d, bgImage: current.bgImage }));
        return (
          <div key={look.id} role="button" tabIndex={0} onClick={pick} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } }} aria-pressed={active}
            className={cn("group relative cursor-pointer overflow-hidden rounded-[20px] border text-left transition duration-300", active ? "border-brand ring-2 ring-brand/40" : "border-edge hover:-translate-y-1 hover:border-edge-strong hover:shadow-lift")}>
            <LiveThumb type={type} content={{ ...demo, design: look.design }} className="aspect-[4/5] w-full" />
            {active && <span className="absolute right-2.5 top-2.5 grid size-7 place-items-center rounded-full bg-brand text-on-brand shadow-lg"><Check className="size-4" /></span>}
            <span className="block border-t border-edge bg-surface px-3 py-2.5">
              <span className="block text-[14px] font-semibold">{look.name}</span>
              <span className="line-clamp-1 block text-[12px] leading-snug text-faint">{look.mood}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
