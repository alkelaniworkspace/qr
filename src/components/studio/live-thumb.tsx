"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { CodeTypeId } from "@/lib/codes/types";
import { cn } from "@/lib/cn";

// Loaded lazily so the form module stays light (and free of page CSS).
const HostedPage = dynamic(() => import("@/components/pages/hosted-pages").then((m) => m.HostedPage), { ssr: false });

/**
 * A live hosted page scaled to exactly fill its box. Hovering (or touching)
 * the card glides slowly down through the whole page and back up on leave.
 * Mounts only when scrolled into view.
 */
export function LiveThumb({ type, content, className }: { type: CodeTypeId; content: Record<string, unknown>; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const glide = useRef<HTMLDivElement>(null);
  const page = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / 390));
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShow(true); io.disconnect(); } }, { rootMargin: "300px" });
    io.observe(el);
    return () => { ro.disconnect(); io.disconnect(); };
  }, []);

  const start = () => {
    const g = glide.current, p = page.current, b = box.current;
    if (!g || !p || !b) return;
    const dist = Math.max(0, p.offsetHeight * scale - b.clientHeight);
    const secs = Math.min(9, Math.max(2.2, dist / 260));
    g.style.transition = `transform ${secs}s cubic-bezier(.45,.05,.4,1)`;
    g.style.transform = `translateY(${-dist}px)`;
  };
  const stop = () => {
    const g = glide.current;
    if (!g) return;
    g.style.transition = "transform .9s cubic-bezier(.2,.8,.2,1)";
    g.style.transform = "translateY(0)";
  };

  return (
    <div ref={box} onPointerEnter={start} onPointerLeave={stop} onTouchEnd={() => window.setTimeout(stop, 2500)}
      className={cn("relative overflow-hidden bg-hi/[0.04]", className)}>
      {show && scale > 0 && (
        <div ref={glide} className="pointer-events-none absolute inset-x-0 top-0 will-change-transform" inert>
          <div ref={page} className="mp-preview w-[390px] origin-top-left" style={{ transform: `scale(${scale})` }}>
            <HostedPage code={{ id: "preview", slug: "preview", name: "", type, mode: "static", status: "active", branding: false, content }} />
          </div>
        </div>
      )}
    </div>
  );
}
