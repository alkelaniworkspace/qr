"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ImagePlus, RotateCcw, X } from "lucide-react";
import { eyeGlyph, patternGlyph, renderQrSvg } from "@/lib/qr/render";
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
  /** the user's real code content, so design previews show their own code */
  data?: string;
}

const SAMPLE = "SCANWERK-2026";
const SWATCHES = ["#0f1113", "#ffffff", "#d42a4e", "#ff5d6c", "#38d5ff", "#a78bfa", "#3ee6a8", "#ffb020", "#1a1d4e", "#5a1428"];

const DOTS: { value: DotStyle; label: string }[] = [
  { value: "square", label: "Quadrat" },
  { value: "rounded", label: "Weich" },
  { value: "fluid", label: "Fließend" },
  { value: "classy", label: "Elegant" },
  { value: "dots", label: "Punkte" },
  { value: "bubble", label: "Bubbles" },
  { value: "mini", label: "Pixel" },
  { value: "diamond", label: "Raute" },
  { value: "vertical", label: "Säulen" },
  { value: "horizontal", label: "Streifen" },
];
const FRAMES: { value: EyeFrameStyle; label: string }[] = [
  { value: "square", label: "Eckig" },
  { value: "rounded", label: "Rund" },
  { value: "circle", label: "Kreis" },
  { value: "leaf", label: "Blatt" },
  { value: "octagon", label: "Achteck" },
  { value: "shield", label: "Wappen" },
];
const BALLS: { value: EyeBallStyle; label: string }[] = [
  { value: "square", label: "Eckig" },
  { value: "rounded", label: "Rund" },
  { value: "circle", label: "Kreis" },
  { value: "diamond", label: "Raute" },
  { value: "leaf", label: "Blatt" },
  { value: "octagon", label: "Achteck" },
  { value: "shield", label: "Wappen" },
];
const FRAME_STYLES: { value: FrameStyle; label: string }[] = [
  { value: "none", label: "Ohne" },
  { value: "label", label: "Banner" },
  { value: "card", label: "Karte" },
  { value: "ticket", label: "Ticket" },
];

function Section({ title, hint, defaultOpen = false, children }: { title: string; hint?: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/[0.02]" aria-expanded={open}>
        <span>
          <span className="block font-display text-base uppercase">{title}</span>
          {hint && <span className="mt-0.5 block text-xs text-faint">{hint}</span>}
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-dim transition-transform duration-300", open && "rotate-180 text-brand")} />
      </button>
      {open && <div className="border-t border-edge px-5 pb-6 pt-5 animate-rise">{children}</div>}
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
        "group flex flex-col items-center gap-2 rounded-2xl border bg-bg/60 p-2.5 text-[11px] font-semibold transition duration-200 hover:-translate-y-0.5",
        active ? "border-brand text-brand shadow-[0_0_0_1px_rgba(212,42,78,0.4),0_0_24px_-6px_rgba(212,42,78,0.6)]" : "border-edge text-dim hover:border-white/25 hover:text-fg",
      )}
    >
      {children}
      <span className="max-w-full truncate">{label}</span>
    </button>
  );
}

function Svg({ svg, className }: { svg: string; className?: string }) {
  return <span className={cn("block [&>svg]:h-full [&>svg]:w-full", className)} dangerouslySetInnerHTML={{ __html: svg }} />;
}

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex flex-wrap rounded-[14px] border border-edge bg-bg/60 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn("rounded-[10px] px-4 py-2 text-xs font-bold uppercase tracking-wide transition", value === o.value ? "bg-brand text-on-brand shadow-[0_2px_0_#7a1027]" : "text-dim hover:text-fg")}
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
      <div className="mb-2 flex justify-between">
        <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-dim">{label}</span>
        <span className="font-mono text-xs text-brand">{format ? format(value) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
    </div>
  );
}

function Swatches({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {SWATCHES.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={`Farbe ${c}`}
          onClick={() => onChange(c)}
          className={cn("size-6 rounded-lg border transition hover:scale-110", value.toLowerCase() === c ? "border-brand ring-2 ring-brand/40" : "border-white/15")}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
      <span className={cn("relative h-6 w-11 shrink-0 rounded-full border transition", checked ? "border-brand bg-brand" : "border-edge-strong bg-bg")}>
        <span className={cn("absolute top-0.5 size-[18px] rounded-full transition-all", checked ? "left-[22px] bg-on-brand" : "left-0.5 bg-dim")} />
      </span>
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function DesignPanel({ style, onChange, data }: Props) {
  const set = (patch: Partial<QrStyle>) => onChange({ ...style, ...patch });
  const [logoError, setLogoError] = useState<string | null>(null);

  const presetSvgs = useMemo(
    () => STYLE_PRESETS.map((p) => renderQrSvg(data || SAMPLE, { ...DEFAULT_STYLE, ...p.style, margin: 2, logo: style.logo } as QrStyle, { size: 160, id: `preset-${p.id}` })),
    [data, style.logo],
  );
  const activePreset = STYLE_PRESETS.find((p) => (Object.keys(p.style) as (keyof QrStyle)[]).every((k) => JSON.stringify(p.style[k]) === JSON.stringify(style[k])))?.id;
  const dotSvgs = useMemo(() => DOTS.map((d) => patternGlyph(d.value)), []);

  const fill = style.fill;
  const mainColor = fill.type === "solid" ? fill.color : fill.colors[0];

  async function onLogo(file: File) {
    setLogoError(null);
    if (!/^image\/(png|jpe?g|webp|svg\+xml)$/.test(file.type)) return setLogoError("Bitte PNG, JPG, WebP oder SVG wählen");
    try {
      const src = await fileToLogoDataUrl(file);
      set({ logo: { src, size: style.logo?.size ?? 0.22, excavate: true, plate: true }, ecc: "H" });
    } catch {
      setLogoError("Bild konnte nicht gelesen werden");
    }
  }

  return (
    <div className="space-y-3">
      <Section title="Designs" hint={`${STYLE_PRESETS.length} fertige Looks, mit deinem Code`} defaultOpen>
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 xl:grid-cols-6">
          {STYLE_PRESETS.map((p, i) => (
            <Tile
              key={p.id}
              label={p.name}
              active={activePreset === p.id}
              onClick={() => onChange({ ...DEFAULT_STYLE, ...p.style, logo: style.logo, margin: style.margin, ecc: style.logo ? "H" : DEFAULT_STYLE.ecc } as QrStyle)}
            >
              <Svg svg={presetSvgs[i]} className="w-full overflow-hidden rounded-xl" />
            </Tile>
          ))}
        </div>
      </Section>

      <Section title="Muster" hint="10 Formen für die Punkte" defaultOpen>
        <div className="grid grid-cols-5 gap-2.5">
          {DOTS.map((d, i) => (
            <Tile key={d.value} label={d.label} active={style.dots === d.value} onClick={() => set({ dots: d.value })}>
              <Svg svg={dotSvgs[i]} className="size-11" />
            </Tile>
          ))}
        </div>
      </Section>

      <Section title="Ecken" hint="Rahmen und Kern getrennt wählen" defaultOpen>
        <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-dim">Rahmen</p>
        <div className="mb-6 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {FRAMES.map((f) => (
            <Tile key={f.value} label={f.label} active={style.eyeFrame === f.value} onClick={() => set({ eyeFrame: f.value })}>
              <Svg svg={eyeGlyph(f.value, style.eyeBall, "#f7f7f8")} className="size-9" />
            </Tile>
          ))}
        </div>
        <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-dim">Kern</p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {BALLS.map((b) => (
            <Tile key={b.value} label={b.label} active={style.eyeBall === b.value} onClick={() => set({ eyeBall: b.value })}>
              <Svg svg={eyeGlyph(style.eyeFrame, b.value, "#f7f7f8")} className="size-8" />
            </Tile>
          ))}
        </div>
      </Section>

      <Section title="Farben" hint="Punkte, Ecken, Hintergrund" defaultOpen>
        <div className="space-y-6">
          <Segmented
            value={fill.type}
            options={[{ value: "solid", label: "Einfarbig" }, { value: "linear", label: "Verlauf" }, { value: "radial", label: "Radial" }]}
            onChange={(t) =>
              set({ fill: t === "solid" ? { type: "solid", color: mainColor } : { type: t, colors: fill.type === "solid" ? [mainColor, "#38d5ff"] : fill.colors, rotation: fill.type === "solid" ? 45 : fill.rotation } })
            }
          />
          <div className="grid gap-5 sm:grid-cols-2">
            {fill.type === "solid" ? (
              <FieldShell label="Punkte">
                <ColorInput value={fill.color} onChange={(c) => set({ fill: { type: "solid", color: c } })} />
                <Swatches value={fill.color} onChange={(c) => set({ fill: { type: "solid", color: c } })} />
              </FieldShell>
            ) : (
              <>
                <FieldShell label="Farbe 1"><ColorInput value={fill.colors[0]} onChange={(c) => set({ fill: { ...fill, colors: [c, fill.colors[1]] } })} /></FieldShell>
                <FieldShell label="Farbe 2"><ColorInput value={fill.colors[1]} onChange={(c) => set({ fill: { ...fill, colors: [fill.colors[0], c] } })} /></FieldShell>
              </>
            )}
            <FieldShell label="Hintergrund">
              <ColorInput value={style.background} onChange={(c) => set({ background: c, transparent: false })} />
              <Swatches value={style.background} onChange={(c) => set({ background: c, transparent: false })} />
            </FieldShell>
          </div>
          {fill.type === "linear" && (
            <Slider label="Winkel" value={fill.rotation} min={0} max={360} step={5} format={(v) => `${v}°`} onChange={(v) => set({ fill: { ...fill, rotation: v } })} />
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Toggle checked={style.eyeColor !== null} onChange={(v) => set({ eyeColor: v ? "#d42a4e" : null })} label="Eigene Farbe Rahmen" />
              {style.eyeColor !== null && <div className="mt-3"><ColorInput value={style.eyeColor} onChange={(c) => set({ eyeColor: c })} /></div>}
            </div>
            <div>
              <Toggle checked={style.eyeBallColor !== null} onChange={(v) => set({ eyeBallColor: v ? "#d42a4e" : null })} label="Eigene Farbe Kern" />
              {style.eyeBallColor !== null && <div className="mt-3"><ColorInput value={style.eyeBallColor} onChange={(c) => set({ eyeBallColor: c })} /></div>}
            </div>
          </div>
          <Toggle checked={style.transparent} onChange={(v) => set({ transparent: v })} label="Transparenter Hintergrund" />
        </div>
      </Section>

      <Section title="Logo" hint="Mit Freistellung und Platte">
        {style.logo ? (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <span className="checker grid size-16 place-items-center overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={style.logo.src} alt="" className="max-h-12 max-w-12" />
              </span>
              <button type="button" onClick={() => set({ logo: null })} className="inline-flex items-center gap-1.5 text-sm font-semibold text-dim hover:text-rose">
                <X className="size-4" /> Logo entfernen
              </button>
            </div>
            <Slider label="Größe" value={style.logo.size} min={0.12} max={0.3} step={0.01} format={(v) => `${Math.round(v * 100)} %`} onChange={(v) => set({ logo: { ...style.logo!, size: v } })} />
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              <Toggle checked={style.logo.excavate} onChange={(v) => set({ logo: { ...style.logo!, excavate: v } })} label="Fläche freistellen" />
              <Toggle checked={style.logo.plate} onChange={(v) => set({ logo: { ...style.logo!, plate: v } })} label="Hintergrundplatte" />
            </div>
            <p className="text-xs text-faint">Mit Logo nutzt der Code automatisch die höchste Fehlerkorrektur (H).</p>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-edge-strong bg-bg/60 px-4 py-9 text-sm font-semibold text-dim transition hover:border-brand/60 hover:text-brand">
            <ImagePlus className="size-7" strokeWidth={1.6} />
            Logo hochladen
            <span className="text-xs font-normal text-faint">PNG, JPG, WebP oder SVG</span>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" onChange={(e) => e.target.files?.[0] && onLogo(e.target.files[0])} />
          </label>
        )}
        {logoError && <p className="mt-2 text-xs text-rose">{logoError}</p>}
      </Section>

      <Section title="Rahmen & Text" hint="Call-to-Action unter dem Code">
        <div className="space-y-5">
          <Segmented value={style.frame.style} options={FRAME_STYLES} onChange={(v) => set({ frame: { ...style.frame, style: v } })} />
          {style.frame.style !== "none" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldShell label="Text" className="sm:col-span-2">
                <Input value={style.frame.text} maxLength={40} onChange={(e) => set({ frame: { ...style.frame, text: e.target.value } })} />
              </FieldShell>
              <FieldShell label="Rahmenfarbe"><ColorInput value={style.frame.color} onChange={(c) => set({ frame: { ...style.frame, color: c } })} /></FieldShell>
              <FieldShell label="Textfarbe"><ColorInput value={style.frame.textColor} onChange={(c) => set({ frame: { ...style.frame, textColor: c } })} /></FieldShell>
            </div>
          )}
        </div>
      </Section>

      <Section title="Feinschliff" hint="Rand, Ecken, Fehlerkorrektur">
        <div className="grid gap-6 sm:grid-cols-2">
          <Slider label="Ruhezone" value={style.margin} min={0} max={8} step={1} format={(v) => `${v} Module`} onChange={(v) => set({ margin: v })} />
          <Slider label="Ecken-Rundung" value={style.radius} min={0} max={20} step={1} format={(v) => `${v} %`} onChange={(v) => set({ radius: v })} />
          <FieldShell label="Fehlerkorrektur" hint={style.logo ? "Mit Logo immer H" : "Höher = robuster, aber dichter"}>
            <Select value={style.logo ? "H" : style.ecc} disabled={!!style.logo} onChange={(e) => set({ ecc: e.target.value as QrStyle["ecc"] })}>
              <option value="L">L · 7 %</option>
              <option value="M">M · 15 %</option>
              <option value="Q">Q · 25 %</option>
              <option value="H">H · 30 %</option>
            </Select>
          </FieldShell>
          <div className="flex items-end">
            <button type="button" onClick={() => onChange({ ...DEFAULT_STYLE, logo: style.logo, ecc: style.logo ? "H" : DEFAULT_STYLE.ecc })} className="inline-flex h-12 items-center gap-2 rounded-[14px] border border-edge px-4 text-xs font-bold uppercase tracking-wide text-dim transition hover:border-white/25 hover:text-fg">
              <RotateCcw className="size-4" /> Zurücksetzen
            </button>
          </div>
        </div>
      </Section>
    </div>
  );
}
