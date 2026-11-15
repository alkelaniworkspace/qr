"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, Loader2, QrCode, Smartphone, XCircle } from "lucide-react";
import { checkScannability } from "@/lib/qr/scannability";
import { decodeSvgInBrowser } from "@/lib/qr/decode";
import { downloadPng, downloadSvg } from "@/lib/qr/export";
import type { QrStyle } from "@/lib/qr/style";
import { cn } from "@/lib/cn";

type DecodeState = "checking" | "ok" | "fail";

interface Props {
  svg: string;
  data: string;
  style: QrStyle;
  name: string;
  footer?: React.ReactNode;
  /** live mobile page preview, for types with a hosted page */
  phone?: React.ReactNode;
}

function ScoreRing({ score, tone }: { score: number; tone: "ok" | "warn" | "bad" }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const color = tone === "ok" ? "#3ee6a8" : tone === "warn" ? "#e9b949" : "#ff5d6c";
  return (
    <svg viewBox="0 0 56 56" className="size-14 shrink-0 -rotate-90" aria-hidden>
      <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
      <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} style={{ transition: "stroke-dashoffset .6s cubic-bezier(.2,.7,.2,1)", filter: `drop-shadow(0 0 6px ${color})` }} />
    </svg>
  );
}

export function Preview({ svg, data, style, name, footer, phone }: Props) {
  const check = useMemo(() => checkScannability(style), [style]);
  const [decode, setDecode] = useState<{ svg: string; state: DecodeState }>({ svg: "", state: "checking" });
  const [pngSize, setPngSize] = useState(2048);
  const [view, setView] = useState<"code" | "phone">("code");

  // Real decode test, debounced so dragging a slider stays smooth.
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      const ok = await decodeSvgInBrowser(svg, data).catch(() => false);
      if (!cancelled) setDecode({ svg, state: ok ? "ok" : "fail" });
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [svg, data]);

  const decodeState: DecodeState = decode.svg === svg ? decode.state : "checking";
  const score = decodeState === "fail" ? Math.min(check.score, 30) : check.score;
  const tone = decodeState === "fail" || check.level === "bad" ? "bad" : check.level === "risky" ? "warn" : "ok";
  const showPhone = phone && view === "phone";

  return (
    <div className="card card-glow p-4">
      {phone && (
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-[14px] border border-edge bg-bg/60 p-1">
          {([["code", "Code", QrCode], ["phone", "Handy-Seite", Smartphone]] as const).map(([v, label, Icon]) => (
            <button key={v} type="button" onClick={() => setView(v)} className={cn("inline-flex items-center justify-center gap-1.5 rounded-[10px] py-2 text-xs font-bold uppercase tracking-wide transition", view === v ? "bg-brand text-on-brand" : "text-dim hover:text-fg")}>
              <Icon className="size-3.5" /> {label}
            </button>
          ))}
        </div>
      )}

      {showPhone ? (
        <div className="grid place-items-center rounded-2xl bg-bg/60 py-6">
          <div className="relative h-[640px] w-[300px] overflow-hidden rounded-[40px] border-[6px] border-[#2a2e33] bg-black shadow-lift">
            <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
            <div className="h-full overflow-y-auto overflow-x-hidden pt-7 [scrollbar-width:none]">
              <div className="origin-top-left" style={{ width: 390, transform: "scale(0.738)" }}>{phone}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className={cn("relative grid aspect-square place-items-center overflow-hidden rounded-2xl p-6", style.transparent ? "checker" : "bg-bg/70")}>
          <div className="pointer-events-none absolute inset-10 rounded-full bg-brand/10 blur-3xl" />
          <div className="relative w-full max-w-[330px] transition-all duration-300 [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
          <div className="pointer-events-none absolute inset-x-5 h-0.5 rounded-full bg-brand/80 shadow-[0_0_14px_3px_rgb(var(--glow)/0.55)] animate-scan" />
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-edge bg-bg/40 p-3.5">
        <div className="flex items-center gap-3.5">
          <ScoreRing score={score} tone={tone} />
          <div className="min-w-0 leading-tight">
            <p className="font-display text-xl">
              {score}<span className="text-sm text-faint">/100</span>
              <span className={cn("badge ml-2 align-middle text-night", tone === "ok" ? "bg-mint" : tone === "warn" ? "bg-gold" : "bg-rose")}>
                {tone === "ok" ? "Top" : tone === "warn" ? "Riskant" : "Kritisch"}
              </span>
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-dim">
              {decodeState === "checking" && (<><Loader2 className="size-3 animate-spin" /> Scanner testet …</>)}
              {decodeState === "ok" && (<><CheckCircle2 className="size-3 text-mint" /> Mit echtem Scanner gelesen</>)}
              {decodeState === "fail" && (<><XCircle className="size-3 text-rose" /> Scanner konnte nicht lesen</>)}
            </p>
          </div>
        </div>
        {(check.issues.length > 0 || decodeState === "fail") && (
          <ul className="mt-3 space-y-1.5 border-t border-edge pt-3">
            {decodeState === "fail" && (
              <li className="flex gap-2 text-xs text-rose"><XCircle className="mt-px size-3.5 shrink-0" /> Kontrast erhöhen oder Logo verkleinern.</li>
            )}
            {check.issues.map((i) => (
              <li key={i.message} className={cn("flex gap-2 text-xs", i.severity === "error" ? "text-rose" : "text-gold")}>
                <AlertTriangle className="mt-px size-3.5 shrink-0" /> {i.message}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
        <button
          type="button"
          onClick={() => downloadPng(svg, name, pngSize)}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-[14px] bg-elevated font-display text-[13px] font-bold uppercase tracking-wide text-fg shadow-[0_4px_0_rgba(0,0,0,0.45)] transition hover:-translate-y-0.5 active:translate-y-1 active:shadow-none"
        >
          <Download className="size-4" /> PNG
        </button>
        <select aria-label="PNG-Größe" value={pngSize} onChange={(e) => setPngSize(Number(e.target.value))} className="h-12 rounded-[14px] border border-edge bg-bg px-3 text-sm font-semibold text-fg">
          <option value={1024}>1024 px</option>
          <option value={2048}>2048 px</option>
          <option value={4096}>4096 px</option>
        </select>
        <button
          type="button"
          onClick={() => downloadSvg(svg, name)}
          className="col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-edge text-xs font-bold uppercase tracking-wide text-dim transition hover:border-hi/25 hover:text-fg"
        >
          SVG für Druck · Vektor
        </button>
      </div>
      {footer}
    </div>
  );
}
