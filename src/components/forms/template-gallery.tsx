"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Loader2, Plus } from "lucide-react";
import type { FormDef } from "@/lib/forms/types";
import { lookOf, backdropCss } from "@/lib/forms/looks";
import { TypeIcon } from "@/components/type-icon";
import { createForm } from "@/app/dashboard/forms/actions";
import { FormThumb } from "./form-thumb";
import { cn } from "@/lib/cn";

export interface GalleryItem { id: string; name: string; hint: string; icon: string; category: string; def: FormDef }

const TILTS = [-3.2, 2.4, -1.8, 3, -2.6, 1.6];

export function TemplateGallery({ items, categories }: { items: GalleryItem[]; categories: readonly string[] }) {
  const [cat, setCat] = useState<string>("Alle");
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();
  const use = (template?: string) => {
    if (busy) return;
    setBusy(template ?? "blank");
    const fd = new FormData();
    if (template) fd.set("template", template);
    start(async () => { await createForm(fd); });
  };
  const shown = cat === "Alle" ? items : items.filter((t) => t.category === cat);
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl leading-none">Vorlagen</h2>
          <p className="mt-2 text-sm text-dim">{items.length} fertige Formulare. Fahr mit der Maus drüber zum Durchblättern, dann direkt anpassen.</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {["Alle", ...categories].map((c) => (
            <button key={c} type="button" onClick={() => setCat(c)} className="relative h-9 rounded-xl px-3.5 text-[13px] font-semibold">
              {cat === c && <motion.span layoutId="tpl-cat" className="absolute inset-0 rounded-xl bg-fg" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
              <span className={cn("relative", cat === c ? "text-bg" : "text-dim hover:text-fg")}>{c}</span>
            </button>
          ))}
        </div>
      </div>

      <motion.div layout className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        <div className="contents">
          <button type="button" onClick={() => use()} className="group flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-[28px] border-2 border-dashed border-edge-strong p-6 text-center transition hover:border-lime hover:bg-lime/[0.04]">
            <span className="grid size-16 place-items-center rounded-2xl bg-lime text-night transition group-hover:rotate-90 group-hover:scale-110">{busy === "blank" ? <Loader2 className="size-7 animate-spin" /> : <Plus className="size-7" />}</span>
            <span><span className="block text-lg font-semibold">Leer starten</span><span className="mt-1 block text-sm text-dim">Eigene Fragen, eigenes Design</span></span>
          </button>
        </div>
        <AnimatePresence mode="popLayout">
          {shown.map((t, i) => {
            const look = lookOf(t.def.settings.look);
            const dark = (t.def.settings.mode ?? look.prefers) === "dark";
            const p = dark ? look.dark : look.light;
            return (
              <motion.div key={t.id} layout
                initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.35, delay: Math.min(i, 8) * 0.04 }}
                className="group/card">
                <div role="button" tabIndex={0} onClick={() => use(t.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); use(t.id); } }} className="block w-full cursor-pointer text-left outline-none">
                  <div className={cn("relative overflow-hidden rounded-[28px] px-10 pb-10 pt-9 transition duration-500", dark && "ring-1 ring-inset ring-white/10")} style={{ background: backdropCss(look, p, dark) }}>
                    <div aria-hidden className="absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_100%,rgba(0,0,0,.18),transparent_70%)]" />
                    <FormThumb def={t.def} tilt={TILTS[i % TILTS.length]} />
                    <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm" style={{ background: p.accent, color: isLight(p.accent) ? "#0b0b0b" : "#ffffff" }}>
                      {look.name}
                    </span>
                  </div>
                  <div className="mt-4 flex items-start gap-3 px-1">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-hi/[0.07]"><TypeIcon name={t.icon} className="size-[18px]" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{t.name}</span>
                      <span className="block text-[13px] text-dim">{t.hint} · {t.def.fields.length} Felder{t.def.settings.layout === "steps" ? " · Schritt für Schritt" : ""}</span>
                    </span>
                    <span className="mt-1 inline-flex items-center gap-1 text-[13px] font-semibold opacity-0 transition group-hover/card:translate-x-0.5 group-hover/card:opacity-100">
                      {busy === t.id ? <Loader2 className="size-4 animate-spin" /> : <>Nutzen <ArrowRight className="size-4" /></>}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}

function isLight(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 160;
}
