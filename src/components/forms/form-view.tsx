"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Check, Loader2, Star } from "lucide-react";
import type { FormField, FormSettings } from "@/lib/forms/types";
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

/** The form as visitors see it. Used on /f/[slug] and as the live preview in the builder. */
export function FormView({ form, onSubmit, preview }: { form: PublicFormData; onSubmit?: (answers: Record<string, unknown>) => Promise<SubmitResult>; preview?: boolean }) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [poll, setPoll] = useState<Record<string, Record<string, number>> | null>(null);
  const accent = form.settings.accent || "#191919";
  const dark = form.settings.theme === "dark";
  const set = (id: string, v: unknown) => {
    setAnswers((a) => ({ ...a, [id]: v }));
    setErrors((e) => ({ ...e, [id]: "" }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!onSubmit) return;
    setState("busy");
    setMessage(null);
    const res = await onSubmit(answers);
    if (res.ok) {
      setPoll(res.poll ?? null);
      setState("done");
    } else {
      setState("idle");
      setErrors(res.errors ?? {});
      setMessage(res.message);
    }
  }

  const vars = {
    "--f-bg": dark ? "#111111" : "#f5f5f0",
    "--f-card": dark ? "#1c1c1c" : "#ffffff",
    "--f-fg": dark ? "#ffffff" : "#191919",
    "--f-muted": dark ? "#a3a3a3" : "#6b6b66",
    "--f-line": dark ? "rgba(255,255,255,0.12)" : "rgba(25,25,25,0.1)",
    "--f-accent": accent,
  } as React.CSSProperties;

  return (
    <div style={vars} className="min-h-full bg-[var(--f-bg)] px-4 py-10 text-[var(--f-fg)]">
      <div className="mx-auto max-w-xl">
        <AnimatePresence mode="wait">
          {state === "done" ? (
            <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-[var(--f-card)] p-8 text-center shadow-sm">
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 14 }} className="mx-auto grid size-14 place-items-center rounded-full bg-[var(--f-accent)] text-white"><Check className="size-7" strokeWidth={3} /></motion.span>
              <p className="mt-5 text-2xl font-bold">{form.settings.thankYou || "Danke!"}</p>
              {poll && (
                <div className="mt-8 space-y-6 text-left">
                  {form.fields.filter((f) => poll[f.id]).map((f) => {
                    const counts = poll[f.id];
                    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
                    return (
                      <div key={f.id}>
                        <p className="mb-2 font-semibold">{f.label}</p>
                        {(f.options ?? Object.keys(counts)).map((o) => {
                          const pct = Math.round(((counts[o] ?? 0) / total) * 100);
                          return (
                            <div key={o} className="mb-2">
                              <div className="flex justify-between text-sm"><span>{o}</span><span className="tabular-nums">{pct} %</span></div>
                              <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-[var(--f-line)]">
                                <motion.div className="h-full rounded-full bg-[var(--f-accent)]" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, ease: "easeOut" }} />
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
          ) : (
            <motion.form key="form" onSubmit={submit} className="space-y-4" noValidate>
              <header className="mb-6">
                <h1 className="text-3xl font-bold leading-tight tracking-tight">{form.title}</h1>
                {form.description && <p className="mt-2 whitespace-pre-line text-[var(--f-muted)]">{form.description}</p>}
              </header>
              {form.status !== "open" && !preview && <p className="rounded-2xl border border-[var(--f-line)] p-4 text-center">Dieses Formular nimmt gerade keine Antworten an.</p>}
              {form.fields.map((f) => (
                <Field key={f.id} f={f} value={answers[f.id]} error={errors[f.id]} onChange={(v) => set(f.id, v)} />
              ))}
              {message && <p className="rounded-2xl bg-[#e11d48]/10 p-3 text-sm text-[#e11d48]">{message}</p>}
              <button type="submit" disabled={state === "busy" || form.status !== "open" || preview} className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[var(--f-accent)] py-3.5 text-base font-semibold text-white transition active:scale-[0.98] disabled:opacity-60" style={{ color: isLight(accent) ? "#191919" : "#ffffff" }}>
                {state === "busy" && <Loader2 className="size-4 animate-spin" />} {form.settings.buttonText || "Absenden"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
        {form.branding && <p className="mt-8 text-center text-xs text-[var(--f-muted)]">Erstellt mit <Link href="/" className="font-semibold underline-offset-2 hover:underline">Qlick</Link></p>}
      </div>
    </div>
  );
}

function isLight(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 160;
}

const box = "w-full rounded-2xl border border-[var(--f-line)] bg-[var(--f-card)] px-4 py-3 text-base outline-none transition focus:border-[var(--f-accent)]";

function Field({ f, value, error, onChange }: { f: FormField; value: unknown; error?: string; onChange: (v: unknown) => void }) {
  if (f.type === "section") {
    return (
      <div className="pt-4">
        <p className="text-xl font-bold">{f.label}</p>
        {f.help && <p className="mt-1 text-sm text-[var(--f-muted)]">{f.help}</p>}
      </div>
    );
  }
  const label = (
    <span className="mb-2 block font-semibold">
      {f.label}{f.required && <span className="text-[#e11d48]"> *</span>}
      {f.help && <span className="mt-0.5 block text-sm font-normal text-[var(--f-muted)]">{f.help}</span>}
    </span>
  );
  let input: React.ReactNode;
  switch (f.type) {
    case "long":
      input = <textarea rows={4} className={box} value={String(value ?? "")} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "single":
      input = (
        <div className="grid gap-2">
          {(f.options ?? []).map((o) => (
            <button key={o} type="button" onClick={() => onChange(o)} className={cn("flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition", value === o ? "border-[var(--f-accent)] bg-[var(--f-accent)]/10" : "border-[var(--f-line)] bg-[var(--f-card)]")}>
              <span className={cn("grid size-5 place-items-center rounded-full border-2", value === o ? "border-[var(--f-accent)]" : "border-[var(--f-line)]")}>{value === o && <span className="size-2.5 rounded-full bg-[var(--f-accent)]" />}</span>{o}
            </button>
          ))}
        </div>
      );
      break;
    case "multi": {
      const arr = Array.isArray(value) ? (value as string[]) : [];
      input = (
        <div className="grid gap-2">
          {(f.options ?? []).map((o) => {
            const on = arr.includes(o);
            return (
              <button key={o} type="button" onClick={() => onChange(on ? arr.filter((x) => x !== o) : [...arr, o])} className={cn("flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition", on ? "border-[var(--f-accent)] bg-[var(--f-accent)]/10" : "border-[var(--f-line)] bg-[var(--f-card)]")}>
                <span className={cn("grid size-5 place-items-center rounded-md border-2", on ? "border-[var(--f-accent)] bg-[var(--f-accent)] text-white" : "border-[var(--f-line)]")}>{on && <Check className="size-3.5" strokeWidth={3} />}</span>{o}
              </button>
            );
          })}
        </div>
      );
      break;
    }
    case "dropdown":
      input = (
        <select className={box} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
          <option value="">Bitte wählen</option>
          {(f.options ?? []).map((o) => <option key={o}>{o}</option>)}
        </select>
      );
      break;
    case "rating":
      input = (
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} Sterne`} className="transition active:scale-90">
              <Star className={cn("size-10", Number(value) >= n ? "fill-[#f5b301] text-[#f5b301]" : "text-[var(--f-line)]")} strokeWidth={1.5} />
            </button>
          ))}
        </div>
      );
      break;
    case "nps":
      input = (
        <div>
          <div className="grid grid-cols-11 gap-1">
            {Array.from({ length: 11 }, (_, n) => (
              <button key={n} type="button" onClick={() => onChange(n)} className={cn("aspect-square rounded-xl border text-sm font-semibold transition", value === n ? "border-[var(--f-accent)] bg-[var(--f-accent)] text-white" : "border-[var(--f-line)] bg-[var(--f-card)]")}>{n}</button>
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-xs text-[var(--f-muted)]"><span>Unwahrscheinlich</span><span>Sehr wahrscheinlich</span></div>
        </div>
      );
      break;
    case "consent":
      return (
        <label className="flex items-start gap-3 rounded-2xl border border-[var(--f-line)] bg-[var(--f-card)] p-4">
          <input type="checkbox" className="mt-1 size-4" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
          <span className="text-sm">{f.label}{f.required && <span className="text-[#e11d48]"> *</span>}{error && <span className="mt-1 block text-[#e11d48]">{error}</span>}</span>
        </label>
      );
    default: {
      const type = f.type === "email" ? "email" : f.type === "phone" ? "tel" : f.type === "number" ? "number" : f.type === "date" ? "date" : "text";
      input = <input type={type} inputMode={f.type === "number" ? "decimal" : undefined} className={box} value={String(value ?? "")} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />;
    }
  }
  return (
    <div className="rounded-3xl bg-[var(--f-card)]/0">
      {label}
      {input}
      {error && <p className="mt-1.5 text-sm text-[#e11d48]">{error}</p>}
    </div>
  );
}
