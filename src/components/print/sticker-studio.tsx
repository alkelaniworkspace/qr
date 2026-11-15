"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Clapperboard, Download, FileDown, Loader2, Scissors } from "lucide-react";
import { downloadSvg, safeFilename } from "@/lib/qr/export";
import { renderMp4, saveBlob } from "@/lib/video/mp4";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { ColorInput } from "@/components/studio/content-form";
import { cn } from "@/lib/cn";

/**
 * Die-cut stickers. Each design is one self-contained SVG. With "Schnittkante"
 * on, a white contour runs around the shape: that is the cut line sticker
 * printers (Sticker Mule, Flyeralarm, …) follow. The QR always sits on its own
 * white quiet zone and nothing is ever drawn on top of it.
 */

export type StickerId = "round" | "burst" | "bubble" | "badge" | "ticket" | "window" | "tag" | "phone" | "circle" | "heart" | "hexagon" | "stamp" | "blob" | "label";

export const STICKERS: { id: StickerId; name: string }[] = [
  { id: "round", name: "Schriftring" },
  { id: "burst", name: "Stern" },
  { id: "bubble", name: "Sprechblase" },
  { id: "badge", name: "Badge" },
  { id: "ticket", name: "Ticket" },
  { id: "window", name: "Fenster" },
  { id: "tag", name: "Anhänger" },
  { id: "phone", name: "Handy" },
  { id: "circle", name: "Kreis" },
  { id: "label", name: "Etikett" },
  { id: "stamp", name: "Briefmarke" },
  { id: "hexagon", name: "Sechseck" },
  { id: "heart", name: "Herz" },
  { id: "blob", name: "Organisch" },
];

export interface StickerOptions {
  text: string;
  sub: string;
  bg: string;
  fg: string;
  accent: string;
  cut: boolean;
}

const PALETTES: { name: string; bg: string; fg: string; accent: string }[] = [
  { name: "Night", bg: "#191919", fg: "#ffffff", accent: "#bdfb04" },
  { name: "Lime", bg: "#bdfb04", fg: "#191919", accent: "#191919" },
  { name: "Weiß", bg: "#ffffff", fg: "#191919", accent: "#191919" },
  { name: "Rot", bg: "#e5332a", fg: "#ffffff", accent: "#ffd23f" },
  { name: "Marine", bg: "#10204d", fg: "#ffffff", accent: "#e9b949" },
  { name: "Rosé", bg: "#ffd6e0", fg: "#3b0e1a", accent: "#b3173a" },
  { name: "Mint", bg: "#0f9f6e", fg: "#ffffff", accent: "#ffffff" },
  { name: "Gold", bg: "#fbf4e2", fg: "#1a1a1a", accent: "#c8931e" },
];

const SIZES_CM = [3, 5, 7.5, 10] as const;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Places a rendered QR <svg> inside another SVG at x/y with the given size. */
function place(qr: string, x: number, y: number, size: number) {
  return qr
    .replace(/<svg\b([^>]*?)\swidth="[^"]*"/, "<svg$1")
    .replace(/<svg\b([^>]*?)\sheight="[^"]*"/, "<svg$1")
    .replace("<svg", `<svg x="${x}" y="${y}" width="${size}" height="${size}"`);
}

/** White quiet-zone card plus the QR inside it. */
function qrCard(qr: string, x: number, y: number, size: number, r = size * 0.1) {
  const pad = size * 0.055;
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${r}" fill="#ffffff"/>${place(qr, x + pad, y + pad, size - pad * 2)}`;
}

const FONT = `font-family="'Inter Variable', Inter, 'Helvetica Neue', Arial, sans-serif"`;

let measureCtx: CanvasRenderingContext2D | null = null;
/** Width of `text` at 100 px in the sticker font (real metrics in the browser, estimate on the server). */
function textWidth(text: string, weight = 800): number {
  if (typeof document === "undefined") return text.length * 62;
  measureCtx ??= document.createElement("canvas").getContext("2d");
  if (!measureCtx) return text.length * 62;
  measureCtx.font = `${weight} 100px 'Inter Variable', Inter, 'Helvetica Neue', Arial, sans-serif`;
  return measureCtx.measureText(text).width;
}

/** Largest font size (≤ max) at which `text` fits into `maxW`: measured, so text never leaves its shape. */
function fit(text: string, maxW: number, max: number, _legacy?: number, weight = 800) {
  void _legacy;
  return Math.max(10, Math.floor(Math.min(max, (maxW * 100) / Math.max(1, textWidth(text, weight)) * 0.96)));
}

function label(x: number, y: number, text: string, size: number, fill: string, extra = "") {
  // `extra` may carry its own font-weight: never emit the attribute twice (invalid XML breaks every export)
  const weight = /font-weight=/.test(extra) ? "" : ' font-weight="800"';
  return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" ${FONT} font-size="${size}"${weight} fill="${fill}" ${extra}>${esc(text)}</text>`;
}

/** Shape with an optional white cut contour around it. */
function shape(d: string, fill: string, cut: boolean, contour = 26) {
  const outline = cut ? `<path d="${d}" fill="#ffffff" stroke="#ffffff" stroke-width="${contour * 2}" stroke-linejoin="round"/>` : "";
  return `${outline}<path d="${d}" fill="${fill}"/>`;
}

function roundedRect(x: number, y: number, w: number, h: number, r: number) {
  return `M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + h} H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h - r} V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`;
}

function burstPath(cx: number, cy: number, rOuter: number, rInner: number, points: number) {
  // Smooth scalloped badge: quadratic curves between outer peaks.
  let d = "";
  for (let i = 0; i < points; i++) {
    const a0 = (i / points) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 0.5) / points) * Math.PI * 2 - Math.PI / 2;
    const a2 = ((i + 1) / points) * Math.PI * 2 - Math.PI / 2;
    const p0 = [cx + Math.cos(a0) * rInner, cy + Math.sin(a0) * rInner];
    const c = [cx + Math.cos(a1) * rOuter * 1.04, cy + Math.sin(a1) * rOuter * 1.04];
    const p2 = [cx + Math.cos(a2) * rInner, cy + Math.sin(a2) * rInner];
    d += `${i === 0 ? `M${p0[0].toFixed(1)} ${p0[1].toFixed(1)}` : ""} Q${c[0].toFixed(1)} ${c[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return `${d} Z`;
}

export function stickerSvg(id: StickerId, qr: string, o: StickerOptions, uid = "s") {
  const t = (o.text || "SCAN MICH").trim();
  const sub = o.sub.trim();
  const open = (w: number, h: number) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">`;

  switch (id) {
    case "round": {
      const C = 320;
      const r = 236;
      const circ = 2 * Math.PI * r;
      const unit = `${t.toUpperCase()}  •  `;
      const fs = 30;
      const unitW = unit.length * fs * 0.66;
      const reps = Math.max(2, Math.round(circ / unitW));
      const ring = unit.repeat(reps);
      return `${open(640, 640)}${o.cut ? `<circle cx="${C}" cy="${C}" r="314" fill="#ffffff"/>` : ""}<circle cx="${C}" cy="${C}" r="292" fill="${o.bg}"/><circle cx="${C}" cy="${C}" r="196" fill="none" stroke="${o.accent}" stroke-width="3" opacity="0.6"/><defs><path id="ring-${uid}" d="M${C} ${C} m0 ${-r} a${r} ${r} 0 1 1 0 ${2 * r} a${r} ${r} 0 1 1 0 ${-2 * r}"/></defs><text ${FONT} font-size="${fs}" font-weight="800" fill="${o.fg}" dominant-baseline="central"><textPath href="#ring-${uid}" textLength="${circ.toFixed(1)}" lengthAdjust="spacing">${esc(ring)}</textPath></text>${qrCard(qr, 180, 180, 280, 34)}</svg>`;
    }
    case "burst": {
      const d = burstPath(320, 320, 300, 268, 18);
      const fs = fit(t, 300, 52);
      return `${open(640, 640)}${shape(d, o.bg, o.cut, 22)}${qrCard(qr, 190, 120, 260, 30)}<rect x="${320 - Math.max(150, t.length * fs * 0.34)}" y="410" width="${2 * Math.max(150, t.length * fs * 0.34)}" height="${fs + 34}" rx="${(fs + 34) / 2}" fill="${o.accent}"/>${label(320, 410 + (fs + 34) / 2, t, fs, o.bg)}${sub ? label(320, 512, sub, fit(sub, 260, 26, 0.58), o.fg, 'font-weight="600" opacity="0.85"') : ""}</svg>`;
    }
    case "bubble": {
      const d = "M80 30 H560 a60 60 0 0 1 60 60 V540 a60 60 0 0 1 -60 60 H270 L160 700 L178 600 H80 a60 60 0 0 1 -60 -60 V90 a60 60 0 0 1 60 -60 Z";
      const fs = fit(t, 480, 60);
      return `${open(640, 720)}${shape(d, o.bg, o.cut)}${qrCard(qr, 160, 78, 320, 34)}${label(320, sub ? 482 : 500, t, fs, o.fg)}${sub ? label(320, 545, sub, fit(sub, 480, 28, 0.56), o.fg, 'font-weight="600" opacity="0.75"') : `<rect x="290" y="548" width="60" height="8" rx="4" fill="${o.accent}"/>`}</svg>`;
    }
    case "badge": {
      const d = roundedRect(20, 20, 560, 680, 90);
      const fs = fit(t, 340, 42);
      return `${open(600, 720)}${shape(d, o.bg, o.cut)}${qrCard(qr, 80, 80, 440, 44)}<rect x="90" y="560" width="420" height="88" rx="44" fill="${o.accent}"/>${label(300, 604, t.toUpperCase(), fs, o.bg, 'letter-spacing="1.5"')}${sub ? label(300, 672, sub, fit(sub, 420, 22, 0.56), o.fg, 'font-weight="600" opacity="0.7"') : ""}</svg>`;
    }
    case "ticket": {
      // Horizontal coupon with perforation and side notches.
      const W = 980;
      const H = 520;
      const d = `M60 20 H${W - 60} a40 40 0 0 1 40 40 V${H / 2 - 44} a44 44 0 0 0 0 88 V${H - 60} a40 40 0 0 1 -40 40 H60 a40 40 0 0 1 -40 -40 V${H / 2 + 44} a44 44 0 0 0 0 -88 V60 a40 40 0 0 1 40 -40 Z`;
      const fs = fit(t, 380, 92, 0.6);
      const dots = Array.from({ length: 10 }, (_, i) => `<circle cx="470" cy="${70 + i * 42}" r="7" fill="${o.fg}" opacity="0.25"/>`).join("");
      return `${open(W, H)}${shape(d, o.bg, o.cut)}${qrCard(qr, 80, 80, 360, 34)}${dots}<text x="520" y="${sub ? 230 : 260}" ${FONT} font-size="${fs}" font-weight="900" letter-spacing="-2" fill="${o.fg}" dominant-baseline="central">${esc(t)}</text>${sub ? `<text x="522" y="320" ${FONT} font-size="${fit(sub, 380, 34, 0.56)}" font-weight="600" fill="${o.fg}" opacity="0.75" dominant-baseline="central">${esc(sub)}</text>` : ""}<rect x="520" y="390" width="120" height="12" rx="6" fill="${o.accent}"/></svg>`;
    }
    case "window": {
      // Square window cling: header bar, QR, small footer.
      const d = roundedRect(20, 20, 600, 720, 48);
      const fs = fit(t.toUpperCase(), 500, 56);
      return `${open(640, 760)}${shape(d, o.bg, o.cut)}<path d="M68 20 H572 a48 48 0 0 1 48 48 V150 H20 V68 a48 48 0 0 1 48 -48 Z" fill="${o.accent}"/>${label(320, 86, t.toUpperCase(), fs, o.bg, 'letter-spacing="3"')}${qrCard(qr, 120, 190, 400, 36)}${label(320, 660, sub || "QR-Code scannen", fit(sub || "QR-Code scannen", 520, 32, 0.56), o.fg, 'font-weight="600" opacity="0.8"')}</svg>`;
    }
    case "tag": {
      const d = "M260 20 L480 140 a40 40 0 0 1 20 34 V760 a40 40 0 0 1 -40 40 H60 a40 40 0 0 1 -40 -40 V174 a40 40 0 0 1 20 -34 Z";
      const fs = fit(t, 400, 54);
      return `${open(520, 820)}${shape(d, o.bg, o.cut)}<circle cx="260" cy="130" r="30" fill="${o.cut ? "#ffffff" : "none"}" stroke="${o.accent}" stroke-width="8"/>${qrCard(qr, 70, 220, 380, 34)}${label(260, sub ? 664 : 680, t, fs, o.fg)}${sub ? label(260, 724, sub, fit(sub, 400, 26, 0.56), o.fg, 'font-weight="600" opacity="0.75"') : `<rect x="210" y="728" width="100" height="8" rx="4" fill="${o.accent}"/>`}</svg>`;
    }
    case "circle": {
      const fs = fit(t, 360, 50);
      return `${open(640, 640)}${o.cut ? `<circle cx="320" cy="320" r="314" fill="#ffffff"/>` : ""}<circle cx="320" cy="320" r="292" fill="${o.bg}"/>${qrCard(qr, 185, 112, 270, 30)}${label(320, sub ? 440 : 452, t, fs, o.fg)}${sub ? label(320, 496, sub, fit(sub, 300, 26, 0, 600), o.fg, 'font-weight="600" opacity="0.75"') : `<rect x="290" y="490" width="60" height="8" rx="4" fill="${o.accent}"/>`}</svg>`;
    }
    case "label": {
      const d = roundedRect(20, 20, 920, 380, 190);
      const fs = fit(t, 440, 84, 0, 900);
      return `${open(960, 420)}${shape(d, o.bg, o.cut)}${qrCard(qr, 70, 60, 300, 32)}<text x="410" y="${sub ? 175 : 210}" ${FONT} font-size="${fs}" font-weight="900" letter-spacing="-1" fill="${o.fg}" dominant-baseline="central">${esc(t)}</text>${sub ? `<text x="412" y="260" ${FONT} font-size="${fit(sub, 440, 34, 0, 600)}" font-weight="600" fill="${o.fg}" opacity="0.75" dominant-baseline="central">${esc(sub)}</text>` : ""}<rect x="412" y="${sub ? 310 : 280}" width="110" height="12" rx="6" fill="${o.accent}"/></svg>`;
    }
    case "stamp": {
      // postage stamp: perforated edge from small circular bites
      const W = 600, H = 740, r = 16, step = 46;
      let bites = "";
      for (let x = step / 2 + 20; x < W - 20; x += step) bites += `<circle cx="${x}" cy="20" r="${r}"/><circle cx="${x}" cy="${H - 20}" r="${r}"/>`;
      for (let y = step / 2 + 20; y < H - 20; y += step) bites += `<circle cx="20" cy="${y}" r="${r}"/><circle cx="${W - 20}" cy="${y}" r="${r}"/>`;
      const fs = fit(t, 420, 50);
      return `${open(W, H)}<defs><mask id="perf-${uid}"><rect width="${W}" height="${H}" fill="#fff"/><g fill="#000">${bites}</g></mask></defs>${o.cut ? `<rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="10" fill="#ffffff"/>` : ""}<rect x="20" y="20" width="${W - 40}" height="${H - 40}" fill="${o.bg}" mask="url(#perf-${uid})"/><rect x="58" y="58" width="${W - 116}" height="${H - 116}" fill="none" stroke="${o.accent}" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>${qrCard(qr, 110, 110, 380, 30)}${label(300, sub ? 568 : 590, t, fs, o.fg)}${sub ? label(300, 628, sub, fit(sub, 400, 26, 0, 600), o.fg, 'font-weight="600" opacity="0.75"') : ""}</svg>`;
    }
    case "hexagon": {
      const pts = Array.from({ length: 6 }, (_, k) => { const a = (Math.PI / 3) * k - Math.PI / 2; return `${(340 + Math.cos(a) * 320).toFixed(1)} ${(360 + Math.sin(a) * 320).toFixed(1)}`; });
      const d = `M${pts.join(" L")} Z`;
      const fs = fit(t, 300, 46);
      return `${open(680, 720)}${shape(d, o.bg, o.cut, 22)}${qrCard(qr, 205, 160, 270, 28)}${label(340, sub ? 486 : 500, t, fs, o.fg)}${sub ? label(340, 540, sub, fit(sub, 260, 24, 0, 600), o.fg, 'font-weight="600" opacity="0.75"') : `<rect x="310" y="538" width="60" height="8" rx="4" fill="${o.accent}"/>`}</svg>`;
    }
    case "heart": {
      const d = "M340 640 C 120 500, 30 380, 30 250 C 30 130, 120 50, 225 50 C 285 50, 320 80, 340 120 C 360 80, 395 50, 455 50 C 560 50, 650 130, 650 250 C 650 380, 560 500, 340 640 Z";
      const fs = fit(t, 260, 40);
      return `${open(680, 680)}${shape(d, o.bg, o.cut, 22)}${qrCard(qr, 220, 140, 240, 26)}${label(340, 432, t, fs, o.fg)}${sub ? label(340, 478, sub, fit(sub, 220, 22, 0, 600), o.fg, 'font-weight="600" opacity="0.75"') : ""}</svg>`;
    }
    case "blob": {
      const d = "M330 30 C 470 20, 610 90, 625 230 C 640 350, 600 430, 610 520 C 620 640, 500 700, 360 690 C 220 680, 110 700, 55 590 C 0 480, 50 400, 35 300 C 20 170, 120 40, 330 30 Z";
      const fs = fit(t, 400, 50);
      return `${open(660, 720)}${shape(d, o.bg, o.cut, 22)}<circle cx="560" cy="120" r="34" fill="${o.accent}" opacity="0.9"/>${qrCard(qr, 175, 130, 310, 34)}${label(330, sub ? 520 : 540, t, fs, o.fg)}${sub ? label(330, 578, sub, fit(sub, 360, 26, 0, 600), o.fg, 'font-weight="600" opacity="0.75"') : ""}</svg>`;
    }
    case "phone": {
      const d = roundedRect(20, 20, 440, 800, 76);
      const fs = fit(t, 360, 50);
      const q = { x: 70, y: 250, s: 340 };
      const L = 46;
      const k = 10;
      const g = 16;
      const corners = [
        `M${q.x - g} ${q.y - g + L} V${q.y - g} H${q.x - g + L}`,
        `M${q.x + q.s + g - L} ${q.y - g} H${q.x + q.s + g} V${q.y - g + L}`,
        `M${q.x + q.s + g} ${q.y + q.s + g - L} V${q.y + q.s + g} H${q.x + q.s + g - L}`,
        `M${q.x - g + L} ${q.y + q.s + g} H${q.x - g} V${q.y + q.s + g - L}`,
      ].map((c) => `<path d="${c}" fill="none" stroke="${o.accent}" stroke-width="${k}" stroke-linecap="round" stroke-linejoin="round"/>`).join("");
      return `${open(480, 840)}${shape(d, o.bg, o.cut)}<rect x="44" y="44" width="392" height="752" rx="56" fill="none" stroke="${o.fg}" stroke-opacity="0.12" stroke-width="3"/><rect x="190" y="64" width="100" height="24" rx="12" fill="${o.fg}" opacity="0.18"/>${label(240, 175, t, fs, o.fg)}${qrCard(qr, q.x, q.y, q.s, 30)}${corners}${sub ? label(240, 680, sub, fit(sub, 360, 28, 0.56), o.fg, 'font-weight="600" opacity="0.75"') : ""}<rect x="190" y="748" width="100" height="10" rx="5" fill="${o.fg}" opacity="0.3"/></svg>`;
    }
  }
}

type AnimId = "wobble" | "pop" | "float" | "flip" | "shine" | "pulse";
const ANIMS: { id: AnimId; label: string }[] = [
  { id: "pop", label: "Pop" },
  { id: "wobble", label: "Wackeln" },
  { id: "float", label: "Schweben" },
  { id: "flip", label: "Drehen" },
  { id: "shine", label: "Glanz" },
  { id: "pulse", label: "Puls" },
];
const VIDEO_FORMATS = { square: { label: "1:1", w: 1080, h: 1080 }, story: { label: "9:16", w: 1080, h: 1920 }, wide: { label: "16:9", w: 1920, h: 1080 } } as const;
type VideoFormat = keyof typeof VIDEO_FORMATS;
const LOOP = 4;

const easeOut = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const springIn = (x: number) => { const t = Math.min(1, Math.max(0, x)); return 1 - Math.cos(t * Math.PI * 3) * Math.exp(-t * 6); };

/** One frame of the animated sticker on a solid background (MP4 has no transparency). */
function drawStickerFrame(ctx: CanvasRenderingContext2D, img: HTMLImageElement, W: number, H: number, t: number, anim: AnimId, bg: string, accent: string, layer: HTMLCanvasElement) {
  const p = (t % LOOP) / LOOP;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const iw = img.naturalWidth || 600;
  const ih = img.naturalHeight || 600;
  const k = Math.min((W * 0.72) / iw, (H * 0.72) / ih);
  const w = iw * k;
  const h = ih * k;
  let sx = 1, sy = 1, rot = 0, dy = 0;
  if (anim === "pop") { const s = p < 0.3 ? springIn(p / 0.3) : p > 0.9 ? 1 - easeOut((p - 0.9) / 0.1) : 1; sx = sy = Math.max(0.001, s); }
  if (anim === "wobble") rot = Math.sin(p * Math.PI * 4) * 0.09 * (1 - Math.abs(Math.sin(p * Math.PI)) * 0.3);
  if (anim === "float") { dy = Math.sin(p * Math.PI * 2) * H * 0.03; rot = Math.sin(p * Math.PI * 2 + 1) * 0.03; }
  if (anim === "flip") sx = Math.cos(easeOut(p < 0.5 ? p * 2 : 1) * Math.PI * 2);
  if (anim === "pulse") { sx = sy = 1 + Math.sin(p * Math.PI * 4) * 0.035; }
  if (anim === "pulse") {
    for (let i = 0; i < 2; i++) {
      const q = (p * 2 + i / 2) % 1;
      ctx.strokeStyle = accent;
      ctx.globalAlpha = (1 - q) * 0.5;
      ctx.lineWidth = Math.min(W, H) * 0.008;
      ctx.beginPath();
      ctx.ellipse(W / 2, H / 2, (w / 2) * (1 + q * 0.35), (h / 2) * (1 + q * 0.35), 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  // soft shadow under the sticker
  ctx.save();
  ctx.translate(W / 2, H / 2 + dy);
  ctx.rotate(rot);
  ctx.scale(sx, sy);
  ctx.shadowColor = "rgba(0,0,0,0.28)";
  ctx.shadowBlur = Math.min(W, H) * 0.04;
  ctx.shadowOffsetY = Math.min(W, H) * 0.015;
  if (anim === "shine") {
    // sticker on its own layer, light band clipped to its pixels
    layer.width = Math.ceil(w);
    layer.height = Math.ceil(h);
    const l = layer.getContext("2d")!;
    l.clearRect(0, 0, w, h);
    l.drawImage(img, 0, 0, w, h);
    l.globalCompositeOperation = "source-atop";
    const x = -w * 0.6 + (w * 2.2) * ((p * 1.6) % 1.6);
    const g = l.createLinearGradient(x, 0, x + w * 0.35, h * 0.35);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    l.fillStyle = g;
    l.fillRect(0, 0, w, h);
    l.globalCompositeOperation = "source-over";
    ctx.drawImage(layer, -w / 2, -h / 2, w, h);
  } else {
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
  }
  ctx.restore();
}

export function StickerStudio({ qrSvg, name, defaults }: { qrSvg: string; name: string; defaults: { text: string; bg: string; fg: string; accent: string } }) {
  const [id, setId] = useState<StickerId>("round");
  const [o, setO] = useState<StickerOptions>({ ...defaults, sub: "", cut: true });
  const [sizeCm, setSizeCm] = useState<number>(5);
  const [fontsReady, setFontsReady] = useState(0);
  const [jpgBg, setJpgBg] = useState("#ffffff");
  const [busy, setBusy] = useState<string | null>(null);
  const [anim, setAnim] = useState<AnimId>("pop");
  const [vfmt, setVfmt] = useState<VideoFormat>("square");
  const [videoBg, setVideoBg] = useState("#f4f1ea");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const preview = useRef<HTMLCanvasElement>(null);

  // Text is measured with the real font: re-render once the web font is in.
  useEffect(() => {
    document.fonts?.ready.then(() => setFontsReady((n) => n + 1));
  }, []);
  const svg = useMemo(() => stickerSvg(id, qrSvg, o, "main"), [id, qrSvg, o, fontsReady]); // eslint-disable-line react-hooks/exhaustive-deps
  const thumbs = useMemo(() => STICKERS.map((st) => ({ ...st, svg: stickerSvg(st.id, qrSvg, o, `t-${st.id}`) })), [qrSvg, o, fontsReady]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (patch: Partial<StickerOptions>) => setO((prev) => ({ ...prev, ...patch }));
  // Print resolution: 300 dpi on the longest side.
  const px = Math.round((sizeCm / 2.54) * 300);
  const [vw, vh] = (svg.match(/viewBox="0 0 (\d+) (\d+)"/)?.slice(1).map(Number) ?? [1, 1]) as [number, number];
  const pngWidth = Math.round(px * (vw / Math.max(vw, vh)));
  const file = safeFilename(`${name}-sticker-${id}`);

  const loadImg = async () => {
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const img = new Image();
    img.src = url;
    await img.decode();
    return { img, done: () => URL.revokeObjectURL(url) };
  };

  async function raster(kind: "png" | "jpg" | "pdf") {
    setBusy(kind);
    try {
      const { img, done } = await loadImg();
      const w = pngWidth;
      const h = Math.round((w * vh) / vw);
      const c = Object.assign(document.createElement("canvas"), { width: w, height: h });
      const ctx = c.getContext("2d")!;
      if (kind === "jpg") {
        ctx.fillStyle = jpgBg;
        ctx.fillRect(0, 0, w, h);
      }
      ctx.drawImage(img, 0, 0, w, h);
      done();
      if (kind === "pdf") {
        const { jsPDF } = await import("jspdf");
        const mmW = (sizeCm * 10 * vw) / Math.max(vw, vh);
        const mmH = (sizeCm * 10 * vh) / Math.max(vw, vh);
        const doc = new jsPDF({ unit: "mm", format: [mmW, mmH], orientation: mmW > mmH ? "landscape" : "portrait", compress: true });
        doc.addImage(c.toDataURL("image/png"), "PNG", 0, 0, mmW, mmH, undefined, "FAST");
        doc.save(`${file}.pdf`);
      } else {
        const a = document.createElement("a");
        a.href = c.toDataURL(kind === "png" ? "image/png" : "image/jpeg", 0.95);
        a.download = `${file}-${w}px.${kind}`;
        a.click();
      }
    } finally {
      setBusy(null);
    }
  }

  // Live animation preview
  useEffect(() => {
    const canvas = preview.current;
    if (!canvas) return;
    let alive = true;
    let raf = 0;
    const layer = document.createElement("canvas");
    loadImg().then(({ img, done }) => {
      if (!alive) return done();
      const f = VIDEO_FORMATS[vfmt];
      const scale = 360 / Math.max(f.w, f.h);
      canvas.width = Math.round(f.w * scale);
      canvas.height = Math.round(f.h * scale);
      const ctx = canvas.getContext("2d")!;
      const t0 = performance.now();
      const tick = () => {
        if (!alive) return;
        drawStickerFrame(ctx, img, canvas.width, canvas.height, (performance.now() - t0) / 1000, anim, videoBg, o.accent, layer);
        raf = requestAnimationFrame(tick);
      };
      tick();
      return () => done();
    });
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svg, anim, vfmt, videoBg]);

  async function exportVideo() {
    setError(null);
    setProgress(0);
    try {
      const { img, done } = await loadImg();
      const f = VIDEO_FORMATS[vfmt];
      const layer = document.createElement("canvas");
      const blob = await renderMp4({ width: f.w, height: f.h, fps: 30, seconds: LOOP * 2, draw: (ctx, t) => drawStickerFrame(ctx, img, f.w, f.h, t, anim, videoBg, o.accent, layer), onProgress: setProgress });
      done();
      saveBlob(blob, `${file}-${anim}.${blob.type.includes("mp4") ? "mp4" : "webm"}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Das Video konnte nicht erzeugt werden.");
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-6">
      <div className="order-2 min-w-0 space-y-4 lg:order-1">
        <div className="card p-4 sm:p-5">
          <p className="mb-3 font-display text-base">Form <span className="text-sm font-normal text-faint">{STICKERS.length} Formen</span></p>
          <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:grid-cols-3">
            {thumbs.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setId(st.id)}
                aria-pressed={id === st.id}
                className={cn("group relative w-24 shrink-0 snap-start rounded-2xl border p-1.5 text-left transition sm:w-auto", id === st.id ? "border-brand bg-hi/5 ring-2 ring-brand/20" : "border-edge hover:-translate-y-0.5 hover:border-edge-strong")}
              >
                <div className="checker grid aspect-square place-items-center overflow-hidden rounded-xl p-2 [&>svg]:h-full [&>svg]:max-h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: st.svg }} />
                <span className="mt-1.5 block truncate px-0.5 text-[11px] font-semibold text-dim">{st.name}</span>
                {id === st.id && <span className="absolute right-2.5 top-2.5 grid size-5 place-items-center rounded-full bg-brand text-on-brand"><Check className="size-3" /></span>}
              </button>
            ))}
          </div>
        </div>

        <div className="card space-y-4 p-4 sm:p-5">
          <p className="font-display text-base">Text</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <Input aria-label="Haupttext" value={o.text} maxLength={22} onChange={(e) => set({ text: e.target.value })} placeholder="Scan mich" />
            <Input aria-label="Zusatzzeile" value={o.sub} maxLength={36} onChange={(e) => set({ sub: e.target.value })} placeholder="Zusatzzeile (optional)" />
          </div>
          <p className="text-xs text-faint">Die Schrift passt sich automatisch an, damit nichts über den Rand läuft.</p>
        </div>

        <div className="card space-y-4 p-4 sm:p-5">
          <p className="font-display text-base">Farben</p>
          <div className="grid grid-cols-8 gap-1.5">
            {PALETTES.map((pl) => {
              const active = o.bg === pl.bg && o.fg === pl.fg && o.accent === pl.accent;
              return (
                <button key={pl.name} type="button" title={pl.name} aria-label={`Farbschema ${pl.name}`} onClick={() => set({ bg: pl.bg, fg: pl.fg, accent: pl.accent })} className={cn("relative aspect-square overflow-hidden rounded-xl border transition hover:scale-105", active ? "border-brand ring-2 ring-brand/30" : "border-edge")}>
                  <span className="absolute inset-0" style={{ background: pl.bg }} />
                  <span className="absolute bottom-1 right-1 size-2.5 rounded-full ring-1 ring-black/10" style={{ background: pl.accent }} />
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <label className="min-w-0 space-y-1 text-xs font-semibold text-dim"><span>Grund</span><ColorInput value={o.bg} onChange={(c) => set({ bg: c })} /></label>
            <label className="min-w-0 space-y-1 text-xs font-semibold text-dim"><span>Text</span><ColorInput value={o.fg} onChange={(c) => set({ fg: c })} /></label>
            <label className="min-w-0 space-y-1 text-xs font-semibold text-dim"><span>Akzent</span><ColorInput value={o.accent} onChange={(c) => set({ accent: c })} /></label>
          </div>
        </div>

        <div className="card space-y-4 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="font-display text-base">Animation & Video</p>
            <span className="badge bg-lime text-night">MP4</span>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
            <div className="grid grid-cols-3 gap-1.5 self-start">
              {ANIMS.map((a) => (
                <button key={a.id} type="button" onClick={() => setAnim(a.id)} className={cn("rounded-xl border px-2 py-2 text-xs font-semibold transition", anim === a.id ? "border-brand bg-brand text-on-brand" : "border-edge text-dim hover:text-fg")}>{a.label}</button>
              ))}
              {(Object.keys(VIDEO_FORMATS) as VideoFormat[]).map((k) => (
                <button key={k} type="button" onClick={() => setVfmt(k)} className={cn("rounded-xl border px-2 py-2 text-xs font-semibold transition", vfmt === k ? "border-brand bg-hi/10 text-fg" : "border-edge text-dim hover:text-fg")}>{VIDEO_FORMATS[k].label}</button>
              ))}
            </div>
            <canvas ref={preview} className="h-36 w-auto max-w-[140px] rounded-xl border border-edge object-contain" />
          </div>
          <label className="block space-y-1 text-xs font-semibold text-dim"><span>Hintergrund im Video</span><ColorInput value={videoBg} onChange={setVideoBg} /></label>
          <Button type="button" className="relative w-full overflow-hidden" onClick={exportVideo} disabled={progress !== null}>
            {progress !== null && <span className="absolute inset-y-0 left-0 bg-lime/40" style={{ width: `${progress * 100}%` }} />}
            <span className="relative inline-flex items-center gap-2">{progress !== null ? <><Loader2 className="size-4 animate-spin" /> Video wird erzeugt … {Math.round(progress * 100)} %</> : <><Clapperboard className="size-4" /> Als MP4 herunterladen</>}</span>
          </Button>
          <p className="text-xs text-faint">{VIDEO_FORMATS[vfmt].w} × {VIDEO_FORMATS[vfmt].h} px · {LOOP * 2} Sekunden · nahtlose Schleife · für Instagram, WhatsApp, TikTok und Bildschirme.</p>
          {error && <p className="text-xs text-rose">{error}</p>}
        </div>
      </div>

      <div className="order-1 min-w-0 lg:order-2 lg:sticky lg:top-40 lg:self-start">
        <div className="card card-glow p-4 sm:p-5">
          <div className="checker relative grid min-h-[280px] place-items-center overflow-hidden rounded-2xl p-6 sm:min-h-[420px] sm:p-12">
            <div key={id} className="w-full max-w-[min(100%,380px)] animate-rise drop-shadow-[0_24px_36px_rgba(0,0,0,0.28)] [&>svg]:mx-auto [&>svg]:h-auto [&>svg]:max-h-[52vh] [&>svg]:w-auto [&>svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} />
            <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 font-mono text-[10px] font-semibold text-white backdrop-blur">{String(sizeCm).replace(".", ",")} cm</span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="flex rounded-full border border-edge bg-hi/5 p-1" role="group" aria-label="Größe">
              {SIZES_CM.map((sz) => (
                <button key={sz} type="button" onClick={() => setSizeCm(sz)} className={cn("rounded-full px-3 py-1.5 text-xs font-bold transition", sizeCm === sz ? "bg-brand text-on-brand" : "text-dim hover:text-fg")}>{String(sz).replace(".", ",")} cm</button>
              ))}
            </div>
            <button type="button" onClick={() => set({ cut: !o.cut })} aria-pressed={o.cut} className={cn("ml-auto inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold transition", o.cut ? "border-brand bg-brand text-on-brand" : "border-edge text-dim hover:text-fg")}>
              <Scissors className="size-3.5" /> Schnittkante
            </button>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button type="button" size="lg" onClick={() => raster("png")} disabled={busy !== null}>{busy === "png" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} PNG transparent</Button>
            <Button type="button" variant="secondary" size="lg" onClick={() => raster("pdf")} disabled={busy !== null}>{busy === "pdf" ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />} PDF für Druck</Button>
          </div>
          <div className="mt-2 grid grid-cols-[1fr_1fr_auto] items-center gap-2">
            <Button type="button" variant="secondary" onClick={() => downloadSvg(svg, file)}><Download className="size-4" /> SVG</Button>
            <Button type="button" variant="secondary" onClick={() => raster("jpg")} disabled={busy !== null}>{busy === "jpg" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} JPG</Button>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-dim" title="Hintergrund für JPG">
              <input type="color" value={jpgBg} onChange={(e) => setJpgBg(e.target.value)} className="size-8 cursor-pointer rounded-lg border border-edge bg-transparent p-0.5" aria-label="Hintergrund für JPG" />
            </label>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-faint">
            {String(sizeCm).replace(".", ",")} cm · 300 dpi ({pngWidth} px). PNG mit transparentem Hintergrund, JPG mit Hintergrundfarbe, PDF in Originalgröße, SVG als Vektor. {o.cut ? "Die weiße Kontur ist die Schnittlinie für Sticker-Druckereien." : ""} Unter 3 cm wird der Code schwer lesbar.
          </p>
        </div>
      </div>
    </div>
  );
}
