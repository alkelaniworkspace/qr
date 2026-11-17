"use client";

import { useEffect, useRef, useState } from "react";
import type { FormDef } from "@/lib/forms/types";
import { FormView } from "./form-view";
import { cn } from "@/lib/cn";

const W = 400;

/**
 * A live form on a sheet of paper, tilted on its table. Hover straightens and
 * lifts the sheet and glides through the whole form.
 */
export function FormThumb({ def, tilt = -3, className, mode }: { def: FormDef; tilt?: number; className?: string; mode?: "light" | "dark" }) {
  const box = useRef<HTMLDivElement>(null);
  const glide = useRef<HTMLDivElement>(null);
  const page = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / W));
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShow(true); io.disconnect(); } }, { rootMargin: "300px" });
    io.observe(el);
    return () => { ro.disconnect(); io.disconnect(); };
  }, []);
  const start = () => {
    const g = glide.current, p = page.current, b = box.current;
    if (!g || !p || !b) return;
    const dist = Math.max(0, p.offsetHeight * scale - b.clientHeight);
    g.style.transition = `transform ${Math.min(7, Math.max(1.6, dist / 220))}s cubic-bezier(.45,.05,.4,1)`;
    g.style.transform = `translateY(${-dist}px)`;
  };
  const stop = () => {
    const g = glide.current;
    if (!g) return;
    g.style.transition = "transform .8s cubic-bezier(.2,.8,.2,1)";
    g.style.transform = "translateY(0)";
  };
  return (
    <div className={cn("group/thumb [perspective:1400px]", className)} onPointerEnter={start} onPointerLeave={stop}>
      <div
        className="relative transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] [transform-style:preserve-3d] [transform:rotate(var(--tilt))_rotateX(6deg)] group-hover/thumb:[transform:rotate(0deg)_translateY(-8px)_scale(1.02)]"
        style={{ "--tilt": `${tilt}deg` } as React.CSSProperties}
      >
        {/* stacked sheets behind */}
        <div aria-hidden className="absolute inset-0 translate-x-2 translate-y-2 rotate-[2.5deg] rounded-[14px] bg-white/70 shadow-md ring-1 ring-black/5 transition duration-500 group-hover/thumb:translate-x-3 group-hover/thumb:rotate-[4deg] dark:bg-white/10" />
        <div ref={box} className="relative aspect-[3/4] overflow-hidden rounded-[14px] bg-white shadow-[0_30px_60px_-24px_rgba(0,0,0,.55),0_2px_6px_rgba(0,0,0,.12)] ring-1 ring-black/10">
          {show && scale > 0 && (
            <div ref={glide} className="will-change-transform">
              <div ref={page} style={{ width: W, transform: `scale(${scale})`, transformOrigin: "top left" }}>
                <FormView thumb preview force={mode} form={{ slug: "thumb", title: def.title, description: def.description, fields: def.fields, settings: { ...def.settings, layout: "classic" }, status: "open", branding: false }} />
              </div>
            </div>
          )}
          {/* paper sheen */}
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,.18),transparent_35%,transparent_65%,rgba(0,0,0,.06))]" />
        </div>
      </div>
    </div>
  );
}
