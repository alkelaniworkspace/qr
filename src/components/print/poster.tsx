"use client";

import { useLayoutEffect, useRef } from "react";
import { Star, UtensilsCrossed, Wifi, Heart } from "lucide-react";
import type { PosterSettings } from "@/lib/print/types";
import { posterSize } from "@/lib/print/types";

/**
 * A print poster that scales to any paper size. All measures use `cqmin`
 * (1 % of the poster's shorter side), so the same design works from a 5 cm
 * sticker to an A0 poster, portrait or landscape.
 */

interface Props {
  settings: PosterSettings;
  qrSvg: string;
  className?: string;
  /** render at an exact physical size (print) instead of filling the parent width */
  physical?: boolean;
}

/** Poster unit: 1 % of the shorter side, times an auto-fit factor (see useAutoFit). */
const u = (n: number) => `calc(${n} * var(--fit, 1) * 1cqmin)`;

/**
 * Shrinks the whole design (all units) until nothing overflows the poster:
 * long headlines on a 5 cm sticker no longer push the QR code out of frame.
 */
function useAutoFit(deps: unknown[]) {
  const box = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const fits = () => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return true;
      const slack = Math.max(1.5, r.height * 0.004);
      for (const c of el.querySelectorAll<HTMLElement>("*")) {
        const b = c.getBoundingClientRect();
        if (b.width === 0 && b.height === 0) continue;
        if (b.bottom > r.bottom + 0.5 || b.right > r.right + 0.5 || b.top < r.top - 0.5 || b.left < r.left - 0.5) return false;
        // a layout box (frame, column) whose content is taller/wider than itself
        if (c.children.length && c.clientHeight > 20 && (c.scrollHeight > c.clientHeight + slack || c.scrollWidth > c.clientWidth + slack)) return false;
      }
      return el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1;
    };
    const run = () => {
      let fit = 1;
      el.style.setProperty("--fit", "1");
      while (!fits() && fit > 0.42) {
        fit = Math.round((fit - 0.03) * 100) / 100;
        el.style.setProperty("--fit", String(fit));
      }
      el.dataset.fit = String(fit);
    };
    run();
    const ro = new ResizeObserver(() => run());
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return box;
}

function Qr({ svg, size, border }: { svg: string; size: number; border?: string }) {
  return (
    <div
      style={{ width: u(size), padding: u(size * 0.06), background: "#ffffff", borderRadius: u(size * 0.08), boxShadow: `0 ${u(1)} ${u(4)} rgba(0,0,0,0.18)`, border: border ?? "none", flexShrink: 0 }}
      className="[&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function Cta({ text, bg, fg, size = 4.2 }: { text: string; bg: string; fg: string; size?: number }) {
  if (!text) return null;
  return (
    <div style={{ background: bg, color: fg, fontSize: u(size), padding: `${u(size * 0.55)} ${u(size * 1.4)}`, borderRadius: u(size * 2), fontWeight: 700, whiteSpace: "nowrap" }}>
      {text}
    </div>
  );
}

const headlineStyle = (size: number, color: string): React.CSSProperties => ({
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: u(size),
  lineHeight: 1,
  letterSpacing: "-0.03em",
  color,
  margin: 0,
  overflowWrap: "anywhere",
});

const textStyle = (size: number, color: string, opacity = 0.85): React.CSSProperties => ({ fontSize: u(size), lineHeight: 1.35, color, opacity, margin: 0, whiteSpace: "pre-line" });

const onColor = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? "#111111" : "#ffffff";
};

export function Poster({ settings: p, qrSvg, className, physical }: Props) {
  const box = useAutoFit([p, qrSvg]);
  const { w, h } = posterSize(p);
  const bleed = p.bleed ? 3 : 0;
  const W = w + bleed * 2;
  const H = h + bleed * 2;
  const landscape = w > h * 1.12;
  const onAccent = onColor(p.accent);

  const pad = u(7);
  const column: React.CSSProperties = { display: "flex", flexDirection: landscape ? "row" : "column", alignItems: "center", justifyContent: "space-between", gap: u(5), height: "100%", padding: pad, boxSizing: "border-box", textAlign: landscape ? "left" : "center" };
  const textBlock: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: landscape ? "flex-start" : "center", gap: u(2.6), flex: landscape ? "1 1 0" : undefined, minWidth: 0 };
  const qrSize = landscape ? 62 : 54;

  let body: React.ReactNode;
  switch (p.template) {
    case "bold":
      body = (
        <div style={{ display: "flex", flexDirection: landscape ? "row" : "column", height: "100%" }}>
          <div style={{ background: p.accent, color: onAccent, flex: landscape ? "1 1 0" : "0 0 46%", padding: pad, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: u(2) }}>
            <p style={textStyle(3.2, onAccent, 0.85)}>{p.footer}</p>
            <h1 style={headlineStyle(13, onAccent)}>{p.headline}</h1>
          </div>
          <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: u(3.5), padding: pad }}>
            <Qr svg={qrSvg} size={landscape ? 58 : 48} />
            <p style={{ ...textStyle(3.6, p.text), textAlign: "center", maxWidth: u(70) }}>{p.subline}</p>
            <Cta text={p.cta} bg={p.accent} fg={onAccent} />
          </div>
        </div>
      );
      break;
    case "split":
      body = (
        <div style={{ display: "flex", flexDirection: landscape ? "row" : "column", height: "100%" }}>
          <div style={{ flex: "1 1 0", background: p.accent, color: onAccent, padding: pad, display: "flex", flexDirection: "column", justifyContent: "center", gap: u(3) }}>
            <h1 style={headlineStyle(11, onAccent)}>{p.headline}</h1>
            <p style={textStyle(3.6, onAccent)}>{p.subline}</p>
            <div><Cta text={p.cta} bg={onAccent} fg={p.accent} /></div>
          </div>
          <div style={{ flex: "1 1 0", display: "flex", alignItems: "center", justifyContent: "center", padding: pad, flexDirection: "column", gap: u(3) }}>
            <Qr svg={qrSvg} size={landscape ? 64 : 52} />
            <p style={textStyle(3, p.text, 0.7)}>{p.footer}</p>
          </div>
        </div>
      );
      break;
    case "luxe":
      body = (
        <div style={{ position: "absolute", inset: u(4), border: `${u(0.5)} solid ${p.accent}`, padding: u(1.2) }}>
          <div style={{ border: `${u(0.25)} solid ${p.accent}`, height: "100%", boxSizing: "border-box" }}>
            <div style={column}>
              <div style={textBlock}>
                <p style={{ ...textStyle(2.8, p.accent, 1), fontWeight: 700 }}>{p.footer}</p>
                <h1 style={headlineStyle(10, p.accent)}>{p.headline}</h1>
                <p style={textStyle(3.4, p.text, 0.8)}>{p.subline}</p>
              </div>
              <Qr svg={qrSvg} size={qrSize - 4} border={`${u(0.6)} solid ${p.accent}`} />
              {!landscape && <p style={{ ...textStyle(3, p.accent, 1), fontWeight: 700 }}>{p.cta}</p>}
            </div>
          </div>
        </div>
      );
      break;
    case "minimal":
      body = (
        <div style={{ ...column, justifyContent: "center", gap: u(6) }}>
          <div style={textBlock}>
            <h1 style={headlineStyle(7.5, p.text)}>{p.headline}</h1>
            <div style={{ width: u(10), height: u(0.8), background: p.accent }} />
            <p style={textStyle(3.2, p.text, 0.7)}>{p.subline}</p>
          </div>
          <Qr svg={qrSvg} size={landscape ? 60 : 56} />
          {!landscape && <p style={{ ...textStyle(2.8, p.text, 0.6) }}>{p.footer}</p>}
        </div>
      );
      break;
    case "ticket":
      body = (
        <div style={{ position: "absolute", inset: u(5), border: `${u(0.8)} dashed ${p.accent}`, borderRadius: u(4) }}>
          <div style={column}>
            <div style={textBlock}>
              <p style={{ ...textStyle(3, p.accent, 1), fontWeight: 800 }}>{p.footer}</p>
              <h1 style={{ ...headlineStyle(20, p.accent), lineHeight: 0.85 }}>{p.headline}</h1>
              <p style={textStyle(3.4, p.text)}>{p.subline}</p>
            </div>
            <Qr svg={qrSvg} size={landscape ? 56 : 46} />
            {!landscape && <Cta text={p.cta} bg={p.accent} fg={onAccent} />}
          </div>
        </div>
      );
      break;
    default: {
      const icon =
        p.template === "menu" ? <UtensilsCrossed style={{ width: "55%", height: "55%" }} strokeWidth={1.8} />
        : p.template === "wifi" ? <Wifi style={{ width: "58%", height: "58%" }} strokeWidth={2} />
        : p.template === "social" ? <Heart style={{ width: "52%", height: "52%" }} strokeWidth={2} />
        : null;
      body = (
        <div style={column}>
          <div style={textBlock}>
            {p.template === "review" && (
              <div style={{ display: "flex", gap: u(1.2), color: "#e9b949" }}>
                {Array.from({ length: 5 }, (_, i) => <Star key={i} style={{ width: u(7), height: u(7) }} fill="currentColor" strokeWidth={0} />)}
              </div>
            )}
            {icon && (
              <div style={{ width: u(16), height: u(16), borderRadius: "50%", background: p.accent, color: onAccent, display: "grid", placeItems: "center" }}>{icon}</div>
            )}
            {p.template === "classic" && <p style={{ ...textStyle(3, p.accent, 1), fontWeight: 800 }}>{p.footer}</p>}
            <h1 style={headlineStyle(landscape ? 9 : 10.5, p.template === "classic" ? p.text : p.accent)}>{p.headline}</h1>
            <p style={textStyle(3.6, p.text)}>{p.subline}</p>
            {p.info && <p style={{ ...textStyle(3.6, p.text, 1), fontWeight: 700 }}>{p.info}</p>}
            {landscape && <Cta text={p.cta} bg={p.accent} fg={onAccent} />}
          </div>
          <Qr svg={qrSvg} size={qrSize} />
          {!landscape && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: u(2.4) }}>
              <Cta text={p.cta} bg={p.accent} fg={onAccent} />
              {p.template !== "classic" && <p style={textStyle(2.8, p.text, 0.65)}>{p.footer}</p>}
            </div>
          )}
        </div>
      );
    }
  }

  return (
    <div
      className={className}
      style={{
        width: physical ? `${W}mm` : "100%",
        height: physical ? `${H}mm` : undefined,
        aspectRatio: physical ? undefined : `${W} / ${H}`,
        background: p.bg,
        color: p.text,
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
        padding: bleed ? (physical ? `${bleed}mm` : `${(bleed / W) * 100}%`) : 0,
        fontFamily: "var(--font-sans)",
      }}
    >
      <div ref={box} data-poster-box style={{ position: "relative", width: "100%", height: "100%", containerType: "size", overflow: "hidden" }}>{body}</div>
    </div>
  );
}
