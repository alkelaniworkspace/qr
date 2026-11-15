"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, BarChart3, Check, Copy, ExternalLink, Loader2, Plus, QrCode, Trash2, X } from "lucide-react";
import { FIELD_TYPES, hasOptions, newFieldId, type FieldType, type FormDef, type FormField } from "@/lib/forms/types";
import { FormView } from "./form-view";
import { saveForm, setFormStatus, deleteForm } from "@/app/dashboard/forms/actions";
import { TypeIcon } from "@/components/type-icon";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { ColorInput } from "@/components/studio/content-form";
import { cn } from "@/lib/cn";

interface Props {
  id: string;
  slug: string;
  status: "open" | "closed";
  responses: number;
  initial: FormDef;
  url: string;
  branding: boolean;
}

export function FormBuilder({ id, slug, status, responses, initial, url, branding }: Props) {
  const [def, setDef] = useState<FormDef>(initial);
  const [open, setOpen] = useState<string | null>(initial.fields[0]?.id ?? null);
  const [saved, setSaved] = useState<"saved" | "dirty" | "error">("saved");
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  const update = (patch: Partial<FormDef>) => {
    setDef((d) => ({ ...d, ...patch }));
    setSaved("dirty");
  };
  const setField = (fid: string, patch: Partial<FormField>) => update({ fields: def.fields.map((f) => (f.id === fid ? { ...f, ...patch } : f)) });
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= def.fields.length) return;
    const next = [...def.fields];
    [next[i], next[j]] = [next[j], next[i]];
    update({ fields: next });
  };
  const add = (type: FieldType) => {
    const f: FormField = { id: newFieldId(), type, label: FIELD_TYPES.find((t) => t.type === type)!.label, required: false, ...(hasOptions(type) ? { options: ["Option 1", "Option 2"] } : {}) };
    update({ fields: [...def.fields, f] });
    setOpen(f.id);
  };

  function save() {
    start(async () => {
      const res = await saveForm(id, def);
      if (res.ok) {
        setSaved("saved");
        setMsg("");
      } else {
        setSaved("error");
        setMsg(res.message);
      }
    });
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="min-w-0 space-y-5">
        <div className="sticky top-16 z-20 -mx-2 flex flex-wrap items-center gap-2 rounded-2xl border border-edge bg-bg/80 p-2 backdrop-blur-xl">
          <Button type="button" onClick={save} disabled={pending || saved === "saved"} size="sm">
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} {saved === "saved" ? "Gespeichert" : "Speichern"}
          </Button>
          <button type="button" onClick={() => start(() => setFormStatus(id, status === "open" ? "closed" : "open"))} className={cn("rounded-full border px-3.5 py-1.5 text-sm font-semibold", status === "open" ? "border-mint/40 text-mint" : "border-edge text-dim")}>
            {status === "open" ? "● Offen" : "○ Geschlossen"}
          </button>
          <Link href={`/dashboard/forms/${id}/responses`} className="inline-flex items-center gap-1.5 rounded-full border border-edge px-3.5 py-1.5 text-sm font-semibold hover:bg-hi/5"><BarChart3 className="size-4" /> {responses} Antworten</Link>
          <div className="ml-auto flex flex-wrap gap-2">
            <button type="button" onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="inline-flex items-center gap-1.5 rounded-full border border-edge px-3.5 py-1.5 text-sm font-semibold hover:bg-hi/5">{copied ? <Check className="size-4" /> : <Copy className="size-4" />} Link</button>
            <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-edge px-3.5 py-1.5 text-sm font-semibold hover:bg-hi/5"><ExternalLink className="size-4" /> Öffnen</a>
            <Link href={`/studio?type=url&url=${encodeURIComponent(url)}`} className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-1.5 text-sm font-semibold text-on-brand"><QrCode className="size-4" /> QR-Code gestalten</Link>
          </div>
        </div>
        {saved === "error" && <p className="rounded-xl border border-rose/30 bg-rose/10 px-4 py-2.5 text-sm text-rose">{msg}</p>}

        <div className="card space-y-3 p-5">
          <Input value={def.title} onChange={(e) => update({ title: e.target.value })} className="font-display text-xl" placeholder="Titel" />
          <Textarea rows={2} value={def.description} onChange={(e) => update({ description: e.target.value })} placeholder="Beschreibung (optional)" />
        </div>

        <ul className="space-y-2.5">
          {def.fields.map((f, i) => {
            const expanded = open === f.id;
            const meta = FIELD_TYPES.find((t) => t.type === f.type)!;
            return (
              <li key={f.id} className={cn("card overflow-hidden transition", expanded && "border-edge-strong")}>
                <button type="button" onClick={() => setOpen(expanded ? null : f.id)} className="flex w-full items-center gap-3 p-4 text-left">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-hi/10"><TypeIcon name={meta.icon} className="size-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{f.label}{f.required && <span className="text-rose"> *</span>}</span>
                    <span className="text-xs text-faint">{meta.label}{f.options ? ` · ${f.options.length} Optionen` : ""}</span>
                  </span>
                </button>
                {expanded && (
                  <div className="space-y-3 border-t border-edge p-4">
                    <Input value={f.label} onChange={(e) => setField(f.id, { label: e.target.value })} placeholder="Frage" />
                    <Input value={f.help ?? ""} onChange={(e) => setField(f.id, { help: e.target.value })} placeholder="Hilfetext (optional)" />
                    {hasOptions(f.type) && (
                      <div className="space-y-1.5">
                        {(f.options ?? []).map((o, k) => (
                          <div key={k} className="flex gap-1.5">
                            <Input value={o} onChange={(e) => setField(f.id, { options: f.options!.map((x, m) => (m === k ? e.target.value : x)) })} />
                            <button type="button" aria-label="Option entfernen" onClick={() => setField(f.id, { options: f.options!.filter((_, m) => m !== k) })} className="grid size-12 shrink-0 place-items-center rounded-xl text-faint hover:text-rose"><X className="size-4" /></button>
                          </div>
                        ))}
                        <button type="button" onClick={() => setField(f.id, { options: [...(f.options ?? []), `Option ${(f.options?.length ?? 0) + 1}`] })} className="inline-flex items-center gap-1 text-sm font-semibold hover:underline"><Plus className="size-4" /> Option</button>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      {f.type !== "section" && (
                        <label className="mr-auto flex items-center gap-2 text-sm font-semibold">
                          <input type="checkbox" className="size-4 accent-brand" checked={!!f.required} onChange={(e) => setField(f.id, { required: e.target.checked })} /> Pflichtfeld
                        </label>
                      )}
                      <button type="button" onClick={() => move(i, -1)} className="grid size-9 place-items-center rounded-lg text-faint hover:bg-hi/5 hover:text-fg" aria-label="Hoch"><ArrowUp className="size-4" /></button>
                      <button type="button" onClick={() => move(i, 1)} className="grid size-9 place-items-center rounded-lg text-faint hover:bg-hi/5 hover:text-fg" aria-label="Runter"><ArrowDown className="size-4" /></button>
                      <button type="button" onClick={() => update({ fields: def.fields.filter((x) => x.id !== f.id) })} className="grid size-9 place-items-center rounded-lg text-faint hover:bg-hi/5 hover:text-rose" aria-label="Löschen"><Trash2 className="size-4" /></button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="card p-5">
          <p className="mb-3 text-sm font-semibold text-dim">Feld hinzufügen</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
            {FIELD_TYPES.map((t) => (
              <button key={t.type} type="button" onClick={() => add(t.type)} className="flex items-center gap-2 rounded-xl border border-edge px-3 py-2.5 text-sm font-medium transition hover:border-edge-strong hover:bg-hi/5">
                <TypeIcon name={t.icon} className="size-4" /> {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card grid gap-4 p-5 sm:grid-cols-2">
          <label className="text-sm font-semibold text-dim">Danke-Text<Input className="mt-1.5" value={def.settings.thankYou ?? ""} onChange={(e) => update({ settings: { ...def.settings, thankYou: e.target.value } })} placeholder="Danke!" /></label>
          <label className="text-sm font-semibold text-dim">Button<Input className="mt-1.5" value={def.settings.buttonText ?? ""} onChange={(e) => update({ settings: { ...def.settings, buttonText: e.target.value } })} placeholder="Absenden" /></label>
          <label className="text-sm font-semibold text-dim">Farbe<div className="mt-1.5"><ColorInput value={def.settings.accent ?? "#191919"} onChange={(c) => update({ settings: { ...def.settings, accent: c } })} /></div></label>
          <div className="space-y-2 text-sm font-semibold">
            <label className="flex items-center gap-2"><input type="checkbox" className="size-4 accent-brand" checked={def.settings.theme === "dark"} onChange={(e) => update({ settings: { ...def.settings, theme: e.target.checked ? "dark" : "light" } })} /> Dunkles Design</label>
            <label className="flex items-center gap-2"><input type="checkbox" className="size-4 accent-brand" checked={!!def.settings.showResults} onChange={(e) => update({ settings: { ...def.settings, showResults: e.target.checked } })} /> Ergebnisse nach Abstimmung zeigen</label>
          </div>
        </div>

        <form action={() => start(() => deleteForm(id))} className="pt-2">
          <button className="text-sm font-semibold text-dim hover:text-rose">Formular löschen</button>
        </form>
      </div>

      <aside className="xl:sticky xl:top-24 xl:self-start">
        <div className="mx-auto h-[720px] w-[360px] overflow-hidden rounded-[44px] border-[10px] border-[#0b0b0b] bg-black shadow-lift">
          <div className="h-full overflow-y-auto [scrollbar-width:none]">
            <FormView preview form={{ slug, title: def.title, description: def.description, fields: def.fields, settings: def.settings, status: "open", branding }} />
          </div>
        </div>
      </aside>
    </div>
  );
}
