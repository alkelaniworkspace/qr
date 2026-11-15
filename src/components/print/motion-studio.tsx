"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Circle, Download, Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { ColorInput } from "@/components/studio/content-form";
import { safeFilename } from "@/lib/qr/export";
import { renderMp4, saveBlob } from "@/lib/video/mp4";
import { cn } from "@/lib/cn";

/**
 * Animated QR clips for Instagram/TikTok stories, posts and in-store screens.
 * Drawn on a canvas, so the preview and the recorded video are the same frames
 * (MP4 where the browser can, otherwise WebM).
 *
 * Layout is computed from measured text blocks first, then the QR and the space
 * the effects may use around it. Effects never reach into the text.
 * Every loop starts and ends on the same frame, so the clip repeats seamlessly.
 */

type FormatId = "story" | "portrait" | "post" | "screen";
type StyleId = "pulse" | "scan" | "pop" | "orbit" | "frame" | "float";
type BgId = "glow" | "grid" | "solid";

const FORMATS: Record<FormatId, { label: string; hint: string; w: number; h: number }> = {
  story: { label: "Story", hint: "9:16", w: 1080, h: 1920 },
  portrait: { label: "Feed", hint: "4:5", w: 1080, h: 1350 },
  post: { label: "Post", hint: "1:1", w: 1080, h: 1080 },
  screen: { label: "Screen", hint: "16:9", w: 1920, h: 1080 },
};
const STYLES: { id: StyleId; label: string }[] = [
  { id: "pulse", label: "Puls" },
  { id: "scan", label: "Scanner" },
  { id: "frame", label: "Lichtrahmen" },
  { id: "orbit", label: "Orbit" },
  { id: "pop", label: "Pop-in" },
  { id: "float", label: "Schweben" },
];
const BGS: { id: BgId; label: string }[] = [
  { id: "glow", label: "Licht" },
  { id: "grid", label: "Raster" },
  { id: "solid", label: "Uni" },
];
const PALETTES = [
  { name: "Night", bg: "#141414", fg: "#ffffff", accent: "#bdfb04" },
  { name: "Lime", bg: "#bdfb04", fg: "#141414", accent: "#141414" },
  { name: "Papier", bg: "#f4f1e8", fg: "#141414", accent: "#e5332a" },
  { name: "Marine", bg: "#0e1a3d", fg: "#ffffff", accent: "#e9b949" },
  { name: "Bordeaux", bg: "#3b0e1a", fg: "#fff7ec", accent: "#ffb38a" },
  { name: "Violett", bg: "#1d1240", fg: "#ffffff", accent: "#9b8cff" },
];
const LOOP = 6; // seconds per seamless loop
const FONT = "'Inter Variable', Inter, 'Helvetica Neue', Arial, sans-serif";

export interface Texts { headline: string; sub: string; cta: string; footer: string; bg: string; fg: string; accent: string }

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
const easeInOut = (t: number) => { const x = clamp01(t); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const spring = (t: number) => { const x = clamp01(t); return 1 - Math.cos(x * Math.PI * 3.2) * Math.exp(-x * 5.5); };

function hexA(hex: string, a: number) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1].replace(/\s+\S*$/, "")} …`;
    return kept;
  }
  return lines;
}

/** Largest font size (down to `min`) at which `text` fits in `maxLines` lines of `maxW`. */
function fitLines(ctx: CanvasRenderingContext2D, text: string, weight: number, start: number, min: number, maxW: number, maxLines: number) {
  let size = start;
  for (; size > min; size *= 0.94) {
    ctx.font = `${weight} ${size}px ${FONT}`;
    const words = text.trim().split(/\s+/);
    const longest = Math.max(0, ...words.map((w) => ctx.measureText(w).width));
    const lines = wrap(ctx, text, maxW, 99);
    if (lines.length <= maxLines && longest <= maxW) break;
  }
  ctx.font = `${weight} ${size}px ${FONT}`;
  return { size, lines: text.trim() ? wrap(ctx, text, maxW, maxLines) : [] };
}

interface Layout {
  landscape: boolean;
  head: { lines: string[]; size: number; x: number; y: number; lh: number; align: CanvasTextAlign };
  sub: { lines: string[]; size: number; x: number; y: number; lh: number };
  cta: { x: number; y: number; w: number; h: number; size: number } | null;
  qr: { x: number; y: number; s: number; room: number };
  footer: { x: number; y: number; size: number } | null;
}

function layout(ctx: CanvasRenderingContext2D, W: number, H: number, x: Texts): Layout {
  const m = Math.min(W, H);
  const landscape = W > H * 1.2;
  const pad = m * 0.085;

  if (landscape) {
    const colW = W * 0.44;
    const left = W * 0.075;
    const head = fitLines(ctx, x.headline, 800, m * 0.11, m * 0.05, colW, 3);
    const sub = fitLines(ctx, x.sub, 500, m * 0.042, m * 0.028, colW, 3);
    const lh = head.size * 1.04;
    const slh = sub.size * 1.35;
    const ctaH = x.cta ? m * 0.095 : 0;
    const gap = m * 0.05;
    const blockH = head.lines.length * lh + (sub.lines.length ? gap * 0.6 + sub.lines.length * slh : 0) + (ctaH ? gap + ctaH : 0);
    let y = (H - blockH) / 2;
    const headY = y;
    y += head.lines.length * lh;
    const subY = y + gap * 0.6;
    if (sub.lines.length) y = subY + sub.lines.length * slh;
    ctx.font = `800 ${m * 0.04}px ${FONT}`;
    const cta = x.cta ? { x: left, y: y + gap, w: ctx.measureText(x.cta).width + m * 0.12, h: ctaH, size: m * 0.04 } : null;
    const s = H * 0.6;
    const room = Math.min(H * 0.1, (H - s) / 2 - pad * 0.4);
    return {
      landscape,
      head: { lines: head.lines, size: head.size, x: left, y: headY, lh, align: "left" },
      sub: { lines: sub.lines, size: sub.size, x: left, y: subY, lh: slh },
      cta,
      qr: { x: W * 0.74 - s / 2, y: H / 2 - s / 2, s, room },
      footer: x.footer ? { x: left, y: H - pad * 0.7, size: m * 0.028 } : null,
    };
  }

  const tall = H > W * 1.5;
  const maxW = W - pad * 2;
  const head = fitLines(ctx, x.headline, 800, m * (tall ? 0.11 : 0.088), m * 0.055, maxW, tall ? 3 : 2);
  const sub = fitLines(ctx, x.sub, 500, m * (tall ? 0.042 : 0.036), m * 0.028, maxW * 0.92, 2);
  const lh = head.size * 1.04;
  const slh = sub.size * 1.35;
  const ctaH = x.cta ? m * (tall ? 0.1 : 0.088) : 0;
  const footerH = x.footer ? m * 0.06 : 0;
  const gap = m * (tall ? 0.06 : 0.04);
  const headH = head.lines.length * lh;
  const subH = sub.lines.length * slh;
  const avail = H - pad * 2 - footerH;
  // QR as large as the remaining space allows, with room for the effects around it.
  let s = W * (tall ? 0.6 : H > W * 1.1 ? 0.5 : 0.42);
  const roomFor = (size: number) => Math.max(gap, size * 0.11);
  const total = (size: number) => headH + (sub.lines.length ? gap * 0.5 + subH : 0) + roomFor(size) * 2 + size + (ctaH ? gap * 0.6 + ctaH : 0);
  while (total(s) > avail && s > m * 0.25) s *= 0.96;
  const room = roomFor(s);
  let y = pad + (avail - total(s)) / 2;
  const headY = y;
  y += headH;
  const subY = y + gap * 0.5;
  if (sub.lines.length) y = subY + subH;
  const qrY = y + room;
  y = qrY + s + room;
  ctx.font = `800 ${ctaH * 0.42}px ${FONT}`;
  const ctaW = x.cta ? ctx.measureText(x.cta).width + ctaH * 1.3 : 0;
  return {
    landscape,
    head: { lines: head.lines, size: head.size, x: W / 2, y: headY, lh, align: "center" },
    sub: { lines: sub.lines, size: sub.size, x: W / 2, y: subY, lh: slh },
    cta: x.cta ? { x: W / 2 - ctaW / 2, y: y + gap * 0.6, w: ctaW, h: ctaH, size: ctaH * 0.42 } : null,
    qr: { x: W / 2 - s / 2, y: qrY, s, room },
    footer: x.footer ? { x: W / 2, y: H - pad * 0.75, size: m * 0.03 } : null,
  };
}

function drawBackground(ctx: CanvasRenderingContext2D, W: number, H: number, p: number, bg: BgId, x: Texts) {
  const m = Math.min(W, H);
  ctx.fillStyle = x.bg;
  ctx.fillRect(0, 0, W, H);
  if (bg === "glow") {
    const a = p * Math.PI * 2;
    const blobs = [
      [W * (0.5 + 0.32 * Math.sin(a)), H * (0.28 + 0.06 * Math.cos(a)), m * 0.85, 0.22],
      [W * (0.5 - 0.3 * Math.sin(a)), H * (0.78 - 0.05 * Math.cos(a)), m * 0.7, 0.12],
    ] as const;
    for (const [bx, by, r, al] of blobs) {
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, r);
      g.addColorStop(0, hexA(x.accent, al));
      g.addColorStop(1, hexA(x.accent, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
  } else if (bg === "grid") {
    const step = m * 0.06;
    const off = (p * step) % step;
    ctx.fillStyle = hexA(x.fg, 0.1);
    for (let gx = -step + off; gx < W + step; gx += step) {
      for (let gy = -step + off; gy < H + step; gy += step) {
        ctx.beginPath();
        ctx.arc(gx, gy, m * 0.0035, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const v = ctx.createRadialGradient(W / 2, H / 2, m * 0.2, W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, hexA(x.bg, 0));
    v.addColorStop(1, hexA(x.bg, 0.95));
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }
}

/** Point on the perimeter of a rounded square (approximate), u in [0,1). */
function onSquare(cx: number, cy: number, half: number, u: number) {
  const k = ((u % 1) + 1) % 1 * 4;
  const side = Math.floor(k);
  const f = k - side;
  const a = -half + f * half * 2;
  return side === 0 ? [cx + a, cy - half] : side === 1 ? [cx + half, cy + a] : side === 2 ? [cx - a, cy + half] : [cx - half, cy - a];
}

function draw(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, img: HTMLImageElement | null, s: StyleId, bg: BgId, x: Texts, L: Layout) {
  const p = (t % LOOP) / LOOP; // 0..1 loop progress
  const m = Math.min(W, H);
  // Enter during the first 18 %, leave during the last 7 %: frame 0 == last frame.
  const enter = (delay: number) => easeOut((p - delay) / 0.12);
  const leave = 1 - easeInOut((p - 0.93) / 0.07);
  const k = (delay: number) => Math.min(enter(delay), leave);

  ctx.clearRect(0, 0, W, H);
  drawBackground(ctx, W, H, p, bg, x);

  // Headline
  ctx.textBaseline = "top";
  ctx.textAlign = L.head.align;
  ctx.fillStyle = x.fg;
  ctx.font = `800 ${L.head.size}px ${FONT}`;
  L.head.lines.forEach((line, i) => {
    const a = k(0.02 + i * 0.03);
    ctx.globalAlpha = a;
    ctx.fillText(line, L.head.x, L.head.y + i * L.head.lh + (1 - a) * m * 0.03);
  });
  // Subline
  ctx.font = `500 ${L.sub.size}px ${FONT}`;
  L.sub.lines.forEach((line, i) => {
    const a = k(0.08 + i * 0.02);
    ctx.globalAlpha = a * 0.78;
    ctx.fillText(line, L.sub.x, L.sub.y + i * L.sub.lh + (1 - a) * m * 0.02);
  });
  ctx.globalAlpha = 1;

  // QR + effects
  const { s: qs, room } = L.qr;
  const cx = L.qr.x + qs / 2;
  const cy = L.qr.y + qs / 2;
  const qa = k(0.05);
  let scale = 0.9 + 0.1 * qa;
  let dy = 0;
  let rot = 0;
  if (s === "pop") scale = Math.min(spring((p - 0.04) / 0.22), leave) * 0.98 + 0.02;
  if (s === "pulse") scale *= 1 + 0.022 * Math.sin(p * Math.PI * 6);
  if (s === "float") { dy = Math.sin(p * Math.PI * 2) * room * 0.35; rot = Math.sin(p * Math.PI * 2 + 1) * 0.025; }

  const half = qs / 2;
  if (s === "pulse") {
    for (let i = 0; i < 3; i++) {
      const q = (p * 3 + i / 3) % 1;
      ctx.strokeStyle = x.accent;
      ctx.globalAlpha = (1 - q) * 0.55 * qa;
      ctx.lineWidth = m * 0.005;
      const r = half + q * room * 0.9;
      ctx.beginPath();
      ctx.roundRect(cx - r, cy - r, r * 2, r * 2, qs * 0.09 + q * room * 0.4);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  if (s === "orbit") {
    const off = half + room * 0.5;
    for (let i = 0; i < 8; i++) {
      const [ox, oy] = onSquare(cx, cy, off, p + i / 8);
      ctx.fillStyle = i % 2 ? x.fg : x.accent;
      ctx.globalAlpha = qa * (i % 2 ? 0.5 : 1);
      ctx.beginPath();
      ctx.arc(ox, oy, m * (i % 2 ? 0.007 : 0.011), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  if (s === "frame" && "createConicGradient" in ctx) {
    const g = ctx.createConicGradient(p * Math.PI * 2, cx, cy);
    g.addColorStop(0, hexA(x.accent, 0));
    g.addColorStop(0.18, hexA(x.accent, 1));
    g.addColorStop(0.32, hexA(x.accent, 0));
    g.addColorStop(0.5, hexA(x.accent, 0));
    g.addColorStop(0.68, hexA(x.accent, 1));
    g.addColorStop(0.82, hexA(x.accent, 0));
    g.addColorStop(1, hexA(x.accent, 0));
    const r = half + room * 0.38;
    ctx.globalAlpha = qa;
    ctx.save();
    ctx.shadowColor = x.accent;
    ctx.shadowBlur = m * 0.03;
    ctx.strokeStyle = g;
    ctx.lineWidth = m * 0.012;
    ctx.beginPath();
    ctx.roundRect(cx - r, cy - r, r * 2, r * 2, qs * 0.14);
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = hexA(x.fg, 0.12);
    ctx.lineWidth = m * 0.003;
    ctx.beginPath();
    ctx.roundRect(cx - r, cy - r, r * 2, r * 2, qs * 0.14);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.save();
  ctx.translate(cx, cy + dy);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  ctx.globalAlpha = s === "pop" ? 1 : qa;
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = m * 0.05;
  ctx.shadowOffsetY = m * 0.018;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(-half, -half, qs, qs, qs * 0.09);
  ctx.fill();
  ctx.shadowColor = "transparent";
  if (img) {
    const pad = qs * 0.06;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, -half + pad, -half + pad, qs - pad * 2, qs - pad * 2);
  }
  if (s === "scan") {
    const sy = -half + qs * (0.5 - 0.44 * Math.cos(p * Math.PI * 4));
    const band = qs * 0.14;
    const lg = ctx.createLinearGradient(0, sy - band, 0, sy);
    lg.addColorStop(0, hexA(x.accent, 0));
    lg.addColorStop(1, hexA(x.accent, 0.35));
    ctx.fillStyle = lg;
    ctx.fillRect(-half, Math.max(-half, sy - band), qs, Math.min(band, sy + half));
    ctx.fillStyle = x.accent;
    ctx.shadowColor = x.accent;
    ctx.shadowBlur = m * 0.02;
    ctx.fillRect(-half - qs * 0.03, sy - m * 0.003, qs * 1.06, m * 0.006);
    ctx.shadowColor = "transparent";
    // corner brackets
    const g = qs * 0.06;
    const len = qs * 0.14;
    ctx.strokeStyle = x.accent;
    ctx.lineWidth = m * 0.009;
    ctx.lineCap = "round";
    for (const [sx, sy2] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
      const ex = sx * (half + g);
      const ey = sy2 * (half + g);
      ctx.beginPath();
      ctx.moveTo(ex, ey - sy2 * len);
      ctx.lineTo(ex, ey);
      ctx.lineTo(ex - sx * len, ey);
      ctx.stroke();
    }
  }
  ctx.restore();
  ctx.globalAlpha = 1;

  // CTA pill
  if (L.cta) {
    const c = L.cta;
    const a = k(0.12);
    const bounce = s === "pop" || s === "pulse" ? Math.max(0, Math.sin(p * Math.PI * 6)) * m * 0.008 : 0;
    ctx.globalAlpha = a;
    ctx.fillStyle = x.accent;
    ctx.beginPath();
    ctx.roundRect(c.x, c.y - bounce + (1 - a) * m * 0.02, c.w, c.h, c.h / 2);
    ctx.fill();
    ctx.fillStyle = x.bg;
    ctx.font = `800 ${c.size}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(x.cta, c.x + c.w / 2, c.y + c.h / 2 - bounce + (1 - a) * m * 0.02 + c.size * 0.04);
    ctx.globalAlpha = 1;
  }
  if (L.footer) {
    ctx.font = `600 ${L.footer.size}px ${FONT}`;
    ctx.textAlign = L.landscape ? "left" : "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = x.fg;
    ctx.globalAlpha = 0.55 * k(0.15);
    ctx.fillText(x.footer, L.footer.x, L.footer.y);
    ctx.globalAlpha = 1;
  }
}


export function MotionStudio({ qrSvg, name, defaults }: { qrSvg: string; name: string; defaults: Texts }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [format, setFormat] = useState<FormatId>("story");
  const [style, setStyle] = useState<StyleId>("pulse");
  const [bg, setBg] = useState<BgId>("glow");
  const [loops, setLoops] = useState(2);
  const [x, setX] = useState<Texts>(defaults);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState<number | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const start = useRef(0);
  const f = FORMATS[format];
  const recording = progress !== null;
  const set = (patch: Partial<Texts>) => setX((prev) => ({ ...prev, ...patch }));

  useEffect(() => {
    let alive = true;
    const fonts = document.fonts;
    Promise.all([fonts.load(`800 40px ${FONT}`), fonts.load(`500 40px ${FONT}`), fonts.load(`600 40px ${FONT}`)])
      .catch(() => undefined)
      .finally(() => alive && setFontsReady(true));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const url = URL.createObjectURL(new Blob([qrSvg], { type: "image/svg+xml" }));
    const image = new Image();
    let alive = true;
    image.onload = () => { if (alive) setImg(image); URL.revokeObjectURL(url); };
    image.onerror = () => URL.revokeObjectURL(url);
    image.src = url;
    return () => { alive = false; };
  }, [qrSvg]);

  // Measuring needs a context; an offscreen one keeps layout independent of the visible canvas.
  const L = useMemo(() => {
    if (typeof document === "undefined") return null;
    const ctx = document.createElement("canvas").getContext("2d");
    return ctx ? layout(ctx, f.w, f.h, x) : null;
    // fontsReady: re-measure once the real font is in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f, x, fontsReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !L) return;
    let raf = 0;
    const tick = () => {
      const t = playing ? (performance.now() - start.current) / 1000 : LOOP * 0.45;
      draw(ctx, f.w, f.h, t, img, style, bg, x, L);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [f, img, style, bg, x, playing, L]);

  const restart = () => { start.current = performance.now(); setPlaying(true); };

  /** Frame-by-frame MP4 (WebCodecs), independent of the preview and of tab focus. */
  async function record() {
    if (!L) return;
    setError(null);
    setProgress(0);
    try {
      const blob = await renderMp4({
        width: f.w,
        height: f.h,
        fps: 30,
        seconds: LOOP * loops,
        draw: (ctx, t) => draw(ctx, f.w, f.h, t, img, style, bg, x, L),
        onProgress: setProgress,
      });
      saveBlob(blob, `${safeFilename(name)}-${format}-${style}.${blob.type.includes("mp4") ? "mp4" : "webm"}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Das Video konnte nicht erzeugt werden.");
    } finally {
      setProgress(null);
    }
  }

  const chip = (active: boolean) => cn("rounded-xl border px-2 py-2.5 text-xs font-semibold transition", active ? "border-brand bg-brand text-on-brand" : "border-edge text-dim hover:border-edge-strong hover:text-fg");

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-6">
      <div className="order-2 min-w-0 space-y-4 lg:order-1">
        <div className="card space-y-5 p-4 sm:p-5">
          <div>
            <p className="mb-3 font-display text-base">Format</p>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(FORMATS) as FormatId[]).map((id) => (
                <button key={id} type="button" disabled={recording} onClick={() => setFormat(id)} className={chip(format === id)}>
                  <span className="block">{FORMATS[id].label}</span>
                  <span className={cn("block text-[10px] font-medium", format === id ? "opacity-70" : "text-faint")}>{FORMATS[id].hint}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-3 font-display text-base">Animation</p>
            <div className="grid grid-cols-3 gap-2">
              {STYLES.map((s) => (
                <button key={s.id} type="button" disabled={recording} onClick={() => { setStyle(s.id); restart(); }} className={chip(style === s.id)}>{s.label}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-3 font-display text-base">Hintergrund</p>
            <div className="grid grid-cols-3 gap-2">
              {BGS.map((b) => (
                <button key={b.id} type="button" disabled={recording} onClick={() => setBg(b.id)} className={chip(bg === b.id)}>{b.label}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="card space-y-3 p-4 sm:p-5">
          <p className="font-display text-base">Texte</p>
          <Input aria-label="Überschrift" value={x.headline} maxLength={50} onChange={(e) => set({ headline: e.target.value })} placeholder="Überschrift" />
          <Input aria-label="Untertitel" value={x.sub} maxLength={90} onChange={(e) => set({ sub: e.target.value })} placeholder="Untertitel (optional)" />
          <div className="grid grid-cols-2 gap-2">
            <Input aria-label="Button" value={x.cta} maxLength={24} onChange={(e) => set({ cta: e.target.value })} placeholder="Button" />
            <Input aria-label="Fußzeile" value={x.footer} maxLength={40} onChange={(e) => set({ footer: e.target.value })} placeholder="Fußzeile" />
          </div>
        </div>

        <div className="card space-y-4 p-4 sm:p-5">
          <p className="font-display text-base">Farben</p>
          <div className="grid grid-cols-6 gap-1.5">
            {PALETTES.map((p) => {
              const active = x.bg === p.bg && x.accent === p.accent;
              return (
                <button key={p.name} type="button" title={p.name} aria-label={`Farbschema ${p.name}`} onClick={() => set({ bg: p.bg, fg: p.fg, accent: p.accent })} className={cn("relative aspect-square overflow-hidden rounded-xl border transition hover:scale-105", active ? "border-brand ring-2 ring-brand/30" : "border-edge")}>
                  <span className="absolute inset-0" style={{ background: p.bg }} />
                  <span className="absolute bottom-1.5 right-1.5 size-3 rounded-full" style={{ background: p.accent }} />
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <label className="min-w-0 space-y-1 text-xs font-semibold text-dim"><span>Grund</span><ColorInput value={x.bg} onChange={(c) => set({ bg: c })} /></label>
            <label className="min-w-0 space-y-1 text-xs font-semibold text-dim"><span>Text</span><ColorInput value={x.fg} onChange={(c) => set({ fg: c })} /></label>
            <label className="min-w-0 space-y-1 text-xs font-semibold text-dim"><span>Akzent</span><ColorInput value={x.accent} onChange={(c) => set({ accent: c })} /></label>
          </div>
        </div>
      </div>

      <div className="order-1 min-w-0 lg:order-2 lg:sticky lg:top-40 lg:self-start">
        <div className="card card-glow p-4 sm:p-5">
          <div className="relative grid place-items-center overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_50%_40%,rgb(var(--glow)/0.08),transparent_70%)] p-4 sm:p-8">
            <canvas
              ref={canvasRef}
              width={f.w}
              height={f.h}
              className="block h-auto w-full rounded-[18px] shadow-lift ring-1 ring-black/10"
              style={{ maxWidth: `min(100%, calc(min(62vh, 640px) * ${f.w / f.h}))` }}
            />
            {recording && (
              <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/75 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur">
                <Circle className="size-2.5 animate-pulse fill-rose text-rose" /> REC
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button type="button" variant="secondary" onClick={() => setPlaying((v) => !v)} disabled={recording} aria-label={playing ? "Pause" : "Abspielen"}>{playing ? <Pause className="size-4" /> : <Play className="size-4" />}</Button>
            <Button type="button" variant="secondary" onClick={restart} disabled={recording} aria-label="Von vorn"><RotateCcw className="size-4" /></Button>
            <div className="ml-auto flex rounded-full border border-edge bg-hi/5 p-1" role="group" aria-label="Länge">
              {[1, 2, 3].map((n) => (
                <button key={n} type="button" disabled={recording} onClick={() => setLoops(n)} className={cn("rounded-full px-3 py-1.5 text-xs font-bold transition", loops === n ? "bg-brand text-on-brand" : "text-dim hover:text-fg")}>{LOOP * n} s</button>
              ))}
            </div>
          </div>

          <Button type="button" size="lg" onClick={record} disabled={recording} className="relative mt-3 w-full overflow-hidden">
            {recording && <span className="absolute inset-y-0 left-0 bg-lime/35 transition-[width] duration-100" style={{ width: `${(progress ?? 0) * 100}%` }} />}
            <span className="relative inline-flex items-center gap-2">
              {recording ? <>Video wird erzeugt … {Math.round((progress ?? 0) * 100)} %</> : <><Download className="size-4" /> Als MP4 herunterladen</>}
            </span>
          </Button>
          <p className="mt-3 text-xs leading-relaxed text-faint">
            {f.w} × {f.h} px · {LOOP * loops} Sekunden · nahtlose Schleife. Ideal für Instagram, TikTok, WhatsApp-Status und Bildschirme im Laden.
            
          </p>
          {error && <p className="mt-2 text-xs text-rose">{error}</p>}
        </div>
      </div>
    </div>
  );
}
