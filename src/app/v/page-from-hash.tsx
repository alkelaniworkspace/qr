"use client";

import { useEffect, useState } from "react";
import { decodePage, type PagePayload } from "@/lib/codes/page-link";
import { resolveRedirect } from "@/lib/codes/resolve";
import { buildVCard } from "@/lib/codes/vcard";
import { buildIcs } from "@/lib/codes/ics";
import { getType } from "@/lib/codes/types";
import { HostedPage, type PageLinks } from "@/components/pages/hosted-pages";
import { Mark } from "@/components/ui/logo";

/** Renders a page whose content travels inside the QR code (URL fragment). */
export function PageFromHash() {
  const [state, setState] = useState<{ payload: PagePayload | null; links: PageLinks; ready: boolean }>({ payload: null, links: {}, ready: false });

  useEffect(() => {
    const payload = decodePage(window.location.hash.slice(1));
    if (payload && getType(payload.t)) {
      const target = resolveRedirect(payload.t, payload.c, navigator.userAgent);
      if (target && !getType(payload.t)?.hostedPage) {
        window.location.replace(target);
        return;
      }
      const links: PageLinks = {};
      if (payload.t === "vcard") links.vcard = URL.createObjectURL(new Blob([buildVCard(payload.c)], { type: "text/vcard" }));
      if (payload.t === "event") links.ics = URL.createObjectURL(new Blob([buildIcs(payload.c, `${Date.now()}@scanwerk`)], { type: "text/calendar" }));
      document.title = String(payload.c.name ?? payload.c.title ?? payload.c.business ?? payload.n ?? "Seite");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the fragment is only readable in the browser
      setState({ payload, links, ready: true });
    } else setState({ payload: null, links: {}, ready: true });
  }, []);

  if (!state.ready) return <div className="min-h-screen bg-bg" />;
  if (!state.payload) {
    return (
      <main className="ambient grid min-h-screen place-items-center px-6 text-center">
        <div>
          <Mark className="mx-auto size-14" />
          <h1 className="mt-6 font-display text-3xl uppercase">Code unvollständig</h1>
          <p className="mt-3 text-dim">Dieser QR-Code enthält keine lesbare Seite.</p>
        </div>
      </main>
    );
  }
  const { payload } = state;
  return <HostedPage code={{ id: "in-code", slug: "in-code", name: payload.n ?? "", type: payload.t, mode: "static", status: "active", content: payload.c }} links={state.links} />;
}
