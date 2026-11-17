"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Camera, Check, Loader2, Minus, Plus, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { setAvatar } from "@/app/dashboard/settings/actions";
import { cn } from "@/lib/cn";

const VIEW = 280;   // crop circle in px
const OUT = 512;    // saved image size

/** Profile photo with a round crop: drag to move, scroll/pinch or slider to zoom. */
export function AvatarEditor({ userId, url, initial }: { userId: string; url: string | null; initial: string }) {
  const [current, setCurrent] = useState(url);
  const [src, setSrc] = useState<string | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState<"save" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const pinch = useRef<{ d: number; z: number } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());

  const base = img ? Math.max(VIEW / img.naturalWidth, VIEW / img.naturalHeight) : 1;
  const scale = base * zoom;
  const clamp = (p: { x: number; y: number }, z = zoom) => {
    if (!img) return p;
    const s = base * z;
    const mx = Math.max(0, (img.naturalWidth * s - VIEW) / 2);
    const my = Math.max(0, (img.naturalHeight * s - VIEW) / 2);
    return { x: Math.min(mx, Math.max(-mx, p.x)), y: Math.min(my, Math.max(-my, p.y)) };
  };
  const setZoomClamped = (z: number) => { const nz = Math.min(4, Math.max(1, z)); setZoom(nz); setPos((p) => clamp(p, nz)); };

  useEffect(() => {
    if (!src) return;
    const i = new Image();
    i.onload = () => setImg(i);
    i.onerror = () => { setError("Dieses Bild kann der Browser nicht öffnen."); setSrc(null); };
    i.src = src;
    return () => URL.revokeObjectURL(src);
  }, [src]);

  const pick = (f: File | undefined) => {
    setError(null);
    if (!f) return;
    if (!f.type.startsWith("image/")) { setError("Bitte ein Bild wählen (JPG, PNG oder WebP)."); return; }
    if (f.size > 15 * 1024 * 1024) { setError("Das Bild ist größer als 15 MB."); return; }
    setImg(null); setZoom(1); setPos({ x: 0, y: 0 });
    setSrc(URL.createObjectURL(f));
  };
  const close = () => { setSrc(null); setImg(null); };

  const save = async () => {
    if (!img) return;
    setBusy("save"); setError(null);
    try {
      const c = document.createElement("canvas");
      c.width = OUT; c.height = OUT;
      const ctx = c.getContext("2d")!;
      const k = OUT / VIEW;
      const w = img.naturalWidth * scale * k, h = img.naturalHeight * scale * k;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, OUT / 2 - w / 2 + pos.x * k, OUT / 2 - h / 2 + pos.y * k, w, h);
      const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/webp", 0.9));
      if (!blob) throw new Error();
      const supabase = createClient();
      const path = `${userId}/avatar-${Date.now()}.webp`;
      const { error: up } = await supabase.storage.from("assets").upload(path, blob, { contentType: "image/webp", upsert: false });
      if (up) { console.error("avatar upload", up); throw new Error(); }
      const publicUrl = supabase.storage.from("assets").getPublicUrl(path).data.publicUrl;
      const r = await setAvatar(publicUrl);
      if (r.error) throw new Error(r.error);
      setCurrent(publicUrl); setSaved((n) => n + 1); close();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Hochladen hat nicht geklappt. Bitte erneut versuchen.");
    } finally { setBusy(null); }
  };

  const remove = async () => {
    setBusy("remove");
    const r = await setAvatar(null);
    setBusy(null);
    if (r.error) setError(r.error); else setCurrent(null);
  };

  const onDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), z: zoom };
      drag.current = null;
    } else drag.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      setZoomClamped(pinch.current.z * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.current.d));
    } else if (drag.current) {
      setPos(clamp({ x: drag.current.px + e.clientX - drag.current.x, y: drag.current.py + e.clientY - drag.current.y }));
    }
  };
  const onUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    drag.current = null;
  };

  return (
    <div className="flex items-center gap-5">
      <button type="button" onClick={() => input.current?.click()} className="group relative size-20 shrink-0 rounded-[22px]" aria-label="Profilbild ändern">
        <motion.span key={saved} initial={saved ? { scale: 0.85 } : false} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 380, damping: 16 }} className="block size-full overflow-hidden rounded-[22px]">
          {current
            ? // eslint-disable-next-line @next/next/no-img-element -- user photo from storage
              <img src={current} alt="" className="size-full object-cover" />
            : <span className="grid size-full place-items-center bg-lime font-display text-3xl text-night">{initial}</span>}
        </motion.span>
        <span className="absolute inset-0 grid place-items-center rounded-[22px] bg-black/55 text-white opacity-0 transition group-hover:opacity-100"><Camera className="size-5" /></span>
        <span className="absolute -bottom-1.5 -right-1.5 grid size-8 place-items-center rounded-full border-4 border-surface bg-fg text-bg transition group-hover:scale-110"><Camera className="size-3.5" /></span>
      </button>
      <div className="flex flex-col items-start gap-1.5">
        <button type="button" onClick={() => input.current?.click()} className="text-sm font-semibold underline-offset-4 hover:underline">{current ? "Neues Foto wählen" : "Foto hochladen"}</button>
        {current && (
          <button type="button" onClick={remove} disabled={!!busy} className="inline-flex items-center gap-1.5 text-[13px] text-dim hover:text-rose">
            {busy === "remove" ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />} Entfernen
          </button>
        )}
        <span className="text-[12px] text-faint">JPG, PNG oder WebP, bis 15 MB</span>
        {error && !src && <span className="text-[12.5px] text-rose">{error}</span>}
      </div>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />

      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {src && (
            <motion.div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
              <motion.div role="dialog" aria-label="Profilbild zuschneiden" onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }} transition={{ type: "spring", stiffness: 300, damping: 26 }}
                className="w-full max-w-[400px] rounded-[28px] border border-edge-strong bg-elevated p-6 shadow-lift">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold">Foto zuschneiden</p>
                  <button type="button" onClick={close} aria-label="Schließen" className="grid size-9 place-items-center rounded-xl text-dim hover:bg-hi/[0.07] hover:text-fg"><X className="size-4" /></button>
                </div>
                <div className="mx-auto mt-5 select-none" style={{ width: VIEW, height: VIEW }}>
                  <div
                    className="relative size-full cursor-grab touch-none overflow-hidden rounded-[24px] bg-black active:cursor-grabbing"
                    onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
                    onWheel={(e) => setZoomClamped(zoom * (e.deltaY < 0 ? 1.08 : 0.93))}
                  >
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element -- local preview
                      <img src={img.src} alt="" draggable={false} className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
                        style={{ width: img.naturalWidth * scale, height: img.naturalHeight * scale, transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))` }} />
                    ) : <span className="grid size-full place-items-center"><Loader2 className="size-6 animate-spin text-white/70" /></span>}
                    <motion.span aria-hidden initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.12, duration: 0.35 }}
                      className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(circle at center, transparent ${VIEW / 2 - 7}px, rgb(0 0 0 / 0.6) ${VIEW / 2 - 6}px)` }} />
                    <span aria-hidden className="pointer-events-none absolute rounded-full ring-2 ring-white/80" style={{ inset: 6 }} />
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-3">
                  <button type="button" onClick={() => setZoomClamped(zoom - 0.25)} className="grid size-9 place-items-center rounded-xl border border-edge text-dim hover:text-fg" aria-label="Verkleinern"><Minus className="size-4" /></button>
                  <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => setZoomClamped(Number(e.target.value))} aria-label="Zoom" className="h-1.5 flex-1 cursor-pointer accent-lime" />
                  <button type="button" onClick={() => setZoomClamped(zoom + 0.25)} className="grid size-9 place-items-center rounded-xl border border-edge text-dim hover:text-fg" aria-label="Vergrößern"><Plus className="size-4" /></button>
                </div>
                <p className="mt-3 text-center text-[12.5px] text-faint">Ziehen zum Verschieben, scrollen oder zwei Finger zum Zoomen.</p>
                {error && <p className="mt-3 rounded-xl bg-rose/10 px-3 py-2 text-[13px] text-rose">{error}</p>}
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button type="button" onClick={close} className="h-11 rounded-xl border border-edge text-sm font-semibold hover:bg-hi/[0.06]">Abbrechen</button>
                  <button type="button" onClick={save} disabled={!img || !!busy} className={cn("btn-cta inline-flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold disabled:opacity-50")}>
                    {busy === "save" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Übernehmen
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
