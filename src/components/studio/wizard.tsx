"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Clapperboard, Sticker as StickerIcon, Copy, ExternalLink, Infinity as InfinityIcon, KeyRound, Loader2, Lock, PenLine, Printer, Palette, RefreshCw, Save, Shapes, ShieldCheck, TriangleAlert } from "lucide-react";
import { CODE_TYPES, TYPE_ORDER, validateContent, type CodeTypeId } from "@/lib/codes/types";
import { staticPayload } from "@/lib/codes/payload";
import { renderQrSvg } from "@/lib/qr/render";
import { DEFAULT_STYLE, STYLE_PRESETS, normalizeStyle, type QrStyle } from "@/lib/qr/style";
import { STARTERS, type Starter } from "@/lib/templates";
import { defaultPoster, type PosterSettings } from "@/lib/print/types";
import { getLocalCode, listLocalCodes, saveLocalCode } from "@/lib/codes/local-store";
import { newSlug } from "@/lib/codes/slug";
import { env, shortLink, supabaseConfigured } from "@/lib/env";
import { loadGuestCode, publishGuestCode } from "@/app/studio/actions";
import { ContentForm } from "./content-form";
import { DesignPanel } from "./design-panel";
import { Preview } from "./preview";
import { StepDock } from "./step-dock";
import { PrintStudio } from "@/components/print/print-studio";
import { PollResults } from "@/components/dashboard/poll-results";
import { RsvpList } from "@/components/dashboard/rsvp-list";
import { StickerStudio } from "@/components/print/sticker-studio";
import { MotionStudio } from "@/components/print/motion-studio";
import { HostedPage } from "@/components/pages/hosted-pages";
import { TypeIcon } from "@/components/type-icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { usePublishStudioNav } from "@/components/shell/studio-nav";
import { presetById } from "@/lib/page-design";

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
  mode: Mode;
  slug: string;
  /** set once the dynamic code exists on the server */
  token: string | null;
}

type Mode = "dynamic" | "static";
const DEFAULT_MODE: Mode = supabaseConfigured ? "dynamic" : "static";

export function editLink(slug: string, token: string) {
  return `${env.appUrl}/studio?code=${slug}#k=${token}`;
}

function loadInit(editId: string | null, startType: string | null, startStep: Step, prefillUrl?: string | null): Init {
  const base: Init = { step: 1, reached: 1, id: newId(), type: "url", name: "", content: structuredClone(CODE_TYPES.url.defaults), style: normalizeStyle(DEFAULT_STYLE), poster: null, editing: false, mode: DEFAULT_MODE, slug: newSlug(), token: null };
  const c = editId ? getLocalCode(editId) : null;
  if (c) {
    return {
      step: startStep, reached: 4, id: c.id, createdAt: c.createdAt, type: c.type, name: c.name, content: c.content, style: normalizeStyle(c.style),
      poster: c.poster ?? null, editing: true, mode: c.dynamic ? "dynamic" : "static", slug: c.dynamic?.slug ?? newSlug(), token: c.dynamic?.token ?? null,
    };
  }
  if (startType && startType in CODE_TYPES) {
    const t = startType as CodeTypeId;
    const content = structuredClone(CODE_TYPES[t].defaults);
    if (t === "url" && prefillUrl && /^https?:\/\//.test(prefillUrl)) content.url = prefillUrl;
    return { ...base, step: 2, reached: 2, type: t, content };
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
  const remote = params.get("code");
  if (!client) return <div className="mx-auto h-[70vh] w-full max-w-[1600px]" />;
  if (remote) return <RemoteWizard key={remote} slug={remote} />;
  return <WizardEditor key={`${editId ?? ""}|${startType ?? ""}`} init={loadInit(editId, startType, startStep, params.get("url"))} />;
}

/** Opens a dynamic code from its private edit link (/studio?code=slug#k=token). */
function RemoteWizard({ slug }: { slug: string }) {
  const [state, setState] = useState<{ init: Init } | { error: string } | null>(null);
  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get("k") ?? "";
    let alive = true;
    loadGuestCode(slug, token).then((code) => {
      if (!alive) return;
      if (!code) return setState({ error: "Dieser Bearbeitungs-Link ist ungültig oder unvollständig." });
      const local = listLocalCodes().find((c) => c.dynamic?.slug === slug);
      const init: Init = {
        step: 2, reached: 4, id: local?.id ?? newId(), createdAt: local?.createdAt, type: code.type, name: code.name, content: code.content,
        style: normalizeStyle(code.style), poster: local?.poster ?? null, editing: true, mode: "dynamic", slug, token,
      };
      // Remember it in this browser too, so it shows up under "Meine Codes".
      try {
        saveLocalCode({ id: init.id, name: code.name, type: code.type, content: code.content, style: code.style, poster: local?.poster, dynamic: { slug, token }, createdAt: local?.createdAt });
      } catch {
        // storage full: editing still works
      }
      setState({ init });
    });
    return () => {
      alive = false;
    };
  }, [slug]);
  if (!state) return <div className="mx-auto grid h-[60vh] w-full max-w-[1600px] place-items-center text-dim"><Loader2 className="size-6 animate-spin" /></div>;
  if ("error" in state) {
    return (
      <div className="card mx-auto mt-16 max-w-lg p-8 text-center">
        <Lock className="mx-auto size-8 text-brand" />
        <p className="mt-4 font-display text-2xl">Kein Zugriff</p>
        <p className="mt-2 text-dim">{state.error} Öffne den vollständigen Link, den du beim Erstellen bekommen hast.</p>
        <Link href="/studio" className="mt-6 inline-block font-semibold text-brand hover:underline">Neuen Code erstellen</Link>
      </div>
    );
  }
  return <WizardEditor init={state.init} />;
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
  const [copied, setCopied] = useState<"page" | "edit" | null>(null);
  const [output, setOutput] = useState<"print" | "sticker" | "motion">("print");
  const [mode, setMode] = useState<Mode>(init.mode);
  const [slug, setSlug] = useState(init.slug);
  const [token, setToken] = useState<string | null>(init.token);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const signature = JSON.stringify([name, type, content, style]);
  const [publishedSig, setPublishedSig] = useState<string | null>(init.token ? signature : null);
  const live = mode === "dynamic" && !!token;
  const dirty = live && publishedSig !== signature;
  const locked = mode === "dynamic" && !!token; // live (maybe printed): stays dynamic

  const def = CODE_TYPES[type];
  const data = useMemo(() => (mode === "dynamic" ? shortLink(slug) : staticPayload(type, content, name || undefined)), [mode, slug, type, content, name]);
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
    // Some types need the server (e.g. polls store votes): they are always dynamic.
    if (!CODE_TYPES[t].modes.includes("static") && !locked) setMode("dynamic");
    go(2);
  }

  function applyStarter(st: Starter) {
    setType(st.type);
    setContent(structuredClone(st.content));
    const preset = STYLE_PRESETS.find((p) => p.id === st.preset);
    if (preset) setStyle(normalizeStyle({ ...DEFAULT_STYLE, ...preset.style, logo: style.logo }));
    setPoster(null);
    setErrors({});
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

  const displayName = name || String(content.business ?? content.name ?? content.title ?? "").trim() || def.label;

  async function publish(): Promise<boolean> {
    setPublishing(true);
    setPublishError(null);
    let currentSlug = slug;
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await publishGuestCode({ slug: currentSlug, token: token ?? undefined, name: displayName, type, content, style });
      if (res.ok) {
        setToken(res.token);
        setSlug(res.slug);
        setPublishedSig(signature);
        setPublishing(false);
        try {
          const c = saveLocalCode({ id, name: displayName, type, content, style, poster: posterSettings, dynamic: { slug: res.slug, token: res.token }, createdAt });
          setCreatedAt(c.createdAt);
        } catch {
          // ignore: the server copy is what counts
        }
        return true;
      }
      if (res.message === "SLUG_TAKEN" && !token) {
        currentSlug = newSlug();
        setSlug(currentSlug);
        continue;
      }
      setPublishing(false);
      setPublishError(res.message);
      if (res.fieldErrors) {
        setErrors(res.fieldErrors);
        go(2);
      }
      return false;
    }
    setPublishing(false);
    setPublishError("Speichern fehlgeschlagen. Bitte erneut versuchen.");
    return false;
  }

  function toPrint() {
    go(4);
    if (mode === "dynamic" && (!token || dirty)) void publish();
  }

  function save() {
    if (mode === "dynamic") {
      void publish().then((ok) => {
        setSaved(ok ? "ok" : "error");
        setSaveMsg(ok ? "Veröffentlicht. Gedruckte Codes zeigen sofort den neuen Stand." : "Speichern fehlgeschlagen.");
      });
      return;
    }
    try {
      const c = saveLocalCode({ id, name: displayName, type, content, style, poster: posterSettings, createdAt });
      setCreatedAt(c.createdAt);
      setSaved("ok");
      setSaveMsg("In „Meine Codes“ gespeichert. Nur in diesem Browser.");
    } catch (e) {
      setSaved("error");
      setSaveMsg(e instanceof Error ? e.message : "Speichern fehlgeschlagen.");
    }
  }

  async function copy(text: string, what: "page" | "edit") {
    await navigator.clipboard.writeText(text).catch(() => undefined);
    setCopied(what);
    setTimeout(() => setCopied(null), 1500);
  }

  // Keep the poster copy in sync locally when the dynamic code is already live.
  const posterRef = useRef(poster);
  useEffect(() => {
    if (!live || posterRef.current === poster) return;
    posterRef.current = poster;
    try {
      saveLocalCode({ id, name: displayName, type, content, style, poster: posterSettings, dynamic: { slug, token: token! }, createdAt });
    } catch {
      // ignore
    }
  }, [poster, live, id, displayName, type, content, style, posterSettings, slug, token, createdAt]);

  const canOpen = (s: Step) => s <= reached || (s === 2 && step === 1);
  const stepClick = (s: Step) => (s === 3 && step === 2 ? nextFromContent() : s === 4 ? toPrint() : go(s));

  // Tell the sidebar where we are (numbered path + output sub-menu).
  const publishNav = usePublishStudioNav();
  const stepClickRef = useRef(stepClick);
  useEffect(() => {
    stepClickRef.current = stepClick;
  });
  const designPreset = (content.design as { preset?: string } | undefined)?.preset;
  useEffect(() => {
    publishNav?.({
      step,
      reached,
      typeLabel: def.label,
      name: name.trim(),
      designLabel: def.hostedPage ? (designPreset ? `Seite: ${presetById(designPreset).name}` : "Seite und Code") : "Farben und Formen",
      output,
      go: (n) => stepClickRef.current(n as Step),
      setOutput: (o) => setOutput(o),
    });
  }, [publishNav, step, reached, def.label, def.hostedPage, name, designPreset, output]);
  useEffect(() => () => publishNav?.(null), [publishNav]);

  const previewEl = svg ? (
    <Preview key={step === 2 && phone ? "p2" : "p3"} svg={svg} data={data} style={style} name={name || def.label} phone={phone} />
  ) : (
    <div className="card grid aspect-square place-items-center p-8 text-center text-sm text-dim">Zu viel Inhalt für einen QR-Code.</div>
  );

  return (
    <div className="mx-auto w-full max-w-[1600px]">
      {/* Stepper */}
      <ol className="sticky top-14 z-30 -mx-5 mb-8 flex gap-1.5 lg:hidden overflow-x-auto border-b border-edge bg-bg/80 px-5 py-3 backdrop-blur-xl [scrollbar-width:none] sm:-mx-8 sm:px-8">
        {STEPS.map((s, i) => {
          const done = s.id < step || (s.id <= reached && s.id !== step && s.id < reached);
          const active = s.id === step;
          const Icon = s.icon;
          return (
            <li key={s.id} className={cn("flex min-w-0 items-center gap-1.5", active ? "flex-1" : "flex-none sm:flex-1")}>
              <button
                type="button"
                disabled={!canOpen(s.id as Step)}
                onClick={() => stepClick(s.id as Step)}
                className={cn(
                  "flex w-full min-w-0 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition",
                  active ? "border-brand bg-brand/15 shadow-[0_0_24px_-8px_rgb(var(--glow)/0.9)]" : done ? "border-edge bg-surface hover:border-hi/25" : "border-transparent opacity-50",
                )}
              >
                <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg font-display text-sm", active ? "bg-brand text-on-brand" : done ? "bg-mint/15 text-mint" : "bg-hi/5 text-faint")}>
                  {done && !active ? <Check className="size-4" /> : <Icon className="size-4" />}
                </span>
                <span className={cn("min-w-0", !active && "hidden sm:block")}>
                  <span className="block text-[10px] font-bold text-faint">Schritt {s.id}</span>
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
          <h1 className="font-display text-4xl leading-[0.95] sm:text-6xl">
            Was soll dein Code <span className="text-brand glow-text">können?</span>
          </h1>
          <p className="mt-3 max-w-2xl text-dim">Wähle einen Typ. Du kommst automatisch zum nächsten Schritt. Kein Konto nötig.</p>
          {live && (
            <p className="mt-5 flex max-w-3xl gap-2.5 rounded-2xl border border-mint/30 bg-mint/10 px-4 py-3 text-sm text-fg">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-mint" />
              <span>Du kannst den Typ wechseln, zum Beispiel von Website zu Speisekarte. Dein gedruckter Code bleibt exakt gleich und zeigt nach dem Veröffentlichen den neuen Inhalt.</span>
            </p>
          )}
          <section className="mt-10">
            <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 id="vorlagen" className="scroll-mt-24 font-display text-xl">Mit Vorlage starten</h2>
              <span className="text-sm text-faint">Fertige Mini-Website mit passendem QR-Design. Alles danach frei änderbar.</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
              {STARTERS.map((st, i) => (
                <div key={st.id} role="button" tabIndex={0} onClick={() => applyStarter(st)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); applyStarter(st); } }} style={{ animationDelay: `${i * 50}ms` }} className="card group cursor-pointer overflow-hidden p-0 text-left transition duration-300 animate-rise hover:-translate-y-1 hover:border-edge-strong">
                  <div inert className="pointer-events-none relative h-56 overflow-hidden border-b border-edge bg-bg/40">
                    <div className="mp-preview absolute left-1/2 top-3 w-[390px] origin-top -translate-x-1/2 scale-[0.46] overflow-hidden rounded-[36px] border-[10px] border-[#111] shadow-lift transition duration-500 group-hover:scale-[0.48]">
                      <HostedPage code={{ id: st.id, slug: st.id, name: String(st.content.name), type: st.type, mode: "static", status: "active", content: st.content }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3.5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-hi/10 text-fg"><TypeIcon name={st.icon} className="size-4" /></span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{st.name}</span>
                      <span className="block truncate text-xs text-faint">{st.hint}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {GROUPS.map((group, gi) => (
            <section key={group.id} className="mt-10">
              <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="font-display text-xl">{group.title}</h2>
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
                          {t === "review" && <span className="badge bg-lime text-night">Neu</span>}
                          {t === "site" && <span className="badge bg-hi/10 text-fg">Mini-Website</span>}
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
        <div className="grid gap-8 pb-28 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_440px] xl:gap-10">
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
                    className="w-full bg-transparent font-display text-3xl leading-none text-fg outline-none placeholder:text-faint sm:text-5xl"
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
                <ModeSwitch mode={mode} onChange={setMode} locked={locked} dynamicOnly={!def.modes.includes("static")} />
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
              </div>
            ) : (
              <div className="mt-8">
                <DesignPanel style={style} onChange={setStyle} data={data} />
              </div>
            )}
          </div>

          <aside className="hidden lg:sticky lg:top-6 lg:mt-14 lg:block lg:self-start">
            {previewEl}
          </aside>
          <StepDock
            step={step}
            backLabel={step === 2 ? "Typ" : "Inhalt"}
            nextLabel={step === 2 ? "Weiter zum Design" : mode === "dynamic" && !token ? "Aktivieren & drucken" : "Druck & Download"}
            onBack={() => go(step === 2 ? 1 : 2)}
            onNext={step === 2 ? nextFromContent : toPrint}
            nextDisabled={step === 2 && tooLong}
            preview={previewEl}
          />
        </div>
      )}

      {/* ───── Step 4: print + download ───── */}
      {step === 4 && svg && mode === "dynamic" && !token && (
        <div className="card mx-auto mt-10 max-w-xl p-10 text-center">
          {publishing ? (
            <>
              <Loader2 className="mx-auto size-8 animate-spin text-brand" />
              <p className="mt-4 font-display text-2xl">Code wird aktiviert</p>
              <p className="mt-2 text-dim">Einen Moment. Danach gehört dieser Link für immer dir.</p>
            </>
          ) : (
            <>
              <TriangleAlert className="mx-auto size-8 text-rose" />
              <p className="mt-4 font-display text-2xl">Nicht aktiviert</p>
              <p className="mt-2 text-dim">{publishError ?? "Bitte erneut versuchen."}</p>
              <div className="mt-6 flex justify-center gap-2">
                <Button type="button" onClick={() => void publish()}><RefreshCw className="size-4" /> Erneut versuchen</Button>
                {def.modes.includes("static") && <Button type="button" variant="ghost" onClick={() => { setMode("static"); }}>Statisch weiter</Button>}
              </div>
            </>
          )}
        </div>
      )}

      {step === 4 && svg && (mode === "static" || !!token) && (
        <div className="animate-rise">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl leading-[0.95] sm:text-5xl">
                Fertig zum <span className="text-brand glow-text">Drucken</span>
              </h1>
              <p className="mt-2 max-w-2xl text-dim">Wähle Format und Vorlage: A6 bis A0, Sticker, Visitenkarte oder eigene Maße. Oder lade nur den Code herunter.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="ghost" onClick={() => go(3)}><ArrowLeft className="size-4" /> Design</Button>
              {mode === "dynamic" ? (
                <Button type="button" variant={dirty ? "primary" : "secondary"} onClick={save} disabled={publishing || !dirty}>
                  {publishing ? <Loader2 className="size-4 animate-spin" /> : dirty ? <RefreshCw className="size-4" /> : <Check className="size-4" />}
                  {dirty ? "Änderungen veröffentlichen" : "Live"}
                </Button>
              ) : (
                <Button type="button" variant="secondary" onClick={save}><Save className="size-4" /> {saved === "ok" ? "Gespeichert" : "Speichern"}</Button>
              )}
            </div>
          </div>
          {live && token && <EditLinkCard slug={slug} token={token} copied={copied === "edit"} onCopy={() => copy(editLink(slug, token), "edit")} dirty={dirty} />}
          {type === "event" && live && token && content.rsvp === true && <RsvpList slug={slug} token={token} className="mt-5" />}
          {type === "poll" && live && token && <PollResults slug={slug} token={token} options={(content.options as { label: string }[]) ?? []} className="mt-5" />}
          {publishError && mode === "dynamic" && token && <p className="mt-4 rounded-xl border border-rose/30 bg-rose/10 px-4 py-2.5 text-sm font-semibold text-rose">{publishError}</p>}
          {saved !== "idle" && (
            <p className={cn("mt-4 rounded-xl border px-4 py-2.5 text-sm font-semibold", saved === "ok" ? "border-mint/30 bg-mint/10 text-mint" : "border-rose/30 bg-rose/10 text-rose")}>
              {saveMsg} {saved === "ok" && <Link href="/codes" className="underline">Meine Codes öffnen</Link>}
            </p>
          )}

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] 2xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0">
              <div role="tablist" aria-label="Ausgabe" className="mb-5 grid w-full grid-cols-3 rounded-2xl border border-edge bg-hi/5 p-1 text-sm font-semibold sm:inline-grid sm:w-auto sm:rounded-full">
                {([["print", "Poster & Druck", "Poster", Printer], ["sticker", "Sticker", "Sticker", StickerIcon], ["motion", "Animation & Video", "Video", Clapperboard]] as const).map(([k, label, short, Icon]) => (
                  <button key={k} type="button" role="tab" aria-selected={output === k} onClick={() => setOutput(k)} className={cn("inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 transition sm:rounded-full sm:px-4 sm:py-2", output === k ? "bg-brand text-on-brand shadow-sm" : "text-dim hover:text-fg")}>
                    <Icon className="size-4 shrink-0" />
                    <span className="sm:hidden">{short}</span>
                    <span className="hidden sm:inline">{label}</span>
                    {k === "motion" && <span className="badge ml-0.5 hidden bg-lime text-night md:inline-flex">Neu</span>}
                  </button>
                ))}
              </div>
              {output === "print" && <PrintStudio settings={posterSettings} onChange={setPoster} qrSvg={posterQr} name={name || def.label} />}
              {output === "sticker" && <StickerStudio qrSvg={posterQr} name={name || def.label} defaults={{ text: posterSettings.cta || "SCAN MICH", bg: "#191919", fg: "#ffffff", accent: "#bdfb04" }} />}
              {output === "motion" && <MotionStudio qrSvg={posterQr} name={name || def.label} defaults={{ headline: posterSettings.headline, sub: posterSettings.subline, cta: posterSettings.cta, footer: posterSettings.footer, bg: "#191919", fg: "#ffffff", accent: "#bdfb04" }} />}
            </div>
            <aside className="grid gap-4 sm:grid-cols-2 xl:block xl:space-y-4 xl:sticky xl:top-40 xl:self-start">
              <Preview svg={svg} data={data} style={style} name={name || def.label} />
              {(isPageLink || live) && (
                <div className="card p-4">
                  <p className="text-xs font-bold text-faint">{live ? "Link im Code" : "Link der Handy-Seite"}</p>
                  {live && <p className="mt-2 break-all font-mono text-sm text-fg">{data.replace(/^https?:\/\//, "")}</p>}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <a href={data} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-edge text-xs font-bold text-dim hover:border-hi/25 hover:text-fg"><ExternalLink className="size-4" /> Öffnen</a>
                    <button type="button" onClick={() => copy(data, "page")} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-edge text-xs font-bold text-dim hover:border-hi/25 hover:text-fg">{copied === "page" ? <Check className="size-4 text-mint" /> : <Copy className="size-4" />} Kopieren</button>
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

function ModeSwitch({ mode, onChange, locked, dynamicOnly }: { mode: Mode; onChange: (m: Mode) => void; locked: boolean; dynamicOnly?: boolean }) {
  if (dynamicOnly && !locked) {
    return (
      <p className="mb-5 flex gap-2.5 rounded-2xl border border-edge bg-hi/5 px-4 py-3 text-sm text-fg">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-mint" />
        <span>
          <b>Immer dynamisch.</b> Stimmen werden sicher gespeichert, die Ergebnisse siehst du live. Fragen und Antworten kannst du jederzeit ändern.
          {!supabaseConfigured && <span className="mt-1 block text-rose">Abstimmungen sind verfügbar, sobald die Datenbank verbunden ist.</span>}
        </span>
      </p>
    );
  }
  if (locked) {
    return (
      <p className="mb-5 flex gap-2.5 rounded-2xl border border-mint/30 bg-mint/10 px-4 py-3 text-sm text-fg">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-mint" />
        <span><b>Dynamischer Code.</b> Was du hier änderst, erscheint nach dem Veröffentlichen sofort hinter deinem gedruckten Code. Der Code selbst ändert sich nie.</span>
      </p>
    );
  }
  const options = [
    { id: "dynamic" as const, title: "Dynamisch", badge: "Empfohlen", icon: ShieldCheck, text: "Der Code bleibt für immer gleich. Inhalt, Typ und Seite jederzeit ändern, ohne neu zu drucken. Mit Bildern und großen Karten.", disabled: !supabaseConfigured },
    { id: "static" as const, title: "Statisch", badge: "Offline", icon: InfinityIcon, text: "Inhalt steckt direkt im Code. Jede Änderung ergibt einen neuen Code. Gut für WLAN, Kontakt und kurze Texte.", disabled: false },
  ];
  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          disabled={o.disabled}
          onClick={() => onChange(o.id)}
          className={cn("card p-4 text-left transition disabled:opacity-40", mode === o.id ? "card-glow" : "hover:border-hi/25")}
        >
          <span className="flex items-center gap-2 font-display text-base">
            <o.icon className={cn("size-4", mode === o.id ? "text-brand" : "text-faint")} /> {o.title}
            <span className={cn("badge", o.id === "dynamic" ? "bg-brand text-on-brand" : "bg-hi/10 text-dim")}>{o.badge}</span>
          </span>
          <span className="mt-1.5 block text-xs leading-relaxed text-dim">{o.text}</span>
        </button>
      ))}
    </div>
  );
}

function EditLinkCard({ slug, token, copied, onCopy, dirty }: { slug: string; token: string; copied: boolean; onCopy: () => void; dirty: boolean }) {
  return (
    <div className="mt-5 grid gap-4 rounded-2xl border border-gold/35 bg-gold/[0.07] p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
      <span className="grid size-11 place-items-center rounded-xl bg-gold text-night"><KeyRound className="size-5" /></span>
      <div className="min-w-0">
        <p className="font-bold">Dein privater Bearbeitungs-Link {dirty && <span className="badge ml-1 bg-gold text-night">Ungespeichert</span>}</p>
        <p className="mt-0.5 text-xs text-dim">Wer diesen Link hat, kann den Inhalt ändern. Speichere ihn gut, zum Beispiel per E-Mail an dich selbst. Der Code ist in „Meine Codes“ in diesem Browser gemerkt.</p>
        <p className="mt-1.5 truncate font-mono text-xs text-faint">{editLink(slug, token).replace(/#k=.*/, "#k=••••••••")}</p>
      </div>
      <Button type="button" variant="secondary" onClick={onCopy}>{copied ? <Check className="size-4 text-mint" /> : <Copy className="size-4" />} Link kopieren</Button>
    </div>
  );
}
