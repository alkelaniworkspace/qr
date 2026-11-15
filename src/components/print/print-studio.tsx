"use client";

import { useRef, useState } from "react";
import { Download, FileDown, Loader2, Printer, RectangleHorizontal, RectangleVertical, Scissors } from "lucide-react";
import { Poster } from "./poster";
import { FORMATS, POSTER_PALETTES, POSTER_TEMPLATES, clampMm, posterSize, type FormatId, type PosterSettings } from "@/lib/print/types";
import { ColorInput } from "@/components/studio/content-form";
import { FieldShell, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { safeFilename } from "@/lib/qr/export";
import { cn } from "@/lib/cn";

interface Props {
  settings: PosterSettings;
  onChange: (s: PosterSettings) => void;
  qrSvg: string;
  name: string;
}

const MAX_SIDE_PX = 9000;

export function PrintStudio({ settings: p, onChange, qrSvg, name }: Props) {
  const set = (patch: Partial<PosterSettings>) => onChange({ ...p, ...patch });
  const previewRef = useRef<HTMLDivElement>(null);
  const [dpi, setDpi] = useState(300);
  const [busy, setBusy] = useState<"png" | "jpg" | "pdf" | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const { w, h } = posterSize(p);
  const fullW = w + (p.bleed ? 6 : 0);
  const fullH = h + (p.bleed ? 6 : 0);

  /** The live preview node (already auto-fitted), rendered at print resolution. */
  async function renderCanvas(targetDpi: number) {
    const node = previewRef.current?.firstElementChild as HTMLElement | null;
    if (!node) return null;
    const { toCanvas } = await import("html-to-image");
    await document.fonts?.ready;
    let targetW = Math.round((fullW / 25.4) * targetDpi);
    const longest = Math.max(targetW, Math.round((fullH / 25.4) * targetDpi));
    const scaleDown = Math.min(1, MAX_SIDE_PX / longest);
    if (scaleDown < 1) {
      targetW = Math.round(targetW * scaleDown);
      setNote(`Für dieses Format wurde die Auflösung auf ${Math.round(targetDpi * scaleDown)} dpi begrenzt. Für Großformate „Drucken“ nutzen (Vektor, beliebig groß).`);
    }
    return toCanvas(node, { pixelRatio: targetW / node.offsetWidth, cacheBust: true });
  }

  const file = `${safeFilename(name)}-${p.format}${p.landscape ? "-quer" : ""}`;
  const save = (href: string, ext: string) => {
    const a = document.createElement("a");
    a.href = href;
    a.download = `${file}.${ext}`;
    a.click();
  };

  async function exportImage(kind: "png" | "jpg") {
    setBusy(kind);
    setNote(null);
    try {
      const canvas = await renderCanvas(dpi);
      if (canvas) save(canvas.toDataURL(kind === "png" ? "image/png" : "image/jpeg", 0.95), kind);
    } finally {
      setBusy(null);
    }
  }

  /** One-page PDF at the exact paper size (incl. bleed), downloaded directly. */
  async function exportPdf() {
    setBusy("pdf");
    setNote(null);
    try {
      const canvas = await renderCanvas(Math.max(dpi, 300));
      if (!canvas) return;
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: [fullW, fullH], orientation: fullW > fullH ? "landscape" : "portrait", compress: true });
      doc.addImage(canvas.toDataURL("image/jpeg", 0.96), "JPEG", 0, 0, fullW, fullH, undefined, "FAST");
      doc.save(`${file}.pdf`);
    } finally {
      setBusy(null);
    }
  }

  /**
   * Vector print: only the poster, in its own frame, on exactly one page of the
   * right size. The whole studio is never part of the print.
   */
  function printVector() {
    const node = previewRef.current?.firstElementChild as HTMLElement | null;
    if (!node) return;
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).map((el) => el.outerHTML).join("");
    const clone = node.cloneNode(true) as HTMLElement;
    clone.style.width = `${fullW}mm`;
    clone.style.height = `${fullH}mm`;
    clone.style.aspectRatio = "auto";
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
    document.body.appendChild(frame);
    const doc = frame.contentDocument!;
    doc.open();
    doc.write(`<!doctype html><html><head><meta charset="utf-8">${styles}<style>@page{size:${fullW}mm ${fullH}mm;margin:0}html,body{margin:0;padding:0;background:#fff;width:${fullW}mm;height:${fullH}mm;overflow:hidden}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}</style></head><body>${clone.outerHTML}</body></html>`);
    doc.close();
    const go = async () => {
      await frame.contentDocument?.fonts?.ready;
      await new Promise((r) => setTimeout(r, 250));
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
      setTimeout(() => frame.remove(), 1500);
    };
    if (doc.readyState === "complete") void go();
    else frame.onload = () => void go();
  }

  const formatIds = Object.keys(FORMATS) as FormatId[];

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-6">
      <div className="order-2 min-w-0 space-y-4 lg:order-1">
        <div className="card p-5">
          <p className="mb-3 font-display text-base">Format</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {formatIds.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => set({ format: id })}
                className={cn("rounded-xl border px-2 py-2.5 text-center transition", p.format === id ? "border-brand bg-brand/15 text-fg" : "border-edge bg-bg/60 text-dim hover:border-hi/25")}
              >
                <span className="block truncate font-display text-[13px]">{FORMATS[id].label}</span>
                <span className="block truncate text-[10px] text-faint">{FORMATS[id].hint}</span>
              </button>
            ))}
          </div>
          {p.format === "custom" && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <FieldShell label="Breite (mm)"><Input type="number" min={30} max={2000} value={p.customW} onChange={(e) => set({ customW: Number(e.target.value) })} onBlur={() => set({ customW: clampMm(p.customW) })} /></FieldShell>
              <FieldShell label="Höhe (mm)"><Input type="number" min={30} max={2000} value={p.customH} onChange={(e) => set({ customH: Number(e.target.value) })} onBlur={() => set({ customH: clampMm(p.customH) })} /></FieldShell>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {p.format !== "custom" && (
              <>
                <button type="button" onClick={() => set({ landscape: false })} className={cn("inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold", !p.landscape ? "border-brand text-fg" : "border-edge text-dim")}><RectangleVertical className="size-4" /> Hoch</button>
                <button type="button" onClick={() => set({ landscape: true })} className={cn("inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold", p.landscape ? "border-brand text-fg" : "border-edge text-dim")}><RectangleHorizontal className="size-4" /> Quer</button>
              </>
            )}
            <button type="button" onClick={() => set({ bleed: !p.bleed })} className={cn("inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold", p.bleed ? "border-gold text-gold" : "border-edge text-dim")}>
              <Scissors className="size-4" /> 3 mm Beschnitt
            </button>
          </div>
          <p className="mt-3 font-mono text-xs text-faint">{w} × {h} mm{p.bleed ? ` + Beschnitt = ${fullW} × ${fullH} mm` : ""}</p>
        </div>

        <div className="card p-5">
          <p className="mb-3 font-display text-base">Vorlage</p>
          <div className="grid grid-cols-5 gap-2">
            {POSTER_TEMPLATES.map((t) => (
              <button key={t.id} type="button" onClick={() => set({ template: t.id })} title={t.name} className={cn("group rounded-xl border p-1 transition", p.template === t.id ? "border-brand shadow-[0_0_20px_-6px_rgb(var(--glow)/0.8)]" : "border-edge hover:border-hi/25")}>
                <div className="pointer-events-none overflow-hidden rounded-lg">
                  <Poster settings={{ ...p, template: t.id, format: "a6", landscape: false, bleed: false }} qrSvg={qrSvg} />
                </div>
                <span className={cn("mt-1 block truncate text-[10px] font-semibold", p.template === t.id ? "text-fg" : "text-faint")}>{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card space-y-4 p-5">
          <p className="font-display text-base">Texte</p>
          <FieldShell label="Überschrift"><Input value={p.headline} maxLength={60} onChange={(e) => set({ headline: e.target.value })} /></FieldShell>
          <FieldShell label="Untertitel"><Textarea rows={2} value={p.subline} maxLength={160} onChange={(e) => set({ subline: e.target.value })} /></FieldShell>
          <div className="grid grid-cols-2 gap-3">
            <FieldShell label="Button"><Input value={p.cta} maxLength={30} onChange={(e) => set({ cta: e.target.value })} /></FieldShell>
            <FieldShell label="Fußzeile"><Input value={p.footer} maxLength={60} onChange={(e) => set({ footer: e.target.value })} /></FieldShell>
          </div>
          <FieldShell label="Infozeilen (optional)"><Textarea rows={2} value={p.info} maxLength={160} placeholder="z. B. Netzwerk und Passwort" onChange={(e) => set({ info: e.target.value })} /></FieldShell>
        </div>

        <div className="card space-y-4 p-5">
          <p className="font-display text-base">Farben</p>
          <div className="grid grid-cols-3 gap-2">
            {POSTER_PALETTES.map((pal) => (
              <button key={pal.name} type="button" onClick={() => set({ bg: pal.bg, accent: pal.accent, text: pal.text })} className={cn("flex items-center gap-2 rounded-xl border p-2 text-xs font-semibold transition", p.bg === pal.bg && p.accent === pal.accent ? "border-brand text-fg" : "border-edge text-dim hover:border-hi/25")}>
                <span className="flex overflow-hidden rounded-md border border-hi/10">
                  <span className="size-5" style={{ background: pal.bg }} />
                  <span className="size-5" style={{ background: pal.accent }} />
                </span>
                {pal.name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <FieldShell label="Grund"><ColorInput value={p.bg} onChange={(c) => set({ bg: c })} /></FieldShell>
            <FieldShell label="Akzent"><ColorInput value={p.accent} onChange={(c) => set({ accent: c })} /></FieldShell>
            <FieldShell label="Text"><ColorInput value={p.text} onChange={(c) => set({ text: c })} /></FieldShell>
          </div>
        </div>
      </div>

      <div className="order-1 min-w-0 lg:order-2 lg:sticky lg:top-40 lg:self-start">
        <div className="card card-glow p-4 sm:p-5">
          <div className="grid place-items-center rounded-2xl bg-[repeating-linear-gradient(45deg,var(--color-bg),var(--color-bg)_12px,var(--color-elevated)_12px,var(--color-elevated)_24px)] p-6 sm:p-10">
            <div ref={previewRef} className="w-full shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]" style={{ maxWidth: `min(100%, calc(min(62vh, 680px) * ${fullW / fullH}))` }}>
              <Poster settings={p} qrSvg={qrSvg} />
            </div>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
            <Button type="button" onClick={exportPdf} size="lg" disabled={busy !== null}>
              {busy === "pdf" ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />} PDF herunterladen
            </Button>
            <select aria-label="Auflösung" value={dpi} onChange={(e) => setDpi(Number(e.target.value))} className="h-13 rounded-[14px] border border-edge bg-bg px-3 text-sm font-semibold text-fg">
              <option value={150}>150 dpi</option>
              <option value={300}>300 dpi</option>
            </select>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <Button type="button" variant="secondary" onClick={() => exportImage("png")} disabled={busy !== null}>{busy === "png" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} PNG</Button>
            <Button type="button" variant="secondary" onClick={() => exportImage("jpg")} disabled={busy !== null}>{busy === "jpg" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} JPG</Button>
            <Button type="button" variant="secondary" onClick={printVector} disabled={busy !== null}><Printer className="size-4" /> Drucken</Button>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-faint">
            Genau eine Seite in {fullW} × {fullH} mm{p.bleed ? " inklusive 3 mm Beschnitt" : ""}. „Drucken“ erzeugt im Druckdialog eine Vektor-PDF („Als PDF speichern“), gestochen scharf bis A0.
          </p>
          {note && <p className="mt-2 text-xs text-gold">{note}</p>}
        </div>
      </div>

    </div>
  );
}
