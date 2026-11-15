"use client";

import { useEffect, useRef, useState } from "react";
import { Circle, Download, Loader2, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { ColorInput } from "@/components/studio/content-form";
import { safeFilename } from "@/lib/qr/export";
import { cn } from "@/lib/cn";

/**
 * Animated QR clips for Instagram/TikTok stories, posts and in-store screens.
 * Drawn on a canvas, so the same frames are shown in the preview and recorded
 * into the video file (MP4 where the browser supports it, otherwise WebM).
 */

type FormatId = "story" | "post" | "screen";
type StyleId = "pulse" | "scan" | "pop" | "orbit";

const FORMATS: Record<FormatId, { label: string; w: number; h: number }> = {
  story: { label: "Story 9:16", w: 1080, h: 1920 },
  post: { label: "Post 1:1", w: 1080, h: 1080 },
  screen: { label: "Bildschirm 16:9", w: 1920, h: 1080 },
};
const STYLES: { id: StyleId; label: string }[] = [
  { id: "pulse", label: "Puls" },
  { id: "scan", label: "Scanner" },
  { id: "pop", label: "Pop-in" },
  { id: "orbit", label: "Orbit" },
];
const DURATION = 5; // seconds per loop

interface Texts { headline: string; sub: string; cta: string; footer: string; bg: string; fg: string; accent: string }

const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
const spring = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return 1 - Math.cos(x * Math.PI * 4.5) * Math.exp(-x * 6);
};

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/);
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
  return lines.slice(0, 3);
}

function draw(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, img: HTMLImageElement | null, s: StyleId, x: Texts) {
  const p = (t % DURATION) / DURATION; // 0..1 loop
  const m = Math.min(W, H);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = x.bg;
  ctx.fillRect(0, 0, W, H);

  // soft moving light
  const gx = W * (0.5 + 0.35 * Math.sin(p * Math.PI * 2));
  const grd = ctx.createRadialGradient(gx, H * 0.3, 0, gx, H * 0.3, m * 0.8);
  grd.addColorStop(0, `${x.accent}33`);
  grd.addColorStop(1, `${x.accent}00`);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  const landscape = W > H * 1.2;
  const tall = H > W * 1.4;
  const qrSize = landscape ? H * 0.62 : m * (tall ? 0.62 : 0.4);
  const qrX = landscape ? W * 0.68 - qrSize / 2 : W / 2 - qrSize / 2;
  const qrY = landscape ? H / 2 - qrSize / 2 : H * (tall ? 0.36 : 0.27);
  const intro = Math.min(1, t / 1.2);

  // headline
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = x.fg;
  ctx.font = `800 ${m * 0.085}px Inter, Helvetica, Arial, sans-serif`;
  ctx.textAlign = landscape ? "left" : "center";
  const tx = landscape ? W * 0.08 : W / 2;
  const lines = wrap(ctx, x.headline, landscape ? W * 0.42 : W * 0.86);
  const lh = m * 0.095;
  const headTop = landscape ? H / 2 - lines.length * lh * 0.6 : qrY - m * (tall ? 0.2 : 0.09) - (lines.length - 1) * lh;
  lines.forEach((l, i) => {
    const k = ease((t - 0.15 * i) / 0.7);
    ctx.globalAlpha = k;
    ctx.fillText(l, tx, headTop + i * lh + (1 - k) * m * 0.04);
  });
  ctx.globalAlpha = 1;
  if (x.sub) {
    ctx.font = `500 ${m * 0.036}px Inter, Helvetica, Arial, sans-serif`;
    ctx.globalAlpha = 0.75 * ease((t - 0.5) / 0.6);
    const subY = landscape ? headTop + lines.length * lh + m * 0.02 : qrY + qrSize + m * (tall ? 0.14 : 0.09);
    wrap(ctx, x.sub, landscape ? W * 0.42 : W * 0.8).forEach((l, i) => ctx.fillText(l, tx, subY + i * m * 0.048));
    ctx.globalAlpha = 1;
  }

  // QR card with animation
  const cx = qrX + qrSize / 2;
  const cy = qrY + qrSize / 2;
  let scale = 1;
  let rot = 0;
  if (s === "pop") scale = 0.4 + 0.6 * spring(t / 1.6);
  else scale = 0.85 + 0.15 * ease(intro);
  if (s === "pulse") scale *= 1 + 0.025 * Math.sin(p * Math.PI * 4);
  if (s === "orbit") rot = Math.sin(p * Math.PI * 2) * 0.04;

  // rings
  if (s === "pulse" || s === "orbit") {
    for (let i = 0; i < 3; i++) {
      const k = (p * 2 + i / 3) % 1;
      ctx.strokeStyle = x.accent;
      ctx.globalAlpha = (1 - k) * 0.5;
      ctx.lineWidth = m * 0.006;
      const r = qrSize * (0.55 + k * 0.45);
      ctx.beginPath();
      ctx.roundRect(cx - r, cy - r, r * 2, r * 2, r * 0.25);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  if (s === "orbit") {
    for (let i = 0; i < 6; i++) {
      const a = p * Math.PI * 2 + (i / 6) * Math.PI * 2;
      ctx.fillStyle = i % 2 ? x.fg : x.accent;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * qrSize * 0.72, cy + Math.sin(a) * qrSize * 0.72, m * 0.012, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = m * 0.05;
  ctx.shadowOffsetY = m * 0.02;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(-qrSize / 2, -qrSize / 2, qrSize, qrSize, qrSize * 0.09);
  ctx.fill();
  ctx.shadowColor = "transparent";
  if (img) {
    const pad = qrSize * 0.06;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, -qrSize / 2 + pad, -qrSize / 2 + pad, qrSize - pad * 2, qrSize - pad * 2);
  }
  if (s === "scan") {
    const y = -qrSize / 2 + qrSize * (0.5 - 0.45 * Math.cos(p * Math.PI * 4));
    const lg = ctx.createLinearGradient(0, y - qrSize * 0.12, 0, y);
    lg.addColorStop(0, `${x.accent}00`);
    lg.addColorStop(1, `${x.accent}55`);
    ctx.fillStyle = lg;
    ctx.fillRect(-qrSize / 2, y - qrSize * 0.12, qrSize, qrSize * 0.12);
    ctx.fillStyle = x.accent;
    ctx.fillRect(-qrSize / 2 - qrSize * 0.04, y - m * 0.004, qrSize * 1.08, m * 0.008);
  }
  ctx.restore();

  // CTA pill
  if (x.cta) {
    ctx.font = `800 ${m * 0.045}px Inter, Helvetica, Arial, sans-serif`;
    const tw = ctx.measureText(x.cta).width;
    const bw = tw + m * 0.12;
    const bh = m * 0.1;
    const bounce = Math.abs(Math.sin(p * Math.PI * 4)) * m * 0.012;
    const bx = landscape ? W * 0.08 : W / 2 - bw / 2;
    const by = (landscape ? H * 0.72 : qrY + qrSize + (x.sub ? m * (tall ? 0.26 : 0.17) : m * 0.08)) - bounce;
    ctx.globalAlpha = ease((t - 0.8) / 0.5);
    ctx.fillStyle = x.accent;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, bh / 2);
    ctx.fill();
    ctx.fillStyle = x.bg;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(x.cta, bx + bw / 2, by + bh / 2 + m * 0.003);
    ctx.globalAlpha = 1;
  }
  if (x.footer && (tall || landscape)) {
    ctx.font = `600 ${m * 0.03}px Inter, Helvetica, Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = x.fg;
    ctx.globalAlpha = 0.6;
    ctx.fillText(x.footer, W / 2, H - m * 0.06);
    ctx.globalAlpha = 1;
  }
}

function pickMime(): { mime: string; ext: string } | null {
  if (typeof MediaRecorder === "undefined") return null;
  for (const [mime, ext] of [["video/mp4;codecs=avc1", "mp4"], ["video/mp4", "mp4"], ["video/webm;codecs=vp9", "webm"], ["video/webm", "webm"]] as const) {
    if (MediaRecorder.isTypeSupported(mime)) return { mime, ext };
  }
  return null;
}

export function MotionStudio({ qrSvg, name, defaults }: { qrSvg: string; name: string; defaults: Texts }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [format, setFormat] = useState<FormatId>("story");
  const [style, setStyle] = useState<StyleId>("pulse");
  const [x, setX] = useState<Texts>(defaults);
  const [playing, setPlaying] = useState(true);
  const [recording, setRecording] = useState(false);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const start = useRef(0);
  const f = FORMATS[format];

  useEffect(() => {
    const url = URL.createObjectURL(new Blob([qrSvg], { type: "image/svg+xml" }));
    const image = new Image();
    image.onload = () => setImg(image);
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [qrSvg]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let raf = 0;
    const tick = () => {
      const t = playing ? (performance.now() - start.current) / 1000 : 2.2;
      draw(ctx, f.w, f.h, t, img, style, x);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [f, img, style, x, playing]);

  async function record() {
    const canvas = canvasRef.current;
    const kind = pickMime();
    if (!canvas || !kind) return setError("Dein Browser kann leider keine Videos aufnehmen. Bitte Chrome, Edge oder Safari nutzen.");
    setRecording(true);
    setPlaying(true);
    start.current = performance.now();
    const stream = canvas.captureStream(30);
    const rec = new MediaRecorder(stream, { mimeType: kind.mime, videoBitsPerSecond: 8_000_000 });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const done = new Promise<void>((r) => (rec.onstop = () => r()));
    rec.start();
    await new Promise((r) => setTimeout(r, DURATION * 1000 * 2));
    rec.stop();
    await done;
    const url = URL.createObjectURL(new Blob(chunks, { type: kind.mime }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeFilename(name)}-${format}-${style}.${kind.ext}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setRecording(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
      <div className="space-y-4">
        <div className="card p-5">
          <p className="mb-3 font-display text-base">Format</p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(FORMATS) as FormatId[]).map((id) => (
              <button key={id} type="button" onClick={() => setFormat(id)} className={cn("rounded-xl border px-2 py-2.5 text-xs font-semibold transition", format === id ? "border-brand bg-hi/5 text-fg" : "border-edge text-dim hover:border-edge-strong")}>{FORMATS[id].label}</button>
            ))}
          </div>
          <p className="mb-3 mt-5 font-display text-base">Animation</p>
          <div className="grid grid-cols-4 gap-2">
            {STYLES.map((s) => (
              <button key={s.id} type="button" onClick={() => { setStyle(s.id); start.current = performance.now(); }} className={cn("rounded-xl border px-2 py-2.5 text-xs font-semibold transition", style === s.id ? "border-brand bg-hi/5 text-fg" : "border-edge text-dim hover:border-edge-strong")}>{s.label}</button>
            ))}
          </div>
        </div>
        <div className="card space-y-3 p-5">
          <p className="font-display text-base">Texte</p>
          <Input value={x.headline} maxLength={50} onChange={(e) => setX({ ...x, headline: e.target.value })} placeholder="Überschrift" />
          <Input value={x.sub} maxLength={90} onChange={(e) => setX({ ...x, sub: e.target.value })} placeholder="Untertitel" />
          <div className="grid grid-cols-2 gap-2">
            <Input value={x.cta} maxLength={24} onChange={(e) => setX({ ...x, cta: e.target.value })} placeholder="Button" />
            <Input value={x.footer} maxLength={40} onChange={(e) => setX({ ...x, footer: e.target.value })} placeholder="Fußzeile" />
          </div>
          <div className="grid grid-cols-3 gap-3 pt-1">
            <label className="text-xs font-semibold text-dim">Grund<ColorInput value={x.bg} onChange={(c) => setX({ ...x, bg: c })} /></label>
            <label className="text-xs font-semibold text-dim">Text<ColorInput value={x.fg} onChange={(c) => setX({ ...x, fg: c })} /></label>
            <label className="text-xs font-semibold text-dim">Akzent<ColorInput value={x.accent} onChange={(c) => setX({ ...x, accent: c })} /></label>
          </div>
        </div>
      </div>
      <div className="card card-glow p-5">
        <div className="grid place-items-center rounded-2xl bg-hi/5 p-6">
          <canvas ref={canvasRef} width={f.w} height={f.h} className="h-auto w-full rounded-2xl shadow-lift" style={{ maxWidth: `min(100%, calc(64vh * ${f.w / f.h}))` }} />
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-[auto_1fr]">
          <Button type="button" variant="secondary" size="lg" onClick={() => setPlaying((v) => !v)} disabled={recording}>{playing ? <Pause className="size-4" /> : <Play className="size-4" />}</Button>
          <Button type="button" size="lg" onClick={record} disabled={recording}>
            {recording ? <><Circle className="size-3 animate-pulse fill-current text-rose" /> Nimmt auf … 10 s</> : <><Download className="size-4" /> Video herunterladen</>}
          </Button>
        </div>
        <p className="mt-3 text-xs text-faint">{f.w} × {f.h} px · {DURATION * 2} Sekunden, nahtlose Schleife. Ideal für Instagram, TikTok, WhatsApp-Status und Bildschirme im Laden.</p>
        {error && <p className="mt-2 text-xs text-rose">{error}</p>}
        {recording && <p className="mt-2 flex items-center gap-2 text-xs text-dim"><Loader2 className="size-3 animate-spin" /> Bitte dieses Fenster geöffnet lassen.</p>}
      </div>
    </div>
  );
}

