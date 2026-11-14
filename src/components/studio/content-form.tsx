"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, FileUp, GripVertical, Plus, Trash2 } from "lucide-react";
import type { Field } from "@/lib/codes/types";
import { FieldShell, Input, Select, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

type Content = Record<string, unknown>;
type Errors = Record<string, string>;

interface Props {
  fields: Field[];
  value: Content;
  errors: Errors;
  onChange: (next: Content) => void;
  userId?: string;
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

export function ContentForm({ fields, value, errors, onChange, userId }: Props) {
  const set = (name: string, v: unknown) => onChange({ ...value, [name]: v });

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-5">
      {fields.map((field) => {
        const id = `f-${field.name}`;
        const error = errors[field.name];
        const span = "half" in field && field.half ? "col-span-2 sm:col-span-1" : "col-span-2";

        switch (field.kind) {
          case "textarea":
            return (
              <FieldShell key={field.name} label={field.label} htmlFor={id} error={error} hint={field.hint} className={span}>
                <Textarea id={id} value={str(value[field.name])} placeholder={field.placeholder} aria-invalid={!!error} onChange={(e) => set(field.name, e.target.value)} />
              </FieldShell>
            );
          case "select":
            return (
              <FieldShell key={field.name} label={field.label} htmlFor={id} error={error} className={span}>
                <Select id={id} value={str(value[field.name])} onChange={(e) => set(field.name, e.target.value)}>
                  {field.options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Select>
              </FieldShell>
            );
          case "checkbox":
            return (
              <label key={field.name} className="col-span-2 flex items-center gap-2.5 text-sm font-medium">
                <input type="checkbox" className="size-4 accent-lime" checked={Boolean(value[field.name])} onChange={(e) => set(field.name, e.target.checked)} />
                {field.label}
              </label>
            );
          case "color":
            return (
              <FieldShell key={field.name} label={field.label} htmlFor={id} className={span}>
                <ColorInput id={id} value={str(value[field.name]) || "#14130f"} onChange={(v) => set(field.name, v)} />
              </FieldShell>
            );
          case "links":
            return (
              <div key={field.name} className="col-span-2">
                <LinksEditor value={(value[field.name] as LinkItem[]) ?? []} errors={errors} prefix={field.name} onChange={(v) => set(field.name, v)} />
                {error && <p className="mt-1.5 text-xs text-rose">{error}</p>}
              </div>
            );
          case "menu":
            return (
              <div key={field.name} className="col-span-2">
                <MenuEditor value={(value[field.name] as MenuSection[]) ?? []} errors={errors} prefix={field.name} onChange={(v) => set(field.name, v)} />
                {error && <p className="mt-1.5 text-xs text-rose">{error}</p>}
              </div>
            );
          case "file":
            return (
              <FieldShell key={field.name} label={field.label} error={error} hint={field.hint} className="col-span-2">
                <FileUpload accept={field.accept} userId={userId} value={value[field.name] as UploadedFile | null} onChange={(v) => set(field.name, v)} />
              </FieldShell>
            );
          default: {
            const type = field.kind === "datetime" ? "datetime-local" : field.kind;
            return (
              <FieldShell key={field.name} label={field.label + (field.required ? " *" : "")} htmlFor={id} error={error} hint={field.hint} className={span}>
                <Input
                  id={id}
                  type={type}
                  value={str(value[field.name])}
                  placeholder={field.placeholder}
                  aria-invalid={!!error}
                  autoComplete="off"
                  onChange={(e) => set(field.name, e.target.value)}
                />
              </FieldShell>
            );
          }
        }
      })}
    </div>
  );
}

export function ColorInput({ id, value, onChange }: { id?: string; value: string; onChange: (v: string) => void }) {
  const [text, setText] = useState(value);
  const [prev, setPrev] = useState(value);
  if (prev !== value) {
    setPrev(value);
    setText(value);
  }
  return (
    <div className="flex h-12 items-center gap-2 rounded-[14px] border border-edge bg-bg/60 pl-2 pr-3 focus-within:border-lime/60">
      <input
        id={id}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="size-8 cursor-pointer rounded-lg border-0 bg-transparent p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-black/10 [&::-webkit-color-swatch-wrapper]:p-0"
      />
      <input
        value={text}
        maxLength={7}
        spellCheck={false}
        onChange={(e) => {
          const v = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
          setText(v);
          if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v.toLowerCase());
        }}
        className="w-full bg-transparent font-mono text-sm uppercase text-fg outline-none"
      />
    </div>
  );
}

// ───────── Links ─────────
type LinkItem = { label: string; url: string };

const LINK_SUGGESTIONS = ["Instagram", "TikTok", "Facebook", "WhatsApp", "YouTube", "LinkedIn", "Website", "Google Maps"];

function move<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

function LinksEditor({ value, onChange, errors, prefix }: { value: LinkItem[]; onChange: (v: LinkItem[]) => void; errors: Errors; prefix: string }) {
  const update = (i: number, patch: Partial<LinkItem>) => onChange(value.map((l, k) => (k === i ? { ...l, ...patch } : l)));
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-dim">Links</span>
        <span className="text-xs text-faint">{value.length} / 30</span>
      </div>
      <div className="space-y-2.5">
        {value.map((link, i) => (
          <div key={i} className="group flex items-start gap-2 rounded-2xl border border-edge bg-surface p-2.5">
            <GripVertical className="mt-4 size-4 shrink-0 text-faint" />
            <div className="grid flex-1 gap-2 sm:grid-cols-[150px_1fr]">
              <Input
                value={link.label}
                placeholder="Bezeichnung"
                list="link-suggestions"
                aria-invalid={!!errors[`${prefix}.${i}.label`]}
                onChange={(e) => update(i, { label: e.target.value })}
              />
              <Input
                value={link.url}
                placeholder="https://"
                aria-invalid={!!errors[`${prefix}.${i}.url`]}
                onChange={(e) => update(i, { url: e.target.value })}
              />
              {(errors[`${prefix}.${i}.url`] || errors[`${prefix}.${i}.label`]) && (
                <p className="text-xs text-rose sm:col-span-2">{errors[`${prefix}.${i}.label`] ?? errors[`${prefix}.${i}.url`]}</p>
              )}
            </div>
            <RowActions onUp={() => onChange(move(value, i, -1))} onDown={() => onChange(move(value, i, 1))} onRemove={() => onChange(value.filter((_, k) => k !== i))} />
          </div>
        ))}
      </div>
      <datalist id="link-suggestions">
        {LINK_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
      </datalist>
      {value.length < 30 && (
        <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={() => onChange([...value, { label: "", url: "" }])}>
          <Plus className="size-4" /> Link hinzufügen
        </Button>
      )}
    </div>
  );
}

function RowActions({ onUp, onDown, onRemove }: { onUp: () => void; onDown: () => void; onRemove: () => void }) {
  const btn = "grid size-8 place-items-center rounded-lg text-faint transition hover:bg-white/[0.07] hover:text-fg";
  return (
    <div className="flex shrink-0 flex-col sm:flex-row">
      <button type="button" className={btn} onClick={onUp} aria-label="Nach oben"><ArrowUp className="size-4" /></button>
      <button type="button" className={btn} onClick={onDown} aria-label="Nach unten"><ArrowDown className="size-4" /></button>
      <button type="button" className={cn(btn, "hover:text-rose")} onClick={onRemove} aria-label="Entfernen"><Trash2 className="size-4" /></button>
    </div>
  );
}

// ───────── Menu ─────────
type MenuItem = { name: string; description: string; price: string; tags: string };
type MenuSection = { title: string; items: MenuItem[] };
const emptyItem = (): MenuItem => ({ name: "", description: "", price: "", tags: "" });

function MenuEditor({ value, onChange, errors, prefix }: { value: MenuSection[]; onChange: (v: MenuSection[]) => void; errors: Errors; prefix: string }) {
  const setSection = (i: number, s: MenuSection) => onChange(value.map((x, k) => (k === i ? s : x)));
  return (
    <div className="space-y-4">
      {value.map((section, i) => (
        <div key={i} className="rounded-2xl border border-edge bg-surface">
          <div className="flex items-center gap-2 border-b border-edge p-3">
            <Input
              value={section.title}
              placeholder="Kategorie, z. B. Hauptgerichte"
              className="border-transparent bg-transparent font-display uppercase"
              aria-invalid={!!errors[`${prefix}.${i}.title`]}
              onChange={(e) => setSection(i, { ...section, title: e.target.value })}
            />
            <RowActions onUp={() => onChange(move(value, i, -1))} onDown={() => onChange(move(value, i, 1))} onRemove={() => onChange(value.filter((_, k) => k !== i))} />
          </div>
          <div className="divide-y divide-edge">
            {section.items.map((item, j) => {
              const setItem = (patch: Partial<MenuItem>) =>
                setSection(i, { ...section, items: section.items.map((x, k) => (k === j ? { ...x, ...patch } : x)) });
              const err = errors[`${prefix}.${i}.items.${j}.name`];
              return (
                <div key={j} className="flex items-start gap-2 p-3">
                  <div className="grid flex-1 grid-cols-[1fr_96px] gap-2">
                    <Input value={item.name} placeholder="Gericht" aria-invalid={!!err} onChange={(e) => setItem({ name: e.target.value })} />
                    <Input value={item.price} placeholder="12,90" inputMode="decimal" onChange={(e) => setItem({ price: e.target.value })} />
                    <Input className="col-span-2" value={item.description} placeholder="Beschreibung (optional)" onChange={(e) => setItem({ description: e.target.value })} />
                    <Input className="col-span-2" value={item.tags} placeholder="Hinweise: vegan, scharf, A, G …" onChange={(e) => setItem({ tags: e.target.value })} />
                    {err && <p className="col-span-2 text-xs text-rose">{err}</p>}
                  </div>
                  <RowActions
                    onUp={() => setSection(i, { ...section, items: move(section.items, j, -1) })}
                    onDown={() => setSection(i, { ...section, items: move(section.items, j, 1) })}
                    onRemove={() => setSection(i, { ...section, items: section.items.filter((_, k) => k !== j) })}
                  />
                </div>
              );
            })}
          </div>
          <div className="p-3 pt-0">
            <Button type="button" variant="ghost" size="sm" onClick={() => setSection(i, { ...section, items: [...section.items, emptyItem()] })}>
              <Plus className="size-4" /> Gericht
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="secondary" size="sm" onClick={() => onChange([...value, { title: "", items: [emptyItem()] }])}>
        <Plus className="size-4" /> Kategorie hinzufügen
      </Button>
    </div>
  );
}

// ───────── File upload ─────────
type UploadedFile = { url: string; name: string };

function FileUpload({ accept, userId, value, onChange }: { accept: string; userId?: string; value: UploadedFile | null; onChange: (v: UploadedFile | null) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    if (!userId) return setError("Bitte zuerst anmelden");
    if (file.size > 20 * 1024 * 1024) return setError("Die Datei ist größer als 20 MB");
    setBusy(true);
    setError(null);
    const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const supabase = createClient();
    const { error: upErr } = await supabase.storage.from("assets").upload(path, file, { contentType: file.type, upsert: false });
    setBusy(false);
    if (upErr) return setError("Upload fehlgeschlagen");
    const { data } = supabase.storage.from("assets").getPublicUrl(path);
    onChange({ url: data.publicUrl, name: file.name });
  }

  return (
    <div>
      {value ? (
        <div className="flex items-center justify-between rounded-[14px] border border-lime/40 bg-lime/10 px-4 py-3 text-sm font-semibold">
          <span className="truncate">{value.name}</span>
          <button type="button" className="text-dim hover:text-rose" onClick={() => onChange(null)}>Entfernen</button>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-edge-strong bg-surface px-4 py-9 text-sm text-dim transition hover:border-lime/60 hover:text-lime">
          <FileUp className="size-6" strokeWidth={1.5} />
          {busy ? "Wird hochgeladen …" : "Datei auswählen oder hierher ziehen"}
          <input type="file" accept={accept} className="sr-only" disabled={busy} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </label>
      )}
      {error && <p className="mt-1.5 text-xs text-rose">{error}</p>}
    </div>
  );
}
