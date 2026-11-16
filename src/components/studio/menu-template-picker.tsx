"use client";

import { Check } from "lucide-react";
import { MENU_TEMPLATES, type MenuTemplate } from "@/lib/menu-templates";
import { DEMO_MENU } from "@/lib/samples";
import { cn } from "@/lib/cn";
import { LiveThumb } from "./live-thumb";

/**
 * Menu templates with live previews. Previews always show the demo restaurant
 * with photos; picking a template only changes the look of the owner's menu.
 */
export function MenuTemplatePicker({ value, content, onPick }: { value: string; content: Record<string, unknown>; onPick: (t: MenuTemplate) => void }) {
  const logo = content.logo;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4">
      {MENU_TEMPLATES.map((t) => {
        const active = (value || "") === t.id;
        return (
          <div key={t.id} role="button" tabIndex={0} onClick={() => onPick(t)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(t); } }} aria-pressed={active}
            className={cn("group relative cursor-pointer overflow-hidden rounded-[20px] border text-left transition duration-300", active ? "border-brand ring-2 ring-brand/40" : "border-edge hover:-translate-y-1 hover:border-edge-strong hover:shadow-lift")}>
            <LiveThumb type="menu" content={{ ...DEMO_MENU, ...(logo ? { logo } : {}), template: t.id, design: t.design }} className="aspect-[9/14] w-full" />
            {active && <span className="absolute right-2.5 top-2.5 grid size-7 place-items-center rounded-full bg-brand text-on-brand shadow-lg"><Check className="size-4" /></span>}
            <span className="flex items-start gap-2 border-t border-edge bg-surface px-3 py-2.5">
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[14px] font-semibold">{t.name}{t.engine === "showcase" && <span className="rounded-full bg-brand px-1.5 py-px text-[10px] font-bold text-on-brand">Neu</span>}</span>
                <span className="line-clamp-1 block text-[12px] leading-snug text-faint">{t.mood}</span>
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
