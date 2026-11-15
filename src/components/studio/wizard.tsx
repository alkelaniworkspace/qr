"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Copy, ExternalLink, Info, PenLine, Printer, Palette, Save, Shapes, TriangleAlert } from "lucide-react";
import { CODE_TYPES, TYPE_ORDER, validateContent, type CodeTypeId } from "@/lib/codes/types";
import { staticPayload } from "@/lib/codes/payload";
import { renderQrSvg } from "@/lib/qr/render";
import { DEFAULT_STYLE, normalizeStyle, type QrStyle } from "@/lib/qr/style";
import { defaultPoster, type PosterSettings } from "@/lib/print/types";
import { getLocalCode, saveLocalCode } from "@/lib/codes/local-store";
import { ContentForm } from "./content-form";
import { DesignPanel } from "./design-panel";
import { Preview } from "./preview";
import { PrintStudio } from "@/components/print/print-studio";
import { HostedPage } from "@/components/pages/hosted-pages";
import { TypeIcon } from "@/components/type-icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const STEPS = [
  { id: 1, label: "Typ", icon: Shapes },
  { id: 2, label: "Inhalt", icon: PenLine },
  { id: 3, label: "Design", icon: Palette },
  { id: 4, label: "Druck & Download", icon: Printer },
] as const;
type Step = 1 | 2 | 3 | 4;

const GROUPS = [
  { id: "page", title: "Mit eigener Handy-Seite", hint: "Eine schöne Seite, die direkt im Code steckt" },
  { id: "link", title: "Weiterleitung", hint: "Scan führt direkt ans Ziel" },
  { id: "direct", title: "Direkt im Code", hint: "Funktioniert sogar offline" },
] as const;

/** Rough byte limit of a well-scannable code; above this it gets dense. */
const DENSE_AT = 1100;
const MAX_AT = 2300;

function newId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

interface Init {
  step: Step;
  reached: Step;
  id: string;
  createdAt?: string;
  type: CodeTypeId;
  name: string;
  content: Record<string, unknown>;
  style: QrStyle;
  poster: PosterSettings | null;
  editing: boolean;
}

function loadInit(editId: string | null, startType: string | null, startStep: Step): Init {
  const base: Init = { step: 1, reached: 1, id: newId(), type: "url", name: "", content: structuredClone(CODE_TYPES.url.defaults), style: normalizeStyle(DEFAULT_STYLE), poster: null, editing: false };
  const c = editId ? getLocalCode(editId) : null;
  if (c) {
    return { step: startStep, reached: 4, id: c.id, createdAt: c.createdAt, type: c.type, name: c.name, content: c.content, style: normalizeStyle(c.style), poster: c.poster ?? null, editing: true };
  }
  if (startType && startType in CODE_TYPES) {
    const t = startType as CodeTypeId;
    return { ...base, step: 2, reached: 2, type: t, content: structuredClone(CODE_TYPES[t].defaults) };
  }
  return base;
}

const noop = () => () => {};

/** Reads the URL and this browser's saved codes once on the client, then mounts the editor. */
export function Wizard() {
  const params = useSearchParams();
  const client = useSyncExternalStore(noop, () => true, () => false);
  const editId = params.get("edit");
  const startType = params.get("type");
  const startStep: Step = params.get("step") === "4" ? 4 : 2;
  if (!client) return <div className="mx-auto h-[70vh] w-full max-w-[1600px]" />;
  return <WizardEditor key={`${editId ?? ""}|${startType ?? ""}`} init={loadInit(editId, startType, startStep)} />;
}

function WizardEditor({ init }: { init: Init }) {
  const [step, setStep] = useState<Step>(init.step);
  const [reached, setReached] = useState<Step>(init.reached);
  const [id] = useState(init.id);
  const [createdAt, setCreatedAt] = useState<string | undefined>(init.createdAt);
  const [type, setType] = useState<CodeTypeId>(init.type);
  const [name, setName] = useState(init.name);
  const [content, setContent] = useState<Record<string, unknown>>(init.content);
  const [style, setStyle] = useState<QrStyle>(init.style);
  const [poster, setPoster] = useState<PosterSettings | null>(init.poster);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<"idle" | "ok" | "error">("idle");
  const [saveMsg, setSaveMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const def = CODE_TYPES[type];
  const data = useMemo(() => staticPayload(type, content, name || undefined), [type, content, name]);
  const tooLong = data.length > MAX_AT;
  const svg = useMemo(() => {
    if (tooLong) return "";
    try {
      return renderQrSvg(data, style, { size: 640, id: "wizard" });
    } catch {
      return "";
    }
  }, [data, style, tooLong]);
  const posterSettings = poster ?? defaultPoster(type, content, name || def.label);
  const posterQr = useMemo(() => (svg ? renderQrSvg(data, style, { size: 600, id: "poster" }) : ""), [svg, data, style]);
  const isPageLink = data.includes("/v#");

  // Empty fields show their placeholder in the phone preview, so the page never looks blank.
  const previewContent = useMemo(() => {
    const out: Record<string, unknown> = { ...content };
    for (const f of def.fields) {
      if ("placeholder" in f && f.placeholder && !String(out[f.name] ?? "").trim()) out[f.name] = f.placeholder;
    }
    return out;
  }, [content, def]);

  const phone = def.hostedPage ? (
    <HostedPage code={{ id: "preview", slug: "preview", name: name || def.label, type, mode: "static", status: "active", content: previewContent }} />
  ) : undefined;

  function go(s: Step) {
    setStep(s);
    setReached((r) => (s > r ? s : r));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function pickType(t: CodeTypeId) {
    if (t !== type) {
      setType(t);
      setContent(structuredClone(CODE_TYPES[t].defaults));
      setPoster(null);
      setErrors({});
    }
    go(2);
  }

  function nextFromContent() {
    const res = validateContent(type, content);
    if (!res.ok) {
      setErrors(res.errors);
      return;
    }
    setErrors({});
    if (tooLong) return;
    go(3);
  }

  function save() {
    try {
      const fallback = String(content.business ?? content.name ?? content.title ?? "").trim();
      const c = saveLocalCode({ id, name: name || fallback || def.label, type, content, style, poster: posterSettings, createdAt });
      setCreatedAt(c.createdAt);
      setSaved("ok");
      setSaveMsg("In „Meine Codes“ gespeichert. Nur in diesem Browser.");
    } catch (e) {
      setSaved("error");
      setSaveMsg(e instanceof Error ? e.message : "Speichern fehlgeschlagen.");
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(data).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const canOpen = (s: Step) => s <= reached || (s === 2 && step === 1);

  return (
    <div className="mx-auto w-full max-w-[1600px]">
      {/* Stepper */}
      <ol className="sticky top-16 z-30 -mx-5 mb-8 flex gap-1.5 overflow-x-auto border-b border-edge bg-bg/80 px-5 py-3 backdrop-blur-xl [scrollbar-width:none] sm:-mx-8 sm:px-8">
        {STEPS.map((s, i) => {
          const done = s.id < step || (s.id <= reached && s.id !== step && s.id < reached);
          const active = s.id === step;
          const Icon = s.icon;
          return (
            <li key={s.id} className={cn("flex min-w-0 items-center gap-1.5", active ? "flex-1" : "flex-none sm:flex-1")}>
              <button
                type="button"
                disabled={!canOpen(s.id as Step)}
                onClick={() => (s.id === 3 && step === 2 ? nextFromContent() : go(s.id as Step))}
                className={cn(
                  "flex w-full min-w-0 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition",
                  active ? "border-brand bg-brand/15 shadow-[0_0_24px_-8px_rgb(var(--glow)/0.9)]" : done ? "border-edge bg-surface hover:border-hi/25" : "border-transparent opacity-50",
                )}
              >
                <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg font-display text-sm", active ? "bg-brand text-on-brand" : done ? "bg-mint/15 text-mint" : "bg-hi/5 text-faint")}>
                  {done && !active ? <Check className="size-4" /> : <Icon className="size-4" />}
                </span>
                <span className={cn("min-w-0", !active && "hidden sm:block")}>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-faint">Schritt {s.id}</span>
                  <span className={cn("block truncate text-sm font-bold", active ? "text-fg" : "text-dim")}>{s.label}</span>
                </span>
              </button>
              {i < STEPS.length - 1 && <span className={cn("hidden h-px w-6 shrink-0 sm:block", s.id < reached ? "bg-brand/60" : "bg-edge")} />}
            </li>
          );
        })}
      </ol>

      {/* ───── Step 1: type ───── */}
      {step === 1 && (
        <div className="animate-rise">
          <h1 className="font-display text-4xl uppercase leading-[0.95] sm:text-6xl">
            Was soll dein Code <span className="text-brand glow-text">können?</span>
          </h1>
          <p className="mt-3 max-w-2xl text-dim">Wähle einen Typ. Du kommst automatisch zum nächsten Schritt. Kein Konto nötig.</p>
          {GROUPS.map((group, gi) => (
            <section key={group.id} className="mt-10">
              <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="font-display text-xl uppercase">{group.title}</h2>
                <span className="text-sm text-faint">{group.hint}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {TYPE_ORDER.filter((t) => CODE_TYPES[t].group === group.id).map((t, i) => {
                  const d = CODE_TYPES[t];
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => pickType(t)}
                      style={{ animationDelay: `${(gi * 4 + i) * 35}ms` }}
                      className={cn("card group flex items-center gap-4 p-4 text-left transition duration-200 animate-rise hover:-translate-y-1 hover:border-brand/50", t === type && reached > 1 && "border-brand/60")}
                    >
                      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-elevated text-brand transition group-hover:bg-brand group-hover:text-on-brand group-hover:shadow-[0_0_24px_-4px_rgb(var(--glow)/0.7)]">
                        <TypeIcon name={d.icon} className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 font-bold">
                          {d.label}
                          {t === "review" && <span className="badge bg-gold text-night">Neu</span>}
                          {t === "site" && <span className="badge bg-cyan text-night">Mini-Website</span>}
                        </span>
                        <span className="mt-0.5 block text-sm leading-snug text-dim">{d.description}</span>
                      </span>
                      <ArrowRight className="size-4 shrink-0 -translate-x-1 text-brand opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ───── Steps 2 + 3: editor with live preview ───── */}
      {(step === 2 || step === 3) && (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_440px] xl:gap-10">
          <div className="min-w-0 animate-rise" key={step}>
            <div className="flex items-start gap-4">
              <button type="button" onClick={() => go(1)} title="Typ ändern" className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand text-on-brand shadow-[0_0_32px_-6px_rgb(var(--glow)/0.7)] transition hover:scale-105">
                <TypeIcon name={def.icon} className="size-6" />
              </button>
              <div className="min-w-0 flex-1">
                <label className="group flex items-center gap-2">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={`${def.label} benennen`}
                    className="w-full bg-transparent font-display text-3xl uppercase leading-none text-fg outline-none placeholder:text-faint sm:text-5xl"
                    maxLength={120}
                  />
                  <PenLine className="size-5 shrink-0 text-faint transition group-hover:text-brand" />
                </label>
                <p className="mt-2 text-sm text-dim">
                  {def.description} · <button type="button" onClick={() => go(1)} className="font-semibold text-brand hover:underline">Typ ändern</button>
                </p>
              </div>
            </div>

            {step === 2 ? (
              <div className="mt-8">
                {def.hostedPage && (
                  <p className="mb-4 flex gap-2.5 rounded-2xl border border-cyan/25 bg-cyan/10 px-4 py-3 text-sm text-dim">
                    <Info className="mt-0.5 size-4 shrink-0 text-cyan" />
                    <span>Die Handy-Seite steckt komplett im Code. Kein Konto, kein Server, sie funktioniert für immer. Rechts siehst du sie live.</span>
                  </p>
                )}
                <div className="card p-5 sm:p-7">
                  <ContentForm fields={def.fields} value={content} errors={errors} onChange={setContent} />
                </div>
                {Object.keys(errors).length > 0 && (
                  <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-rose"><TriangleAlert className="size-4" /> Bitte die markierten Felder prüfen.</p>
                )}
                {tooLong && (
                  <p className="mt-4 flex gap-2 rounded-2xl border border-rose/30 bg-rose/10 px-4 py-3 text-sm text-rose">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" /> Zu viel Inhalt für einen Code. Kürze Texte oder entferne Einträge.
                  </p>
                )}
                {!tooLong && data.length > DENSE_AT && (
                  <p className="mt-4 flex gap-2 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" /> Viel Inhalt macht den Code dicht. Drucke ihn mindestens 4 cm groß.
                  </p>
                )}
                <div className="mt-6 flex flex-wrap justify-between gap-3">
                  <Button type="button" variant="ghost" onClick={() => go(1)}><ArrowLeft className="size-4" /> Zurück</Button>
                  <Button type="button" size="lg" onClick={nextFromContent} disabled={tooLong} className="shine">Weiter zum Design <ArrowRight className="size-4" /></Button>
                </div>
              </div>
            ) : (
              <div className="mt-8">
                <DesignPanel style={style} onChange={setStyle} data={data} />
                <div className="mt-6 flex flex-wrap justify-between gap-3">
                  <Button type="button" variant="ghost" onClick={() => go(2)}><ArrowLeft className="size-4" /> Inhalt</Button>
                  <Button type="button" size="lg" onClick={() => go(4)} className="shine">Weiter zu Druck & Download <ArrowRight className="size-4" /></Button>
                </div>
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-40 lg:self-start">
            {svg ? (
              <Preview key={step === 2 && phone ? "p2" : "p3"} svg={svg} data={data} style={style} name={name || def.label} phone={phone} />
            ) : (
              <div className="card grid aspect-square place-items-center p-8 text-center text-sm text-dim">Zu viel Inhalt für einen QR-Code.</div>
            )}
          </aside>
        </div>
      )}

      {/* ───── Step 4: print + download ───── */}
      {step === 4 && svg && (
        <div className="animate-rise">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl uppercase leading-[0.95] sm:text-5xl">
                Fertig zum <span className="text-brand glow-text">Drucken</span>
              </h1>
              <p className="mt-2 max-w-2xl text-dim">Wähle Format und Vorlage: A6 bis A0, Sticker, Visitenkarte oder eigene Maße. Oder lade nur den Code herunter.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="ghost" onClick={() => go(3)}><ArrowLeft className="size-4" /> Design</Button>
              <Button type="button" variant="secondary" onClick={save}><Save className="size-4" /> {saved === "ok" ? "Gespeichert" : "Speichern"}</Button>
            </div>
          </div>
          {saved !== "idle" && (
            <p className={cn("mt-4 rounded-xl border px-4 py-2.5 text-sm font-semibold", saved === "ok" ? "border-mint/30 bg-mint/10 text-mint" : "border-rose/30 bg-rose/10 text-rose")}>
              {saveMsg} {saved === "ok" && <Link href="/codes" className="underline">Meine Codes öffnen</Link>}
            </p>
          )}

          <div className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0">
              <PrintStudio settings={posterSettings} onChange={setPoster} qrSvg={posterQr} name={name || def.label} />
            </div>
            <aside className="grid gap-4 sm:grid-cols-2 2xl:block 2xl:space-y-4 2xl:sticky 2xl:top-40 2xl:self-start">
              <Preview svg={svg} data={data} style={style} name={name || def.label} />
              {isPageLink && (
                <div className="card p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-faint">Link der Handy-Seite</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <a href={data} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-edge text-xs font-bold uppercase text-dim hover:border-hi/25 hover:text-fg"><ExternalLink className="size-4" /> Öffnen</a>
                    <button type="button" onClick={copyLink} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-edge text-xs font-bold uppercase text-dim hover:border-hi/25 hover:text-fg">{copied ? <Check className="size-4 text-mint" /> : <Copy className="size-4" />} Kopieren</button>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
