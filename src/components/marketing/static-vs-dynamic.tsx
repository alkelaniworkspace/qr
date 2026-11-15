"use client";

import { useT } from "@/components/i18n/lang-provider";
import { useEffect, useMemo, useState } from "react";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Lock, RefreshCw } from "lucide-react";
import { renderQrSvg } from "@/lib/qr/render";
import { DEFAULT_STYLE, type QrStyle } from "@/lib/qr/style";

const TARGETS = ["dili-grill.de/karte", "dili-grill.de/mittag", "instagram.com/diligrill", "dili-grill.de/aktion"];
const STYLE: QrStyle = { ...DEFAULT_STYLE, dots: "rounded", fill: { type: "solid", color: "#191919" }, background: "#ffffff", eyeBallColor: null, eyeColor: null };

/** Same edit, two kinds of code: the static one changes its pattern, the dynamic one never does. */
export function StaticVsDynamic() {
  const T = useT();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const t = setInterval(() => setI((n) => (n + 1) % TARGETS.length), 1800);
    return () => clearInterval(t);
  }, [inView]);
  const target = TARGETS[i];
  const staticSvg = useMemo(() => renderQrSvg(`https://${target}`, STYLE, { size: 260, id: `s${i}` }), [target, i]);
  const dynamicSvg = useMemo(() => renderQrSvg("https://qlick.codes/r/dili", STYLE, { size: 260, id: "dyn" }), []);

  return (
    <div ref={ref} className="grid gap-4 md:grid-cols-2">
      <Card title={T("Statisch", "Static")} note={T("Inhalt steckt im Muster", "Content is baked into the pattern")} svg={staticSvg} changes i={i} target={target} />
      <div className="relative">
        <span className="badge absolute -top-3 left-1/2 z-10 -translate-x-1/2 bg-lime text-night">{T("Qlick dynamisch", "Qlick dynamic")}</span>
        <Card title={T("Dynamisch", "Dynamic")} note={T("Muster zeigt auf deinen festen Link", "Pattern points to your fixed link")} svg={dynamicSvg} changes={false} i={i} target={target} />
      </div>
    </div>
  );
}

function Card({ title, note, svg, changes, i, target }: { title: string; note: string; svg: string; changes: boolean; i: number; target: string }) {
  const T = useT();
  return (
    <div className="card flex flex-col items-center p-6 text-center">
      <p className="font-display text-2xl">{title}</p>
      <p className="mt-1 text-sm text-dim">{note}</p>
      <div className="relative mt-6 w-full max-w-[220px] rounded-3xl bg-white p-3">
        <motion.div key={changes ? i : "fixed"} initial={changes ? { opacity: 0.2, scale: 0.92 } : false} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45 }} className="[&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
        {changes && <motion.span key={`f${i}`} className="pointer-events-none absolute inset-0 rounded-3xl bg-rose/30" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.6 }} />}
      </div>
      <div className="mt-5 flex items-center gap-2 rounded-full border border-edge px-3.5 py-1.5 font-mono text-xs">
        <motion.span key={target} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>→ {target}</motion.span>
      </div>
      <p className={`mt-4 flex items-center gap-1.5 text-sm font-semibold ${changes ? "text-rose" : "text-mint"}`}>
        {changes ? <><RefreshCw className="size-4" /> {T("Neuer Code. Alter Druck veraltet.", "New code. Old print outdated.")}</> : <><Lock className="size-4" /> {T("Code bleibt. Druck bleibt gültig.", "Code stays. Print stays valid.")}</>}
      </p>
    </div>
  )
}
