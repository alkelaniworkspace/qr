"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, Loader2, ScanLine, XCircle } from "lucide-react";
import { checkScannability } from "@/lib/qr/scannability";
import { decodeSvgInBrowser } from "@/lib/qr/decode";
import { downloadPng, downloadSvg } from "@/lib/qr/export";
import type { QrStyle } from "@/lib/qr/style";
import { cn } from "@/lib/cn";

type DecodeState = "checking" | "ok" | "fail";

export function Preview({ svg, data, style, name, footer }: { svg: string; data: string; style: QrStyle; name: string; footer?: React.ReactNode }) {
  const check = useMemo(() => checkScannability(style), [style]);
  const [decode, setDecode] = useState<{ svg: string; state: DecodeState }>({ svg: "", state: "checking" });
  const [pngSize, setPngSize] = useState(2048);

  // Real decode test, debounced so dragging a slider stays smooth.
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      const ok = await decodeSvgInBrowser(svg, data).catch(() => false);
      if (!cancelled) setDecode({ svg, state: ok ? "ok" : "fail" });
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [svg, data]);

  const decodeState: DecodeState = decode.svg === svg ? decode.state : "checking";
  const tone =
    decodeState === "fail" || check.level === "bad" ? "danger" : check.level === "risky" ? "warn" : "success";

  return (
    <div className="rounded-[28px] border border-line bg-white p-5 shadow-lift">
      <div className={cn("relative grid aspect-square place-items-center overflow-hidden rounded-2xl p-6", style.transparent ? "checker" : "bg-sand/60")}>
        <div className="w-full max-w-[340px] transition-all duration-300 [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
      </div>

      <div className="mt-4 rounded-2xl border border-line p-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "grid size-9 place-items-center rounded-full",
                tone === "success" && "bg-success/10 text-success",
                tone === "warn" && "bg-warn/10 text-warn",
                tone === "danger" && "bg-danger/10 text-danger",
              )}
            >
              <ScanLine className="size-[18px]" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-medium">Lesbarkeit {check.score}/100</p>
              <p className="flex items-center gap-1 text-xs text-muted">
                {decodeState === "checking" && (<><Loader2 className="size-3 animate-spin" /> Wird getestet …</>)}
                {decodeState === "ok" && (<><CheckCircle2 className="size-3 text-success" /> Mit echtem Scanner getestet</>)}
                {decodeState === "fail" && (<><XCircle className="size-3 text-danger" /> Scanner-Test fehlgeschlagen</>)}
              </p>
            </div>
          </div>
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-sand">
            <div
              className={cn("h-full rounded-full transition-all", tone === "success" ? "bg-success" : tone === "warn" ? "bg-warn" : "bg-danger")}
              style={{ width: `${decodeState === "fail" ? Math.min(check.score, 30) : check.score}%` }}
            />
          </div>
        </div>
        {(check.issues.length > 0 || decodeState === "fail") && (
          <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
            {decodeState === "fail" && (
              <li className="flex gap-2 text-xs text-danger"><XCircle className="mt-px size-3.5 shrink-0" /> Der Testscan konnte den Code nicht lesen. Kontrast erhöhen oder Logo verkleinern.</li>
            )}
            {check.issues.map((i) => (
              <li key={i.message} className={cn("flex gap-2 text-xs", i.severity === "error" ? "text-danger" : "text-warn")}>
                <AlertTriangle className="mt-px size-3.5 shrink-0" /> {i.message}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
        <button
          type="button"
          onClick={() => downloadPng(svg, name, pngSize)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink text-sm font-medium text-paper transition hover:bg-ink-soft"
        >
          <Download className="size-4" /> PNG herunterladen
        </button>
        <select
          aria-label="PNG-Größe"
          value={pngSize}
          onChange={(e) => setPngSize(Number(e.target.value))}
          className="h-11 rounded-full border border-line bg-white px-3 text-sm"
        >
          <option value={1024}>1024 px</option>
          <option value={2048}>2048 px</option>
          <option value={4096}>4096 px</option>
        </select>
        <button
          type="button"
          onClick={() => downloadSvg(svg, name)}
          className="col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line text-sm font-medium transition hover:border-ink/30"
        >
          SVG für Druck (Vektor)
        </button>
      </div>
      {footer}
    </div>
  );
}
