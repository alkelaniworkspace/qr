"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, ImagePlus, Plus, Search, Star, Trash2, Wand2, X } from "lucide-react";
import { PLATFORMS, platformOf } from "@/lib/platforms";
import { BrandIcon } from "@/components/pages/brand-icons";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { ImageField } from "./menu-builder";

export type LinkItem = { label: string; url: string; icon?: string; image?: string; highlight?: boolean };
type Errors = Record<string, string>;

const QUICK = ["instagram", "tiktok", "youtube", "facebook", "whatsapp", "x", "linkedin", "spotify", "snapchat", "telegram", "threads", "pinterest", "googlemaps", "google", "website", "email"];

function move<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

/** Brand tile: platform colour with the white mark, or the owner's own icon image. */
function Tile({ link, size = 40 }: { link: LinkItem; size?: number }) {
  const p = platformOf(link.url, link.icon);
  if (link.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={link.image} alt="" className="shrink-0 rounded-xl object-cover" style={{ width: size, height: size }} />;
  }
  const light = ["#FFFC00", "#53FC18", "#34E0A1"].includes(p.color);
  return (
    <span className="grid shrink-0 place-items-center rounded-xl" style={{ width: size, height: size, background: p.color, color: light ? "#111" : "#fff" }}>
      <BrandIcon k={p.key} className="size-[55%]" />
    </span>
  );
}

function IconMenu({ link, onPick, onClose }: { link: LinkItem; onPick: (patch: Partial<LinkItem>) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const list = PLATFORMS.filter((p) => p.label.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div className="absolute left-0 top-full z-30 mt-2 w-[320px] rounded-2xl border border-edge-strong bg-solid p-3 shadow-lift">
      <div className="flex items-center gap-2 rounded-xl border border-edge px-2.5">
        <Search className="size-4 text-faint" />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Plattform suchen" className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none" />
        <button type="button" onClick={onClose} aria-label="Schließen" className="text-faint hover:text-fg"><X className="size-4" /></button>
      </div>
      <button type="button" onClick={() => { onPick({ icon: "", image: "" }); onClose(); }} className="mt-2 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-[13px] font-semibold hover:bg-hi/5"><Wand2 className="size-4 text-brand" /> Automatisch aus dem Link erkennen</button>
      <div className="mt-1 grid max-h-[220px] grid-cols-5 gap-1 overflow-y-auto pr-1">
        {list.map((p) => (
          <button key={p.key} type="button" title={p.label} onClick={() => { onPick({ icon: p.key, image: "" }); onClose(); }} className={cn("flex flex-col items-center gap-1 rounded-xl p-1.5 text-[10px] font-medium text-dim hover:bg-hi/5 hover:text-fg", link.icon === p.key && "bg-brand/15 text-fg")}>
            <Tile link={{ label: "", url: "", icon: p.key }} size={34} />
            <span className="w-full truncate text-center">{p.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 border-t border-edge pt-3">
        <p className="mb-2 text-[12px] font-semibold text-dim">Eigenes Icon</p>
        <ImageField value={link.image ?? ""} onChange={(v) => { onPick({ image: v }); if (v) onClose(); }} label="Bild hochladen" className="max-w-[110px]" />
      </div>
    </div>
  );
}

export function LinksEditor({ value, onChange, errors, prefix }: { value: LinkItem[]; onChange: (v: LinkItem[]) => void; errors: Errors; prefix: string }) {
  const [menu, setMenu] = useState<number | null>(null);
  const [all, setAll] = useState(false);
  const update = (i: number, patch: Partial<LinkItem>) => onChange(value.map((l, k) => (k === i ? { ...l, ...patch } : l)));
  const add = (key: string) => {
    const p = PLATFORMS.find((x) => x.key === key)!;
    onChange([...value, { label: p.key === "website" ? "Website" : p.label, url: p.prefix, icon: p.key, image: "", highlight: false }]);
  };
  const quick = all ? PLATFORMS.map((p) => p.key) : QUICK;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] font-semibold text-dim">Links</span>
        <span className="text-xs text-faint">{value.length} / 30</span>
      </div>
      <div className="space-y-2.5">
        {value.map((link, i) => {
          const p = platformOf(link.url, link.icon);
          const err = errors[`${prefix}.${i}.label`] ?? errors[`${prefix}.${i}.url`];
          return (
            <div key={i} className={cn("rounded-2xl border bg-surface p-2.5 transition", link.highlight ? "border-brand/60 shadow-[0_0_0_3px_rgb(189_251_4/0.12)]" : "border-edge")}>
              <div className="flex items-start gap-2.5">
                <div className="relative">
                  <button type="button" onClick={() => setMenu(menu === i ? null : i)} className="group flex items-center gap-1 rounded-xl p-1 hover:bg-hi/5" aria-label="Icon wählen" title="Icon wählen">
                    <Tile link={link} size={42} />
                    <ChevronDown className="size-3.5 text-faint group-hover:text-fg" />
                  </button>
                  {menu === i && <IconMenu link={link} onPick={(patch) => update(i, patch)} onClose={() => setMenu(null)} />}
                </div>
                <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[160px_1fr]">
                  <Input value={link.label} placeholder={p.label === "Website" ? "Bezeichnung" : p.label} aria-invalid={!!errors[`${prefix}.${i}.label`]} onChange={(e) => update(i, { label: e.target.value })} />
                  <Input value={link.url} placeholder={p.prefix} aria-invalid={!!errors[`${prefix}.${i}.url`]} onChange={(e) => update(i, { url: e.target.value })} />
                  {err && <p className="text-xs text-rose sm:col-span-2">{err}</p>}
                </div>
                <div className="flex shrink-0 flex-col sm:flex-row">
                  <button type="button" onClick={() => update(i, { highlight: !link.highlight })} title="Hervorheben" aria-label="Hervorheben" className={cn("grid size-8 place-items-center rounded-lg transition hover:bg-hi/[0.07]", link.highlight ? "text-brand" : "text-faint hover:text-fg")}><Star className={cn("size-4", link.highlight && "fill-current")} /></button>
                  <button type="button" onClick={() => onChange(move(value, i, -1))} aria-label="Nach oben" className="grid size-8 place-items-center rounded-lg text-faint hover:bg-hi/[0.07] hover:text-fg"><ArrowUp className="size-4" /></button>
                  <button type="button" onClick={() => onChange(move(value, i, 1))} aria-label="Nach unten" className="grid size-8 place-items-center rounded-lg text-faint hover:bg-hi/[0.07] hover:text-fg"><ArrowDown className="size-4" /></button>
                  <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} aria-label="Entfernen" className="grid size-8 place-items-center rounded-lg text-faint hover:bg-hi/[0.07] hover:text-rose"><Trash2 className="size-4" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {value.length < 30 && (
        <div className="mt-4 rounded-2xl border border-dashed border-edge-strong p-3">
          <p className="mb-2.5 flex items-center gap-1.5 text-[12px] font-semibold text-dim"><Plus className="size-3.5" /> Link hinzufügen</p>
          <div className="flex flex-wrap gap-1.5">
            {quick.map((k) => {
              const p = PLATFORMS.find((x) => x.key === k)!;
              return (
                <button key={k} type="button" onClick={() => add(k)} className="inline-flex items-center gap-2 rounded-full border border-edge bg-surface py-1 pl-1 pr-3 text-[12.5px] font-semibold transition hover:-translate-y-0.5 hover:border-edge-strong">
                  <Tile link={{ label: "", url: "", icon: k }} size={24} /> {p.label}
                </button>
              );
            })}
            <button type="button" onClick={() => setAll((v) => !v)} className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12.5px] font-semibold text-brand hover:underline">
              {all ? "Weniger" : `Alle ${PLATFORMS.length} Plattformen`}
            </button>
            <button type="button" onClick={() => onChange([...value, { label: "", url: "", icon: "", image: "", highlight: false }])} className="inline-flex items-center gap-1.5 rounded-full border border-edge py-1 pl-2 pr-3 text-[12.5px] font-semibold text-dim hover:text-fg">
              <ImagePlus className="size-4" /> Eigener Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
