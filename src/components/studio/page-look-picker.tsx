"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import dynamic from "next/dynamic";
import { CODE_TYPES, type CodeTypeId } from "@/lib/codes/types";
import { PAGE_LOOKS, compactDesign, resolveDesign, type StoredDesign } from "@/lib/page-design";
import { cn } from "@/lib/cn";

// Loaded lazily so the form module stays light (and free of page CSS).
const HostedPage = dynamic(() => import("@/components/pages/hosted-pages").then((m) => m.HostedPage), { ssr: false });

function Live({ type, content }: { type: CodeTypeId; content: Record<string, unknown> }) {
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
          <HostedPage code={{ id: "preview", slug: "preview", name: "", type, mode: "static", status: "active", branding: false, content }} />
        </div>
      )}
    </div>
  );
}

/** Live previews of every look with the owner's own content. */
export function PageLookPicker({ type, content, onPick }: { type: CodeTypeId; content: Record<string, unknown>; onPick: (d: StoredDesign) => void }) {
  const filled: Record<string, unknown> = { ...content };
  for (const f of CODE_TYPES[type].fields) if ("placeholder" in f && f.placeholder && !String(filled[f.name] ?? "").trim()) filled[f.name] = f.placeholder;
  const current = resolveDesign(content);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {PAGE_LOOKS.map((look) => {
        const d = resolveDesign({ design: look.design });
        const active = current.preset === d.preset && current.accent === d.accent && current.hero === d.hero && current.bg === d.bg;
        return (
          <div key={look.id} role="button" tabIndex={0} onClick={() => onPick(compactDesign({ ...d, bgImage: current.bgImage }))} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(compactDesign({ ...d, bgImage: current.bgImage })); } }} aria-pressed={active} className={cn("group cursor-pointer overflow-hidden rounded-2xl border text-left transition", active ? "border-brand ring-2 ring-brand/30" : "border-edge hover:-translate-y-0.5 hover:border-edge-strong")}>
            <Live type={type} content={{ ...filled, design: look.design }} />
            <span className="flex items-start gap-2 border-t border-edge px-3 py-2.5">
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold">{look.name}</span>
                <span className="line-clamp-2 block text-[12px] leading-snug text-faint">{look.mood}</span>
              </span>
              {active && <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand text-on-brand"><Check className="size-3" /></span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}
