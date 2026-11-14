"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Infinity as InfinityIcon, Loader2, Lock, Pencil, Sparkles } from "lucide-react";
import { CODE_TYPES, TYPE_ORDER, type CodeMode, type CodeTypeId } from "@/lib/codes/types";
import { staticPayload } from "@/lib/codes/payload";
import { shortLink } from "@/lib/env";
import { newSlug } from "@/lib/codes/slug";
import { renderQrSvg } from "@/lib/qr/render";
import { DEFAULT_STYLE, normalizeStyle, type QrStyle } from "@/lib/qr/style";
import { ContentForm } from "./content-form";
import { DesignPanel } from "./design-panel";
import { Preview } from "./preview";
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

  const data = useMemo(
    () => (!type ? "" : mode === "dynamic" ? shortLink(slug) : staticPayload(type, content)),
    [type, mode, slug, content],
  );
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
        <h1 className="font-display text-4xl sm:text-5xl">Was soll dein Code können?</h1>
        <p className="mt-2 text-muted">Wähle einen Typ. Alles Weitere gestaltest du im nächsten Schritt.</p>
        {(["page", "link", "direct"] as const).map((group) => (
          <section key={group} className="mt-10">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-muted">
              {group === "page" ? "Mit eigener Seite" : group === "link" ? "Weiterleitung" : "Direkt im Code"}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {types.filter((t) => CODE_TYPES[t].group === group).map((t) => {
                const d = CODE_TYPES[t];
                const locked = dynamicLocked && !d.modes.includes("static");
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => pickType(t)}
                    className="group flex items-start gap-4 rounded-2xl border border-line bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-ink/25 hover:shadow-soft"
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sand text-ink transition group-hover:bg-ink group-hover:text-paper">
                      <TypeIcon name={d.icon} />
                    </span>
                    <span>
                      <span className="flex items-center gap-2 font-medium">
                        {d.label}
                        {locked && <Lock className="size-3.5 text-muted" />}
                      </span>
                      <span className="mt-0.5 block text-sm text-muted">{d.description}</span>
                    </span>
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

  // ───────── Step 2: content + design ─────────
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] xl:gap-12">
      <div className="min-w-0">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {variant !== "edit" && !isPublic && (
            <button type="button" onClick={() => setType(null)} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
              <ArrowLeft className="size-4" /> Typ ändern
            </button>
          )}
        </div>

        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-ink text-paper">
            <TypeIcon name={def.icon} className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            {isPublic ? (
              <h1 className="font-display text-4xl">QR-Code erstellen</h1>
            ) : (
              <label className="group flex items-center gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`${def.label} – Name für dich`}
                  className="w-full bg-transparent font-display text-3xl outline-none placeholder:text-muted/50 sm:text-4xl"
                  maxLength={120}
                />
                <Pencil className="size-4 shrink-0 text-muted opacity-0 transition group-hover:opacity-100" />
              </label>
            )}
            <p className="mt-1 text-sm text-muted">{def.description}</p>
          </div>
        </div>

        {isPublic && (
          <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
            {types.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => pickType(t)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition",
                  t === type ? "border-ink bg-ink text-paper" : "border-line bg-white hover:border-ink/30",
                )}
              >
                <TypeIcon name={CODE_TYPES[t].icon} className="size-4" /> {CODE_TYPES[t].label}
              </button>
            ))}
          </div>
        )}

        {!isPublic && def.modes.length > 1 && variant !== "edit" && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <ModeCard
              active={mode === "dynamic"}
              onClick={() => setMode("dynamic")}
              title="Dynamisch"
              icon={<Sparkles className="size-4" />}
              text="Inhalt jederzeit ändern, Scans messen. Empfohlen für Druck."
              locked={dynamicLocked}
            />
            <ModeCard
              active={mode === "static"}
              onClick={() => setMode("static")}
              title="Statisch"
              icon={<InfinityIcon className="size-4" />}
              text="Inhalt steckt direkt im Code. Ohne Statistik, unbegrenzt kostenlos."
            />
          </div>
        )}

        <div className="mt-8 flex gap-1 border-b border-line">
          {(["content", "design"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn("relative px-4 pb-3 text-sm font-medium transition", tab === t ? "text-ink" : "text-muted hover:text-ink")}
            >
              {t === "content" ? "1  Inhalt" : "2  Design"}
              {tab === t && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-ink" />}
            </button>
          ))}
        </div>

        <div className="pt-7">
          {tab === "content" ? (
            <>
              <ContentForm fields={def.fields} value={content} errors={errors} onChange={setContent} userId={userId} />
              <div className="mt-8 flex justify-end">
                <Button type="button" variant="secondary" onClick={() => setTab("design")}>Weiter zum Design</Button>
              </div>
            </>
          ) : (
            <DesignPanel style={style} onChange={setStyle} />
          )}
        </div>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <Preview
          svg={svg}
          data={data}
          style={style}
          name={name || def.label}
          footer={
            <div className="mt-4 border-t border-line pt-4">
              {message && (
                <p className={cn("mb-3 rounded-xl px-3 py-2 text-sm", message.tone === "error" ? "bg-danger/10 text-danger" : "bg-success/10 text-success")}>
                  {message.text}
                </p>
              )}
              {isPublic ? (
                <div className="text-center">
                  <p className="text-sm text-muted">Inhalt später ändern und Scans messen?</p>
                  <ButtonLink href="/signup" variant="gold" className="mt-3 w-full">Kostenlos dynamisch speichern</ButtonLink>
                </div>
              ) : dynamicBlocked ? (
                <div className="text-center">
                  <p className="text-sm text-muted">Alle dynamischen Codes deines Tarifs sind vergeben.</p>
                  <ButtonLink href="/dashboard/billing" variant="gold" className="mt-3 w-full">Tarif upgraden</ButtonLink>
                </div>
              ) : (
                <Button type="button" variant="gold" size="lg" className="w-full" onClick={save} disabled={pending}>
                  {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                  {variant === "edit" ? "Änderungen speichern" : "Code speichern"}
                </Button>
              )}
              {mode === "dynamic" && (
                <p className="mt-3 text-center text-xs text-muted">
                  Link im Code: <span className="font-mono text-ink-soft">{data.replace(/^https?:\/\//, "")}</span>
                  <br />Dieser Code funktioniert für immer, auch ohne Abo.
                </p>
              )}
              {variant === "edit" && code && (
                <p className="mt-2 text-center text-xs"><Link href={`/dashboard/codes/${code.id}`} className="text-muted underline-offset-4 hover:underline">Zur Statistik</Link></p>
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
      className={cn("rounded-2xl border bg-white p-4 text-left transition", active ? "border-ink ring-2 ring-ink/10" : "border-line hover:border-ink/30")}
    >
      <span className="flex items-center gap-2 text-sm font-medium">
        {icon} {title} {locked && <Lock className="size-3.5 text-muted" />}
      </span>
      <span className="mt-1 block text-xs leading-relaxed text-muted">{text}</span>
    </button>
  );
}
