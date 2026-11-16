"use client";

import { useEffect, useRef, useState } from "react";
import { QrCode, Smartphone } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * The always-visible preview column of the editor: a phone that fits the
 * window height exactly (no inner jumps, no page scroll needed) and the QR
 * code, switchable. The phone keeps its own scroll position while you type.
 */
export function LivePane({ phone, code, prefer }: { phone?: React.ReactNode; code: React.ReactNode; prefer: "phone" | "code" }) {
  const [view, setView] = useState<"phone" | "code">(phone ? prefer : "code");
  const [prev, setPrev] = useState(prefer);
  if (prev !== prefer) {
    setPrev(prefer);
    setView(phone ? prefer : "code");
  }
  const box = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(0);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setH(Math.floor(e.contentRect.height)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const frameH = Math.max(420, Math.min(h, 820));
  const frameW = Math.round(frameH * 0.47);
  const scale = (frameW - 14) / 390;
  const showPhone = !!phone && view === "phone";

  return (
    <div className="flex h-full flex-col">
      {phone && (
        <div className="mb-3 flex items-center gap-2 pr-12 lg:pr-0">
          <div className="grid flex-1 grid-cols-2 gap-1 rounded-2xl border border-edge bg-surface p-1">
            {([["phone", "Handy-Seite", Smartphone], ["code", "QR-Code", QrCode]] as const).map(([v, label, Icon]) => (
              <button key={v} type="button" onClick={() => setView(v)} className={cn("inline-flex h-9 items-center justify-center gap-1.5 rounded-xl text-[13px] font-semibold transition", view === v ? "bg-fg text-bg shadow-sm" : "text-dim hover:text-fg")}>
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>
          <span className="hidden h-11 items-center gap-1.5 rounded-2xl border border-edge bg-surface px-3 lg:inline-flex text-[12px] font-semibold text-dim"><span className="size-2 animate-pulse rounded-full bg-lime shadow-[0_0_8px_#bdfb04]" /> Live</span>
        </div>
      )}
      <div ref={box} className={cn("min-h-0 flex-1", showPhone ? "grid place-items-start justify-center" : "overflow-y-auto [scrollbar-width:none]")}>
        {showPhone ? (
          <div className="relative overflow-hidden rounded-[46px] border-[7px] border-[#16181b] bg-black shadow-[0_40px_80px_-30px_rgba(0,0,0,.55),0_0_0_1px_rgba(255,255,255,.06)]" style={{ width: frameW, height: frameH }}>
            <div className="absolute left-1/2 top-2 z-10 h-[22px] w-[30%] -translate-x-1/2 rounded-full bg-black" />
            <div className="h-full overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-width:none]">
              <div className="mp-preview" style={{ width: 390, zoom: scale }}>{phone}</div>
            </div>
          </div>
        ) : code}
      </div>
    </div>
  );
}
