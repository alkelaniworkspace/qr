"use client";

import { useState } from "react";
import { ChevronDown, RotateCcw } from "lucide-react";
import { BACKGROUNDS, BUTTONS, CARDS, FONTS, HEROES, MOTION, RADII, compactDesign, designVars, presetById, resolveDesign, type Design, type FontId, type RadiusId, type StoredDesign } from "@/lib/page-design";
import { ColorInput } from "./content-form";
import { ImageField } from "./menu-builder";
import { cn } from "@/lib/cn";

const LABELS = {
  button: { solid: "Voll", soft: "Sanft", outline: "Kontur", shadow: "3D", glass: "Glas", pill: "Pille" },
  card: { flat: "Flach", outline: "Linie", elevated: "Schatten", glass: "Glas" },
  background: { solid: "Farbe", gradient: "Verlauf", mesh: "Mesh", dots: "Punkte", grid: "Raster", waves: "Wellen", image: "Foto" },
  hero: { card: "Karte", full: "Großes Foto", cover: "Klassisch", centered: "Zentriert", minimal: "Editorial" },
  motion: { none: "Aus", subtle: "Dezent", lively: "Lebendig" },
  radius: { none: "Eckig", sm: "Klein", md: "Mittel", lg: "Groß", xl: "Rund" },
} as const;

function Chip({ active, onClick, children, className, title }: { active: boolean; onClick: () => void; children: React.ReactNode; className?: string; title?: string }) {
  return (
    <button type="button" title={title} aria-pressed={active} onClick={onClick} className={cn("relative rounded-xl border p-2 text-xs font-semibold transition", active ? "border-brand bg-brand/10 text-fg ring-2 ring-brand/20" : "border-edge text-dim hover:border-edge-strong hover:text-fg", className)}>
      {children}
    </button>
  );
}

function Group({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="border-t border-edge pt-4">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-[12px] font-semibold text-dim">{title}</p>
        {right}
      </div>
      {children}
    </div>
  );
}

export function DesignEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (design: StoredDesign) => void }) {
  const d = resolveDesign(content);
  const [open, setOpen] = useState(false);
  const set = (patch: Partial<Design>) => onChange(compactDesign({ ...d, ...patch }));
  const pickPreset = (id: string) => {
    const p = presetById(id);
    onChange(compactDesign({ ...d, ...p, preset: p.id, bgImage: d.bgImage } as Design));
  };
  const customised = Object.keys(compactDesign(d)).length > 1;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-edge bg-surface">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold">Farben, Schrift und Stil anpassen</span>
            <span className="block truncate text-xs text-faint">{customised ? "Angepasst · " : ""}Farben, Schrift, Buttons, Hintergrund, Animation</span>
          </span>
          {customised && (
            <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); pickPreset(d.preset); }} onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); pickPreset(d.preset); } }} className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-dim hover:bg-hi/5 hover:text-fg">
              <RotateCcw className="size-3" /> Zurücksetzen
            </span>
          )}
          <ChevronDown className={cn("size-4 text-faint transition", open && "rotate-180")} />
        </button>

        {open && (
          <div className="space-y-4 px-4 pb-4">
            <Group title="Farben">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {([["bg", "Hintergrund"], ["surface", "Karten"], ["text", "Text"], ["muted", "Nebentext"], ["accent", "Akzent"], ["accent2", "Akzent 2"]] as const).map(([k, label]) => (
                  <label key={k} className="min-w-0 space-y-1 text-xs font-semibold text-dim"><span>{label}</span><ColorInput value={d[k]} onChange={(v) => set({ [k]: v } as Partial<Design>)} /></label>
                ))}
              </div>
            </Group>

            <Group title="Schrift">
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {(Object.keys(FONTS) as FontId[]).map((f) => (
                  <Chip key={f} active={d.font === f} onClick={() => set({ font: f })} className="!px-1 !py-2.5">
                    <span className="block text-[22px] leading-none text-fg" style={{ fontFamily: FONTS[f].display, fontWeight: FONTS[f].weight }}>{FONTS[f].sample}</span>
                    <span className="mt-1.5 block truncate text-[10px]">{FONTS[f].label}</span>
                  </Chip>
                ))}
              </div>
            </Group>

            <Group title="Kopfbereich">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {HEROES.map((h) => (
                  <Chip key={h} active={d.hero === h} onClick={() => set({ hero: h })}>
                    <span className="mx-auto mb-1.5 flex h-10 w-12 flex-col overflow-hidden rounded-md border border-edge bg-bg/60">
                      {h === "card" && <><span className="h-4 bg-dim/40" /><span className="mx-1 -mt-1.5 flex-1 rounded-t-sm bg-surface"><span className="ml-1 mt-0.5 block size-2.5 rounded-sm bg-dim" /><span className="ml-1 mt-0.5 block h-1 w-6 rounded bg-dim/60" /></span></>}
                      {h === "full" && <><span className="relative h-full bg-dim/45"><span className="absolute bottom-1 left-1 block h-1.5 w-7 rounded bg-white/90" /></span></>}
                      {h === "cover" && <><span className="h-3.5 bg-dim/40" /><span className="-mt-1.5 ml-auto mr-auto size-3 rounded-full bg-dim" /><span className="mx-auto mt-1 h-1 w-6 rounded bg-dim/60" /></>}
                      {h === "centered" && <><span className="mx-auto mt-1.5 size-4 rounded-full bg-dim" /><span className="mx-auto mt-1 h-1 w-7 rounded bg-dim/60" /></>}
                      {h === "minimal" && <><span className="ml-1.5 mt-1.5 size-2.5 rounded-full bg-dim" /><span className="ml-1.5 mt-1 h-1.5 w-8 rounded bg-dim/70" /><span className="ml-1.5 mt-1 h-1 w-6 rounded bg-dim/40" /></>}
                    </span>
                    {LABELS.hero[h]}
                  </Chip>
                ))}
              </div>
            </Group>

            <Group title="Buttons">
              <div className="pg grid grid-cols-3 gap-2" style={designVars(d) as React.CSSProperties}>
                {BUTTONS.map((b) => (
                  <Chip key={b} active={d.button === b} onClick={() => set({ button: b })} className="!p-2">
                    <span className="pg block rounded-lg bg-[var(--pg-bg)] p-1.5" data-btn={b} style={designVars(d) as React.CSSProperties}>
                      <span className="pg-btn !min-h-0 !py-1.5 !text-[10px]">{LABELS.button[b]}</span>
                    </span>
                  </Chip>
                ))}
              </div>
            </Group>

            <div className="grid gap-4 sm:grid-cols-2">
              <Group title="Karten">
                <div className="grid grid-cols-4 gap-1.5">
                  {CARDS.map((k) => (
                    <Chip key={k} active={d.card === k} onClick={() => set({ card: k })} className="!p-1.5">
                      <span className="pg block rounded-md bg-[var(--pg-bg)] p-1.5" data-card={k} style={designVars(d) as React.CSSProperties}><span className="pg-card block h-4" /></span>
                      <span className="mt-1 block text-[10px]">{LABELS.card[k]}</span>
                    </Chip>
                  ))}
                </div>
              </Group>
              <Group title="Ecken">
                <div className="grid grid-cols-5 gap-1.5">
                  {(Object.keys(RADII) as RadiusId[]).map((r) => (
                    <Chip key={r} active={d.radius === r} onClick={() => set({ radius: r })} className="!p-1.5">
                      <span className="mx-auto block size-6 border-2 border-current border-b-0 border-l-0" style={{ borderTopRightRadius: Math.min(RADII[r], 20) }} />
                      <span className="mt-1 block text-[10px]">{LABELS.radius[r]}</span>
                    </Chip>
                  ))}
                </div>
              </Group>
            </div>

            <Group title="Hintergrund">
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
                {BACKGROUNDS.map((b) => (
                  <Chip key={b} active={d.background === b} onClick={() => set({ background: b })} className="!p-1.5">
                    <span className="pg relative block h-9 overflow-hidden rounded-md bg-[var(--pg-bg)]" data-bg={b} data-motion="none" style={designVars(d) as React.CSSProperties}><span className="pg-bgfx" /></span>
                    <span className="mt-1 block text-[10px]">{LABELS.background[b]}</span>
                  </Chip>
                ))}
              </div>
              {d.background === "image" && (
                <div className="mt-3 max-w-xs"><ImageField value={d.bgImage} onChange={(url) => set({ bgImage: url })} shape="wide" label="Hintergrundfoto hochladen" /></div>
              )}
            </Group>

            <Group title="Animation">
              <div className="grid grid-cols-3 gap-2">
                {MOTION.map((m) => <Chip key={m} active={d.motion === m} onClick={() => set({ motion: m })}>{LABELS.motion[m]}</Chip>)}
              </div>
            </Group>
          </div>
        )}
      </div>
    </div>
  );
}
