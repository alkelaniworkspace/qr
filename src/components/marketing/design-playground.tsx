"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { renderQrSvg, patternGlyph, eyeGlyph } from "@/lib/qr/render";
import { DEFAULT_STYLE, STYLE_PRESETS, normalizeStyle, type DotStyle, type EyeBallStyle, type EyeFrameStyle, type QrStyle } from "@/lib/qr/style";
import { cn } from "@/lib/cn";

const DOTS: DotStyle[] = ["square", "rounded", "dots", "classy", "diamond", "fluid", "mini", "vertical", "horizontal", "bubble"];
const EYES: [EyeFrameStyle, EyeBallStyle][] = [["square", "square"], ["rounded", "rounded"], ["circle", "circle"], ["leaf", "leaf"], ["octagon", "octagon"], ["shield", "shield"]];

/** Try-it-yourself: one live code, every knob one click away. */
export function DesignPlayground() {
  const [style, setStyle] = useState<QrStyle>(normalizeStyle({ ...DEFAULT_STYLE, ...STYLE_PRESETS[1].style }));
  const [preset, setPreset] = useState(STYLE_PRESETS[1].id);
  const svg = useMemo(() => renderQrSvg("https://qlick.codes/r/design", style, { size: 420, id: "play" }), [style]);
  const ink = style.fill.type === "solid" ? style.fill.color : "#191919";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
      <div className="card relative grid aspect-square place-items-center overflow-hidden rounded-[36px] p-10">
        <AnimatePresence mode="popLayout">
          <motion.div key={svg.length + preset + style.dots + style.eyeFrame} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.04 }} transition={{ type: "spring", stiffness: 200, damping: 22 }} className="w-full max-w-[380px] [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
        </AnimatePresence>
      </div>
      <div className="space-y-6">
        <div>
          <p className="mb-2.5 text-sm font-semibold text-dim">Fertige Looks</p>
          <div className="flex flex-wrap gap-2">
            {STYLE_PRESETS.slice(0, 12).map((p) => (
              <button key={p.id} type="button" onClick={() => { setPreset(p.id); setStyle(normalizeStyle({ ...DEFAULT_STYLE, ...p.style })); }} className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition", preset === p.id ? "border-brand bg-brand text-on-brand" : "border-edge hover:border-edge-strong")}>
                <span className="size-3.5 rounded-full border border-hi/20" style={{ background: p.style.background as string }}><span className="m-[3px] block size-2 rounded-full" style={{ background: p.style.fill?.type === "solid" ? p.style.fill.color : "#000" }} /></span>
                {p.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2.5 text-sm font-semibold text-dim">Muster</p>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
            {DOTS.map((d) => (
              <button key={d} type="button" title={d} onClick={() => setStyle({ ...style, dots: d })} className={cn("grid aspect-square place-items-center rounded-xl border bg-white p-1.5 transition", style.dots === d ? "border-brand ring-2 ring-brand/40" : "border-edge hover:scale-105")} dangerouslySetInnerHTML={{ __html: patternGlyph(d, ink === "#ffffff" ? "#191919" : ink) }} />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2.5 text-sm font-semibold text-dim">Ecken</p>
          <div className="grid grid-cols-6 gap-2">
            {EYES.map(([f, b]) => (
              <button key={f} type="button" onClick={() => setStyle({ ...style, eyeFrame: f, eyeBall: b })} className={cn("grid aspect-square place-items-center rounded-xl border bg-white p-2 transition", style.eyeFrame === f ? "border-brand ring-2 ring-brand/40" : "border-edge hover:scale-105")} dangerouslySetInnerHTML={{ __html: eyeGlyph(f, b, "#191919") }} />
            ))}
          </div>
        </div>
        <Link href="/studio" className="inline-flex items-center gap-2 font-semibold hover:underline">Mit Logo, Farbverlauf und Rahmen weiter im Studio <ArrowRight className="size-4" /></Link>
      </div>
    </div>
  );
}
