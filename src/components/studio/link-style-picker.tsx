"use client";

import { Check } from "lucide-react";
import { DEMO_PAGES } from "@/lib/samples";
import { cn } from "@/lib/cn";
import { LiveThumb } from "./live-thumb";

export const LINK_STYLE_INFO: { id: string; name: string; mood: string }[] = [
  { id: "cards", name: "Karten", mood: "Weiße Karten mit Marken-Icon" },
  { id: "brand", name: "Markenfarben", mood: "Jeder Knopf in seiner Farbe" },
  { id: "tiles", name: "Kacheln", mood: "Große Icons im Raster" },
  { id: "glass", name: "Glas", mood: "Milchglas über deinem Foto" },
  { id: "outline", name: "Linie", mood: "Schlank, ruhig, edel" },
  { id: "spotlight", name: "Spotlight", mood: "Große Karten mit Farbverlauf" },
];

/** Link styles as live previews (demo profile with photos). */
export function LinkStylePicker({ value, content, onPick }: { value: string; content: Record<string, unknown>; onPick: (v: string) => void }) {
  const demo = { ...DEMO_PAGES.links, design: content.design };
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {LINK_STYLE_INFO.map((st) => {
        const active = value === st.id;
        return (
          <div key={st.id} role="button" tabIndex={0} onClick={() => onPick(st.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(st.id); } }} aria-pressed={active}
            className={cn("group relative cursor-pointer overflow-hidden rounded-[20px] border text-left transition duration-300", active ? "border-brand ring-2 ring-brand/40" : "border-edge hover:-translate-y-1 hover:border-edge-strong hover:shadow-lift")}>
            <LiveThumb type="links" content={{ ...demo, linkStyle: st.id }} className="aspect-[4/5] w-full" />
            {active && <span className="absolute right-2.5 top-2.5 grid size-7 place-items-center rounded-full bg-brand text-on-brand shadow-lg"><Check className="size-4" /></span>}
            <span className="block border-t border-edge bg-surface px-3 py-2.5">
              <span className="block text-[14px] font-semibold">{st.name}</span>
              <span className="line-clamp-1 block text-[12px] text-faint">{st.mood}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
