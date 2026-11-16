import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/800.css";
import "@fontsource/dm-serif-display/400.css";
import "@fontsource/dm-serif-display/400-italic.css";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/playfair-display";
import "@fontsource-variable/playfair-display/wght-italic.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import Link from "next/link";
import type { PublicCode } from "@/lib/codes/public";
import { site } from "@/lib/site";
import { designVars, resolveDesign, type Design } from "@/lib/page-design";
import { menuTemplate } from "@/lib/menu-templates";
import { MenuPage } from "./menu-page";
import { ShowcaseMenu } from "./menu-showcase";
import { PollPage } from "./poll-page";
import { SmartImg } from "./smart-img";
import { s } from "./page-kit";
import { CouponPage, EventPage, LinksPage, PdfPage, ReviewPage, SitePage, VCardPage, type PageLinks } from "./pages-v2";


function Shell({ d, children, branding = true }: { d: Design; children: React.ReactNode; branding?: boolean }) {
  return (
    <div
      className="pg relative isolate min-h-screen overflow-x-clip bg-[var(--pg-bg)] text-[var(--pg-fg)]"
      data-btn={d.button}
      data-card={d.card}
      data-bg={d.background}
      data-motion={d.motion}
      data-font={d.font}
      style={{ ...designVars(d), colorScheme: isDarkBg(d.bg) ? "dark" : "light" } as React.CSSProperties}
    >
      <div className="pg-bgfx" aria-hidden>
        {d.background === "image" && d.bgImage && <SmartImg src={d.bgImage} width={1280} eager />}
      </div>
      <main className="relative z-10 mx-auto max-w-md px-5 pb-16 pt-8">{children}</main>
      {branding && (
        <footer className="relative z-10 pb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-full border border-[var(--pg-line)] bg-[var(--pg-card)]/60 px-3 py-1.5 text-xs text-[var(--pg-muted)] backdrop-blur hover:text-[var(--pg-fg)]">
            Erstellt mit <b>{site.name.toLowerCase()}</b> · Eigenen Code erstellen
          </Link>
        </footer>
      )}
    </div>
  );
}

function isDarkBg(h: string) {
  const n = parseInt(h.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 110;
}

/** Download targets that differ when the page runs without a server (page-in-code). */
export type { PageLinks } from "./pages-v2";

export function HostedPage({ code, links }: { code: PublicCode; links?: PageLinks }) {
  // Menu templates bring their own colours/fonts unless the owner customised the design.
  const tpl = code.type === "menu" ? menuTemplate(code.content.template) : null;
  const c = tpl && !code.content.design ? { ...code.content, design: tpl.design } : code.content;
  const d = resolveDesign(c);
  let body: React.ReactNode = null;
  switch (code.type) {
    case "vcard": body = <VCardPage code={code} c={c} d={d} links={links} />; break;
    case "links": body = <LinksPage c={c} d={d} />; break;
    case "menu": body = tpl?.engine === "showcase" ? <ShowcaseMenu c={c} t={tpl} /> : <MenuPage c={c} />; break;
    case "review": body = <ReviewPage c={c} d={d} />; break;
    case "coupon": body = <CouponPage c={c} d={d} />; break;
    case "pdf": body = <PdfPage c={c} d={d} />; break;
    case "event": body = <EventPage code={code} c={c} d={d} links={links} />; break;
    case "site": body = <SitePage c={c} d={d} />; break;
    case "poll": body = <PollPage c={c} slug={code.slug} demo={code.mode !== "dynamic" || code.id === "preview" || code.slug === "preview"} />; break;
  }
  return <Shell d={d} branding={code.branding !== false}>{body}</Shell>;
}

export function hostedTitle(code: PublicCode): string {
  const c = code.content;
  return s(c.title) || s(c.name) || s(c.business) || s(c.question) || [s(c.firstName), s(c.lastName)].filter(Boolean).join(" ") || code.name;
}

