"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, ClipboardPaste, Copy, Download, Globe, ImagePlus, LayoutGrid, LayoutList, Link2, Loader2, Plus, Rows3, Sparkles, Trash2, X } from "lucide-react";
import { MENU_BADGES, type MenuItemData, type MenuSectionData } from "@/lib/codes/types";
import { uploadImage } from "@/lib/upload-image";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { MENU_STYLES } from "@/lib/menu-styles";
import { proxiedImage } from "@/lib/image-url";
import { IMPORT_CHANNEL, bookmarkletHref, importCaptured, parseCapturePayload } from "@/lib/menu-capture";

type Errors = Record<string, string>;

export const BADGE_LABEL: Record<(typeof MENU_BADGES)[number], string> = {
  beliebt: "Beliebt",
  neu: "Neu",
  vegan: "Vegan",
  vegetarisch: "Vegetarisch",
  scharf: "Scharf",
  hausgemacht: "Hausgemacht",
};

const emptyItem = (): MenuItemData => ({ name: "", description: "", price: "", tags: "", image: "", variants: [], badges: [], soldOut: false });

function move<T>(list: T[], i: number, d: number): T[] {
  const j = i + d;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

/** Normalises older menus (no images, variants …) into the current shape. */
function normalize(sections: Partial<MenuSectionData>[]): MenuSectionData[] {
  return sections.map((s) => ({
    title: s.title ?? "",
    note: s.note ?? "",
    layout: s.layout ?? "auto",
    items: (s.items ?? []).map((it) => ({ ...emptyItem(), ...it, variants: it.variants ?? [], badges: it.badges ?? [] })),
  }));
}

/** Per-category layout (used by the Showcase templates). */
const SECTION_LAYOUT_LABELS: [NonNullable<MenuSectionData["layout"]>, string][] = [["auto", "Automatisch"], ["list", "Liste mit Foto"], ["grid", "Raster"], ["cards", "Große Karten"], ["compact", "Kompakt"]];

// ───────── Image field (logo, cover, dish photos) ─────────
export function ImageField({ value, onChange, shape = "square", label = "Bild hochladen", className }: { value: string; onChange: (url: string) => void; shape?: "square" | "wide"; label?: string; className?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await uploadImage(file, shape === "wide" ? 1800 : 1000));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload fehlgeschlagen");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className={className}>
      <div
        className={cn(
          "group relative grid place-items-center overflow-hidden rounded-2xl border border-dashed border-edge-strong bg-bg/60 transition hover:border-brand/60",
          shape === "wide" ? "aspect-[16/7]" : "aspect-square",
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={proxiedImage(value, 320)} alt="" referrerPolicy="no-referrer" className="absolute inset-0 size-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1.5 p-2 text-center text-xs font-semibold text-faint">
            <ImagePlus className="size-5" /> {label}
          </span>
        )}
        <button type="button" onClick={() => input.current?.click()} className="absolute inset-0" aria-label={label} disabled={busy} />
        {busy && <span className="absolute inset-0 grid place-items-center bg-bg/70"><Loader2 className="size-5 animate-spin text-brand" /></span>}
        {value && !busy && (
          <button type="button" onClick={() => onChange("")} className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-night/70 text-white opacity-0 transition group-hover:opacity-100" aria-label="Bild entfernen">
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      {error && <p className="mt-1.5 text-xs text-rose">{error}</p>}
    </div>
  );
}

// ───────── Layout picker ─────────
const LAYOUTS = [
  { id: "cards", label: "Karten", hint: "Foto neben Text", icon: Rows3 },
  { id: "grid", label: "Galerie", hint: "Große Fotos, 2 Spalten", icon: LayoutGrid },
  { id: "list", label: "Klassisch", hint: "Liste mit Preislinie", icon: LayoutList },
  { id: "elegant", label: "Elegant", hint: "Zentriert, fein", icon: Sparkles },
] as const;

/** Design presets with a live mini preview of palette + typography. */
export function MenuStylePicker({ value, onChange }: { value: string; onChange: (style: string, layout: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {MENU_STYLES.map((st) => {
        const bg = st.vars?.["--pg-bg"] ?? "var(--color-elevated)";
        const fg = st.vars?.["--pg-fg"] ?? "var(--color-fg)";
        const active = (value || "modern") === st.id;
        return (
          <button key={st.id} type="button" onClick={() => onChange(st.id, st.layout)} aria-pressed={active} className={cn("group overflow-hidden rounded-2xl border text-left transition", active ? "border-brand ring-2 ring-brand/25" : "border-edge hover:-translate-y-0.5 hover:border-hi/25")}>
            <span className="relative block h-20 overflow-hidden" style={{ background: bg, color: fg }}>
              <span className="absolute left-3 top-2.5 text-[28px] leading-none" style={{ fontFamily: st.display, fontWeight: st.id === "cafe" ? 700 : st.id === "street" ? 400 : 600, textTransform: undefined }}>Aa</span>
              <span className="absolute bottom-2.5 left-3 right-3 space-y-1">
                <span className="block h-1.5 w-3/4 rounded-full opacity-25" style={{ background: fg }} />
                <span className="flex items-center gap-1.5"><span className="block h-1.5 w-1/2 rounded-full opacity-15" style={{ background: fg }} /><span className="ml-auto block h-1.5 w-6 rounded-full" style={{ background: st.accent ?? fg }} /></span>
              </span>
              <span className="absolute right-3 top-3 size-4 rounded-full ring-2 ring-white/40" style={{ background: st.accent ?? "var(--color-brand)" }} />
            </span>
            <span className="block px-3 py-2">
              <span className="block text-sm font-bold">{st.label}</span>
              <span className="block truncate text-[11px] text-faint">{st.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function LayoutPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {LAYOUTS.map((l) => (
        <button key={l.id} type="button" onClick={() => onChange(l.id)} className={cn("rounded-2xl border p-3 text-left transition", value === l.id ? "border-brand bg-brand/10" : "border-edge hover:border-hi/25")}>
          <l.icon className={cn("size-5", value === l.id ? "text-brand" : "text-faint")} />
          <span className="mt-2 block text-sm font-bold">{l.label}</span>
          <span className="block text-[11px] text-faint">{l.hint}</span>
        </button>
      ))}
    </div>
  );
}

// ───────── Menu builder ─────────
export function MenuBuilder({ value, onChange, errors, prefix }: { value: Partial<MenuSectionData>[]; onChange: (v: MenuSectionData[]) => void; errors: Errors; prefix: string }) {
  const sections = normalize(value);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const cur = Math.min(active, Math.max(0, sections.length - 1));
  const section = sections[cur];

  const setSection = (i: number, s: MenuSectionData) => onChange(sections.map((x, k) => (k === i ? s : x)));
  const setItems = (items: MenuItemData[]) => setSection(cur, { ...section, items });
  const setItem = (j: number, patch: Partial<MenuItemData>) => setItems(section.items.map((x, k) => (k === j ? { ...x, ...patch } : x)));

  function addSection() {
    onChange([...sections, { title: "", note: "", layout: "auto", items: [emptyItem()] }]);
    setActive(sections.length);
    setOpen(0);
  }

  const sectionHasError = (i: number) => Object.keys(errors).some((k) => k.startsWith(`${prefix}.${i}.`));

  return (
    <div className="overflow-hidden rounded-2xl border border-edge bg-bg/40">
      {/* Category tabs, like the guest will see them */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-edge bg-surface p-2 [scrollbar-width:thin]">
        {sections.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => { setActive(i); setOpen(null); }}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold transition",
              i === cur ? "bg-brand text-on-brand shadow-[0_3px_0_var(--color-brand-shadow)]" : "text-dim hover:bg-hi/5 hover:text-fg",
              sectionHasError(i) && i !== cur && "text-rose",
            )}
          >
            {s.title || "Neue Kategorie"}
            <span className={cn("rounded-md px-1.5 text-[10px]", i === cur ? "bg-on-brand/20" : "bg-hi/10")}>{s.items.length}</span>
          </button>
        ))}
        <button type="button" onClick={addSection} className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-dashed border-edge-strong px-3 py-2 text-sm font-bold text-dim hover:border-brand hover:text-brand">
          <Plus className="size-4" /> Kategorie
        </button>
      </div>

      {section && (
        <div className="p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={section.title}
              placeholder="Kategorie, z. B. Döner, Pizza, Schnitzel"
              aria-invalid={!!errors[`${prefix}.${cur}.title`]}
              className="min-w-0 flex-1 font-display text-base"
              onChange={(e) => setSection(cur, { ...section, title: e.target.value })}
            />
            <div className="flex items-center gap-1">
              <IconBtn label="Kategorie nach links" onClick={() => { onChange(move(sections, cur, -1)); setActive(Math.max(0, cur - 1)); }}><ArrowUp className="size-4 -rotate-90" /></IconBtn>
              <IconBtn label="Kategorie nach rechts" onClick={() => { onChange(move(sections, cur, 1)); setActive(Math.min(sections.length - 1, cur + 1)); }}><ArrowDown className="size-4 -rotate-90" /></IconBtn>
              <IconBtn label="Kategorie löschen" danger disabled={sections.length < 2} onClick={() => { onChange(sections.filter((_, k) => k !== cur)); setActive(Math.max(0, cur - 1)); }}><Trash2 className="size-4" /></IconBtn>
            </div>
          </div>
          <Input className="mt-2" value={section.note} placeholder="Hinweis zur Kategorie (optional), z. B. Alle Pizzen auch glutenfrei" onChange={(e) => setSection(cur, { ...section, note: e.target.value })} />
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[12px] font-semibold text-dim">Darstellung</span>
            {SECTION_LAYOUT_LABELS.map(([id, label]) => (
              <button key={id} type="button" onClick={() => setSection(cur, { ...section, layout: id })} aria-pressed={(section.layout ?? "auto") === id} className={cn("rounded-full border px-3 py-1 text-[12.5px] font-medium transition", (section.layout ?? "auto") === id ? "border-brand bg-brand text-on-brand" : "border-edge text-dim hover:text-fg")}>{label}</button>
            ))}
          </div>

          <ul className="mt-4 space-y-2.5">
            {section.items.map((item, j) => {
              const err = errors[`${prefix}.${cur}.items.${j}.name`];
              const expanded = open === j;
              return (
                <li key={j} className={cn("rounded-2xl border bg-surface transition", expanded ? "border-brand/50" : "border-edge", item.soldOut && "opacity-60")}>
                  <div className="flex items-start gap-3 p-3">
                    <ImageField value={item.image} onChange={(url) => setItem(j, { image: url })} label="Foto" className="w-[72px] shrink-0" />
                    <div className="grid min-w-0 flex-1 grid-cols-[1fr_92px] gap-2">
                      <Input value={item.name} placeholder="Gericht" aria-invalid={!!err} onChange={(e) => setItem(j, { name: e.target.value })} />
                      <Input value={item.price} placeholder="9,90" inputMode="decimal" onChange={(e) => setItem(j, { price: e.target.value })} disabled={item.variants.length > 0} title={item.variants.length ? "Preise stehen bei den Größen" : undefined} />
                      <Input className="col-span-2" value={item.description} placeholder="Beschreibung, Zutaten" onChange={(e) => setItem(j, { description: e.target.value })} />
                      {err && <p className="col-span-2 text-xs text-rose">{err}</p>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <IconBtn label="Mehr Optionen" onClick={() => setOpen(expanded ? null : j)}><ChevronDown className={cn("size-4 transition", expanded && "rotate-180")} /></IconBtn>
                      <IconBtn label="Löschen" danger onClick={() => setItems(section.items.filter((_, k) => k !== j))}><Trash2 className="size-4" /></IconBtn>
                    </div>
                  </div>

                  {!expanded && (item.badges.length > 0 || item.variants.length > 0 || item.tags) && (
                    <div className="flex flex-wrap gap-1 px-3 pb-3 pl-[96px] text-[11px] text-faint">
                      {item.badges.map((b) => <span key={b} className="rounded-md bg-brand/10 px-1.5 py-0.5 font-semibold text-brand">{BADGE_LABEL[b]}</span>)}
                      {item.variants.length > 0 && <span className="rounded-md bg-hi/5 px-1.5 py-0.5">{item.variants.length} Größen</span>}
                      {item.tags && <span className="rounded-md bg-hi/5 px-1.5 py-0.5">Allergene: {item.tags}</span>}
                    </div>
                  )}

                  {expanded && (
                    <div className="space-y-4 border-t border-edge p-3 sm:pl-[96px]">
                      <div>
                        <p className="mb-1.5 text-[11px] font-bold text-faint">Kennzeichen</p>
                        <div className="flex flex-wrap gap-1.5">
                          {MENU_BADGES.map((b) => {
                            const on = item.badges.includes(b);
                            return (
                              <button key={b} type="button" onClick={() => setItem(j, { badges: on ? item.badges.filter((x) => x !== b) : [...item.badges, b] })} className={cn("rounded-lg border px-2.5 py-1 text-xs font-semibold transition", on ? "border-brand bg-brand text-on-brand" : "border-edge text-dim hover:text-fg")}>
                                {BADGE_LABEL[b]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <p className="mb-1.5 text-[11px] font-bold text-faint">Größen & Preise (optional)</p>
                        <div className="space-y-1.5">
                          {item.variants.map((v, k) => (
                            <div key={k} className="grid grid-cols-[1fr_92px_auto] gap-1.5">
                              <Input value={v.label} placeholder="z. B. Ø 32 cm, 0,5 l, Teller" onChange={(e) => setItem(j, { variants: item.variants.map((x, m) => (m === k ? { ...x, label: e.target.value } : x)) })} />
                              <Input value={v.price} placeholder="11,90" inputMode="decimal" onChange={(e) => setItem(j, { variants: item.variants.map((x, m) => (m === k ? { ...x, price: e.target.value } : x)) })} />
                              <IconBtn label="Größe entfernen" danger onClick={() => setItem(j, { variants: item.variants.filter((_, m) => m !== k) })}><X className="size-4" /></IconBtn>
                            </div>
                          ))}
                          <button type="button" onClick={() => setItem(j, { variants: [...item.variants, { label: "", price: "" }] })} className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline">
                            <Plus className="size-3.5" /> Größe hinzufügen
                          </button>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                        <label className="block">
                          <span className="mb-1.5 block text-[11px] font-bold text-faint">Allergene & Zusatzstoffe</span>
                          <Input value={item.tags} placeholder="z. B. A, C, G, 3" onChange={(e) => setItem(j, { tags: e.target.value })} />
                        </label>
                        <label className="flex h-12 items-center gap-2 rounded-xl border border-edge px-3 text-sm font-semibold">
                          <input type="checkbox" className="size-4 accent-brand" checked={item.soldOut} onChange={(e) => setItem(j, { soldOut: e.target.checked })} />
                          Heute ausverkauft
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <Button type="button" variant="ghost" size="sm" onClick={() => { setItems(move(section.items, j, -1)); setOpen(Math.max(0, j - 1)); }}><ArrowUp className="size-4" /> Hoch</Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => { setItems(move(section.items, j, 1)); setOpen(Math.min(section.items.length - 1, j + 1)); }}><ArrowDown className="size-4" /> Runter</Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => { const c = section.items; setItems([...c.slice(0, j + 1), { ...c[j] }, ...c.slice(j + 1)]); setOpen(j + 1); }}><Copy className="size-4" /> Duplizieren</Button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={() => { setItems([...section.items, emptyItem()]); setOpen(section.items.length); }}>
            <Plus className="size-4" /> Gericht hinzufügen
          </Button>
        </div>
      )}
    </div>
  );
}

function IconBtn({ children, label, onClick, danger, disabled }: { children: React.ReactNode; label: string; onClick: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled} className={cn("grid size-8 place-items-center rounded-lg text-faint transition hover:bg-hi/5 disabled:opacity-30", danger ? "hover:text-rose" : "hover:text-fg")}>
      {children}
    </button>
  );
}

// ───────── Import from Lieferando, websites or pasted text ─────────
export interface ImportedMenuData {
  name?: string;
  logo?: string;
  cover?: string;
  phone?: string;
  address?: string;
  sections: MenuSectionData[];
  source: string;
}

export function MenuImport({ onImport }: { onImport: (menu: ImportedMenuData, mode: "replace" | "append") => void }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"url" | "browser" | "paste">("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [pasted, setPasted] = useState<{ html: string; url: string; photos: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportedMenuData | null>(null);
  const [app, setApp] = useState("");
  const bm = useRef<HTMLAnchorElement>(null);

  // Results captured by the browser helper arrive from the /import tab.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- origin is only known in the browser
    setApp(window.location.origin);
    let ch: BroadcastChannel | null = null;
    try {
      ch = new BroadcastChannel(IMPORT_CHANNEL);
      ch.onmessage = (e) => {
        if (e.data?.type === "menu" && e.data.menu?.sections) {
          setResult(e.data.menu);
          setError(null);
          setOpen(true);
          ch?.postMessage("received");
        }
      };
    } catch {
      /* no BroadcastChannel: fall back to the focus check below */
    }
    const pick = () => {
      try {
        const raw = localStorage.getItem(IMPORT_CHANNEL);
        if (!raw) return;
        const { at, menu } = JSON.parse(raw);
        localStorage.removeItem(IMPORT_CHANNEL);
        if (Date.now() - at < 30 * 60 * 1000 && menu?.sections) {
          setResult(menu);
          setOpen(true);
        }
      } catch {
        /* ignore */
      }
    };
    pick();
    window.addEventListener("focus", pick);
    return () => {
      ch?.close();
      window.removeEventListener("focus", pick);
    };
  }, []);

  // React blocks javascript: URLs in props, so the bookmarklet href is set directly.
  useEffect(() => {
    if (bm.current && app) bm.current.setAttribute("href", bookmarkletHref(app));
  }, [app, tab, open]);

  async function post(body: Record<string, string>) {
    return fetch("/api/menu-import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
      .then((r) => r.json())
      .catch(() => ({ ok: false, message: "Verbindung fehlgeschlagen." }));
  }

  async function run() {
    setBusy(true);
    setError(null);
    setResult(null);
    const res = tab === "url"
      ? await post({ url })
      : pasted
        ? await importCaptured({ html: pasted.html, url: pasted.url || url })
        : await post({ text });
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      if (res.blocked) setTab("browser");
      return;
    }
    setResult(res.menu);
  }

  function onPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const plain = e.clipboardData.getData("text/plain");
    const captured = parseCapturePayload(plain);
    const html = captured?.html ?? e.clipboardData.getData("text/html");
    if (!html) return; // plain text: let the textarea take it
    e.preventDefault();
    const photos = (html.match(/<img\b/gi) ?? []).length;
    setPasted({ html, url: captured?.url ?? "", photos });
    setText(plain.startsWith("QLICK-MENU:") ? "" : plain.slice(0, 4000));
  }

  const count = result?.sections.reduce((n, s) => n + s.items.length, 0) ?? 0;
  const photos = result?.sections.flatMap((s) => s.items.map((i) => i.image)).filter(Boolean) ?? [];

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="card group mb-4 flex w-full items-center gap-4 p-4 text-left transition hover:border-edge-strong">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-lime text-night"><Download className="size-5" /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">Speisekarte importieren</span>
          <span className="block text-sm text-dim">Von Lieferando, Wolt, Uber Eats oder deiner Website. Gerichte, Preise, Fotos und Allergene kommen automatisch.</span>
        </span>
        <ChevronDown className="size-4 -rotate-90 text-faint transition group-hover:translate-x-0.5" />
      </button>
    );
  }

  const tabs = [
    { id: "url", label: "Aus Link", icon: Link2 },
    { id: "browser", label: "Aus dem Browser", icon: Globe },
    { id: "paste", label: "Einfügen", icon: ClipboardPaste },
  ] as const;

  return (
    <div className="card mb-4 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-lg">Speisekarte importieren</p>
        <button type="button" onClick={() => setOpen(false)} aria-label="Schließen" className="grid size-8 place-items-center rounded-full text-faint hover:bg-hi/5 hover:text-fg"><X className="size-4" /></button>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1 rounded-2xl border border-edge bg-hi/5 p-1 text-[13px] font-semibold sm:inline-grid sm:rounded-full">
        {tabs.map((t) => (
          <button key={t.id} type="button" onClick={() => { setTab(t.id); setError(null); }} className={cn("inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 transition sm:rounded-full sm:px-4", tab === t.id ? "bg-brand text-on-brand" : "text-dim hover:text-fg")}>
            <t.icon className="size-3.5 shrink-0" /> <span className="truncate">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === "url" && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.lieferando.de/speisekarte/dein-restaurant" className="flex-1" onKeyDown={(e) => e.key === "Enter" && url && run()} />
          <Button type="button" onClick={run} disabled={busy || !url.trim()}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Importieren</Button>
        </div>
      )}

      {tab === "browser" && (
        <div className="mt-4">
          <p className="text-sm text-dim">Funktioniert mit <b className="text-fg">jeder Seite</b>, auch wenn sie automatische Abrufe blockiert: Dein Browser liest die Karte so, wie du sie siehst, mit allen Fotos.</p>
          <ol className="mt-4 space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-on-brand">1</span>
              <span className="min-w-0 flex-1">
                Ziehe diesen Button einmalig in deine Lesezeichenleiste
                <span className="mt-2 flex flex-wrap items-center gap-2">
                  <a
                    ref={bm}
                    href="#"
                    onClick={(e) => { e.preventDefault(); setError("Nicht klicken, sondern in die Lesezeichenleiste ziehen. Am Handy: Lesezeichen anlegen und die Adresse durch den kopierten Code ersetzen."); }}
                    draggable
                    className="inline-flex cursor-grab items-center gap-2 rounded-full bg-lime px-4 py-2 font-bold text-night shadow-[0_6px_18px_-8px_#bdfb04] active:cursor-grabbing"
                  >
                    <Sparkles className="size-4" /> Speisekarte holen
                  </a>
                  <button type="button" onClick={() => app && navigator.clipboard.writeText(bookmarkletHref(app)).then(() => setError("Code kopiert. Neues Lesezeichen anlegen und als Adresse einfügen."))} className="inline-flex items-center gap-1.5 text-xs font-semibold text-dim underline-offset-4 hover:text-fg hover:underline">
                    <Copy className="size-3.5" /> Code kopieren
                  </button>
                </span>
                <span className="mt-1.5 block text-xs text-faint">Lesezeichenleiste nicht sichtbar? Strg+Umschalt+B (Mac: ⌘+Umschalt+B).</span>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-on-brand">2</span>
              <span>Öffne die Speisekarte des Restaurants (Lieferando, Wolt, Website …) in einem neuen Tab.</span>
            </li>
            <li className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-on-brand">3</span>
              <span>Klicke dort auf das Lesezeichen „Speisekarte holen“ und dann auf <b className="text-fg">An Qlick senden</b>. Die Karte erscheint automatisch hier.</span>
            </li>
          </ol>
        </div>
      )}

      {tab === "paste" && (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-dim">Auf der Seite des Restaurants <b className="text-fg">Strg+A</b> und <b className="text-fg">Strg+C</b> drücken, dann hier mit <b className="text-fg">Strg+V</b> einfügen. Fotos werden mit übernommen.</p>
          {pasted ? (
            <div className="flex items-center gap-3 rounded-2xl border border-edge-strong bg-hi/5 p-3 text-sm">
              <ImagePlus className="size-5 shrink-0 text-mint" />
              <span className="min-w-0 flex-1">Seite eingefügt · {pasted.photos} Bilder erkannt{pasted.url ? ` · ${new URL(pasted.url).hostname}` : ""}</span>
              <button type="button" onClick={() => { setPasted(null); setText(""); }} className="text-xs font-semibold text-dim hover:text-fg">Leeren</button>
            </div>
          ) : (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onPaste={onPaste}
              rows={6}
              placeholder={"Hier einfügen (Strg+V) …\n\nOder Text eintippen, zum Beispiel:\nPizza\nMargherita (A, G) ...... 8,90 €"}
              className="w-full rounded-2xl border border-edge bg-bg/60 p-3 text-sm outline-none focus:border-brand"
            />
          )}
          {pasted && !pasted.url && (
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Link der Seite (optional, hilft bei Fotos)" />
          )}
          <Button type="button" onClick={run} disabled={busy || (!pasted && !text.trim())}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Gerichte erkennen</Button>
        </div>
      )}

      {busy && <p className="mt-3 text-sm text-dim">Lese die Karte … das kann bis zu einer Minute dauern.</p>}
      {error && <p className={cn("mt-3 rounded-xl border px-3 py-2 text-sm", tab === "browser" ? "border-edge bg-hi/5 text-fg" : "border-rose/30 bg-rose/10 text-rose")}>{error}</p>}
      {result && (
        <div className="mt-4 rounded-2xl border border-edge-strong bg-hi/5 p-4 animate-rise">
          <p className="font-semibold">{count} Gerichte in {result.sections.length} Kategorien gefunden{result.name ? ` · ${result.name}` : ""}</p>
          <p className="mt-1 text-sm text-dim">{photos.length ? `${photos.length} mit Foto · ` : "Keine Fotos gefunden · "}{result.sections.slice(0, 8).map((s) => `${s.title} (${s.items.length})`).join(" · ")}{result.sections.length > 8 ? " …" : ""}</p>
          {photos.length > 0 && (
            <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
              {photos.slice(0, 12).map((src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src} src={proxiedImage(src, 160)} alt="" loading="lazy" referrerPolicy="no-referrer" className="size-14 shrink-0 rounded-xl border border-edge object-cover" />
              ))}
              {photos.length > 12 && <span className="grid size-14 shrink-0 place-items-center rounded-xl border border-edge text-xs font-bold text-dim">+{photos.length - 12}</span>}
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" onClick={() => { onImport(result, "replace"); setOpen(false); setResult(null); }}>Karte ersetzen</Button>
            <Button type="button" variant="secondary" onClick={() => { onImport(result, "append"); setOpen(false); setResult(null); }}>Anhängen</Button>
          </div>
          <p className="mt-3 text-xs text-faint">Bitte Preise und Allergene nach dem Import kurz prüfen. Fotos von Plattformen besser durch eigene ersetzen.</p>
        </div>
      )}
    </div>
  );
}
