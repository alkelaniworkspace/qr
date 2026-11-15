"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BarChart3, Check, Infinity as InfinityIcon, Loader2, Lock, Palette, PenLine, Sparkles } from "lucide-react";
import { CODE_TYPES, TYPE_ORDER, type CodeMode, type CodeTypeId } from "@/lib/codes/types";
import { staticPayload } from "@/lib/codes/payload";
import { shortLink } from "@/lib/env";
import { newSlug } from "@/lib/codes/slug";
import { renderQrSvg } from "@/lib/qr/render";
import { DEFAULT_STYLE, normalizeStyle, type QrStyle } from "@/lib/qr/style";
import { ContentForm } from "./content-form";
import { DesignPanel } from "./design-panel";
import { Preview } from "./preview";
import { HostedPage } from "@/components/pages/hosted-pages";
import { TypeIcon } from "@/components/type-icon";
import { Button, ButtonLink } from "@/components/ui/button";
import { createCode, updateCode, type SaveInput } from "@/app/dashboard/actions";
import { cn } from "@/lib/cn";

export interface StudioCode {
  id: string;
  name: string;
  slug: string;
  type: CodeTypeId;
  mode: CodeMode;
  content: Record<string, unknown>;
  style: unknown;
}

interface Props {
  variant: "public" | "create" | "edit";
  userId?: string;
  code?: StudioCode;
  /** user has no dynamic codes left on their plan */
  dynamicLocked?: boolean;
  initialType?: CodeTypeId;
}

type Tab = "content" | "design";

const GROUPS = [
  { id: "page", title: "Mit eigener Handy-Seite", hint: "Wir hosten eine schöne Seite für dich" },
  { id: "link", title: "Weiterleitung", hint: "Scan führt direkt ans Ziel" },
  { id: "direct", title: "Direkt im Code", hint: "Funktioniert sogar offline" },
] as const;

export function Studio({ variant, userId, code, dynamicLocked = false, initialType }: Props) {
  const router = useRouter();
  const isPublic = variant === "public";
  const types = TYPE_ORDER.filter((t) => !isPublic || CODE_TYPES[t].modes.includes("static"));

  const [type, setType] = useState<CodeTypeId | null>(code?.type ?? initialType ?? (isPublic ? "url" : null));
  const def = type ? CODE_TYPES[type] : null;
  const preferredMode = (t: CodeTypeId): CodeMode => {
    const modes = CODE_TYPES[t].modes;
    if (isPublic || (dynamicLocked && modes.includes("static"))) return "static";
    return modes[0];
  };
  const [mode, setMode] = useState<CodeMode>(code?.mode ?? (type ? preferredMode(type) : "dynamic"));
  const [slug] = useState(() => code?.slug ?? newSlug());
  const [name, setName] = useState(code?.name ?? "");
  const [content, setContent] = useState<Record<string, unknown>>(code?.content ?? (def ? structuredClone(def.defaults) : {}));
  const [style, setStyle] = useState<QrStyle>(normalizeStyle(code?.style ?? DEFAULT_STYLE));
  const [tab, setTab] = useState<Tab>("content");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const data = useMemo(() => (!type ? "" : mode === "dynamic" ? shortLink(slug) : staticPayload(type, content)), [type, mode, slug, content]);
  const svg = useMemo(() => (data ? renderQrSvg(data, style, { size: 640, id: "studio" }) : ""), [data, style]);

  function pickType(t: CodeTypeId) {
    setType(t);
    setMode(preferredMode(t));
    setContent(structuredClone(CODE_TYPES[t].defaults));
    setErrors({});
    setMessage(null);
    setTab("content");
  }

  function save() {
    if (!type) return;
    setMessage(null);
    const input: SaveInput = { name, type, mode, slug, content, style };
    startTransition(async () => {
      const res = variant === "edit" && code ? await updateCode(code.id, input) : await createCode(input);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        setMessage({ tone: "error", text: res.message });
        if (res.fieldErrors) setTab("content");
        return;
      }
      setErrors({});
      if (variant === "edit") {
        setMessage({ tone: "success", text: "Gespeichert. Gedruckte Codes zeigen sofort den neuen Inhalt." });
        router.refresh();
      } else {
        router.push(`/dashboard/codes/${res.id}?created=1`);
      }
    });
  }

  // ───────── Step 1: choose a type ─────────
  if (!def || !type) {
    return (
      <div className="animate-rise">
        <p className="text-sm text-dim">Schritt 1 von 2</p>
        <h1 className="mt-1 font-display text-5xl leading-[0.95] sm:text-6xl">
          Was soll dein Code <span className="text-brand glow-text">können?</span>
        </h1>
        {GROUPS.map((group, gi) => (
          <section key={group.id} className="mt-12">
            <div className="mb-4 flex items-baseline gap-3">
              <h2 className="font-display text-xl">{group.title}</h2>
              <span className="text-sm text-faint">{group.hint}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {types.filter((t) => CODE_TYPES[t].group === group.id).map((t, i) => {
                const d = CODE_TYPES[t];
                const locked = dynamicLocked && !d.modes.includes("static");
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => pickType(t)}
                    style={{ animationDelay: `${(gi * 3 + i) * 40}ms` }}
                    className="card group flex items-center gap-4 p-4 text-left transition duration-200 animate-rise hover:-translate-y-1 hover:border-brand/50"
                  >
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-elevated text-brand transition group-hover:bg-brand group-hover:text-on-brand group-hover:shadow-[0_0_24px_-4px_rgb(var(--glow)/0.7)]">
                      <TypeIcon name={d.icon} className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 font-bold">
                        {d.label}
                        {locked && <Lock className="size-3.5 text-faint" />}
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-dim">{d.description}</span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 -translate-x-1 text-brand opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    );
  }

  const dynamicBlocked = mode === "dynamic" && dynamicLocked && variant !== "edit";
  const phone = mode === "dynamic" && def.hostedPage
    ? <HostedPage code={{ id: "preview", slug, name: name || def.label, type, mode, status: "active", content }} />
    : undefined;

  // ───────── Step 2: content + design ─────────
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] xl:gap-10">
      <div className="min-w-0 animate-rise">
        {variant !== "edit" && !isPublic && (
          <button type="button" onClick={() => setType(null)} className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-dim hover:text-fg">
            <ArrowLeft className="size-4" /> Typ ändern
          </button>
        )}

        <div className="flex items-start gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand text-on-brand shadow-[0_0_32px_-6px_rgb(var(--glow)/0.7)]">
            <TypeIcon name={def.icon} className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            {isPublic ? (
              <h1 className="font-display text-4xl leading-none sm:text-5xl">QR-Code <span className="text-brand">erstellen</span></h1>
            ) : (
              <label className="group flex items-center gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`${def.label} benennen`}
                  className="w-full bg-transparent font-display text-4xl leading-none text-fg outline-none placeholder:text-faint sm:text-5xl"
                  maxLength={120}
                />
                <PenLine className="size-5 shrink-0 text-faint transition group-hover:text-brand" />
              </label>
            )}
            <p className="mt-2 text-sm text-dim">{def.description}</p>
          </div>
        </div>

        {isPublic && (
          <div className="mt-7 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {types.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => pickType(t)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition",
                  t === type ? "border-brand bg-brand text-on-brand shadow-[0_3px_0_var(--color-brand-shadow)]" : "border-edge bg-surface text-dim hover:border-hi/25 hover:text-fg",
                )}
              >
                <TypeIcon name={CODE_TYPES[t].icon} className="size-4" /> {CODE_TYPES[t].label}
              </button>
            ))}
          </div>
        )}

        {!isPublic && def.modes.length > 1 && variant !== "edit" && (
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <ModeCard active={mode === "dynamic"} onClick={() => setMode("dynamic")} title="Dynamisch" icon={<Sparkles className="size-4" />} text="Inhalt jederzeit ändern, Scans messen. Empfohlen für Druck." locked={dynamicLocked} />
            <ModeCard active={mode === "static"} onClick={() => setMode("static")} title="Statisch" icon={<InfinityIcon className="size-4" />} text="Inhalt steckt im Code. Ohne Statistik, für immer gratis." />
          </div>
        )}

        <div className="mt-8 grid grid-cols-2 gap-1 rounded-2xl border border-edge bg-surface p-1.5 sm:inline-grid sm:w-auto">
          {([["content", "Inhalt", PenLine], ["design", "Design", Palette]] as const).map(([t, label, Icon], i) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn("inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition", tab === t ? "bg-brand text-on-brand shadow-[0_3px_0_var(--color-brand-shadow)]" : "text-dim hover:text-fg")}
            >
              <span className={cn("grid size-5 place-items-center rounded-md text-[11px]", tab === t ? "bg-on-brand/15" : "bg-hi/[0.06]")}>{i + 1}</span>
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>

        <div className="pt-7">
          {tab === "content" ? (
            <div className="animate-rise">
              <div className="card p-5 sm:p-6">
                <ContentForm fields={def.fields} value={content} errors={errors} onChange={setContent} userId={userId} />
              </div>
              <div className="mt-6 flex justify-end">
                <Button type="button" variant="secondary" onClick={() => setTab("design")}>Weiter zum Design <ArrowRight className="size-4" /></Button>
              </div>
            </div>
          ) : (
            <DesignPanel style={style} onChange={setStyle} />
          )}
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Preview
          svg={svg}
          data={data}
          style={style}
          name={name || def.label}
          phone={phone}
          footer={
            <div className="mt-4 border-t border-edge pt-4">
              {message && (
                <p className={cn("mb-3 rounded-xl border px-3 py-2.5 text-sm font-semibold", message.tone === "error" ? "border-rose/30 bg-rose/10 text-rose" : "border-brand/40 bg-brand/10 text-brand")}>
                  {message.text}
                </p>
              )}
              {isPublic ? (
                <div className="text-center">
                  <p className="text-sm text-dim">Inhalt später ändern und Scans messen?</p>
                  <ButtonLink href="/signup" size="lg" className="shine mt-3 w-full">Dynamisch speichern</ButtonLink>
                </div>
              ) : dynamicBlocked ? (
                <div className="text-center">
                  <p className="text-sm text-dim">Alle dynamischen Codes deines Tarifs sind vergeben.</p>
                  <ButtonLink href="/dashboard/billing" size="lg" className="mt-3 w-full">Tarif upgraden</ButtonLink>
                </div>
              ) : (
                <Button type="button" size="lg" className="shine w-full" onClick={save} disabled={pending}>
                  {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                  {variant === "edit" ? "Änderungen speichern" : "Code speichern"}
                </Button>
              )}
              {mode === "dynamic" && (
                <p className="mt-3 text-center text-xs leading-relaxed text-faint">
                  Link im Code: <span className="font-mono text-dim">{data.replace(/^https?:\/\//, "")}</span>
                  <br />Funktioniert für immer, auch ohne Abo.
                </p>
              )}
              {variant === "edit" && code && (
                <p className="mt-3 text-center text-xs">
                  <Link href={`/dashboard/codes/${code.id}`} className="inline-flex items-center gap-1 font-semibold text-dim hover:text-brand"><BarChart3 className="size-3.5" /> Zur Statistik</Link>
                </p>
              )}
            </div>
          }
        />
      </aside>
    </div>
  );
}

function ModeCard({ active, onClick, title, text, icon, locked }: { active: boolean; onClick: () => void; title: string; text: string; icon: React.ReactNode; locked?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("card p-4 text-left transition duration-200", active ? "card-glow" : "hover:border-hi/25")}
    >
      <span className={cn("flex items-center gap-2 font-display text-base", active && "text-brand")}>
        {icon} {title} {locked && <Lock className="size-3.5 text-faint" />}
      </span>
      <span className="mt-1.5 block text-xs leading-relaxed text-dim">{text}</span>
    </button>
  );
}
