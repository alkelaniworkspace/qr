"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ImageIcon, Loader2, TriangleAlert, UtensilsCrossed } from "lucide-react";
import { CAPTURE_VERSION, IMPORT_CHANNEL, importCaptured, type CapturedPage } from "@/lib/menu-capture";
import { Mark } from "@/components/ui/logo";

type Menu = { name?: string; sections: { title: string; items: { image?: string }[] }[] };
type State =
  | { s: "waiting" }
  | { s: "working"; title?: string }
  | { s: "done"; menu: Menu; delivered: boolean }
  | { s: "error"; message: string };

/**
 * Opened by the bookmarklet from a restaurant page. Receives the captured page
 * via postMessage, sends it to the import API and hands the result to the
 * studio tab (BroadcastChannel, plus localStorage for a studio opened later).
 */
export function ImportReceiver() {
  const [state, setState] = useState<State>({ s: "waiting" });
  const got = useRef(false);
  const [outdated, setOutdated] = useState(false);

  useEffect(() => {
    async function handle(page: CapturedPage) {
      if (got.current) return;
      got.current = true;
      setState({ s: "working", title: page.title });
      const res = await importCaptured(page);
      if (!res.ok || !res.menu) {
        setState({ s: "error", message: res.message ?? "Auf dieser Seite wurde keine Speisekarte erkannt." });
        return;
      }
      const menu = res.menu as Menu;
      let delivered = false;
      try {
        localStorage.setItem(IMPORT_CHANNEL, JSON.stringify({ at: Date.now(), menu }));
      } catch {
        /* storage full or blocked: the channel below still works */
      }
      try {
        const ch = new BroadcastChannel(IMPORT_CHANNEL);
        ch.onmessage = (e) => { if (e.data === "received") { delivered = true; setState({ s: "done", menu, delivered: true }); } };
        ch.postMessage({ type: "menu", menu });
        setTimeout(() => ch.close(), 3000);
      } catch {
        /* old browser */
      }
      setState({ s: "done", menu, delivered });
    }

    function onMessage(e: MessageEvent) {
      const d = e.data as Partial<CapturedPage> & { type?: string };
      // Comes from the restaurant's page (any origin): only accept the exact shape.
      if (d && d.type === "qlick-menu") setOutdated(Number((d as { v?: number }).v ?? 0) < CAPTURE_VERSION);
      if (d && d.type === "qlick-menu" && typeof d.html === "string" && typeof d.url === "string" && /^https?:\/\//.test(d.url)) {
        void handle({ html: d.html, url: d.url, title: typeof d.title === "string" ? d.title.slice(0, 200) : undefined });
      }
    }
    window.addEventListener("message", onMessage);
    // Tell the bookmarklet we are ready to receive (retry while the opener is busy).
    let tries = 0;
    const ping = setInterval(() => {
      if (got.current || tries++ > 20 || !window.opener) return clearInterval(ping);
      window.opener.postMessage("qlick-ready", "*");
    }, 300);
    return () => {
      window.removeEventListener("message", onMessage);
      clearInterval(ping);
    };
  }, []);

  const count = state.s === "done" ? state.menu.sections.reduce((n, s) => n + s.items.length, 0) : 0;
  const photos = state.s === "done" ? state.menu.sections.reduce((n, s) => n + s.items.filter((i) => i.image).length, 0) : 0;

  return (
    <div className="card w-full max-w-md p-8 text-center animate-rise">
      <Mark className="mx-auto size-12" />
      {outdated && (
        <p className="mt-5 rounded-xl border border-gold/40 bg-gold/10 px-3 py-2 text-left text-xs text-fg">
          Dein Lesezeichen „Speisekarte holen“ ist veraltet. Lösche es und ziehe den Button im Studio (Speisekarte importieren → Aus dem Browser) neu in die Lesezeichenleiste: die neue Version holt mehr Gerichte und schärfere Fotos.
        </p>
      )}
      {state.s === "waiting" && (
        <>
          <Loader2 className="mx-auto mt-8 size-8 animate-spin text-brand" />
          <h1 className="mt-4 font-display text-2xl">Warte auf die Speisekarte …</h1>
          <p className="mt-2 text-sm text-dim">Diese Seite öffnet sich über den Button „Speisekarte holen“ auf der Seite des Restaurants.</p>
          <Link href="/studio?type=menu" className="mt-6 inline-block text-sm font-semibold underline underline-offset-4">Zum Studio</Link>
        </>
      )}
      {state.s === "working" && (
        <>
          <UtensilsCrossed className="mx-auto mt-8 size-8 animate-pulse text-brand" />
          <h1 className="mt-4 font-display text-2xl">Lese die Karte …</h1>
          <p className="mt-2 text-sm text-dim">{state.title ? `„${state.title}“ · ` : ""}Gerichte, Preise, Allergene und Fotos. Das dauert ein paar Sekunden.</p>
        </>
      )}
      {state.s === "done" && (
        <>
          <CheckCircle2 className="mx-auto mt-8 size-10 text-mint" />
          <h1 className="mt-4 font-display text-2xl">{count} Gerichte übernommen</h1>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-dim"><ImageIcon className="size-4" /> {photos} mit Foto · {state.menu.sections.length} Kategorien</p>
          <p className="mt-5 text-sm text-dim">{state.delivered ? "Die Karte ist im Studio angekommen. Du kannst diesen Tab schließen." : "Wechsle zurück in den Studio-Tab: dort wartet die Karte auf dich."}</p>
          <div className="mt-6 flex justify-center gap-2">
            <button type="button" onClick={() => window.close()} className="rounded-full border border-edge px-4 py-2 text-sm font-semibold hover:bg-hi/5">Tab schließen</button>
            <Link href="/studio?type=menu" className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-on-brand">Studio öffnen</Link>
          </div>
        </>
      )}
      {state.s === "error" && (
        <>
          <TriangleAlert className="mx-auto mt-8 size-9 text-rose" />
          <h1 className="mt-4 font-display text-2xl">Das hat nicht geklappt</h1>
          <p className="mt-2 text-sm text-dim">{state.message}</p>
        </>
      )}
    </div>
  );
}
