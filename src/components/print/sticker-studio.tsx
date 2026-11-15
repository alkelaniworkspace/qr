"use client";

import { useMemo, useState } from "react";
import { Check, Download, Scissors } from "lucide-react";
import { downloadPng, downloadSvg } from "@/lib/qr/export";
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

export type StickerId = "round" | "burst" | "bubble" | "badge" | "ticket" | "window" | "tag" | "phone";

export const STICKERS: { id: StickerId; name: string }[] = [
  { id: "round", name: "Schriftring" },
  { id: "burst", name: "Stern" },
  { id: "bubble", name: "Sprechblase" },
  { id: "badge", name: "Badge" },
  { id: "ticket", name: "Ticket" },
  { id: "window", name: "Fenster" },
  { id: "tag", name: "Anhänger" },
  { id: "phone", name: "Handy" },
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

/** Font size so `text` fits into `maxW` (rough Inter Black metrics), capped at `max`. */
function fit(text: string, maxW: number, max: number, perChar = 0.62) {
  return Math.round(Math.min(max, maxW / Math.max(1, text.length * perChar)));
}

function label(x: number, y: number, text: string, size: number, fill: string, extra = "") {
  return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" ${FONT} font-size="${size}" font-weight="800" fill="${fill}" ${extra}>${esc(text)}</text>`;
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

export function StickerStudio({ qrSvg, name, defaults }: { qrSvg: string; name: string; defaults: { text: string; bg: string; fg: string; accent: string } }) {
  const [id, setId] = useState<StickerId>("round");
  const [o, setO] = useState<StickerOptions>({ ...defaults, sub: "", cut: true });
  const [sizeCm, setSizeCm] = useState<number>(5);
  const svg = useMemo(() => stickerSvg(id, qrSvg, o, "main"), [id, qrSvg, o]);
  const thumbs = useMemo(() => STICKERS.map((s) => ({ ...s, svg: stickerSvg(s.id, qrSvg, o, `t-${s.id}`) })), [qrSvg, o]);
  const set = (patch: Partial<StickerOptions>) => setO((prev) => ({ ...prev, ...patch }));
  // Print resolution: 300 dpi on the longest side.
  const px = Math.round((sizeCm / 2.54) * 300);
  const [vw, vh] = (svg.match(/viewBox="0 0 (\d+) (\d+)"/)?.slice(1).map(Number) ?? [1, 1]) as [number, number];
  const pngWidth = Math.round(px * (vw / Math.max(vw, vh)));
  const file = `${name}-sticker-${id}`;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-6">
      <div className="order-2 min-w-0 space-y-4 lg:order-1">
        <div className="card p-4 sm:p-5">
          <p className="mb-3 font-display text-base">Form</p>
          <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:grid-cols-3">
            {thumbs.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setId(s.id)}
                aria-pressed={id === s.id}
                className={cn("group relative w-24 shrink-0 snap-start rounded-2xl border p-1.5 text-left transition sm:w-auto", id === s.id ? "border-brand bg-hi/5 ring-2 ring-brand/20" : "border-edge hover:-translate-y-0.5 hover:border-edge-strong")}
              >
                <div className="checker grid aspect-square place-items-center overflow-hidden rounded-xl p-2 [&>svg]:h-full [&>svg]:max-h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: s.svg }} />
                <span className="mt-1.5 block truncate px-0.5 text-[11px] font-semibold text-dim">{s.name}</span>
                {id === s.id && <span className="absolute right-2.5 top-2.5 grid size-5 place-items-center rounded-full bg-brand text-on-brand"><Check className="size-3" /></span>}
              </button>
            ))}
          </div>
        </div>

        <div className="card space-y-4 p-4 sm:p-5">
          <p className="font-display text-base">Text</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <Input aria-label="Haupttext" value={o.text} maxLength={22} onChange={(e) => set({ text: e.target.value })} placeholder="SCAN MICH" />
            <Input aria-label="Zusatzzeile" value={o.sub} maxLength={36} onChange={(e) => set({ sub: e.target.value })} placeholder="Zusatzzeile (optional)" />
          </div>
        </div>

        <div className="card space-y-4 p-4 sm:p-5">
          <p className="font-display text-base">Farben</p>
          <div className="grid grid-cols-8 gap-1.5">
            {PALETTES.map((p) => {
              const active = o.bg === p.bg && o.fg === p.fg && o.accent === p.accent;
              return (
                <button key={p.name} type="button" title={p.name} aria-label={`Farbschema ${p.name}`} onClick={() => set({ bg: p.bg, fg: p.fg, accent: p.accent })} className={cn("relative aspect-square overflow-hidden rounded-xl border transition hover:scale-105", active ? "border-brand ring-2 ring-brand/30" : "border-edge")}>
                  <span className="absolute inset-0" style={{ background: p.bg }} />
                  <span className="absolute bottom-1 right-1 size-2.5 rounded-full ring-1 ring-black/10" style={{ background: p.accent }} />
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
      </div>

      <div className="order-1 min-w-0 lg:order-2 lg:sticky lg:top-40 lg:self-start">
        <div className="card card-glow p-4 sm:p-5">
          <div className="checker relative grid min-h-[280px] place-items-center overflow-hidden rounded-2xl p-6 sm:min-h-[420px] sm:p-12">
            <div key={id} className="w-full max-w-[min(100%,380px)] animate-rise drop-shadow-[0_24px_36px_rgba(0,0,0,0.28)] [&>svg]:mx-auto [&>svg]:h-auto [&>svg]:max-h-[52vh] [&>svg]:w-auto [&>svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} />
            <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 font-mono text-[10px] font-semibold text-white backdrop-blur">{sizeCm} cm</span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="flex rounded-full border border-edge bg-hi/5 p-1" role="group" aria-label="Größe">
              {SIZES_CM.map((s) => (
                <button key={s} type="button" onClick={() => setSizeCm(s)} className={cn("rounded-full px-3 py-1.5 text-xs font-bold transition", sizeCm === s ? "bg-brand text-on-brand" : "text-dim hover:text-fg")}>{String(s).replace(".", ",")} cm</button>
              ))}
            </div>
            <button type="button" onClick={() => set({ cut: !o.cut })} aria-pressed={o.cut} className={cn("ml-auto inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold transition", o.cut ? "border-brand bg-brand text-on-brand" : "border-edge text-dim hover:text-fg")}>
              <Scissors className="size-3.5" /> Schnittkante
            </button>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button type="button" size="lg" onClick={() => downloadPng(svg, file, pngWidth)}><Download className="size-4" /> PNG · {px} px</Button>
            <Button type="button" variant="secondary" size="lg" onClick={() => downloadSvg(svg, file)}><Download className="size-4" /> SVG · Vektor</Button>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-faint">
            PNG mit transparentem Hintergrund in 300 dpi für {String(sizeCm).replace(".", ",")} cm. {o.cut ? "Die weiße Kontur ist die Schnittlinie für Sticker-Druckereien." : "Ohne Kontur: ideal für digitale Nutzung oder rechteckigen Zuschnitt."} Unter 3 cm wird der Code schwer lesbar. Vor dem Druck einmal mit dem Handy testen.
          </p>
        </div>
      </div>
    </div>
  );
}
