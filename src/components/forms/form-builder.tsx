"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, Reorder, motion, useDragControls } from "motion/react";
import {
  BarChart3, Check, ChevronDown, Copy, CopyPlus, ExternalLink, GitBranch, GripVertical, ImagePlus, Loader2, Monitor, Moon, Plus,
  QrCode, Settings2, Smartphone, Sparkles, Sun, SunMoon, Trash2, Palette, ListChecks, X, Zap,
} from "lucide-react";
import { FIELD_GROUPS, FIELD_TYPES, hasOptions, isInput, newFieldId, type FieldLogic, type FieldType, type FormDef, type FormField, type FormSettings } from "@/lib/forms/types";
import { FORM_FONTS, FORM_LOOKS, backdropCss, lookOf } from "@/lib/forms/looks";
import { FormView } from "./form-view";
import { saveForm, setFormStatus, deleteForm } from "@/app/dashboard/forms/actions";
import { TypeIcon } from "@/components/type-icon";
import { uploadImage } from "@/lib/upload-image";
import { cn } from "@/lib/cn";

interface Props { id: string; slug: string; status: "open" | "closed"; responses: number; initial: FormDef; url: string; branding: boolean }
type Tab = "content" | "design" | "settings";

const inputCls = "h-11 w-full rounded-xl border border-edge bg-bg/60 px-3.5 text-[14px] outline-none transition placeholder:text-faint focus:border-brand/60";
const label = "mb-1.5 block text-[12.5px] font-semibold text-dim";

export function FormBuilder({ id, slug, status: initialStatus, responses, initial, url, branding }: Props) {
  const [def, setDef] = useState<FormDef>(initial);
  const [tab, setTab] = useState<Tab>("content");
  const [open, setOpen] = useState<string | null>(null);
  const [saved, setSaved] = useState<"saved" | "dirty" | "saving" | "error">("saved");
  const [msg, setMsg] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [copied, setCopied] = useState(false);
  const [device, setDevice] = useState<"phone" | "desktop">("phone");
  const [previewMode, setPreviewMode] = useState<"light" | "dark" | null>(null);
  const [, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(def);

  const save = () => {
    setSaved("saving");
    start(async () => {
      const res = await saveForm(id, latest.current);
      if (res.ok) { setSaved((s) => (s === "saving" ? "saved" : s)); setMsg(""); }
      else { setSaved("error"); setMsg(res.message); }
    });
  };
  const update = (patch: Partial<FormDef>) => {
    setDef((d) => {
      const next = { ...d, ...patch };
      latest.current = next;
      return next;
    });
    setSaved("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, 1100);
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const setS = (patch: Partial<FormSettings>) => update({ settings: { ...def.settings, ...patch } });
  const setField = (fid: string, patch: Partial<FormField>) => update({ fields: def.fields.map((f) => (f.id === fid ? { ...f, ...patch } : f)) });
  const add = (type: FieldType) => {
    const meta = FIELD_TYPES.find((t) => t.type === type)!;
    const f: FormField = { id: newFieldId(), type, label: type === "statement" ? "Hinweis für die Person, die ausfüllt." : type === "consent" ? "Ich stimme der Datenschutzerklärung zu." : meta.label, required: false,
      ...(hasOptions(type) ? { options: ["Option 1", "Option 2", "Option 3"] } : {}), ...(type === "slider" ? { min: 0, max: 10, step: 1 } : {}) };
    const at = open ? def.fields.findIndex((x) => x.id === open) + 1 : def.fields.length;
    const fields = [...def.fields];
    fields.splice(at > 0 ? at : fields.length, 0, f);
    update({ fields });
    setOpen(f.id);
    setTab("content");
  };
  const duplicate = (f: FormField) => {
    const i = def.fields.findIndex((x) => x.id === f.id);
    const copy = { ...f, id: newFieldId(), label: `${f.label} (Kopie)` };
    const fields = [...def.fields];
    fields.splice(i + 1, 0, copy);
    update({ fields });
    setOpen(copy.id);
  };
  const remove = (fid: string) => update({ fields: def.fields.filter((x) => x.id !== fid).map((x) => (x.logic?.field === fid ? { ...x, logic: undefined } : x)) });

  const selectFromPreview = (fid: string) => {
    setTab("content");
    setOpen(fid);
    setTimeout(() => document.getElementById(`fb-${fid}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
  };

  const s = def.settings;
  const look = lookOf(s.look);
  const advancedCount = [s.closeAt, s.maxResponses, s.oncePerDevice, s.notifyOwner, s.confirmField, s.redirectUrl, s.closedMessage].filter(Boolean).length;

  return (
    <div>
      {/* top bar */}
      <div className="sticky top-14 z-30 -mx-2 mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-edge bg-bg/85 p-2 backdrop-blur-xl lg:top-3">
        <SaveState state={saved} onRetry={save} />
        <button type="button" onClick={() => { const next = status === "open" ? "closed" : "open"; setStatus(next); start(() => setFormStatus(id, next)); }}
          className={cn("inline-flex h-9 items-center gap-2 rounded-xl px-3 text-[13px] font-semibold transition", status === "open" ? "bg-lime/15 text-fg" : "bg-hi/[0.06] text-dim")}>
          <span className={cn("size-2 rounded-full", status === "open" ? "bg-lime shadow-[0_0_8px] shadow-lime" : "bg-faint")} /> {status === "open" ? "Live" : "Geschlossen"}
        </button>
        <Link href={`/dashboard/forms/${id}/responses`} className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[13px] font-semibold text-dim hover:bg-hi/[0.06] hover:text-fg"><BarChart3 className="size-4" /> {responses} Antworten</Link>
        <div className="ml-auto flex flex-wrap gap-1.5">
          <button type="button" onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-edge px-3 text-[13px] font-semibold hover:bg-hi/[0.06]">{copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? "Kopiert" : "Link"}</button>
          <a href={url} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-edge px-3 text-[13px] font-semibold hover:bg-hi/[0.06]"><ExternalLink className="size-4" /> Öffnen</a>
          <Link href={`/studio?type=url&url=${encodeURIComponent(url)}`} className="btn-cta inline-flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-[13px] font-bold"><QrCode className="size-4" /> QR-Code</Link>
        </div>
      </div>
      {saved === "error" && <p className="mb-4 rounded-xl border border-rose/30 bg-rose/10 px-4 py-2.5 text-sm text-rose">{msg}</p>}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_460px]">
        {/* ─────────── left: editor ─────────── */}
        <div className="min-w-0">
          <div className="mb-5 grid grid-cols-3 gap-1 rounded-2xl border border-edge bg-surface p-1">
            {([["content", "Inhalt", ListChecks], ["design", "Design", Palette], ["settings", "Einstellungen", Settings2]] as const).map(([k, l, I]) => (
              <button key={k} type="button" onClick={() => setTab(k)} className="relative h-10 rounded-xl text-[13.5px] font-semibold">
                {tab === k && <motion.span layoutId="fb-tab" className="absolute inset-0 rounded-xl bg-fg" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
                <span className={cn("relative inline-flex items-center gap-2", tab === k ? "text-bg" : "text-dim")}><I className="size-4" /> {l}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === "content" && (
              <motion.div key="c" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="space-y-4">
                <div className="card space-y-3 p-5">
                  <input value={def.title} onChange={(e) => update({ title: e.target.value })} className="w-full bg-transparent font-display text-[26px] leading-tight outline-none placeholder:text-faint" placeholder="Titel des Formulars" />
                  <textarea rows={2} value={def.description} onChange={(e) => update({ description: e.target.value })} className="w-full resize-none bg-transparent text-[15px] text-dim outline-none placeholder:text-faint" placeholder="Kurze Beschreibung (optional)" />
                </div>

                <Reorder.Group axis="y" values={def.fields} onReorder={(fields) => update({ fields })} className="space-y-2.5">
                  {def.fields.map((f, i) => (
                    <FieldCard key={f.id} f={f} index={i} fields={def.fields} open={open === f.id} layout={s.layout ?? "classic"}
                      onToggle={() => setOpen(open === f.id ? null : f.id)} onChange={(p) => setField(f.id, p)} onDuplicate={() => duplicate(f)} onRemove={() => remove(f.id)} />
                  ))}
                </Reorder.Group>

                <AddField onAdd={add} />
              </motion.div>
            )}

            {tab === "design" && (
              <motion.div key="d" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="space-y-4">
                <Panel title="Design" hint="14 Looks, jeweils hell und dunkel.">
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                    {FORM_LOOKS.map((l) => {
                      const on = look.id === l.id;
                      const dark = (s.mode ?? l.prefers) === "dark" || (s.mode === "auto" && l.prefers === "dark");
                      const p = dark ? l.dark : l.light;
                      return (
                        <button key={l.id} type="button" onClick={() => setS({ look: l.id, accent: undefined, font: undefined, ...(s.look === undefined && !s.mode ? { mode: l.prefers } : {}) })}
                          className={cn("group overflow-hidden rounded-2xl border text-left transition", on ? "border-lime ring-2 ring-lime/50" : "border-edge hover:-translate-y-0.5 hover:border-edge-strong")}>
                          <div className="relative h-24 p-3" style={{ background: backdropCss(l, p, dark), color: p.fg }}>
                            <div className="h-full rounded-[10px] p-2.5" style={{ background: l.sheet ? p.card : "transparent", border: l.sheet ? `1px solid ${p.line}` : undefined }}>
                              <p style={{ fontFamily: FORM_FONTS[l.font].display, fontWeight: FORM_FONTS[l.font].weight, letterSpacing: FORM_FONTS[l.font].tracking }} className="text-[15px] leading-none">Aa</p>
                              <div className="mt-2 h-2 rounded-full" style={{ background: p.field, border: `1px solid ${p.line}` }} />
                              <div className="mt-1.5 h-3 w-12 rounded-full" style={{ background: p.accent }} />
                            </div>
                            {on && <span className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-lime text-night"><Check className="size-3" strokeWidth={3} /></span>}
                          </div>
                          <p className="px-3 py-2 text-[12.5px] font-semibold">{l.name}</p>
                        </button>
                      );
                    })}
                  </div>
                </Panel>
                <Panel title="Modus">
                  <Segmented value={s.mode ?? look.prefers} onChange={(m) => setS({ mode: m as FormSettings["mode"], theme: undefined })}
                    items={[["light", "Hell", Sun], ["dark", "Dunkel", Moon], ["auto", "Automatisch", SunMoon]]} />
                  <p className="mt-2 text-[12.5px] text-faint">Automatisch folgt der Einstellung des Handys deiner Gäste.</p>
                </Panel>
                <Panel title="Aufbau">
                  <div className="grid grid-cols-2 gap-2.5">
                    {([["classic", "Klassisch", "Alle Fragen auf einer Seite"], ["steps", "Schritt für Schritt", "Eine Frage pro Bildschirm"]] as const).map(([k, l, h]) => {
                      const on = (s.layout ?? "classic") === k;
                      return (
                        <button key={k} type="button" onClick={() => setS({ layout: k })} className={cn("rounded-2xl border p-3 text-left transition", on ? "border-lime ring-2 ring-lime/40" : "border-edge hover:border-edge-strong")}>
                          <div className="mb-2.5 grid h-20 place-items-center rounded-xl bg-hi/[0.05]">
                            {k === "classic"
                              ? <div className="w-20 space-y-1.5">{[0, 1, 2, 3].map((n) => <div key={n} className="h-2.5 rounded-sm bg-hi/20" />)}<div className="h-3 rounded-sm bg-lime" /></div>
                              : <div className="relative w-24"><div className="absolute -right-2 top-1 h-14 w-20 rotate-6 rounded-lg bg-hi/10" /><div className="relative h-14 w-20 rounded-lg bg-hi/20 p-2"><div className="h-2 w-12 rounded-sm bg-hi/40" /><div className="mt-2 h-3 rounded-sm bg-bg/70" /><div className="mt-1.5 h-2.5 w-8 rounded-sm bg-lime" /></div></div>}
                          </div>
                          <p className="text-[13.5px] font-semibold">{l}</p>
                          <p className="text-[12px] text-faint">{h}</p>
                        </button>
                      );
                    })}
                  </div>
                </Panel>
                <Panel title="Farbe & Schrift">
                  <p className={label}>Akzentfarbe</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => setS({ accent: undefined })} className={cn("h-9 rounded-xl border px-3 text-[12.5px] font-semibold", !s.accent ? "border-lime bg-lime/10" : "border-edge text-dim")}>Vom Design</button>
                    {["#c8ff2e", "#111111", "#c8102e", "#2563eb", "#7c3aed", "#e11d74", "#f97316", "#0ea5e9", "#d4a24c", "#6b4226"].map((c) => (
                      <button key={c} type="button" onClick={() => setS({ accent: c })} aria-label={c} className={cn("size-9 rounded-xl border border-edge-strong ring-offset-2 ring-offset-bg transition hover:scale-110", s.accent === c && "ring-2 ring-fg")} style={{ background: c }} />
                    ))}
                    <label className="relative grid size-9 cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed border-edge-strong" title="Eigene Farbe">
                      <Plus className="size-4 text-dim" />
                      <input type="color" value={s.accent ?? "#c8ff2e"} onChange={(e) => setS({ accent: e.target.value })} className="absolute inset-0 cursor-pointer opacity-0" />
                    </label>
                  </div>
                  <p className={cn(label, "mt-5")}>Schrift für Überschriften</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(FORM_FONTS).map(([k, f]) => {
                      const on = (s.font ?? look.font) === k;
                      return <button key={k} type="button" onClick={() => setS({ font: k === look.font ? undefined : k })} className={cn("rounded-xl border px-3.5 py-2 text-[15px] transition", on ? "border-lime bg-lime/10" : "border-edge hover:border-edge-strong")} style={{ fontFamily: f.display, fontWeight: f.weight }}>{f.label}</button>;
                    })}
                  </div>
                </Panel>
                <Panel title="Bilder">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ImagePick label="Titelbild" hint="Breit, z. B. 1600 × 600" value={s.cover} onChange={(v) => setS({ cover: v || undefined })} wide />
                    <ImagePick label="Logo" hint="PNG mit transparentem Hintergrund" value={s.logo} onChange={(v) => setS({ logo: v || undefined })} />
                  </div>
                </Panel>
              </motion.div>
            )}

            {tab === "settings" && (
              <motion.div key="s" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="space-y-4">
                <Panel title="Texte">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><span className={label}>Text auf dem Button</span><input className={inputCls} value={s.buttonText ?? ""} onChange={(e) => setS({ buttonText: e.target.value })} placeholder="Absenden" /></div>
                    <div><span className={label}>Danke-Überschrift</span><input className={inputCls} value={s.thankYouTitle ?? ""} onChange={(e) => setS({ thankYouTitle: e.target.value })} placeholder="Danke!" /></div>
                  </div>
                  <span className={cn(label, "mt-3")}>Danke-Text</span>
                  <textarea rows={2} className={cn(inputCls, "h-auto resize-none py-2.5")} value={s.thankYou ?? ""} onChange={(e) => setS({ thankYou: e.target.value })} placeholder="Wir melden uns bald." />
                </Panel>
                <Panel title="Anzeige">
                  <Toggle on={s.showProgress !== false} onChange={(v) => setS({ showProgress: v })} label="Fortschrittsbalken" hint="Zeigt, wie viel noch fehlt." />
                  <Toggle on={!!s.showResults} onChange={(v) => setS({ showResults: v })} label="Ergebnisse nach dem Absenden zeigen" hint="Für Abstimmungen: Live-Prozente aller Antworten." />
                </Panel>

                <details className="group rounded-[24px] border border-edge bg-surface" open={advancedCount > 0}>
                  <summary className="flex cursor-pointer list-none items-center gap-3 p-5 [&::-webkit-details-marker]:hidden">
                    <span className="grid size-9 place-items-center rounded-xl bg-fg text-bg"><Zap className="size-4" /></span>
                    <span className="flex-1"><span className="block font-semibold">Advanced</span><span className="text-[12.5px] text-faint">Zeitplan, Limits, Benachrichtigungen, Weiterleitung</span></span>
                    {advancedCount > 0 && <span className="rounded-full bg-lime/15 px-2 py-0.5 text-[12px] font-semibold">{advancedCount} aktiv</span>}
                    <ChevronDown className="size-4 text-dim transition group-open:rotate-180" />
                  </summary>
                  <div className="space-y-5 border-t border-edge p-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div><span className={label}>Automatisch schließen am</span><input type="datetime-local" className={inputCls} value={s.closeAt ? toLocal(s.closeAt) : ""} onChange={(e) => setS({ closeAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })} /></div>
                      <div><span className={label}>Höchstens Antworten</span><input type="number" min={1} className={inputCls} value={s.maxResponses ?? ""} onChange={(e) => setS({ maxResponses: e.target.value ? Math.max(1, Math.floor(Number(e.target.value))) : undefined })} placeholder="Unbegrenzt" /></div>
                    </div>
                    <div><span className={label}>Text, wenn geschlossen</span><input className={inputCls} value={s.closedMessage ?? ""} onChange={(e) => setS({ closedMessage: e.target.value || undefined })} placeholder="Die Anmeldung ist leider schon voll." /></div>
                    <div className="space-y-0.5">
                      <Toggle on={!!s.oncePerDevice} onChange={(v) => setS({ oncePerDevice: v || undefined })} label="Nur einmal pro Gerät" hint="Gut für Gewinnspiele und Abstimmungen." />
                      <Toggle on={!!s.notifyOwner} onChange={(v) => setS({ notifyOwner: v || undefined })} label="Mir jede Antwort per E-Mail schicken" hint="An die E-Mail deines Kontos." />
                    </div>
                    <div>
                      <span className={label}>Kopie der Antworten an die Person senden</span>
                      <select className={inputCls} value={s.confirmField ?? ""} onChange={(e) => setS({ confirmField: e.target.value || undefined })}>
                        <option value="">Nicht senden</option>
                        {def.fields.filter((f) => f.type === "email").map((f) => <option key={f.id} value={f.id}>An: {f.label}</option>)}
                      </select>
                      {!def.fields.some((f) => f.type === "email") && <p className="mt-1 text-[12px] text-faint">Füge ein E-Mail-Feld hinzu, um das zu nutzen.</p>}
                    </div>
                    <div><span className={label}>Nach dem Absenden weiterleiten zu</span><input className={inputCls} value={s.redirectUrl ?? ""} onChange={(e) => setS({ redirectUrl: e.target.value || undefined })} placeholder="https://deine-seite.de/danke" /></div>
                  </div>
                </details>

                <form action={() => start(() => deleteForm(id))} className="pt-2">
                  <button className="inline-flex items-center gap-2 text-sm font-semibold text-dim hover:text-rose"><Trash2 className="size-4" /> Formular löschen</button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─────────── right: live preview ─────────── */}
        <aside className="xl:sticky xl:top-24 xl:self-start">
          <div className="mb-3 flex items-center justify-between gap-2">
            <Segmented small value={device} onChange={(v) => setDevice(v as "phone" | "desktop")} items={[["phone", "Handy", Smartphone], ["desktop", "Desktop", Monitor]]} />
            <Segmented small value={previewMode ?? "auto"} onChange={(v) => setPreviewMode(v === "auto" ? null : (v as "light" | "dark"))} items={[["light", "", Sun], ["dark", "", Moon], ["auto", "Wie eingestellt", Sparkles]]} />
          </div>
          <motion.div layout transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className={cn("mx-auto overflow-hidden bg-black shadow-lift", device === "phone" ? "h-[760px] w-[372px] rounded-[48px] border-[10px] border-[#0b0b0b]" : "h-[620px] w-full rounded-2xl border border-edge-strong")}>
            {device === "desktop" && <div className="flex h-8 items-center gap-1.5 bg-[#1b1b1d] px-3"><span className="size-2.5 rounded-full bg-[#ff5f57]" /><span className="size-2.5 rounded-full bg-[#febc2e]" /><span className="size-2.5 rounded-full bg-[#28c840]" /><span className="ml-3 truncate text-[11px] text-white/45">{url.replace(/^https?:\/\//, "")}</span></div>}
            <div className={cn("overflow-y-auto [scrollbar-width:none]", device === "phone" ? "h-full" : "h-[calc(100%-2rem)]")}>
              <div style={device === "desktop" ? { zoom: 0.62 } as React.CSSProperties : undefined} className="min-h-full">
                <FormView preview force={previewMode ?? undefined} selected={open} onSelect={selectFromPreview}
                  form={{ slug, title: def.title, description: def.description, fields: def.fields, settings: def.settings, status: "open", branding }} />
              </div>
            </div>
          </motion.div>
          <p className="mt-3 text-center text-[12px] text-faint">Tipp: Klick auf eine Frage in der Vorschau, um sie zu bearbeiten.</p>
        </aside>
      </div>
    </div>
  );
}

/* ───────────────────────── field card ───────────────────────── */

function FieldCard({ f, index, fields, open, layout, onToggle, onChange, onDuplicate, onRemove }: {
  f: FormField; index: number; fields: FormField[]; open: boolean; layout: string;
  onToggle: () => void; onChange: (p: Partial<FormField>) => void; onDuplicate: () => void; onRemove: () => void;
}) {
  const drag = useDragControls();
  const meta = FIELD_TYPES.find((t) => t.type === f.type)!;
  const input = isInput(f.type);
  const before = fields.slice(0, index).filter((x) => isInput(x.type));
  return (
    <Reorder.Item value={f} dragListener={false} dragControls={drag} id={`fb-${f.id}`}
      className={cn("card relative overflow-hidden transition-[border-color,box-shadow]", open && "border-edge-strong shadow-lift")} whileDrag={{ scale: 1.02, boxShadow: "0 20px 50px -20px rgba(0,0,0,.5)" }}>
      <div className="flex items-center gap-2 p-3 pr-2">
        <button type="button" onPointerDown={(e) => drag.start(e)} className="grid h-10 w-6 shrink-0 cursor-grab touch-none place-items-center text-faint hover:text-fg active:cursor-grabbing" aria-label="Verschieben"><GripVertical className="size-4" /></button>
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", open ? "bg-lime text-night" : "bg-hi/[0.07]")}><TypeIcon name={meta.icon} className="size-4" /></span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14.5px] font-semibold">{f.label || "Ohne Titel"}{f.required && <span className="text-rose"> *</span>}</span>
            <span className="flex flex-wrap items-center gap-1.5 text-[12px] text-faint">
              {meta.label}{f.options ? ` · ${f.options.length} Optionen` : ""}
              {f.logic?.field && <span className="inline-flex items-center gap-1 rounded-md bg-hi/[0.07] px-1.5 py-px font-medium text-dim"><GitBranch className="size-3" /> Bedingung</span>}
              {f.width === "half" && <span className="rounded-md bg-hi/[0.07] px-1.5 py-px font-medium text-dim">½ Breite</span>}
            </span>
          </span>
        </button>
        <button type="button" onClick={onDuplicate} className="grid size-9 place-items-center rounded-lg text-faint hover:bg-hi/[0.06] hover:text-fg" aria-label="Duplizieren"><CopyPlus className="size-4" /></button>
        <button type="button" onClick={onRemove} className="grid size-9 place-items-center rounded-lg text-faint hover:bg-rose/10 hover:text-rose" aria-label="Löschen"><Trash2 className="size-4" /></button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
            <div className="space-y-4 border-t border-edge p-4">
              {f.type === "statement"
                ? <textarea rows={3} className={cn(inputCls, "h-auto resize-none py-2.5")} value={f.label} onChange={(e) => onChange({ label: e.target.value })} />
                : <input className={cn(inputCls, "text-[15px] font-semibold")} value={f.label} onChange={(e) => onChange({ label: e.target.value })} placeholder={f.type === "section" ? "Überschrift" : "Deine Frage"} />}
              {f.type !== "statement" && <input className={inputCls} value={f.help ?? ""} onChange={(e) => onChange({ help: e.target.value || undefined })} placeholder="Hilfetext darunter (optional)" />}

              {hasOptions(f.type) && <Options f={f} onChange={onChange} />}

              {input && (
                <div className="flex flex-wrap gap-2">
                  <Chip on={!!f.required} onClick={() => onChange({ required: !f.required || undefined })}>Pflichtfeld</Chip>
                  {layout === "classic" && f.type !== "consent" && <Chip on={f.width === "half"} onClick={() => onChange({ width: f.width === "half" ? undefined : "half" })}>Halbe Breite</Chip>}
                </div>
              )}

              {input && (
                <details className="group/adv rounded-2xl border border-edge" open={!!f.logic?.field}>
                  <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-[13px] font-semibold [&::-webkit-details-marker]:hidden">
                    <Zap className="size-3.5" /> Advanced <span className="text-faint font-normal">Logik, Grenzen, Optionen</span>
                    <ChevronDown className="ml-auto size-4 text-dim transition group-open/adv:rotate-180" />
                  </summary>
                  <div className="space-y-4 border-t border-edge p-4">
                    <Logic f={f} before={before} onChange={onChange} />
                    {(f.type === "short" || f.type === "long" || f.type === "email" || f.type === "phone" || f.type === "url" || f.type === "number") && (
                      <div><span className={label}>Platzhalter</span><input className={inputCls} value={f.placeholder ?? ""} onChange={(e) => onChange({ placeholder: e.target.value || undefined })} placeholder="Grauer Beispieltext im Feld" /></div>
                    )}
                    {(f.type === "number" || f.type === "slider" || f.type === "short" || f.type === "long") && (
                      <div className="grid grid-cols-3 gap-2">
                        <div><span className={label}>{f.type === "short" || f.type === "long" ? "Min. Zeichen" : "Minimum"}</span><input type="number" className={inputCls} value={f.min ?? ""} onChange={(e) => onChange({ min: e.target.value === "" ? undefined : Number(e.target.value) })} /></div>
                        <div><span className={label}>{f.type === "short" || f.type === "long" ? "Max. Zeichen" : "Maximum"}</span><input type="number" className={inputCls} value={f.max ?? ""} onChange={(e) => onChange({ max: e.target.value === "" ? undefined : Number(e.target.value) })} /></div>
                        {f.type === "slider" && <div><span className={label}>Schritt</span><input type="number" min={0.1} className={inputCls} value={f.step ?? ""} onChange={(e) => onChange({ step: e.target.value === "" ? undefined : Math.max(0.1, Number(e.target.value)) })} /></div>}
                      </div>
                    )}
                    {f.type === "slider" && (
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className={label}>Text links</span><input className={inputCls} value={f.minLabel ?? ""} onChange={(e) => onChange({ minLabel: e.target.value || undefined })} placeholder="wenig" /></div>
                        <div><span className={label}>Text rechts</span><input className={inputCls} value={f.maxLabel ?? ""} onChange={(e) => onChange({ maxLabel: e.target.value || undefined })} placeholder="viel" /></div>
                      </div>
                    )}
                    {(f.type === "single" || f.type === "multi" || f.type === "dropdown") && (
                      <div className="flex flex-wrap gap-2">
                        {f.type !== "dropdown" && <Chip on={!!f.other} onClick={() => onChange({ other: !f.other || undefined })}>„Sonstiges“ mit Textfeld</Chip>}
                        <Chip on={!!f.shuffle} onClick={() => onChange({ shuffle: !f.shuffle || undefined })}>Reihenfolge mischen</Chip>
                      </div>
                    )}
                    {f.type === "multi" && (
                      <div className="w-40"><span className={label}>Höchstens wählbar</span><input type="number" min={1} className={inputCls} value={f.maxSelect ?? ""} onChange={(e) => onChange({ maxSelect: e.target.value ? Math.max(1, Math.floor(Number(e.target.value))) : undefined })} placeholder="Alle" /></div>
                    )}
                  </div>
                </details>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  );
}

function Options({ f, onChange }: { f: FormField; onChange: (p: Partial<FormField>) => void }) {
  const opts = f.options ?? [];
  return (
    <div className="space-y-1.5">
      {opts.map((o, k) => (
        <div key={k} className="flex items-center gap-1.5">
          <span className={cn("grid size-5 shrink-0 place-items-center border-2 border-edge-strong", f.type === "multi" ? "rounded-md" : "rounded-full")} />
          <input className={cn(inputCls, "h-10")} value={o} onChange={(e) => onChange({ options: opts.map((x, m) => (m === k ? e.target.value : x)) })}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onChange({ options: [...opts.slice(0, k + 1), "", ...opts.slice(k + 1)] }); } }} />
          <button type="button" aria-label="Option entfernen" onClick={() => onChange({ options: opts.filter((_, m) => m !== k) })} className="grid size-9 shrink-0 place-items-center rounded-lg text-faint hover:text-rose"><X className="size-4" /></button>
        </div>
      ))}
      <button type="button" onClick={() => onChange({ options: [...opts, `Option ${opts.length + 1}`] })} className="ml-6 inline-flex items-center gap-1 pt-1 text-[13px] font-semibold hover:underline"><Plus className="size-4" /> Option hinzufügen</button>
    </div>
  );
}

const OPS: [FieldLogic["op"], string][] = [["eq", "ist"], ["neq", "ist nicht"], ["includes", "enthält"], ["gt", "größer als"], ["lt", "kleiner als"], ["filled", "ist ausgefüllt"]];

function Logic({ f, before, onChange }: { f: FormField; before: FormField[]; onChange: (p: Partial<FormField>) => void }) {
  const l = f.logic;
  const src = before.find((x) => x.id === l?.field);
  const choices = src ? (src.type === "yesno" ? ["Ja", "Nein"] : src.type === "rating" ? ["1", "2", "3", "4", "5"] : src.options) : undefined;
  if (!before.length) return <p className="text-[12.5px] text-faint"><GitBranch className="mr-1 inline size-3.5" /> Bedingungen gehen erst ab der zweiten Frage.</p>;
  return (
    <div>
      <span className={cn(label, "flex items-center gap-1.5")}><GitBranch className="size-3.5" /> Nur zeigen, wenn …</span>
      {!l?.field ? (
        <button type="button" onClick={() => onChange({ logic: { field: before[before.length - 1].id, op: "eq", value: "" } })} className="inline-flex h-10 items-center gap-2 rounded-xl border border-dashed border-edge-strong px-3.5 text-[13px] font-semibold hover:bg-hi/[0.05]"><Plus className="size-4" /> Bedingung hinzufügen</button>
      ) : (
        <div className="grid gap-2 rounded-xl bg-hi/[0.04] p-3 sm:grid-cols-[1.4fr_1fr_1.2fr_auto]">
          <select className={cn(inputCls, "h-10")} value={l.field} onChange={(e) => onChange({ logic: { ...l, field: e.target.value, value: "" } })}>
            {before.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
          </select>
          <select className={cn(inputCls, "h-10")} value={l.op} onChange={(e) => onChange({ logic: { ...l, op: e.target.value as FieldLogic["op"] } })}>
            {OPS.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
          </select>
          {l.op === "filled" ? <span /> : choices && (l.op === "eq" || l.op === "neq" || l.op === "includes") ? (
            <select className={cn(inputCls, "h-10")} value={l.value ?? ""} onChange={(e) => onChange({ logic: { ...l, value: e.target.value } })}>
              <option value="">Wert wählen</option>
              {choices.map((c) => <option key={c}>{c}</option>)}
            </select>
          ) : (
            <input className={cn(inputCls, "h-10")} value={l.value ?? ""} onChange={(e) => onChange({ logic: { ...l, value: e.target.value } })} placeholder="Wert" />
          )}
          <button type="button" onClick={() => onChange({ logic: undefined })} className="grid size-10 place-items-center rounded-xl text-faint hover:bg-rose/10 hover:text-rose" aria-label="Bedingung entfernen"><X className="size-4" /></button>
        </div>
      )}
    </div>
  );
}

function AddField({ onAdd }: { onAdd: (t: FieldType) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 p-4 text-left">
        <span className="grid size-9 place-items-center rounded-xl bg-lime text-night"><Plus className="size-4" /></span>
        <span className="flex-1 font-semibold">Frage hinzufügen</span>
        <ChevronDown className={cn("size-4 text-dim transition", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="space-y-4 border-t border-edge p-4">
              {FIELD_GROUPS.map((g) => (
                <div key={g.label}>
                  <p className="mb-2 text-[12px] font-semibold text-faint">{g.label}</p>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5">
                    {g.types.map((t) => {
                      const m = FIELD_TYPES.find((x) => x.type === t)!;
                      return (
                        <motion.button key={t} type="button" whileTap={{ scale: 0.96 }} onClick={() => onAdd(t)} className="flex items-center gap-2 rounded-xl border border-edge px-3 py-2.5 text-[13px] font-medium transition hover:border-lime/60 hover:bg-lime/[0.06]">
                          <TypeIcon name={m.icon} className="size-4" /> {m.label}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───────────────────────── small UI ───────────────────────── */

function Panel({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <p className="font-semibold">{title}</p>
      {hint && <p className="text-[12.5px] text-faint">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={cn("inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[13px] font-semibold transition", on ? "border-lime bg-lime/10 text-fg" : "border-edge text-dim hover:text-fg")}>
      {on && <Check className="size-3.5" strokeWidth={3} />}{children}
    </button>
  );
}

function Toggle({ on, onChange, label: l, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-5 py-2.5">
      <span><span className="block text-[14px] font-semibold">{l}</span>{hint && <span className="block text-[12.5px] text-faint">{hint}</span>}</span>
      <span className={cn("relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition", on ? "bg-lime" : "bg-hi/20")}><span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", on ? "left-[22px]" : "left-0.5")} /></span>
      <input type="checkbox" className="sr-only" checked={on} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function Segmented({ value, onChange, items, small }: { value: string; onChange: (v: string) => void; items: readonly (readonly [string, string, typeof Sun])[]; small?: boolean }) {
  const uid = useId();
  return (
    <div className={cn("inline-flex rounded-xl border border-edge bg-surface p-1", !small && "w-full")}>
      {items.map(([k, l, I]) => (
        <button key={k} type="button" onClick={() => onChange(k)} title={l || k} className={cn("relative inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold", small ? "h-8 px-2.5 text-[12px]" : "h-10 flex-1 text-[13.5px]")}>
          {value === k && <motion.span layoutId={`seg-${uid}`} className="absolute inset-0 rounded-lg bg-fg" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
          <span className={cn("relative inline-flex items-center gap-1.5", value === k ? "text-bg" : "text-dim")}><I className="size-4" />{l}</span>
        </button>
      ))}
    </div>
  );
}

function ImagePick({ label: l, hint, value, onChange, wide }: { label: string; hint: string; value?: string; onChange: (v: string) => void; wide?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <span className={label}>{l}</span>
      <div className={cn("group relative grid place-items-center overflow-hidden rounded-2xl border border-dashed border-edge-strong bg-hi/[0.03]", wide ? "aspect-[16/6]" : "aspect-[16/6]")}>
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- user image */}
            <img src={value} alt="" className={cn("size-full", wide ? "object-cover" : "object-contain p-3")} />
            <button type="button" onClick={() => onChange("")} className="absolute right-2 top-2 grid size-8 place-items-center rounded-lg bg-black/60 text-white opacity-0 transition group-hover:opacity-100" aria-label="Entfernen"><X className="size-4" /></button>
          </>
        ) : (
          <button type="button" onClick={() => ref.current?.click()} className="flex flex-col items-center gap-1.5 text-[13px] text-dim hover:text-fg">
            {busy ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />} {busy ? "Lädt hoch …" : "Bild wählen"}
          </button>
        )}
      </div>
      <p className="mt-1 text-[11.5px] text-faint">{err ?? hint}</p>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setBusy(true); setErr(null);
        try { onChange(await uploadImage(file, wide ? 1800 : 600)); } catch (x) { setErr(x instanceof Error ? x.message : "Upload fehlgeschlagen"); }
        setBusy(false);
      }} />
    </div>
  );
}

function SaveState({ state, onRetry }: { state: "saved" | "dirty" | "saving" | "error"; onRetry: () => void }) {
  return (
    <button type="button" onClick={onRetry} disabled={state === "saved" || state === "saving"} className="inline-flex h-9 items-center gap-2 rounded-xl px-3 text-[13px] font-semibold text-dim">
      {state === "saving" || state === "dirty" ? <Loader2 className="size-4 animate-spin" /> : state === "error" ? <X className="size-4 text-rose" /> : <Check className="size-4 text-fg" />}
      {state === "saved" ? "Gespeichert" : state === "error" ? "Erneut speichern" : "Speichert …"}
    </button>
  );
}

function toLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}


