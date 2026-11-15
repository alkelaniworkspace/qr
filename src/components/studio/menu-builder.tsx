"use client";

import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Copy, ImagePlus, LayoutGrid, LayoutList, Loader2, Plus, Rows3, Sparkles, Trash2, X } from "lucide-react";
import { MENU_BADGES, type MenuItemData, type MenuSectionData } from "@/lib/codes/types";
import { uploadImage } from "@/lib/upload-image";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type Errors = Record<string, string>;

export const BADGE_LABEL: Record<(typeof MENU_BADGES)[number], string> = {
  beliebt: "Beliebt",
  neu: "Neu",
  vegan: "Vegan",
  vegetarisch: "Vegetarisch",
  scharf: "Scharf",
  hausgemacht: "Hausgemacht",
};

const emptyItem = (): MenuItemData => ({ name: "", description: "", price: "", tags: "", image: "", variants: [], badges: [], soldOut: false });

function move<T>(list: T[], i: number, d: number): T[] {
  const j = i + d;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

/** Normalises older menus (no images, variants …) into the current shape. */
function normalize(sections: Partial<MenuSectionData>[]): MenuSectionData[] {
  return sections.map((s) => ({
    title: s.title ?? "",
    note: s.note ?? "",
    items: (s.items ?? []).map((it) => ({ ...emptyItem(), ...it, variants: it.variants ?? [], badges: it.badges ?? [] })),
  }));
}

// ───────── Image field (logo, cover, dish photos) ─────────
export function ImageField({ value, onChange, shape = "square", label = "Bild hochladen", className }: { value: string; onChange: (url: string) => void; shape?: "square" | "wide"; label?: string; className?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await uploadImage(file, shape === "wide" ? 1800 : 1000));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload fehlgeschlagen");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className={className}>
      <div
        className={cn(
          "group relative grid place-items-center overflow-hidden rounded-2xl border border-dashed border-edge-strong bg-bg/60 transition hover:border-brand/60",
          shape === "wide" ? "aspect-[16/7]" : "aspect-square",
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1.5 p-2 text-center text-xs font-semibold text-faint">
            <ImagePlus className="size-5" /> {label}
          </span>
        )}
        <button type="button" onClick={() => input.current?.click()} className="absolute inset-0" aria-label={label} disabled={busy} />
        {busy && <span className="absolute inset-0 grid place-items-center bg-bg/70"><Loader2 className="size-5 animate-spin text-brand" /></span>}
        {value && !busy && (
          <button type="button" onClick={() => onChange("")} className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-night/70 text-white opacity-0 transition group-hover:opacity-100" aria-label="Bild entfernen">
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      {error && <p className="mt-1.5 text-xs text-rose">{error}</p>}
    </div>
  );
}

// ───────── Layout picker ─────────
const LAYOUTS = [
  { id: "cards", label: "Karten", hint: "Foto neben Text", icon: Rows3 },
  { id: "grid", label: "Galerie", hint: "Große Fotos, 2 Spalten", icon: LayoutGrid },
  { id: "list", label: "Klassisch", hint: "Liste mit Preislinie", icon: LayoutList },
  { id: "elegant", label: "Elegant", hint: "Zentriert, fein", icon: Sparkles },
] as const;

export function LayoutPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {LAYOUTS.map((l) => (
        <button key={l.id} type="button" onClick={() => onChange(l.id)} className={cn("rounded-2xl border p-3 text-left transition", value === l.id ? "border-brand bg-brand/10" : "border-edge hover:border-hi/25")}>
          <l.icon className={cn("size-5", value === l.id ? "text-brand" : "text-faint")} />
          <span className="mt-2 block text-sm font-bold">{l.label}</span>
          <span className="block text-[11px] text-faint">{l.hint}</span>
        </button>
      ))}
    </div>
  );
}

// ───────── Menu builder ─────────
export function MenuBuilder({ value, onChange, errors, prefix }: { value: Partial<MenuSectionData>[]; onChange: (v: MenuSectionData[]) => void; errors: Errors; prefix: string }) {
  const sections = normalize(value);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const cur = Math.min(active, Math.max(0, sections.length - 1));
  const section = sections[cur];

  const setSection = (i: number, s: MenuSectionData) => onChange(sections.map((x, k) => (k === i ? s : x)));
  const setItems = (items: MenuItemData[]) => setSection(cur, { ...section, items });
  const setItem = (j: number, patch: Partial<MenuItemData>) => setItems(section.items.map((x, k) => (k === j ? { ...x, ...patch } : x)));

  function addSection() {
    onChange([...sections, { title: "", note: "", items: [emptyItem()] }]);
    setActive(sections.length);
    setOpen(0);
  }

  const sectionHasError = (i: number) => Object.keys(errors).some((k) => k.startsWith(`${prefix}.${i}.`));

  return (
    <div className="overflow-hidden rounded-2xl border border-edge bg-bg/40">
      {/* Category tabs, like the guest will see them */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-edge bg-surface p-2 [scrollbar-width:thin]">
        {sections.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => { setActive(i); setOpen(null); }}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold transition",
              i === cur ? "bg-brand text-on-brand shadow-[0_3px_0_var(--color-brand-shadow)]" : "text-dim hover:bg-hi/5 hover:text-fg",
              sectionHasError(i) && i !== cur && "text-rose",
            )}
          >
            {s.title || "Neue Kategorie"}
            <span className={cn("rounded-md px-1.5 text-[10px]", i === cur ? "bg-on-brand/20" : "bg-hi/10")}>{s.items.length}</span>
          </button>
        ))}
        <button type="button" onClick={addSection} className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-dashed border-edge-strong px-3 py-2 text-sm font-bold text-dim hover:border-brand hover:text-brand">
          <Plus className="size-4" /> Kategorie
        </button>
      </div>

      {section && (
        <div className="p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={section.title}
              placeholder="Kategorie, z. B. Döner, Pizza, Schnitzel"
              aria-invalid={!!errors[`${prefix}.${cur}.title`]}
              className="min-w-0 flex-1 font-display text-base"
              onChange={(e) => setSection(cur, { ...section, title: e.target.value })}
            />
            <div className="flex items-center gap-1">
              <IconBtn label="Kategorie nach links" onClick={() => { onChange(move(sections, cur, -1)); setActive(Math.max(0, cur - 1)); }}><ArrowUp className="size-4 -rotate-90" /></IconBtn>
              <IconBtn label="Kategorie nach rechts" onClick={() => { onChange(move(sections, cur, 1)); setActive(Math.min(sections.length - 1, cur + 1)); }}><ArrowDown className="size-4 -rotate-90" /></IconBtn>
              <IconBtn label="Kategorie löschen" danger disabled={sections.length < 2} onClick={() => { onChange(sections.filter((_, k) => k !== cur)); setActive(Math.max(0, cur - 1)); }}><Trash2 className="size-4" /></IconBtn>
            </div>
          </div>
          <Input className="mt-2" value={section.note} placeholder="Hinweis zur Kategorie (optional), z. B. Alle Pizzen auch glutenfrei" onChange={(e) => setSection(cur, { ...section, note: e.target.value })} />

          <ul className="mt-4 space-y-2.5">
            {section.items.map((item, j) => {
              const err = errors[`${prefix}.${cur}.items.${j}.name`];
              const expanded = open === j;
              return (
                <li key={j} className={cn("rounded-2xl border bg-surface transition", expanded ? "border-brand/50" : "border-edge", item.soldOut && "opacity-60")}>
                  <div className="flex items-start gap-3 p-3">
                    <ImageField value={item.image} onChange={(url) => setItem(j, { image: url })} label="Foto" className="w-[72px] shrink-0" />
                    <div className="grid min-w-0 flex-1 grid-cols-[1fr_92px] gap-2">
                      <Input value={item.name} placeholder="Gericht" aria-invalid={!!err} onChange={(e) => setItem(j, { name: e.target.value })} />
                      <Input value={item.price} placeholder="9,90" inputMode="decimal" onChange={(e) => setItem(j, { price: e.target.value })} disabled={item.variants.length > 0} title={item.variants.length ? "Preise stehen bei den Größen" : undefined} />
                      <Input className="col-span-2" value={item.description} placeholder="Beschreibung, Zutaten" onChange={(e) => setItem(j, { description: e.target.value })} />
                      {err && <p className="col-span-2 text-xs text-rose">{err}</p>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <IconBtn label="Mehr Optionen" onClick={() => setOpen(expanded ? null : j)}><ChevronDown className={cn("size-4 transition", expanded && "rotate-180")} /></IconBtn>
                      <IconBtn label="Löschen" danger onClick={() => setItems(section.items.filter((_, k) => k !== j))}><Trash2 className="size-4" /></IconBtn>
                    </div>
                  </div>

                  {!expanded && (item.badges.length > 0 || item.variants.length > 0 || item.tags) && (
                    <div className="flex flex-wrap gap-1 px-3 pb-3 pl-[96px] text-[11px] text-faint">
                      {item.badges.map((b) => <span key={b} className="rounded-md bg-brand/10 px-1.5 py-0.5 font-semibold text-brand">{BADGE_LABEL[b]}</span>)}
                      {item.variants.length > 0 && <span className="rounded-md bg-hi/5 px-1.5 py-0.5">{item.variants.length} Größen</span>}
                      {item.tags && <span className="rounded-md bg-hi/5 px-1.5 py-0.5">Allergene: {item.tags}</span>}
                    </div>
                  )}

                  {expanded && (
                    <div className="space-y-4 border-t border-edge p-3 sm:pl-[96px]">
                      <div>
                        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-faint">Kennzeichen</p>
                        <div className="flex flex-wrap gap-1.5">
                          {MENU_BADGES.map((b) => {
                            const on = item.badges.includes(b);
                            return (
                              <button key={b} type="button" onClick={() => setItem(j, { badges: on ? item.badges.filter((x) => x !== b) : [...item.badges, b] })} className={cn("rounded-lg border px-2.5 py-1 text-xs font-semibold transition", on ? "border-brand bg-brand text-on-brand" : "border-edge text-dim hover:text-fg")}>
                                {BADGE_LABEL[b]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-faint">Größen & Preise (optional)</p>
                        <div className="space-y-1.5">
                          {item.variants.map((v, k) => (
                            <div key={k} className="grid grid-cols-[1fr_92px_auto] gap-1.5">
                              <Input value={v.label} placeholder="z. B. Ø 32 cm, 0,5 l, Teller" onChange={(e) => setItem(j, { variants: item.variants.map((x, m) => (m === k ? { ...x, label: e.target.value } : x)) })} />
                              <Input value={v.price} placeholder="11,90" inputMode="decimal" onChange={(e) => setItem(j, { variants: item.variants.map((x, m) => (m === k ? { ...x, price: e.target.value } : x)) })} />
                              <IconBtn label="Größe entfernen" danger onClick={() => setItem(j, { variants: item.variants.filter((_, m) => m !== k) })}><X className="size-4" /></IconBtn>
                            </div>
                          ))}
                          <button type="button" onClick={() => setItem(j, { variants: [...item.variants, { label: "", price: "" }] })} className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline">
                            <Plus className="size-3.5" /> Größe hinzufügen
                          </button>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                        <label className="block">
                          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-faint">Allergene & Zusatzstoffe</span>
                          <Input value={item.tags} placeholder="z. B. A, C, G, 3" onChange={(e) => setItem(j, { tags: e.target.value })} />
                        </label>
                        <label className="flex h-12 items-center gap-2 rounded-xl border border-edge px-3 text-sm font-semibold">
                          <input type="checkbox" className="size-4 accent-brand" checked={item.soldOut} onChange={(e) => setItem(j, { soldOut: e.target.checked })} />
                          Heute ausverkauft
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <Button type="button" variant="ghost" size="sm" onClick={() => { setItems(move(section.items, j, -1)); setOpen(Math.max(0, j - 1)); }}><ArrowUp className="size-4" /> Hoch</Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => { setItems(move(section.items, j, 1)); setOpen(Math.min(section.items.length - 1, j + 1)); }}><ArrowDown className="size-4" /> Runter</Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => { const c = section.items; setItems([...c.slice(0, j + 1), { ...c[j] }, ...c.slice(j + 1)]); setOpen(j + 1); }}><Copy className="size-4" /> Duplizieren</Button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={() => { setItems([...section.items, emptyItem()]); setOpen(section.items.length); }}>
            <Plus className="size-4" /> Gericht hinzufügen
          </Button>
        </div>
      )}
    </div>
  );
}

function IconBtn({ children, label, onClick, danger, disabled }: { children: React.ReactNode; label: string; onClick: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled} className={cn("grid size-8 place-items-center rounded-lg text-faint transition hover:bg-hi/5 disabled:opacity-30", danger ? "hover:text-rose" : "hover:text-fg")}>
      {children}
    </button>
  );
}
