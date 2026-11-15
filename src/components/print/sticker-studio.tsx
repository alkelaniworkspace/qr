"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { downloadPng, downloadSvg } from "@/lib/qr/export";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { ColorInput } from "@/components/studio/content-form";
import { cn } from "@/lib/cn";

/**
 * Die-cut stickers: each design is one SVG with a white cut line around it,
 * ready for sticker printers (Sticker Mule, Flyeralarm, …) or digital use.
 */

type StickerId = "round" | "bubble" | "tag" | "badge" | "arrow" | "phone";

const STICKERS: { id: StickerId; name: string }[] = [
  { id: "round", name: "Rund mit Schriftring" },
  { id: "bubble", name: "Sprechblase" },
  { id: "badge", name: "Badge" },
  { id: "tag", name: "Anhänger" },
  { id: "arrow", name: "Pfeil" },
  { id: "phone", name: "Handy" },
];

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Places a rendered QR <svg> inside another SVG at x/y with the given size. */
function place(qr: string, x: number, y: number, size: number) {
  return qr.replace(/<svg\b([^>]*?)\swidth="[^"]*"/, "<svg$1").replace(/<svg\b([^>]*?)\sheight="[^"]*"/, "<svg$1").replace("<svg", `<svg x="${x}" y="${y}" width="${size}" height="${size}"`);
}

const FONT = `font-family="Inter, 'Helvetica Neue', Arial, sans-serif"`;

export function stickerSvg(id: StickerId, qr: string, o: { text: string; bg: string; fg: string; accent: string }) {
  const t = esc(o.text || "SCAN MICH");
  const cut = (d: string) => `<path d="${d}" fill="#ffffff"/><path d="${d}" fill="none" stroke="#ffffff" stroke-width="28" stroke-linejoin="round"/>`;
  switch (id) {
    case "round": {
      const ring = `${t} • `.repeat(Math.max(2, Math.ceil(36 / (t.length + 3))));
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><circle cx="320" cy="320" r="306" fill="#ffffff"/><circle cx="320" cy="320" r="292" fill="${o.bg}"/><defs><path id="ring" d="M320,320 m-238,0 a238,238 0 1,1 476,0 a238,238 0 1,1 -476,0"/></defs><text ${FONT} font-size="34" font-weight="800" letter-spacing="6" fill="${o.fg}"><textPath href="#ring" textLength="1490">${ring}</textPath></text><rect x="170" y="170" width="300" height="300" rx="36" fill="#ffffff"/>${place(qr, 185, 185, 270)}</svg>`;
    }
    case "bubble":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 720">${cut("M70 40 H570 a50 50 0 0 1 50 50 V560 a50 50 0 0 1 -50 50 H260 L150 690 L170 610 H70 a50 50 0 0 1 -50 -50 V90 a50 50 0 0 1 50 -50 Z")}<path d="M80 54 H560 a44 44 0 0 1 44 44 V552 a44 44 0 0 1 -44 44 H254 L168 664 L184 596 H80 a44 44 0 0 1 -44 -44 V98 a44 44 0 0 1 44 -44 Z" fill="${o.bg}"/><rect x="150" y="90" width="340" height="340" rx="34" fill="#ffffff"/>${place(qr, 165, 105, 310)}<text x="320" y="520" text-anchor="middle" ${FONT} font-size="58" font-weight="800" fill="${o.fg}">${t}</text></svg>`;
    case "badge":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 720">${cut("M110 20 H490 a90 90 0 0 1 90 90 V610 a90 90 0 0 1 -90 90 H110 a90 90 0 0 1 -90 -90 V110 a90 90 0 0 1 90 -90 Z")}<rect x="34" y="34" width="532" height="652" rx="78" fill="${o.bg}"/><rect x="80" y="80" width="440" height="440" rx="40" fill="#ffffff"/>${place(qr, 96, 96, 408)}<rect x="110" y="566" width="380" height="84" rx="42" fill="${o.accent}"/><text x="300" y="622" text-anchor="middle" ${FONT} font-size="40" font-weight="800" letter-spacing="2" fill="${o.bg}">${t}</text></svg>`;
    case "tag":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 820">${cut("M90 20 H430 a70 70 0 0 1 70 70 V730 a70 70 0 0 1 -70 70 H90 a70 70 0 0 1 -70 -70 V90 a70 70 0 0 1 70 -70 Z")}<rect x="34" y="34" width="452" height="752" rx="58" fill="${o.bg}"/><circle cx="260" cy="110" r="34" fill="#ffffff"/><circle cx="260" cy="110" r="18" fill="${o.bg}" stroke="${o.accent}" stroke-width="6"/><rect x="70" y="200" width="380" height="380" rx="34" fill="#ffffff"/>${place(qr, 84, 214, 352)}<text x="260" y="670" text-anchor="middle" ${FONT} font-size="54" font-weight="800" fill="${o.fg}">${t}</text><rect x="200" y="704" width="120" height="8" rx="4" fill="${o.accent}"/></svg>`;
    case "arrow":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 600">${cut("M60 20 H440 a40 40 0 0 1 40 40 V540 a40 40 0 0 1 -40 40 H60 a40 40 0 0 1 -40 -40 V60 a40 40 0 0 1 40 -40 Z M500 170 H700 a40 40 0 0 1 40 40 V390 a40 40 0 0 1 -40 40 H500 Z")}<rect x="34" y="34" width="432" height="532" rx="30" fill="#ffffff"/>${place(qr, 50, 90, 400)}<text x="250" y="530" text-anchor="middle" ${FONT} font-size="38" font-weight="800" fill="#111111">${t}</text><rect x="490" y="184" width="236" height="232" rx="30" fill="${o.bg}"/><path d="M690 300 C640 240, 590 250, 560 300 M560 300 l26 -10 M560 300 l8 26" fill="none" stroke="${o.accent}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    case "phone":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 840">${cut("M90 20 H390 a70 70 0 0 1 70 70 V750 a70 70 0 0 1 -70 70 H90 a70 70 0 0 1 -70 -70 V90 a70 70 0 0 1 70 -70 Z")}<rect x="34" y="34" width="412" height="772" rx="58" fill="${o.bg}"/><rect x="190" y="58" width="100" height="22" rx="11" fill="${o.fg}" opacity="0.25"/><text x="240" y="190" text-anchor="middle" ${FONT} font-size="50" font-weight="800" fill="${o.fg}">${t}</text><rect x="60" y="250" width="360" height="360" rx="34" fill="#ffffff"/>${place(qr, 74, 264, 332)}<rect x="60" y="430" width="360" height="6" fill="${o.accent}" opacity="0.9"/><rect x="170" y="700" width="140" height="60" rx="30" fill="${o.accent}"/></svg>`;
  }
}

export function StickerStudio({ qrSvg, name, defaults }: { qrSvg: string; name: string; defaults: { text: string; bg: string; fg: string; accent: string } }) {
  const [id, setId] = useState<StickerId>("round");
  const [o, setO] = useState(defaults);
  const svg = useMemo(() => stickerSvg(id, qrSvg, o), [id, qrSvg, o]);

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
      <div className="space-y-4">
        <div className="card p-5">
          <p className="mb-3 font-display text-base">Form</p>
          <div className="grid grid-cols-3 gap-2">
            {STICKERS.map((s) => (
              <button key={s.id} type="button" onClick={() => setId(s.id)} className={cn("rounded-2xl border p-2 transition", id === s.id ? "border-brand bg-hi/5" : "border-edge hover:border-edge-strong")}>
                <div className="checker grid aspect-square place-items-center rounded-xl p-2 [&>svg]:max-h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: stickerSvg(s.id, qrSvg, o) }} />
                <span className="mt-1.5 block truncate text-[11px] font-semibold text-dim">{s.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="card space-y-4 p-5">
          <p className="font-display text-base">Text & Farben</p>
          <Input value={o.text} maxLength={22} onChange={(e) => setO({ ...o, text: e.target.value })} placeholder="SCAN MICH" />
          <div className="grid grid-cols-3 gap-3">
            <label className="text-xs font-semibold text-dim">Grund<ColorInput value={o.bg} onChange={(c) => setO({ ...o, bg: c })} /></label>
            <label className="text-xs font-semibold text-dim">Text<ColorInput value={o.fg} onChange={(c) => setO({ ...o, fg: c })} /></label>
            <label className="text-xs font-semibold text-dim">Akzent<ColorInput value={o.accent} onChange={(c) => setO({ ...o, accent: c })} /></label>
          </div>
        </div>
      </div>
      <div className="card card-glow p-5">
        <div className="checker grid place-items-center rounded-2xl p-8 sm:p-14">
          <div className="w-full max-w-[420px] drop-shadow-[0_24px_40px_rgba(0,0,0,0.35)] transition-all duration-300 [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Button type="button" size="lg" onClick={() => downloadPng(svg, `${name}-sticker-${id}`, 2400)}><Download className="size-4" /> PNG transparent</Button>
          <Button type="button" variant="secondary" size="lg" onClick={() => downloadSvg(svg, `${name}-sticker-${id}`)}><Download className="size-4" /> SVG mit Schnittkante</Button>
        </div>
        <p className="mt-3 text-xs text-faint">Die weiße Kontur ist die Schnittlinie für Sticker-Druckereien. Vor dem Druck einmal mit dem Handy testen.</p>
      </div>
    </div>
  );
}
