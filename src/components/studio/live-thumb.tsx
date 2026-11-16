"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { CodeTypeId } from "@/lib/codes/types";
import { cn } from "@/lib/cn";

// Loaded lazily so the form module stays light (and free of page CSS).
const HostedPage = dynamic(() => import("@/components/pages/hosted-pages").then((m) => m.HostedPage), { ssr: false });

/**
 * A live hosted page scaled to exactly fill its box (no empty strip on the
 * side, whatever the column width). Mounts only when scrolled into view.
 */
export function LiveThumb({ type, content, className, scroll = false }: { type: CodeTypeId; content: Record<string, unknown>; className?: string; scroll?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / 390));
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShow(true); io.disconnect(); } }, { rootMargin: "300px" });
    io.observe(el);
    return () => { ro.disconnect(); io.disconnect(); };
  }, []);
  return (
    <div ref={ref} className={cn("relative overflow-hidden bg-hi/[0.04]", scroll ? "overflow-y-auto [scrollbar-width:none]" : "pointer-events-none", className)} inert={!scroll}>
      {show && scale > 0 && (
        <div className="mp-preview absolute left-0 top-0 w-[390px] origin-top-left" style={{ transform: `scale(${scale})` }}>
          <HostedPage code={{ id: "preview", slug: "preview", name: "", type, mode: "static", status: "active", branding: false, content }} />
        </div>
      )}
    </div>
  );
}
