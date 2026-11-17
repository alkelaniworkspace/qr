"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, CornerDownLeft, Loader2, Lock, Star } from "lucide-react";
import { OTHER, isInput, isVisible, type FormField, type FormSettings } from "@/lib/forms/types";
import { FORM_FONTS, backdropCss, isLightColor, lookOf, type FormLook, type Palette } from "@/lib/forms/looks";
import { cn } from "@/lib/cn";

export interface PublicFormData {
  slug: string;
  title: string;
  description: string;
  fields: FormField[];
  settings: FormSettings;
  status: string;
  branding: boolean;
}

type SubmitResult = { ok: true; poll?: Record<string, Record<string, number>> } | { ok: false; message: string; errors?: Record<string, string> };

/* ───────────────────────── theme ───────────────────────── */

const mq = () => (typeof window === "undefined" ? null : window.matchMedia("(prefers-color-scheme: dark)"));
function useSystemDark(fallback: boolean) {
  return useSyncExternalStore(
    (cb) => { const m = mq(); m?.addEventListener("change", cb); return () => m?.removeEventListener("change", cb); },
    () => mq()?.matches ?? fallback,
    () => fallback,
  );
}

export function resolveTheme(settings: FormSettings, systemDark: boolean, force?: "light" | "dark") {
  const look = lookOf(settings.look ?? (settings.theme === "dark" ? "lime" : settings.theme === "light" ? "paper" : undefined));
  const mode = force ?? (settings.mode === "auto" ? (systemDark ? "dark" : "light") : settings.mode ?? settings.theme ?? look.prefers);
  const dark = mode === "dark";
  const base = dark ? look.dark : look.light;
  const accent = settings.accent && /^#[0-9a-f]{6}$/i.test(settings.accent) ? settings.accent : base.accent;
  const p: Palette = { ...base, accent };
  const font = FORM_FONTS[settings.font ?? look.font] ?? FORM_FONTS.inter;
  return { look, dark, p, font, onAccent: isLightColor(accent) ? "#0b0b0b" : "#ffffff" };
}

function cssVars(look: FormLook, p: Palette, dark: boolean, font: (typeof FORM_FONTS)[string], onAccent: string): React.CSSProperties {
  return {
    "--f-bg": p.bg, "--f-card": p.card, "--f-fg": p.fg, "--f-muted": p.muted, "--f-line": p.line, "--f-field": p.field,
    "--f-accent": p.accent, "--f-on": onAccent, "--f-r": `${look.radius}px`, "--f-r2": `${Math.round(look.radius * 1.5)}px`,
    "--f-display": font.display, "--f-body": font.body, "--f-weight": String(font.weight), "--f-track": font.tracking,
    background: backdropCss(look, p, dark), color: p.fg, fontFamily: font.body, colorScheme: dark ? "dark" : "light",
  } as React.CSSProperties;
}

/* ───────────────────────── main ───────────────────────── */

export function FormView({ form, onSubmit, preview, force, selected, onSelect, thumb }: {
  form: PublicFormData;
  onSubmit?: (answers: Record<string, unknown>) => Promise<SubmitResult>;
  preview?: boolean;
  /** render in this mode regardless of settings (thumbnails, editor toggle) */
  force?: "light" | "dark";
  /** editor: highlight + click-to-select fields */
  selected?: string | null;
  onSelect?: (id: string) => void;
  /** static, non-interactive miniature */
  thumb?: boolean;
}) {
  const s = form.settings;
  const systemDark = useSystemDark(lookOf(s.look).prefers === "dark");
  const { look, dark, p, font, onAccent } = resolveTheme(s, systemDark, force);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [poll, setPoll] = useState<Record<string, Record<string, number>> | null>(null);
  const already = useSyncExternalStore(() => () => {}, () => !preview && !!s.oncePerDevice && readOnce(form.slug), () => false);

  const visible = form.fields.filter((f) => isVisible(f, answers));
  const inputs = visible.filter((f) => isInput(f.type));
  const answered = inputs.filter((f) => filled(answers[f.id])).length;
  const progress = inputs.length ? answered / inputs.length : 0;
  const closedByDate = !!s.closeAt && !preview && isPast(s.closeAt);
  const closed = !preview && (form.status !== "open" || closedByDate);
  const steps = (s.layout ?? "classic") === "steps" && !thumb;

  const set = (id: string, v: unknown) => {
    setAnswers((a) => ({ ...a, [id]: v }));
    setErrors((e) => ({ ...e, [id]: "" }));
  };

  const finish = async () => {
    if (!onSubmit) return;
    const local = check(visible, answers);
    if (Object.keys(local).length) { setErrors(local); setMessage("Bitte die markierten Felder prüfen."); return false; }
    setState("busy");
    setMessage(null);
    const res = await onSubmit(answers);
    if (res.ok) {
      setPoll(res.poll ?? null);
      setState("done");
      if (s.oncePerDevice) writeOnce(form.slug);
      if (s.redirectUrl && /^https?:\/\//.test(s.redirectUrl)) setTimeout(() => window.location.assign(s.redirectUrl!), 2600);
      return true;
    }
    setState("idle");
    setErrors(res.errors ?? {});
    setMessage(res.message);
    return false;
  };

  const vars = cssVars(look, p, dark, font, onAccent);

  return (
    <div style={vars} className={cn("qf relative", preview || thumb ? "min-h-full" : "min-h-dvh", thumb && "pointer-events-none select-none")} data-field={look.field}>
      <FormStyles />
      {s.showProgress !== false && !thumb && !steps && state !== "done" && inputs.length > 1 && (
        <div className="sticky top-0 z-20 h-1 w-full bg-[var(--f-line)]">
          <motion.div className="h-full bg-[var(--f-accent)]" initial={false} animate={{ width: `${Math.round(progress * 100)}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
        </div>
      )}
      <div className={cn("mx-auto w-full px-4 pb-10", steps ? "max-w-2xl pt-6" : "max-w-xl pt-8 sm:pt-12")}>
        {s.cover && (
          <div className="mb-6 overflow-hidden rounded-[var(--f-r2)]" style={{ aspectRatio: "16 / 6" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- user image */}
            <img src={s.cover} alt="" className="size-full object-cover" />
          </div>
        )}
        <AnimatePresence mode="wait">
          {state === "done" ? (
            <ThankYou key="done" s={s} form={form} poll={poll} />
          ) : already ? (
            <Notice key="once" title="Schon dabei" text="Du hast dieses Formular auf diesem Gerät bereits ausgefüllt. Danke!" />
          ) : closed ? (
            <Notice key="closed" title="Geschlossen" text={s.closedMessage || "Dieses Formular nimmt gerade keine Antworten an."} lock />
          ) : steps ? (
            <Steps key="steps" form={form} visible={visible} answers={answers} errors={errors} set={set} finish={finish} busy={state === "busy"} message={message} preview={preview} setErrors={setErrors} jumpTo={onSelect ? selected : undefined} />
          ) : (
            <motion.div key="classic" initial={thumb ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className={cn(look.sheet && "qf-sheet rounded-[calc(var(--f-r2)+6px)] p-5 sm:p-8")}>
              <Header form={form} />
              <form noValidate onSubmit={(e) => { e.preventDefault(); if (!preview) void finish(); }} className="mt-7 grid grid-cols-2 gap-x-3 gap-y-6">
                {visible.map((f, i) => (
                  <Selectable key={f.id} id={f.id} selected={selected} onSelect={onSelect} className={cn(f.width === "half" ? "col-span-2 sm:col-span-1" : "col-span-2")}>
                    <motion.div initial={thumb || i > 12 ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.035 }}>
                      <Field f={f} value={answers[f.id]} error={errors[f.id]} onChange={(v) => set(f.id, v)} preview={!!preview} />
                    </motion.div>
                  </Selectable>
                ))}
                {message && <p className="col-span-2 rounded-[var(--f-r)] bg-[#e11d48]/10 p-3 text-sm text-[#e11d48]">{message}</p>}
                <div className="col-span-2 pt-1">
                  <SubmitButton busy={state === "busy"} label={s.buttonText || "Absenden"} disabled={!!preview} />
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
        {form.branding && <p className="mt-10 text-center text-xs text-[var(--f-muted)]">Erstellt mit <Link href="/" className="font-semibold underline-offset-2 hover:underline">Qlick</Link></p>}
      </div>
    </div>
  );
}

/* ───────────────────────── pieces ───────────────────────── */

function Header({ form, small }: { form: PublicFormData; small?: boolean }) {
  return (
    <header>
      {form.settings.logo && (
        // eslint-disable-next-line @next/next/no-img-element -- user logo
        <img src={form.settings.logo} alt="" className="mb-5 h-12 w-auto max-w-[160px] object-contain" />
      )}
      <h1 className={cn("qf-display leading-[1.05]", small ? "text-[26px]" : "text-[32px] sm:text-[38px]")}>{form.title}</h1>
      {form.description && <p className="mt-3 whitespace-pre-line text-[15.5px] leading-relaxed text-[var(--f-muted)]">{form.description}</p>}
    </header>
  );
}

function Selectable({ id, selected, onSelect, className, children }: { id: string; selected?: string | null; onSelect?: (id: string) => void; className?: string; children: React.ReactNode }) {
  if (!onSelect) return <div className={className}>{children}</div>;
  return (
    <div className={cn("group/sel relative -m-2 rounded-[calc(var(--f-r)+6px)] p-2 transition", className, selected === id ? "ring-2 ring-[var(--f-accent)]" : "hover:ring-1 hover:ring-[var(--f-line)]")}
      onClickCapture={() => onSelect(id)} data-sel={id}>
      {children}
    </div>
  );
}

function SubmitButton({ busy, label, disabled, compact }: { busy: boolean; label: string; disabled?: boolean; compact?: boolean }) {
  return (
    <button type="submit" disabled={busy || disabled}
      className={cn("qf-btn group inline-flex items-center justify-center gap-2 font-semibold transition active:scale-[0.98] disabled:cursor-default", compact ? "h-12 px-6 text-[15px]" : "h-14 w-full text-[16px]")}>
      {busy ? <Loader2 className="size-4 animate-spin" /> : null}
      {label}
      {!busy && <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />}
    </button>
  );
}

function Notice({ title, text, lock }: { title: string; text: string; lock?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="qf-sheet rounded-[var(--f-r2)] p-8 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-[var(--f-field)] ring-1 ring-[var(--f-line)]">{lock ? <Lock className="size-6" /> : <Check className="size-6" />}</span>
      <p className="qf-display mt-5 text-2xl">{title}</p>
      <p className="mt-2 text-[var(--f-muted)]">{text}</p>
    </motion.div>
  );
}

function ThankYou({ s, form, poll }: { s: FormSettings; form: PublicFormData; poll: Record<string, Record<string, number>> | null }) {
  const dots = useMemo(() => Array.from({ length: 14 }, (_, i) => ({ a: (i / 14) * Math.PI * 2, d: 54 + (i % 3) * 14 })), []);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 220, damping: 22 }} className="qf-sheet rounded-[var(--f-r2)] p-8 text-center sm:p-10">
      <div className="relative mx-auto size-20">
        {dots.map((d, i) => (
          <motion.span key={i} className="absolute left-1/2 top-1/2 size-2 rounded-full bg-[var(--f-accent)]"
            initial={{ x: "-50%", y: "-50%", opacity: 0, scale: 0 }}
            animate={{ x: `calc(-50% + ${Math.cos(d.a) * d.d}px)`, y: `calc(-50% + ${Math.sin(d.a) * d.d}px)`, opacity: [0, 1, 0], scale: [0, 1, 0.6] }}
            transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }} />
        ))}
        <motion.span initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 13 }}
          className="absolute inset-0 grid place-items-center rounded-full bg-[var(--f-accent)] text-[var(--f-on)]"><Check className="size-9" strokeWidth={3} /></motion.span>
      </div>
      <p className="qf-display mt-6 text-3xl">{s.thankYouTitle || "Danke!"}</p>
      {s.thankYou && <p className="mx-auto mt-2 max-w-sm whitespace-pre-line text-[var(--f-muted)]">{s.thankYou}</p>}
      {s.redirectUrl && <p className="mt-4 text-xs text-[var(--f-muted)]">Du wirst gleich weitergeleitet …</p>}
      {poll && (
        <div className="mt-8 space-y-6 text-left">
          {form.fields.filter((f) => poll[f.id]).map((f) => {
            const counts = poll[f.id];
            const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
            const opts = f.type === "yesno" ? ["Ja", "Nein"] : f.options ?? Object.keys(counts);
            return (
              <div key={f.id}>
                <p className="mb-3 font-semibold">{f.label}</p>
                {opts.map((o, k) => {
                  const pct = Math.round(((counts[o] ?? 0) / total) * 100);
                  return (
                    <div key={o} className="mb-2.5">
                      <div className="flex justify-between text-sm"><span>{o}</span><span className="font-semibold tabular-nums">{pct} %</span></div>
                      <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-[var(--f-field)] ring-1 ring-[var(--f-line)]">
                        <motion.div className="h-full rounded-full bg-[var(--f-accent)]" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, delay: 0.2 + k * 0.08, ease: "easeOut" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

/* ───────────────────── one question per screen ───────────────────── */

const AUTO_NEXT = new Set(["single", "yesno", "rating", "nps", "dropdown"]);

function Steps({ form, visible, answers, errors, set, finish, busy, message, preview, setErrors, jumpTo }: {
  form: PublicFormData; visible: FormField[]; answers: Record<string, unknown>; errors: Record<string, string>;
  set: (id: string, v: unknown) => void; finish: () => Promise<boolean | undefined>; busy: boolean; message: string | null; preview?: boolean;
  setErrors: (e: Record<string, string>) => void;
  jumpTo?: string | null;
}) {
  // screen 0 = welcome, then one per visible field
  const [i, setI] = useState(0);
  // editor: show the question that is being edited
  const [lastJump, setLastJump] = useState<string | null | undefined>(undefined);
  if (jumpTo !== lastJump) {
    setLastJump(jumpTo);
    const k = jumpTo ? visible.findIndex((f) => f.id === jumpTo) : -1;
    if (k >= 0 && k + 1 !== i) setI(k + 1);
  }
  const [dir, setDir] = useState(1);
  const total = visible.length;
  const cur = i > 0 ? visible[Math.min(i, total) - 1] : null;
  const last = i >= total;
  const box = useRef<HTMLDivElement>(null);
  const s = form.settings;

  const next = async () => {
    if (cur) {
      const e = check([cur], answers);
      if (Object.keys(e).length) { setErrors(e); return; }
    }
    if (last) { if (!preview) await finish(); return; }
    setDir(1);
    setI((x) => Math.min(x + 1, total));
  };
  const back = () => { setDir(-1); setI((x) => Math.max(0, x - 1)); };
  const pick = (v: unknown) => {
    if (!cur) return;
    set(cur.id, v);
    if (AUTO_NEXT.has(cur.type) && !(cur.other && typeof v === "string" && v.startsWith(OTHER)) && !last) setTimeout(() => { setDir(1); setI((x) => Math.min(x + 1, total)); }, 320);
  };

  useEffect(() => {
    const el = box.current?.querySelector<HTMLElement>("input:not([type=checkbox]):not([type=range]), textarea");
    if (el && i > 0) setTimeout(() => el.focus({ preventScroll: true }), 260);
  }, [i]);

  const pct = total ? Math.round((Math.max(0, i - 1) / total) * 100) : 0;
  return (
    <div className="flex min-h-[70vh] flex-col">
      <div className="flex items-center gap-3">
        {i > 0 && <button type="button" onClick={back} className="grid size-10 place-items-center rounded-full ring-1 ring-[var(--f-line)] transition hover:bg-[var(--f-field)]" aria-label="Zurück"><ArrowLeft className="size-4" /></button>}
        {s.showProgress !== false && i > 0 && (
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--f-line)]">
            <motion.div className="h-full rounded-full bg-[var(--f-accent)]" animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
          </div>
        )}
        {i > 0 && <span className="text-xs tabular-nums text-[var(--f-muted)]">{Math.min(i, total)}/{total}</span>}
      </div>
      <div ref={box} className="relative flex flex-1 items-center py-10">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={i} custom={dir} className="w-full"
            initial={{ opacity: 0, y: dir * 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: dir * -40 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}>
            {i === 0 ? (
              <div>
                <Header form={form} />
                <button type="button" onClick={next} className="qf-btn group mt-9 inline-flex h-14 items-center gap-2.5 px-8 text-[16px] font-semibold transition active:scale-[0.98]">
                  Los geht&apos;s <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                </button>
                <p className="mt-4 text-xs text-[var(--f-muted)]">{total} {total === 1 ? "Frage" : "Fragen"} · etwa {Math.max(1, Math.round(total * 0.25))} Min.</p>
              </div>
            ) : cur ? (
              <form noValidate onSubmit={(e) => { e.preventDefault(); void next(); }}>
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--f-accent)]">{i} <ArrowRight className="size-3.5" /></p>
                <Field f={cur} big value={answers[cur.id]} error={errors[cur.id]} onChange={(v) => pick(v)} preview={!!preview} />
                {message && last && <p className="mt-4 rounded-[var(--f-r)] bg-[#e11d48]/10 p-3 text-sm text-[#e11d48]">{message}</p>}
                <div className="mt-8 flex items-center gap-4">
                  <SubmitButton compact busy={busy} label={last ? s.buttonText || "Absenden" : "Weiter"} disabled={!!preview && last} />
                  {!last && <span className="hidden items-center gap-1.5 text-xs text-[var(--f-muted)] sm:flex">oder <b className="font-semibold">Enter</b> <CornerDownLeft className="size-3.5" /></span>}
                </div>
              </form>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ───────────────────────── fields ───────────────────────── */

function Field({ f, value, error, onChange, big, preview }: { f: FormField; value: unknown; error?: string; onChange: (v: unknown) => void; big?: boolean; preview: boolean }) {
  const options = useShuffled(f.options ?? [], !!f.shuffle && !preview);
  if (f.type === "section") {
    return (
      <div className={cn(!big && "border-t border-[var(--f-line)] pt-6")}>
        <p className={cn("qf-display", big ? "text-[30px]" : "text-[22px]")}>{f.label}</p>
        {f.help && <p className="mt-1.5 text-[var(--f-muted)]">{f.help}</p>}
      </div>
    );
  }
  if (f.type === "statement") {
    return <p className={cn("rounded-[var(--f-r)] bg-[var(--f-field)] px-4 py-3.5 leading-relaxed ring-1 ring-[var(--f-line)]", big ? "text-lg" : "text-[14.5px]")}>{f.label}{f.help && <span className="mt-1 block text-sm text-[var(--f-muted)]">{f.help}</span>}</p>;
  }
  if (f.type === "consent") {
    return (
      <label className={cn("flex cursor-pointer items-start gap-3 rounded-[var(--f-r)] p-4 ring-1 transition", value === true ? "bg-[var(--f-accent)]/10 ring-[var(--f-accent)]" : "bg-[var(--f-field)] ring-[var(--f-line)]")}>
        <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-md ring-2 transition", value === true ? "bg-[var(--f-accent)] text-[var(--f-on)] ring-[var(--f-accent)]" : "ring-[var(--f-line)]")}>{value === true && <Check className="size-3.5" strokeWidth={3} />}</span>
        <input type="checkbox" className="sr-only" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
        <span className="text-[14.5px] leading-snug">{f.label}{f.required && <span className="text-[#e11d48]"> *</span>}{error && <span className="mt-1 block text-[13px] text-[#e11d48]">{error}</span>}</span>
      </label>
    );
  }

  const label = (
    <span className="mb-3 block">
      <span className={cn("block font-semibold leading-snug", big ? "qf-display text-[26px] sm:text-[30px]" : "text-[15.5px]")}>{f.label}{f.required && <span className="text-[#e11d48]"> *</span>}</span>
      {f.help && <span className={cn("mt-1 block text-[var(--f-muted)]", big ? "text-[15px]" : "text-[13.5px]")}>{f.help}</span>}
    </span>
  );
  let input: React.ReactNode;
  const big2 = big ? "text-[18px] h-14" : "";
  switch (f.type) {
    case "long":
      input = <textarea rows={big ? 5 : 4} className={cn("qf-input resize-none py-3", big && "text-[18px]")} value={String(value ?? "")} placeholder={f.placeholder || "Deine Antwort"} maxLength={f.max} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "single":
    case "multi": {
      const multi = f.type === "multi";
      const arr = multi ? (Array.isArray(value) ? (value as string[]) : []) : [];
      const otherVal = (multi ? arr.find((x) => x.startsWith(OTHER)) : typeof value === "string" && value.startsWith(OTHER) ? value : undefined);
      const isOn = (o: string) => (multi ? arr.includes(o) : value === o);
      const toggle = (o: string) => {
        if (!multi) return onChange(o);
        if (arr.includes(o)) return onChange(arr.filter((x) => x !== o));
        if (f.maxSelect && arr.length >= f.maxSelect) return;
        onChange([...arr, o]);
      };
      input = (
        <div className={cn("grid gap-2", options.length > 4 && !big && "sm:grid-cols-2")}>
          {options.map((o, k) => (
            <Choice key={o} on={isOn(o)} onClick={() => toggle(o)} letter={big ? String.fromCharCode(65 + k) : undefined} square={multi} big={big}>{o}</Choice>
          ))}
          {f.other && (
            <div>
              <Choice on={otherVal !== undefined} onClick={() => (multi ? (otherVal !== undefined ? onChange(arr.filter((x) => !x.startsWith(OTHER))) : onChange([...arr, OTHER])) : onChange(OTHER))} letter={big ? String.fromCharCode(65 + options.length) : undefined} square={multi} big={big}>Sonstiges</Choice>
              {otherVal !== undefined && (
                <input autoFocus className="qf-input mt-2" placeholder="Bitte angeben" value={otherVal.slice(OTHER.length)}
                  onChange={(e) => (multi ? onChange([...arr.filter((x) => !x.startsWith(OTHER)), OTHER + e.target.value]) : onChange(OTHER + e.target.value))} />
              )}
            </div>
          )}
          {multi && f.maxSelect && <p className="text-xs text-[var(--f-muted)]">{arr.length}/{f.maxSelect} ausgewählt</p>}
        </div>
      );
      break;
    }
    case "yesno":
      input = (
        <div className="grid grid-cols-2 gap-2 sm:max-w-sm">
          {["Ja", "Nein"].map((o, k) => <Choice key={o} on={value === o} onClick={() => onChange(o)} letter={big ? (k ? "N" : "J") : undefined} big={big} center>{o}</Choice>)}
        </div>
      );
      break;
    case "dropdown":
      input = (
        <select className={cn("qf-input qf-select", big2)} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
          <option value="">Bitte wählen</option>
          {options.map((o) => <option key={o}>{o}</option>)}
        </select>
      );
      break;
    case "rating":
      input = <Stars value={Number(value) || 0} onChange={onChange} big={big} />;
      break;
    case "nps":
      input = (
        <div>
          <div className="grid grid-cols-11 gap-1">
            {Array.from({ length: 11 }, (_, n) => (
              <motion.button key={n} type="button" whileTap={{ scale: 0.9 }} onClick={() => onChange(n)}
                className={cn("aspect-square rounded-[min(var(--f-r),12px)] text-sm font-semibold ring-1 transition", value === n ? "bg-[var(--f-accent)] text-[var(--f-on)] ring-[var(--f-accent)]" : "bg-[var(--f-field)] ring-[var(--f-line)] hover:ring-[var(--f-accent)]", big && "text-base")}>{n}</motion.button>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-[var(--f-muted)]"><span>Unwahrscheinlich</span><span>Sehr wahrscheinlich</span></div>
        </div>
      );
      break;
    case "slider": {
      const lo = f.min ?? 0, hi = f.max ?? 100, st = f.step ?? 1;
      const v = typeof value === "number" ? value : Math.round((lo + hi) / 2 / st) * st;
      input = (
        <div className="pt-2">
          <div className="flex items-end justify-center"><motion.span key={String(value === undefined)} initial={{ scale: 0.9, opacity: 0.6 }} animate={{ scale: 1, opacity: value === undefined ? 0.45 : 1 }} className="qf-display text-[44px] tabular-nums leading-none">{v}</motion.span></div>
          <input type="range" min={lo} max={hi} step={st} value={v} onChange={(e) => onChange(Number(e.target.value))} className="qf-range mt-4 w-full" style={{ "--pct": `${((v - lo) / Math.max(1, hi - lo)) * 100}%` } as React.CSSProperties} />
          <div className="mt-1.5 flex justify-between text-xs text-[var(--f-muted)]"><span>{f.minLabel || lo}</span><span>{f.maxLabel || hi}</span></div>
        </div>
      );
      break;
    }
    default: {
      const type = f.type === "email" ? "email" : f.type === "phone" ? "tel" : f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "time" ? "time" : f.type === "url" ? "url" : "text";
      const ph = f.placeholder || (f.type === "email" ? "name@beispiel.de" : f.type === "phone" ? "+49 …" : f.type === "url" ? "https://" : f.type === "number" ? "0" : f.type === "short" ? "Deine Antwort" : undefined);
      input = <input type={type} inputMode={f.type === "number" ? "decimal" : undefined} min={f.min} max={f.max} className={cn("qf-input", big2)} value={String(value ?? "")} placeholder={ph}
        autoComplete={f.type === "email" ? "email" : f.type === "phone" ? "tel" : undefined} onChange={(e) => onChange(e.target.value)} />;
    }
  }
  return (
    <div>
      {label}
      {input}
      <AnimatePresence>{error && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 text-[13px] font-medium text-[#e11d48]">{error}</motion.p>}</AnimatePresence>
    </div>
  );
}

function Choice({ on, onClick, children, letter, square, big, center }: { on: boolean; onClick: () => void; children: React.ReactNode; letter?: string; square?: boolean; big?: boolean; center?: boolean }) {
  return (
    <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={onClick}
      className={cn("qf-choice flex w-full items-center gap-3 text-left transition", big ? "min-h-14 px-4 text-[17px]" : "min-h-12 px-4 text-[15px]", center && "justify-center", on && "is-on")}>
      {letter ? (
        <span className={cn("grid size-7 shrink-0 place-items-center rounded-md text-[12px] font-bold ring-1 transition", on ? "bg-[var(--f-accent)] text-[var(--f-on)] ring-[var(--f-accent)]" : "ring-[var(--f-line)]")}>{letter}</span>
      ) : !center ? (
        <span className={cn("grid size-5 shrink-0 place-items-center ring-2 transition", square ? "rounded-md" : "rounded-full", on ? "bg-[var(--f-accent)] text-[var(--f-on)] ring-[var(--f-accent)]" : "ring-[var(--f-line)]")}>
          {on && (square ? <Check className="size-3.5" strokeWidth={3} /> : <span className="size-2 rounded-full bg-[var(--f-on)]" />)}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 py-2">{children}</span>
      {on && letter && <Check className="size-4 shrink-0 text-[var(--f-accent)]" strokeWidth={3} />}
    </motion.button>
  );
}

function Stars({ value, onChange, big }: { value: number; onChange: (v: number) => void; big?: boolean }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  const words = ["", "Schlecht", "Geht so", "Okay", "Gut", "Großartig"];
  return (
    <div>
      <div className="flex gap-1.5" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <motion.button key={n} type="button" whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.85 }} onMouseEnter={() => setHover(n)} onClick={() => onChange(n)} aria-label={`${n} Sterne`}>
            <Star className={cn(big ? "size-12" : "size-10", "transition-colors", shown >= n ? "fill-[#f5b301] text-[#f5b301]" : "text-[var(--f-line)]")} strokeWidth={1.4} />
          </motion.button>
        ))}
      </div>
      <p className="mt-1.5 h-5 text-sm font-medium text-[var(--f-muted)]">{words[shown]}</p>
    </div>
  );
}

/* ───────────────────────── helpers ───────────────────────── */

function isPast(iso: string) {
  return new Date(iso).getTime() < Date.now();
}

function filled(v: unknown) {
  return !(v === undefined || v === null || v === "" || v === false || (Array.isArray(v) && v.length === 0));
}

/** Client-side required check for the visible fields (the server checks again). */
function check(fields: FormField[], answers: Record<string, unknown>): Record<string, string> {
  const e: Record<string, string> = {};
  for (const f of fields) {
    if (!isInput(f.type) || !f.required) continue;
    const v = answers[f.id];
    if (f.type === "consent" ? v !== true : !filled(v) || v === OTHER) e[f.id] = f.type === "consent" ? "Bitte bestätigen" : "Bitte ausfüllen";
    else if (f.type === "email" && typeof v === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) e[f.id] = "Bitte eine gültige E-Mail";
  }
  return e;
}

function useShuffled(list: string[], on: boolean) {
  const [seed] = useState(() => Math.random());
  return useMemo(() => {
    if (!on) return list;
    const a = [...list];
    let r = seed;
    for (let i = a.length - 1; i > 0; i--) { r = (r * 9301 + 49297) % 233280 / 233280; const j = Math.floor(r * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }, [list, on, seed]);
}

function readOnce(slug: string) {
  try { return localStorage.getItem(`qlick.form.${slug}`) === "1"; } catch { return false; }
}
function writeOnce(slug: string) {
  try { localStorage.setItem(`qlick.form.${slug}`, "1"); } catch { /* ignore */ }
}

/** Scoped styles for the four field styles. Kept here so the form works anywhere. */
function FormStyles() {
  return (
    <style>{`
.qf .qf-display{font-family:var(--f-display);font-weight:var(--f-weight);letter-spacing:var(--f-track)}
.qf .qf-sheet{background:var(--f-card);box-shadow:0 1px 0 var(--f-line),0 30px 80px -40px rgba(0,0,0,.45);border:1px solid var(--f-line)}
.qf[data-field=glass] .qf-sheet{backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
.qf .qf-input{width:100%;min-height:3rem;padding:0 1rem;font-size:16px;color:var(--f-fg);background:var(--f-field);border-radius:var(--f-r);outline:none;transition:box-shadow .2s,border-color .2s,background .2s;border:1px solid var(--f-line)}
.qf .qf-input::placeholder{color:var(--f-muted);opacity:.7}
.qf .qf-input:focus{border-color:var(--f-accent);box-shadow:0 0 0 4px color-mix(in srgb,var(--f-accent) 18%,transparent)}
.qf[data-field=soft] .qf-input{border-color:transparent}
.qf[data-field=underline] .qf-input{border-width:0 0 1.5px;border-radius:0;padding-left:0;padding-right:0;background-color:transparent}
.qf[data-field=underline] .qf-input:focus{box-shadow:none;border-color:var(--f-accent)}
.qf[data-field=glass] .qf-input{backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.qf .qf-select{appearance:none;background-image:linear-gradient(45deg,transparent 50%,var(--f-muted) 50%),linear-gradient(135deg,var(--f-muted) 50%,transparent 50%);background-position:calc(100% - 20px) 52%,calc(100% - 15px) 52%;background-size:5px 5px;background-repeat:no-repeat;padding-right:2.5rem}
.qf[data-field=underline] .qf-select{background-position:calc(100% - 10px) 52%,calc(100% - 5px) 52%}
.qf .qf-choice{border-radius:var(--f-r);background:var(--f-field);border:1px solid var(--f-line)}
.qf[data-field=soft] .qf-choice{border-color:transparent}
.qf[data-field=underline] .qf-choice{background:transparent;border-radius:min(var(--f-r),6px)}
.qf .qf-choice:hover{border-color:color-mix(in srgb,var(--f-accent) 55%,var(--f-line))}
.qf .qf-choice.is-on{border-color:var(--f-accent);background:color-mix(in srgb,var(--f-accent) 12%,var(--f-field));box-shadow:0 0 0 1px var(--f-accent)}
.qf .qf-btn{background:var(--f-accent);color:var(--f-on);border-radius:var(--f-r);box-shadow:0 12px 30px -14px var(--f-accent)}
.qf .qf-btn:hover{filter:brightness(1.06)}
.qf .qf-btn:disabled{opacity:.75}
.qf .qf-range{appearance:none;height:8px;border-radius:99px;background:linear-gradient(to right,var(--f-accent) var(--pct),var(--f-line) var(--pct));outline:none}
.qf .qf-range::-webkit-slider-thumb{appearance:none;width:26px;height:26px;border-radius:50%;background:var(--f-card);border:3px solid var(--f-accent);box-shadow:0 4px 14px -4px rgba(0,0,0,.4);cursor:grab}
.qf .qf-range::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:var(--f-card);border:3px solid var(--f-accent);cursor:grab}
`}</style>
  );
}
