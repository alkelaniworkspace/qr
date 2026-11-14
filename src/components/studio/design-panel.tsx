"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ImagePlus, X } from "lucide-react";
import { eyeGlyph, renderQrSvg } from "@/lib/qr/render";
import {
  DEFAULT_STYLE, STYLE_PRESETS,
  type DotStyle, type EyeBallStyle, type EyeFrameStyle, type FrameStyle, type QrStyle,
} from "@/lib/qr/style";
import { fileToLogoDataUrl } from "@/lib/qr/export";
import { ColorInput } from "./content-form";
import { FieldShell, Input, Select } from "@/components/ui/field";
import { cn } from "@/lib/cn";

interface Props {
  style: QrStyle;
  onChange: (s: QrStyle) => void;
}

const SAMPLE = "SCANWERK";

function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line last:border-0">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-4 text-left" aria-expanded={open}>
        <span className="text-[15px] font-medium">{title}</span>
        <ChevronDown className={cn("size-4 text-muted transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="pb-6">{children}</div>}
    </div>
  );
}

function Tile({ active, onClick, children, label }: { active: boolean; onClick: () => void; children: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-pressed={active}
      className={cn(
        "group flex flex-col items-center gap-1.5 rounded-xl border bg-white p-2 text-[11px] text-muted transition",
        active ? "border-ink ring-2 ring-ink/10 text-ink" : "border-line hover:border-ink/30",
      )}
    >
      {children}
      <span className="truncate">{label}</span>
    </button>
  );
}

function Svg({ svg, className }: { svg: string; className?: string }) {
  return <span className={cn("block [&>svg]:h-full [&>svg]:w-full", className)} dangerouslySetInnerHTML={{ __html: svg }} />;
}

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-full border border-line bg-white p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn("rounded-full px-3.5 py-1.5 text-[13px] transition", value === o.value ? "bg-ink text-paper" : "text-muted hover:text-ink")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, format }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format?: (v: number) => string }) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-[13px]">
        <span className="font-medium text-ink-soft">{label}</span>
        <span className="tabular-nums text-muted">{format ? format(value) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-ink" />
    </div>
  );
}

const DOTS: { value: DotStyle; label: string }[] = [
  { value: "square", label: "Quadrat" },
  { value: "rounded", label: "Weich" },
  { value: "fluid", label: "Fließend" },
  { value: "classy", label: "Elegant" },
  { value: "dots", label: "Punkte" },
  { value: "diamond", label: "Raute" },
];
const FRAMES: { value: EyeFrameStyle; label: string }[] = [
  { value: "square", label: "Eckig" },
  { value: "rounded", label: "Abgerundet" },
  { value: "circle", label: "Rund" },
  { value: "leaf", label: "Blatt" },
];
const BALLS: { value: EyeBallStyle; label: string }[] = [
  { value: "square", label: "Eckig" },
  { value: "rounded", label: "Abgerundet" },
  { value: "circle", label: "Rund" },
  { value: "diamond", label: "Raute" },
  { value: "leaf", label: "Blatt" },
];
const FRAME_STYLES: { value: FrameStyle; label: string }[] = [
  { value: "none", label: "Ohne" },
  { value: "label", label: "Banner" },
  { value: "card", label: "Karte" },
  { value: "ticket", label: "Ticket" },
];

export function DesignPanel({ style, onChange }: Props) {
  const set = (patch: Partial<QrStyle>) => onChange({ ...style, ...patch });
  const [logoError, setLogoError] = useState<string | null>(null);

  const presetSvgs = useMemo(
    () => STYLE_PRESETS.map((p) => renderQrSvg(SAMPLE, { ...DEFAULT_STYLE, ...p.style } as QrStyle, { size: 96, id: `preset-${p.id}` })),
    [],
  );
  const dotSvgs = useMemo(
    () => DOTS.map((d) => renderQrSvg(SAMPLE, { ...DEFAULT_STYLE, dots: d.value, eyeFrame: "square", eyeBall: "square", margin: 1 }, { size: 72, id: `dot-${d.value}` })),
    [],
  );

  const fill = style.fill;
  const colors: [string, string] = fill.type === "solid" ? [fill.color, fill.color] : fill.colors;

  async function onLogo(file: File) {
    setLogoError(null);
    if (!/^image\/(png|jpe?g|webp|svg\+xml)$/.test(file.type)) return setLogoError("Bitte PNG, JPG, WebP oder SVG wählen");
    try {
      const src = await fileToLogoDataUrl(file);
      set({ logo: { src, size: 0.22, excavate: true, plate: true, ...(style.logo ? { size: style.logo.size } : {}) }, ecc: "H" });
    } catch {
      setLogoError("Bild konnte nicht gelesen werden");
    }
  }

  return (
    <div>
      <Section title="Vorlagen" defaultOpen>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {STYLE_PRESETS.map((p, i) => (
            <Tile key={p.id} label={p.name} active={false} onClick={() => onChange({ ...style, ...DEFAULT_STYLE, logo: style.logo, frame: style.frame, ...p.style, ecc: style.logo ? "H" : DEFAULT_STYLE.ecc } as QrStyle)}>
              <Svg svg={presetSvgs[i]} className="size-14" />
            </Tile>
          ))}
        </div>
      </Section>

      <Section title="Muster" defaultOpen>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {DOTS.map((d, i) => (
            <Tile key={d.value} label={d.label} active={style.dots === d.value} onClick={() => set({ dots: d.value })}>
              <Svg svg={dotSvgs[i]} className="size-12" />
            </Tile>
          ))}
        </div>
      </Section>

      <Section title="Ecken">
        <p className="mb-2 text-[13px] font-medium text-ink-soft">Rahmen</p>
        <div className="mb-5 grid grid-cols-4 gap-2">
          {FRAMES.map((f) => (
            <Tile key={f.value} label={f.label} active={style.eyeFrame === f.value} onClick={() => set({ eyeFrame: f.value })}>
              <Svg svg={eyeGlyph(f.value, style.eyeBall)} className="size-9" />
            </Tile>
          ))}
        </div>
        <p className="mb-2 text-[13px] font-medium text-ink-soft">Innen</p>
        <div className="grid grid-cols-5 gap-2">
          {BALLS.map((b) => (
            <Tile key={b.value} label={b.label} active={style.eyeBall === b.value} onClick={() => set({ eyeBall: b.value })}>
              <Svg svg={eyeGlyph(style.eyeFrame, b.value)} className="size-9" />
            </Tile>
          ))}
        </div>
      </Section>

      <Section title="Farben" defaultOpen>
        <div className="space-y-5">
          <Segmented
            value={fill.type}
            options={[{ value: "solid", label: "Einfarbig" }, { value: "linear", label: "Verlauf" }, { value: "radial", label: "Radial" }]}
            onChange={(t) =>
              set({ fill: t === "solid" ? { type: "solid", color: colors[0] } : { type: t, colors: fill.type === "solid" ? [colors[0], "#a8823f"] : colors, rotation: fill.type === "solid" ? 45 : fill.rotation } })
            }
          />
          <div className="grid grid-cols-2 gap-3">
            {fill.type === "solid" ? (
              <FieldShell label="Vordergrund"><ColorInput value={fill.color} onChange={(c) => set({ fill: { type: "solid", color: c } })} /></FieldShell>
            ) : (
              <>
                <FieldShell label="Farbe 1"><ColorInput value={fill.colors[0]} onChange={(c) => set({ fill: { ...fill, colors: [c, fill.colors[1]] } })} /></FieldShell>
                <FieldShell label="Farbe 2"><ColorInput value={fill.colors[1]} onChange={(c) => set({ fill: { ...fill, colors: [fill.colors[0], c] } })} /></FieldShell>
              </>
            )}
            <FieldShell label="Hintergrund">
              <ColorInput value={style.background} onChange={(c) => set({ background: c })} />
            </FieldShell>
          </div>
          {fill.type === "linear" && (
            <Slider label="Winkel" value={fill.rotation} min={0} max={360} step={5} format={(v) => `${v}°`} onChange={(v) => set({ fill: { ...fill, rotation: v } })} />
          )}
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="size-4 accent-ink" checked={style.eyeColor !== null} onChange={(e) => set({ eyeColor: e.target.checked ? "#a8823f" : null })} />
              Eigene Farbe für Ecken
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="size-4 accent-ink" checked={style.transparent} onChange={(e) => set({ transparent: e.target.checked })} />
              Transparenter Hintergrund
            </label>
          </div>
          {style.eyeColor !== null && (
            <FieldShell label="Farbe der Ecken" className="max-w-[50%]">
              <ColorInput value={style.eyeColor} onChange={(c) => set({ eyeColor: c })} />
            </FieldShell>
          )}
        </div>
      </Section>

      <Section title="Logo">
        {style.logo ? (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <span className="checker grid size-16 place-items-center overflow-hidden rounded-xl border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={style.logo.src} alt="" className="max-h-12 max-w-12" />
              </span>
              <button type="button" onClick={() => set({ logo: null })} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-danger">
                <X className="size-4" /> Logo entfernen
              </button>
            </div>
            <Slider label="Größe" value={style.logo.size} min={0.12} max={0.3} step={0.01} format={(v) => `${Math.round(v * 100)} %`} onChange={(v) => set({ logo: { ...style.logo!, size: v } })} />
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="size-4 accent-ink" checked={style.logo.excavate} onChange={(e) => set({ logo: { ...style.logo!, excavate: e.target.checked } })} />
                Fläche freistellen
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="size-4 accent-ink" checked={style.logo.plate} onChange={(e) => set({ logo: { ...style.logo!, plate: e.target.checked } })} />
                Hintergrundplatte
              </label>
            </div>
            <p className="text-xs text-muted">Mit Logo nutzt der Code automatisch die höchste Fehlerkorrektur (H).</p>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-white px-4 py-8 text-sm text-muted transition hover:border-ink/30">
            <ImagePlus className="size-6" strokeWidth={1.5} />
            Logo hochladen (PNG, JPG, WebP, SVG)
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" onChange={(e) => e.target.files?.[0] && onLogo(e.target.files[0])} />
          </label>
        )}
        {logoError && <p className="mt-2 text-xs text-danger">{logoError}</p>}
      </Section>

      <Section title="Rahmen & Text">
        <div className="space-y-5">
          <Segmented value={style.frame.style} options={FRAME_STYLES} onChange={(v) => set({ frame: { ...style.frame, style: v } })} />
          {style.frame.style !== "none" && (
            <div className="grid grid-cols-2 gap-3">
              <FieldShell label="Text" className="col-span-2">
                <Input value={style.frame.text} maxLength={40} onChange={(e) => set({ frame: { ...style.frame, text: e.target.value } })} />
              </FieldShell>
              <FieldShell label="Rahmenfarbe"><ColorInput value={style.frame.color} onChange={(c) => set({ frame: { ...style.frame, color: c } })} /></FieldShell>
              <FieldShell label="Textfarbe"><ColorInput value={style.frame.textColor} onChange={(c) => set({ frame: { ...style.frame, textColor: c } })} /></FieldShell>
            </div>
          )}
        </div>
      </Section>

      <Section title="Erweitert">
        <div className="grid gap-5 sm:grid-cols-2">
          <Slider label="Ruhezone (Rand)" value={style.margin} min={0} max={8} step={1} format={(v) => `${v} Module`} onChange={(v) => set({ margin: v })} />
          <FieldShell label="Fehlerkorrektur" hint={style.logo ? "Mit Logo immer H" : "Höher = robuster, aber dichter"}>
            <Select value={style.logo ? "H" : style.ecc} disabled={!!style.logo} onChange={(e) => set({ ecc: e.target.value as QrStyle["ecc"] })}>
              <option value="L">L – 7 %</option>
              <option value="M">M – 15 %</option>
              <option value="Q">Q – 25 %</option>
              <option value="H">H – 30 %</option>
            </Select>
          </FieldShell>
        </div>
      </Section>
    </div>
  );
}
