"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Check, FileUp, Loader2, Moon, Palette, Plus, Star, Sun, Trash2 } from "lucide-react";
import type { CodeTypeId, Field, MenuSectionData, PromoData, ReviewData } from "@/lib/codes/types";
import { FieldShell, Input, Select, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";
import { DateTimeField } from "@/components/ui/date-time-field";
import { ImageField, LayoutPicker, MenuBuilder, MenuImport, MenuStylePicker } from "./menu-builder";
import { DesignEditor } from "./design-editor";
import { MenuTemplatePicker } from "./menu-template-picker";
import { PageLookPicker } from "./page-look-picker";
import { LinksEditor, type LinkItem } from "./links-editor";
import { LinkStylePicker } from "./link-style-picker";

type Content = Record<string, unknown>;
type Errors = Record<string, string>;

interface Props {
  type?: CodeTypeId;
  fields: Field[];
  value: Content;
  errors: Errors;
  onChange: (next: Content) => void;
  userId?: string;
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

export function ContentForm({ type, fields, value, errors, onChange, userId }: Props) {
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
                <input type="checkbox" className="size-4 accent-brand" checked={Boolean(value[field.name])} onChange={(e) => set(field.name, e.target.checked)} />
                {field.label}
              </label>
            );
          case "color":
            return (
              <FieldShell key={field.name} label={field.label} htmlFor={id} className={span}>
                <ColorInput id={id} value={str(value[field.name]) || "#191919"} onChange={(v) => set(field.name, v)} />
              </FieldShell>
            );
          case "links":
            return (
              <div key={field.name} className="col-span-2">
                <LinksEditor value={(value[field.name] as LinkItem[]) ?? []} errors={errors} prefix={field.name} onChange={(v) => set(field.name, v)} />
                {error && <p className="mt-1.5 text-xs text-rose">{error}</p>}
              </div>
            );
          case "pollOptions":
            return (
              <div key={field.name} className="col-span-2">
                <PollOptionsEditor value={(value[field.name] as PollOption[]) ?? []} errors={errors} prefix={field.name} onChange={(v) => set(field.name, v)} />
                {error && <p className="mt-1.5 text-xs text-rose">{error}</p>}
              </div>
            );
          case "menu":
            return (
              <div key={field.name} className="col-span-2">
                <MenuImport
                  onImport={(menu, mode) => {
                    const current = (value[field.name] as MenuSectionData[]) ?? [];
                    const filled = (k: string, v?: string) => (v && !str(value[k]) ? { [k]: v } : {});
                    onChange({
                      ...value,
                      [field.name]: mode === "replace" ? menu.sections : [...current, ...menu.sections],
                      ...filled("name", menu.name), ...filled("logo", menu.logo), ...filled("cover", menu.cover),
                      ...filled("phone", menu.phone), ...filled("address", menu.address),
                    });
                  }}
                />
                <p className="mb-2 text-xs font-bold text-dim">{field.label}</p>
                <MenuBuilder value={(value[field.name] as MenuSectionData[]) ?? []} errors={errors} prefix={field.name} onChange={(v) => set(field.name, v)} />
                {error && <p className="mt-1.5 text-xs text-rose">{error}</p>}
              </div>
            );
          case "section":
            return (
              <div key={field.name} className="col-span-2 mt-4 border-t border-edge pt-6">
                <p className="text-[15px] font-semibold">{field.label}</p>
                {field.hint && <p className="mt-1 text-[13px] leading-relaxed text-faint">{field.hint}</p>}
              </div>
            );
          case "promos":
            return (
              <div key={field.name} className="col-span-2">
                <PromosEditor value={(value[field.name] as PromoData[]) ?? []} errors={errors} prefix={field.name} onChange={(v) => set(field.name, v)} />
              </div>
            );
          case "linkstyle":
            return (
              <FieldShell key={field.name} label={field.label} hint="Wie deine Links aussehen. Die Vorschau zeigt ein Beispiel, deine Links übernehmen nur den Stil." className="col-span-2">
                <LinkStylePicker value={str(value[field.name]) || "cards"} content={value} onPick={(v) => set(field.name, v)} />
              </FieldShell>
            );
          case "gallery":
            return (
              <div key={field.name} className="col-span-2">
                <GalleryEditor value={(value[field.name] as string[]) ?? []} onChange={(v) => set(field.name, v)} />
              </div>
            );
          case "reviews":
            return (
              <div key={field.name} className="col-span-2">
                <ReviewsEditor value={(value[field.name] as ReviewData[]) ?? []} errors={errors} prefix={field.name} onChange={(v) => set(field.name, v)} />
              </div>
            );
          case "review":
            return (
              <FieldShell key={field.name} label={field.label + " *"} error={error} className="col-span-2">
                <ReviewLinkField value={str(value[field.name])} hint={field.hint} onChange={(url, name) => onChange({ ...value, [field.name]: url, ...(name && !str(value.business) ? { business: name } : {}) })} />
              </FieldShell>
            );
          case "image":
            return (
              <FieldShell key={field.name} label={field.label} hint={field.hint} className={field.shape === "wide" ? "col-span-2 sm:col-span-1" : "col-span-1"}>
                <ImageField value={str(value[field.name])} shape={field.shape} onChange={(v) => set(field.name, v)} className={field.shape === "wide" ? "" : "max-w-[140px]"} />
              </FieldShell>
            );
          case "layout":
            return (
              <FieldShell key={field.name} label={field.label} className="col-span-2">
                <LayoutPicker value={str(value[field.name]) || "cards"} onChange={(v) => set(field.name, v)} />
              </FieldShell>
            );
          case "menutemplate":
            return (
              <FieldShell key={field.name} label="Vorlage für die Speisekarte" hint="30 Vorlagen. Die ersten zehn sind komplette Restaurant-Seiten mit Aktionen, Bewertungen und Öffnungszeiten. Die Vorschau zeigt ein Beispiel mit Fotos, deine Karte übernimmt nur den Look." className="col-span-2">
                <MenuTemplatePicker value={str(value[field.name])} content={value} onPick={(t) => onChange({ ...value, [field.name]: t.id, design: t.design })} />
              </FieldShell>
            );
          case "design":
            return (
              <div key={field.name} className="col-span-2 space-y-5">
                {type && type !== "menu" && (
                  <FieldShell label="Look" hint="Komplette Designs, gezeigt an einem Beispiel mit Fotos. Deine Seite übernimmt nur den Look. Danach kannst du unter „Farben & Schrift“ alles fein anpassen.">
                    <PageLookPicker type={type} content={value} onPick={(d) => set(field.name, d)} />
                  </FieldShell>
                )}
              <FieldShell label="Farben & Schrift" hint="Feinschliff für deine Seite. Die Vorschau zeigt jede Änderung sofort." className="col-span-2">
                <DesignEditor content={value} onChange={(d) => set(field.name, d)} />
              </FieldShell>
              </div>
            );
          case "menustyle":
            return (
              <FieldShell key={field.name} label={field.label} hint="Farben, Schriften und Animationen. Eine eigene Akzentfarbe weiter unten überschreibt die der Vorlage." className="col-span-2">
                <MenuStylePicker value={str(value[field.name])} onChange={(st, layout) => onChange({ ...value, [field.name]: st, layout })} />
              </FieldShell>
            );
          case "theme":
            return (
              <FieldShell key={field.name} label={field.label} className="col-span-2">
                <ThemePicker value={str(value[field.name]) || "light"} onChange={(v) => set(field.name, v)} />
              </FieldShell>
            );
          case "file":
            return (
              <FieldShell key={field.name} label={field.label} error={error} hint={field.hint} className="col-span-2">
                <FileUpload accept={field.accept} userId={userId} value={value[field.name] as UploadedFile | null} onChange={(v) => set(field.name, v)} />
              </FieldShell>
            );
          default: {
            if (field.kind === "datetime" || field.kind === "date") {
              return (
                <FieldShell key={field.name} label={field.label + (field.required ? " *" : "")} htmlFor={id} error={error} hint={field.hint} className={span}>
                  <DateTimeField id={id} value={str(value[field.name])} onChange={(v) => set(field.name, v)} withTime={field.kind === "datetime"} invalid={!!error} />
                </FieldShell>
              );
            }
            const type = field.kind;
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
    <div className="flex h-12 min-w-0 items-center gap-1.5 rounded-[14px] border border-edge bg-bg/60 pl-2 pr-1.5 focus-within:border-brand/60">
      <input
        id={id}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="size-6 shrink-0 cursor-pointer rounded-md sm:size-7 border-0 bg-transparent p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-black/10 [&::-webkit-color-swatch-wrapper]:p-0"
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
        className="w-full min-w-0 bg-transparent font-mono text-[12px] tracking-tighter text-fg outline-none"
      />
    </div>
  );
}

// ───────── Links ─────────


function move<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

type PollOption = { label: string; image: string };

/** Poll answers: text plus an optional photo each (photos turn the poll into picture cards). */
function PollOptionsEditor({ value, onChange, errors, prefix }: { value: PollOption[]; onChange: (v: PollOption[]) => void; errors: Errors; prefix: string }) {
  const update = (i: number, patch: Partial<PollOption>) => onChange(value.map((o, k) => (k === i ? { ...o, ...patch } : o)));
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] font-semibold text-dim">Antworten</span>
        <span className="text-xs text-faint">{value.length} / 12 · Foto optional</span>
      </div>
      <div className="space-y-2.5">
        {value.map((o, i) => (
          <div key={i} className="flex items-center gap-2.5 rounded-2xl border border-edge bg-surface p-2.5">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-hi/10 font-mono text-xs font-bold text-dim">{String.fromCharCode(65 + i)}</span>
            <ImageField value={o.image} onChange={(url) => update(i, { image: url })} label="Foto" className="w-14 shrink-0 [&_span]:p-1 [&_span]:text-[10px]" />
            <div className="min-w-0 flex-1">
              <Input value={o.label} maxLength={80} placeholder={`Antwort ${i + 1}`} aria-invalid={!!errors[`${prefix}.${i}.label`]} onChange={(e) => update(i, { label: e.target.value })} />
              {errors[`${prefix}.${i}.label`] && <p className="mt-1 text-xs text-rose">{errors[`${prefix}.${i}.label`]}</p>}
            </div>
            <RowActions onUp={() => onChange(move(value, i, -1))} onDown={() => onChange(move(value, i, 1))} onRemove={() => value.length > 2 && onChange(value.filter((_, k) => k !== i))} />
          </div>
        ))}
      </div>
      {value.length < 12 && (
        <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={() => onChange([...value, { label: "", image: "" }])}>
          <Plus className="size-4" /> Antwort hinzufügen
        </Button>
      )}
    </div>
  );
}


const PROMO_IDEAS: PromoData[] = [
  { kicker: "Mo – Fr · 11 – 15 Uhr", title: "Mittagstisch", text: "Hauptgericht und ein Getränk", tag: "9,90 €", image: "" },
  { kicker: "Jeden Dienstag", title: "Burger-Tag", text: "Der zweite Burger kostet die Hälfte", tag: "–50 %", image: "" },
  { kicker: "Bei Abholung", title: "10 % auf alles", text: "Einfach anrufen und selbst abholen", tag: "–10 %", image: "" },
];

function PromosEditor({ value, onChange, errors, prefix }: { value: PromoData[]; onChange: (v: PromoData[]) => void; errors: Errors; prefix: string }) {
  const update = (i: number, patch: Partial<PromoData>) => onChange(value.map((p, k) => (k === i ? { ...p, ...patch } : p)));
  const err = (i: number) => errors[`${prefix}.${i}.title`];
  return (
    <div>
      <div className="space-y-2.5">
        {value.map((p, i) => (
          <div key={i} className="flex items-start gap-3 rounded-2xl border border-edge bg-surface p-3">
            <ImageField value={p.image} onChange={(v) => update(i, { image: v })} label="Bild" className="w-[84px] shrink-0" />
            <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
              <Input value={p.title} placeholder="Titel, z. B. Mittagstisch" aria-invalid={!!err(i)} onChange={(e) => update(i, { title: e.target.value })} />
              <Input value={p.kicker} placeholder="Zeile oben, z. B. Jeden Dienstag" onChange={(e) => update(i, { kicker: e.target.value })} />
              <Input value={p.text} placeholder="Kurzer Text" onChange={(e) => update(i, { text: e.target.value })} />
              <Input value={p.tag} placeholder="Etikett, z. B. 9,90 € oder –50 %" onChange={(e) => update(i, { tag: e.target.value })} />
              {err(i) && <p className="text-xs text-rose sm:col-span-2">{err(i)}</p>}
            </div>
            <RowActions onUp={() => onChange(move(value, i, -1))} onDown={() => onChange(move(value, i, 1))} onRemove={() => onChange(value.filter((_, k) => k !== i))} />
          </div>
        ))}
      </div>
      {value.length < 6 && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => onChange([...value, { kicker: "", title: "", text: "", tag: "", image: "" }])}><Plus className="size-4" /> Aktion hinzufügen</Button>
          {value.length === 0 && PROMO_IDEAS.map((idea) => (
            <button key={idea.title} type="button" onClick={() => onChange([...value, idea])} className="rounded-full border border-edge px-3 py-1.5 text-[13px] text-dim transition hover:border-edge-strong hover:text-fg">+ {idea.title}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewsEditor({ value, onChange, errors, prefix }: { value: ReviewData[]; onChange: (v: ReviewData[]) => void; errors: Errors; prefix: string }) {
  const update = (i: number, patch: Partial<ReviewData>) => onChange(value.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  return (
    <div>
      <div className="space-y-2.5">
        {value.map((r, i) => (
          <div key={i} className="flex items-start gap-2 rounded-2xl border border-edge bg-surface p-3">
            <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Input value={r.name} placeholder="Name, z. B. Lena M." aria-invalid={!!errors[`${prefix}.${i}.name`]} onChange={(e) => update(i, { name: e.target.value })} />
              <Input value={r.when} placeholder="Wann, z. B. vor 2 Wochen" onChange={(e) => update(i, { when: e.target.value })} />
              <div className="flex h-12 items-center gap-0.5 px-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => update(i, { stars: n })} aria-label={`${n} Sterne`} className="grid size-7 place-items-center">
                    <Star className={cn("size-[18px]", n <= (r.stars ?? 5) ? "fill-amber-400 text-amber-400" : "text-faint")} />
                  </button>
                ))}
              </div>
              <div className="sm:col-span-3">
                <Textarea value={r.text} rows={2} placeholder="Was der Gast geschrieben hat" aria-invalid={!!errors[`${prefix}.${i}.text`]} onChange={(e) => update(i, { text: e.target.value })} />
              </div>
            </div>
            <RowActions onUp={() => onChange(move(value, i, -1))} onDown={() => onChange(move(value, i, 1))} onRemove={() => onChange(value.filter((_, k) => k !== i))} />
          </div>
        ))}
      </div>
      {value.length < 12 && (
        <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={() => onChange([...value, { name: "", text: "", stars: 5, when: "" }])}><Plus className="size-4" /> Bewertung hinzufügen</Button>
      )}
    </div>
  );
}

function GalleryEditor({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const list = value.filter((v) => typeof v === "string");
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
      {list.map((url, i) => (
        <div key={`${url}-${i}`} className="relative">
          <ImageField value={url} onChange={(v) => onChange(v ? list.map((x, k) => (k === i ? v : x)) : list.filter((_, k) => k !== i))} label="Foto" />
          <button type="button" onClick={() => onChange(list.filter((_, k) => k !== i))} aria-label="Foto entfernen" className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full border border-edge bg-surface text-faint shadow-sm hover:text-rose"><Trash2 className="size-3" /></button>
        </div>
      ))}
      {list.length < 12 && <ImageField key={list.length} value="" onChange={(v) => v && onChange([...list, v])} label="Foto hinzufügen" />}
    </div>
  );
}

function RowActions({ onUp, onDown, onRemove }: { onUp: () => void; onDown: () => void; onRemove: () => void }) {
  const btn = "grid size-8 place-items-center rounded-lg text-faint transition hover:bg-hi/[0.07] hover:text-fg";
  return (
    <div className="flex shrink-0 flex-col sm:flex-row">
      <button type="button" className={btn} onClick={onUp} aria-label="Nach oben"><ArrowUp className="size-4" /></button>
      <button type="button" className={btn} onClick={onDown} aria-label="Nach unten"><ArrowDown className="size-4" /></button>
      <button type="button" className={cn(btn, "hover:text-rose")} onClick={onRemove} aria-label="Entfernen"><Trash2 className="size-4" /></button>
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

  if (!userId) {
    return (
      <div>
        <Input
          type="url"
          placeholder="https://… Link zu deiner PDF (z. B. Google Drive, Dropbox)"
          value={value?.url ?? ""}
          onChange={(e) => onChange(e.target.value ? { url: e.target.value, name: e.target.value.split("/").pop() || "Dokument.pdf" } : null)}
        />
        <p className="mt-1.5 text-xs text-faint">Hochladen direkt bei uns kommt mit dem Konto. Bis dahin: Link zur PDF einfügen.</p>
      </div>
    );
  }

  return (
    <div>
      {value ? (
        <div className="flex items-center justify-between rounded-[14px] border border-brand/40 bg-brand/10 px-4 py-3 text-sm font-semibold">
          <span className="truncate">{value.name}</span>
          <button type="button" className="text-dim hover:text-rose" onClick={() => onChange(null)}>Entfernen</button>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-edge-strong bg-surface px-4 py-9 text-sm text-dim transition hover:border-brand/60 hover:text-brand">
          <FileUp className="size-6" strokeWidth={1.5} />
          {busy ? "Wird hochgeladen …" : "Datei auswählen oder hierher ziehen"}
          <input type="file" accept={accept} className="sr-only" disabled={busy} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </label>
      )}
      {error && <p className="mt-1.5 text-xs text-rose">{error}</p>}
    </div>
  );
}

// ───────── Page style ─────────
const THEMES = [
  { value: "light", label: "Hell", icon: Sun, swatch: "bg-[#f7f5f0]" },
  { value: "dark", label: "Dunkel", icon: Moon, swatch: "bg-[#0f1113]" },
  { value: "color", label: "Farbig", icon: Palette, swatch: "bg-brand" },
];

function ThemePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {THEMES.map(({ value: v, label, icon: Icon, swatch }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          className={cn("flex items-center gap-3 rounded-2xl border p-3 text-left text-sm font-bold transition", value === v ? "border-brand bg-brand/10 text-fg" : "border-edge bg-bg/60 text-dim hover:border-hi/25")}
        >
          <span className={cn("grid size-9 place-items-center rounded-xl border border-hi/15", swatch)}><Icon className="size-4 text-white mix-blend-difference" /></span>
          {label}
        </button>
      ))}
    </div>
  );
}

// ───────── Google review link ─────────
function ReviewLinkField({ value, hint, onChange }: { value: string; hint?: string; onChange: (url: string, name?: string) => void }) {
  const [input, setInput] = useState(value);
  const [state, setState] = useState<{ busy: boolean; error?: string; name?: string; method?: string }>({ busy: false });
  const resolved = !!value && !state.busy;
  const direct = value.startsWith("https://search.google.com/local/writereview");

  async function resolve(raw = input) {
    if (!raw.trim()) return setState({ busy: false, error: "Bitte zuerst einen Link einfügen" });
    setState({ busy: true });
    try {
      const res = await fetch("/api/review-link", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: raw.trim() }) });
      const data = (await res.json()) as { ok: boolean; url?: string; name?: string; message?: string; method?: string };
      if (data.ok && data.url) {
        onChange(data.url, data.name);
        setState({ busy: false, name: data.name, method: data.method });
      } else setState({ busy: false, error: data.message ?? "Link konnte nicht erkannt werden" });
    } catch {
      setState({ busy: false, error: "Keine Verbindung. Bitte erneut versuchen." });
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={input}
          placeholder="https://maps.app.goo.gl/… oder Link aus der Adresszeile"
          onChange={(e) => setInput(e.target.value)}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData("text");
            if (pasted) setTimeout(() => resolve(pasted), 0);
          }}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), resolve())}
        />
        <Button type="button" onClick={() => resolve()} disabled={state.busy} className="shrink-0">
          {state.busy ? <Loader2 className="size-4 animate-spin" /> : <Star className="size-4" />} Link erzeugen
        </Button>
      </div>
      {state.error ? <p className="mt-2 text-xs text-rose">{state.error}</p> : !resolved && hint ? <p className="mt-2 text-xs text-faint">{hint}</p> : null}
      {resolved && (
        <div className="mt-3 flex items-start gap-3 rounded-2xl border border-mint/30 bg-mint/10 p-3.5 text-sm">
          <Check className="mt-0.5 size-4 shrink-0 text-mint" />
          <div className="min-w-0">
            <p className="font-bold text-mint">{direct || state.method === "maps" ? "Bewertungs-Link bereit" : "Link zu deinem Google-Profil bereit"}{state.name ? ` für ${state.name}` : ""}</p>
            {!direct && <p className="mt-0.5 text-xs text-dim">{state.method === "maps" ? "Öffnet dein Geschäft in Google Maps direkt bei den Bewertungen." : "Öffnet dein Geschäft in Google Maps. Für das direkte Bewertungsfenster kann der Betreiber einen Google-Maps-API-Schlüssel hinterlegen."}</p>}
            <a href={value} target="_blank" rel="noreferrer" className="mt-0.5 block truncate font-mono text-xs text-dim hover:text-fg">{value}</a>
          </div>
        </div>
      )}
    </div>
  );
}
