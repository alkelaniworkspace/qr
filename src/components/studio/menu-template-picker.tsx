"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { MENU_TEMPLATES, SAMPLE_MENU, type MenuTemplate } from "@/lib/menu-templates";
import dynamic from "next/dynamic";
import { cn } from "@/lib/cn";

// Loaded lazily so the form module stays light (and free of page CSS).
const HostedPage = dynamic(() => import("@/components/pages/hosted-pages").then((m) => m.HostedPage), { ssr: false });

/** Renders the real page only when the card scrolls into view (20 live previews stay cheap). */
function LivePreview({ t, content }: { t: MenuTemplate; content: Record<string, unknown> }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShow(true); io.disconnect(); } }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="pointer-events-none relative h-[230px] overflow-hidden bg-hi/[0.04]" inert>
      {show && (
        <div className="mp-preview absolute left-0 top-0 w-[390px] origin-top-left" style={{ transform: "scale(0.42)" }}>
          <HostedPage code={{ id: "preview", slug: "preview", name: t.name, type: "menu", mode: "static", status: "active", branding: false, content: { ...content, template: t.id, design: t.design } }} />
        </div>
      )}
    </div>
  );
}

export function MenuTemplatePicker({ value, content, onPick }: { value: string; content: Record<string, unknown>; onPick: (t: MenuTemplate) => void }) {
  // Previews use the owner's dishes; with an almost empty menu, a sample menu shows the template properly.
  const items = ((content.sections as { items?: unknown[] }[]) ?? []).reduce((n, sec) => n + (sec.items?.length ?? 0), 0);
  const base = items >= 3 ? { ...SAMPLE_MENU, ...content } : { ...content, ...SAMPLE_MENU, logo: content.logo, cover: content.cover, name: content.name || SAMPLE_MENU.name };
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {MENU_TEMPLATES.map((t) => {
        const active = (value || "") === t.id;
        return (
          <div key={t.id} role="button" tabIndex={0} onClick={() => onPick(t)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(t); } }} aria-pressed={active} className={cn("group cursor-pointer overflow-hidden rounded-2xl border text-left transition", active ? "border-brand ring-2 ring-brand/30" : "border-edge hover:-translate-y-0.5 hover:border-edge-strong")}>
            <LivePreview t={t} content={base} />
            <span className="flex items-start gap-2 border-t border-edge px-3 py-2.5">
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[14px] font-semibold">{t.name}{t.engine === "showcase" && <span className="rounded-full bg-brand px-1.5 py-px text-[10px] font-bold text-on-brand">Neu</span>}</span>
                <span className="line-clamp-2 block text-[12px] leading-snug text-faint">{t.mood}</span>
              </span>
              {active && <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand text-on-brand"><Check className="size-3" /></span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}
