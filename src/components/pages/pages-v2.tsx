"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight, ArrowUpRight, CalendarDays, CalendarPlus, Check, ChevronRight, Clock, Copy, Download, Eye, FileText, Globe, Mail, MapPin,
  MessageCircle, Moon, Navigation, Phone, Share2, Smartphone, Sparkles, Star, Sun, Ticket, UserPlus, X,
} from "lucide-react";
import type { PublicCode } from "@/lib/codes/public";
import type { ReviewData } from "@/lib/codes/types";
import { mapsUrl } from "@/lib/codes/payload";
import { openState, parseHours, todayLine, type OpenState } from "@/lib/hours";
import { isDark, type Design } from "@/lib/page-design";
import { brandOf } from "./brand-icons";
import { Head, MapArt, Reviews, toggleTheme, useReveal } from "./menu-showcase";
import { RsvpCard } from "./rsvp-card";
import { SmartImg } from "./smart-img";

/**
 * Hosted pages (everything except menu and poll) in the Showcase language:
 * cover + profile card, quick actions, cards with soft shadows, live opening
 * hours, map card, floating action bar and scroll reveals. Header layout
 * follows the design's `hero` (card / full photo / centered / editorial).
 */

type C = Record<string, unknown>;
const s = (v: unknown) => String(v ?? "").trim();
const lines = (v: unknown) => s(v).split("\n").map((l) => l.trim()).filter(Boolean);
const tel = (v: string) => `tel:${v.replace(/[^\d+]/g, "")}`;
const wa = (v: string) => `https://wa.me/${v.replace(/[^\d]/g, "").replace(/^0/, "49")}`;
const host = (u: string) => u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "").split("/")[0];
const ext = { target: "_blank", rel: "noopener nofollow ugc" } as const;
const d$ = (n: number) => ({ "--d": `${n * 0.06}s` }) as React.CSSProperties;

export interface PageLinks { vcard?: string; ics?: string }
type Act = { href: string; label: string; icon: typeof Phone; primary?: boolean; download?: boolean };

// ───────── frame + header ─────────

function Frame({ d, children, className = "" }: { d: Design; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useReveal(ref, []);
  const hero = d.hero === "cover" ? "card" : d.hero;
  return <div ref={ref} className={`sc pv -mx-5 -mt-8 ${className}`} data-hero={hero}>{children}</div>;
}

function TopBar({ d, light }: { d: Design; light?: boolean }) {
  const [dark, setDark] = useState<boolean | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const share = () => {
    if (navigator.share) navigator.share({ title: document.title, url: location.href }).catch(() => {});
    else navigator.clipboard?.writeText(location.href).catch(() => {});
  };
  return (
    <div ref={ref} className={`sc-top ${light ? "pv-top-ink" : ""}`}>
      <span />
      <div>
        <button type="button" className="sc-glass" aria-label="Hell oder dunkel" onClick={() => setDark(toggleTheme(ref.current))}>
          {(dark ?? isDark(d.bg)) ? <Sun className="size-[19px]" /> : <Moon className="size-[19px]" />}
        </button>
        <button type="button" className="sc-glass" aria-label="Teilen" onClick={share}><Share2 className="size-[19px]" /></button>
      </div>
    </div>
  );
}

function Avatar({ src, label, square, className }: { src: string; label: string; square?: boolean; className: string }) {
  const fb = <span className={`${className} sc-logo-fb pg-display ${square ? "" : "round"}`}>{label.trim().charAt(0).toUpperCase() || "•"}</span>;
  return src ? <span className={`${className} ${square ? "" : "round"}`}><SmartImg src={src} width={300} eager fallback={fb} /></span> : fb;
}

function PageHead({ d, cover, avatar, square, title, subtitle, eyebrow, meta, children }: {
  d: Design; cover?: string; avatar?: string; square?: boolean; title: string; subtitle?: string; eyebrow?: string; meta?: React.ReactNode; children?: React.ReactNode;
}) {
  const hero = d.hero === "cover" ? "card" : d.hero;
  const hasAvatar = avatar !== undefined;
  if (hero === "minimal") {
    return (
      <header className="pv-min">
        <TopBar d={d} light />
        <div className="pv-min-in sc-rv">
          {hasAvatar && <Avatar src={avatar ?? ""} label={title} square={square} className="pv-av-sm" />}
          {eyebrow && <p className="pv-eye">{eyebrow}</p>}
          <h1 className="pg-display">{title}</h1>
          {subtitle && <p className="pv-sub">{subtitle}</p>}
          {meta && <div className="sc-meta">{meta}</div>}
          {children}
        </div>
        {cover && <div className="pv-min-cover sc-rv"><SmartImg src={cover} width={1280} eager /></div>}
      </header>
    );
  }
  if (hero === "centered") {
    return (
      <header className="pv-cen">
        <div className="pv-cen-art" />
        <TopBar d={d} light />
        <div className="pv-cen-in">
          {hasAvatar && <Avatar src={avatar ?? ""} label={title} square={square} className="pv-av-lg sc-rv" />}
          {eyebrow && <p className="pv-eye sc-rv">{eyebrow}</p>}
          <h1 className="pg-display sc-rv">{title}</h1>
          {subtitle && <p className="pv-sub sc-rv">{subtitle}</p>}
          {meta && <div className="sc-meta sc-rv">{meta}</div>}
          {children && <div className="pv-cen-kids sc-rv">{children}</div>}
        </div>
      </header>
    );
  }
  return (
    <header>
      <div className={`sc-cover ${cover ? "" : "sc-cover-art"}`}>
        <div className="sc-cover-img">{cover && <SmartImg src={cover} width={1280} eager />}</div>
        <TopBar d={d} />
        {hero === "full" && (
          <div className="sc-full">
            {hasAvatar && <Avatar src={avatar ?? ""} label={title} square={square} className="sc-logo-sm" />}
            {eyebrow && <p className="pv-eye on-photo">{eyebrow}</p>}
            <h1 className="pg-display">{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
        )}
      </div>
      <div className="sc-prof sc-rv">
        {hero !== "full" && (
          <>
            {hasAvatar ? <Avatar src={avatar ?? ""} label={title} square={square} className="sc-logo" /> : <div className="pv-nologo" />}
            {eyebrow && <p className="pv-eye">{eyebrow}</p>}
            <h1 className="pg-display">{title}</h1>
            {subtitle && <p className="sc-sub whitespace-pre-line">{subtitle}</p>}
          </>
        )}
        {meta && <div className="sc-meta">{meta}</div>}
        {children}
      </div>
    </header>
  );
}

function Acts({ items }: { items: Act[] }) {
  if (!items.length) return null;
  return (
    <div className="sc-acts">
      {items.map((a, k) => {
        const I = a.icon;
        const primary = a.primary ?? k === 0;
        return (
          <a key={a.label} href={a.href} {...(a.download ? { download: true } : a.href.startsWith("http") ? ext : {})} className={`sc-act ${primary ? "pri" : ""}`} aria-label={a.label}>
            <I className="size-5" />{primary && a.label}
          </a>
        );
      })}
    </div>
  );
}

function useOpen(text: string) {
  const week = useMemo(() => parseHours(text), [text]);
  const [now, setNow] = useState<{ state: OpenState | null; line: number } | null>(null);
  useEffect(() => {
    const tick = () => setNow({ state: openState(week), line: todayLine(text) });
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [week, text]);
  return now;
}

function OpenPill({ state }: { state: OpenState | null | undefined }) {
  if (!state) return null;
  return <span className={`sc-open ${state.open ? "" : "off"}`}><i />{state.label}</span>;
}

function HoursCard({ text, now }: { text: string; now: { state: OpenState | null; line: number } | null }) {
  return (
    <section className="sc-sec" id="pv-hours">
      <Head title="Öffnungszeiten" note={now?.state ? (now.state.open ? `Jetzt geöffnet, ${now.state.label.split("· ")[1]}` : now.state.label.replace("Geschlossen · ", "Gerade geschlossen, ")) : undefined} />
      <div className="sc-card sc-rv">
        {lines(text).map((l, k) => {
          const m = l.match(/^(.*?)(\d.*)$/);
          return <div key={k} className={`sc-hr ${now?.line === k ? "td" : ""}`}><span>{m ? m[1].replace(/[:\s]+$/, "") : l}</span><span>{m ? m[2] : ""}</span></div>;
        })}
      </div>
    </section>
  );
}

function MapCard({ address, title = "So findest du uns" }: { address: string; title?: string }) {
  const [street, ...rest] = address.split(",");
  return (
    <section className="sc-sec">
      <Head title={title} />
      <div className="sc-card sc-rv">
        <a className="sc-map" href={mapsUrl(address)} {...ext} aria-label="Karte öffnen"><MapArt /><span className="sc-pin"><MapPin className="size-6" /></span></a>
        <div className="sc-addr"><div><b>{street}</b>{rest.length > 0 && <small>{rest.join(",").trim()}</small>}</div><a className="sc-rbtn" href={mapsUrl(address)} {...ext}><Navigation className="size-4" />Route</a></div>
      </div>
    </section>
  );
}

/** Floating action bar, shown once the visitor scrolled past the header. */
function FloatBar({ main, side }: { main: Act; side?: Act }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const f = () => setOn(window.scrollY > 380);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  const M = main.icon;
  const S = side?.icon;
  return (
    <div className={`sc-bb ${on ? "on" : ""}`}>
      <a className="sc-call" href={main.href} {...(main.download ? { download: true } : main.href.startsWith("http") ? ext : {})}><M className="size-5" />{main.label}</a>
      {side && S && <a className="sc-wa" href={side.href} {...(side.download ? { download: true } : side.href.startsWith("http") ? ext : {})} aria-label={side.label}><S className="size-5" /></a>}
    </div>
  );
}

function Rows({ rows }: { rows: { k: string; v: string; href: string; icon: typeof Phone }[] }) {
  if (!rows.length) return null;
  return (
    <div className="pv-rows sc-rv">
      {rows.map(({ k, v, href, icon: I }) => (
        <a key={k} href={href} {...(href.startsWith("http") ? ext : {})} className="pv-row">
          <span className="pv-ic"><I className="size-[18px]" /></span>
          <span className="pv-row-t"><small>{k}</small><b>{v}</b></span>
          <ChevronRight className="size-4 pv-chev" />
        </a>
      ))}
    </div>
  );
}

function Gallery({ images }: { images: string[] }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!images.length) return null;
  return (
    <section className="sc-sec">
      <Head title="Galerie" right={`${images.length} Fotos`} />
      <div className="sc-hs">
        {images.map((src, k) => (
          <button key={k} type="button" className={`pv-gal sc-rv ${k % 3 === 0 ? "tall" : ""}`} style={d$(k)} onClick={() => setOpen(k)}><SmartImg src={src} width={700} /></button>
        ))}
      </div>
      {open !== null && typeof document !== "undefined" && createPortal(
        <div className="pv-lightbox" onClick={() => setOpen(null)}>
          <button type="button" className="sc-glass" aria-label="Schließen"><X className="size-5" /></button>
          <SmartImg src={images[open]} width={1600} />
          {images.length > 1 && <span className="pv-lb-n">{open + 1} / {images.length}</span>}
        </div>,
        document.body,
      )}
    </section>
  );
}

function Socials({ urls }: { urls: string[] }) {
  if (!urls.length) return null;
  return <div className="sc-soc">{urls.map((u) => <a key={u} href={u} {...ext} aria-label={brandOf(u).name}>{brandOf(u).icon}</a>)}</div>;
}

function Text({ title, text }: { title: string; text: string }) {
  const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return (
    <section className="sc-sec">
      <Head title={title} />
      <div className="sc-card pv-text sc-rv">{paras.map((p, k) => <p key={k} className={k === 0 ? "lead" : ""}>{p}</p>)}</div>
    </section>
  );
}

// ───────── Mini-Website ─────────

export function SitePage({ c, d }: { c: C; d: Design }) {
  const links = ((c.links as { label: string; url: string }[]) ?? []).filter((l) => l && l.url);
  const socials = links.filter((l) => brandOf(l.url).social).map((l) => l.url);
  const other = links.filter((l) => !brandOf(l.url).social);
  const services = lines(c.services);
  const gallery = ((c.gallery as string[]) ?? []).filter(Boolean);
  const reviews = ((c.reviews as ReviewData[]) ?? []).filter((r) => r && s(r.text));
  const rating = s(c.rating).replace(".", ",");
  const now = useOpen(s(c.hours));
  const phone = s(c.phone);
  const actions: Act[] = [
    phone && { href: tel(phone), label: "Anrufen", icon: Phone },
    s(c.whatsapp) && { href: wa(s(c.whatsapp)), label: "WhatsApp", icon: MessageCircle },
    s(c.address) && { href: mapsUrl(s(c.address)), label: "Route", icon: Navigation },
    s(c.email) && { href: `mailto:${s(c.email)}`, label: "E-Mail", icon: Mail },
  ].filter(Boolean) as Act[];
  const meta = (rating || now?.state) ? (
    <>
      {rating && <a href="#sc-reviews" className="sc-rate"><Star className="size-4" />{rating}{s(c.ratingCount) && <span>({s(c.ratingCount)})</span>}</a>}
      <OpenPill state={now?.state} />
    </>
  ) : null;
  return (
    <Frame d={d}>
      <PageHead d={d} cover={s(c.cover)} avatar={s(c.logo)} square title={s(c.name) || "Dein Unternehmen"} subtitle={s(c.tagline)} meta={meta}>
        <Acts items={actions} />
      </PageHead>
      {s(c.about) && <Text title="Über uns" text={s(c.about)} />}
      {services.length > 0 && (
        <section className="sc-sec">
          <Head title="Leistungen" right={`${services.length}`} />
          <div className="pv-svc">
            {services.map((sv, k) => (
              <div key={sv + k} className={`pv-svc-i sc-rv ${services.length % 2 === 1 && k === services.length - 1 ? "wide" : ""}`} style={d$(k % 2)}>
                <span className="pv-num pg-display">{String(k + 1).padStart(2, "0")}</span>
                <b>{sv}</b>
                <ArrowUpRight className="pv-svc-arr" />
              </div>
            ))}
          </div>
        </section>
      )}
      <Gallery images={gallery} />
      {(rating || reviews.length > 0) && <Reviews rating={rating} ratingNum={Number(rating.replace(",", "."))} count={s(c.ratingCount)} url={s(c.reviewUrl)} reviews={reviews} />}
      {s(c.hours) && <HoursCard text={s(c.hours)} now={now} />}
      {s(c.address) && <MapCard address={s(c.address)} />}
      {(phone || s(c.email) || other.length > 0) && (
        <section className="sc-sec">
          <Head title="Kontakt" />
          <Rows rows={[
            phone && { k: "Telefon", v: phone, href: tel(phone), icon: Phone },
            s(c.whatsapp) && { k: "WhatsApp", v: s(c.whatsapp), href: wa(s(c.whatsapp)), icon: MessageCircle },
            s(c.email) && { k: "E-Mail", v: s(c.email), href: `mailto:${s(c.email)}`, icon: Mail },
            ...other.map((l) => ({ k: l.label, v: host(l.url), href: l.url, icon: Globe })),
          ].filter(Boolean) as { k: string; v: string; href: string; icon: typeof Phone }[]} />
        </section>
      )}
      <footer className="sc-foot sc-rv"><Socials urls={socials} /></footer>
      {phone ? <FloatBar main={{ href: tel(phone), label: "Jetzt anrufen", icon: Phone }} side={s(c.whatsapp) ? { href: wa(s(c.whatsapp)), label: "WhatsApp", icon: MessageCircle } : s(c.address) ? { href: mapsUrl(s(c.address)), label: "Route", icon: Navigation } : undefined} />
        : s(c.whatsapp) ? <FloatBar main={{ href: wa(s(c.whatsapp)), label: "Per WhatsApp schreiben", icon: MessageCircle }} /> : null}
    </Frame>
  );
}

// ───────── Link page ─────────

export function LinksPage({ c, d }: { c: C; d: Design }) {
  const links = ((c.links as { label: string; url: string }[]) ?? []).filter((l) => l && l.url);
  const socials = links.filter((l) => brandOf(l.url).social).slice(0, 6);
  const [first, ...rest] = links;
  const featured = links.length > 2 ? first : null;
  const list = featured ? rest : links;
  return (
    <Frame d={d}>
      <PageHead d={d} cover={s(c.cover)} avatar={s(c.avatar)} title={s(c.title) || "Dein Name"} subtitle={s(c.bio)}>
        {socials.length > 1 && <div className="pv-soc-row">{socials.map((l) => <a key={l.url} href={l.url} {...ext} aria-label={brandOf(l.url).name}>{brandOf(l.url).icon}</a>)}</div>}
      </PageHead>
      <div className="pv-links">
        {featured && (
          <a href={featured.url} {...ext} className="pv-feat sc-rv">
            <span className="pv-feat-ic">{brandOf(featured.url).icon}</span>
            <span className="pv-feat-t"><small>{brandOf(featured.url).name || host(featured.url)}</small><b>{featured.label}</b></span>
            <span className="pv-feat-go"><ArrowRight className="size-5" /></span>
          </a>
        )}
        {list.map((l, k) => {
          const b = brandOf(l.url);
          return (
            <a key={k} href={l.url} {...ext} className="pv-link sc-rv" style={d$(k)}>
              <span className="pv-ic">{b.icon}</span>
              <span className="pv-row-t"><b>{l.label}</b><small>{host(l.url)}</small></span>
              <ArrowUpRight className="size-[18px] pv-chev" />
            </a>
          );
        })}
      </div>
    </Frame>
  );
}

// ───────── vCard ─────────

export function VCardPage({ code, c, d, links }: { code: PublicCode; c: C; d: Design; links?: PageLinks }) {
  const name = [s(c.firstName), s(c.lastName)].filter(Boolean).join(" ") || "Dein Name";
  const role = [s(c.title), s(c.company)].filter(Boolean).join(" · ");
  const address = [s(c.street), s(c.city)].filter(Boolean).join(", ");
  const phone = s(c.mobile || c.phone);
  const save = links?.vcard ?? `/p/${code.slug}/vcard`;
  const card = useRef<HTMLDivElement>(null);
  const tilt = (e: React.PointerEvent) => {
    const el = card.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
    el.style.setProperty("--mx", `${(x + 0.5) * 100}%`);
  };
  const actions: Act[] = [
    phone && { href: tel(phone), label: "Anrufen", icon: Phone },
    s(c.email) && { href: `mailto:${s(c.email)}`, label: "E-Mail", icon: Mail },
    s(c.website) && { href: s(c.website), label: "Website", icon: Globe },
    address && { href: mapsUrl(address), label: "Route", icon: Navigation },
  ].filter(Boolean) as Act[];
  const rows = [
    { k: "Mobil", v: s(c.mobile), href: tel(s(c.mobile)), icon: Smartphone },
    { k: "Telefon", v: s(c.phone), href: tel(s(c.phone)), icon: Phone },
    { k: "E-Mail", v: s(c.email), href: `mailto:${s(c.email)}`, icon: Mail },
    { k: "Website", v: host(s(c.website)), href: s(c.website), icon: Globe },
    { k: "Adresse", v: address, href: mapsUrl(address), icon: MapPin },
  ].filter((r) => r.v);
  return (
    <Frame d={d}>
      <PageHead d={d} cover={s(c.cover)} avatar={s(c.photo)} title={name} subtitle={role}>
        <div className="pv-circles">
          {actions.map(({ href, label, icon: I }) => (
            <a key={label} href={href} {...(href.startsWith("http") ? ext : {})}><span><I className="size-5" /></span>{label}</a>
          ))}
        </div>
      </PageHead>
      <div className="pv-wallet sc-rv">
        <div ref={card} className="pv-wcard" onPointerMove={tilt} onPointerLeave={() => { if (card.current) card.current.style.transform = ""; }}>
          <div className="pv-wc-top"><span>{s(c.company) || "Visitenkarte"}</span><span className="pv-chip" /></div>
          <div className="pv-wc-name pg-display">{name}</div>
          {s(c.title) && <div className="pv-wc-role">{s(c.title)}</div>}
          <div className="pv-wc-lines">{phone && <span>{phone}</span>}{s(c.email) && <span>{s(c.email)}</span>}</div>
          <span className="pv-wc-sheen" />
        </div>
      </div>
      <div className="pv-pad sc-rv"><a href={save} download className="pv-cta"><UserPlus className="size-5" />Kontakt speichern</a></div>
      {rows.length > 0 && <section className="sc-sec"><Head title="Kontakt" /><Rows rows={rows} /></section>}
      {s(c.note) && <Text title="Über mich" text={s(c.note)} />}
      <FloatBar main={{ href: save, label: "Kontakt speichern", icon: UserPlus, download: true }} side={phone ? { href: tel(phone), label: "Anrufen", icon: Phone } : undefined} />
    </Frame>
  );
}

// ───────── Review ─────────

const MOODS = ["", "Das tut uns leid.", "Das tut uns leid.", "Danke für dein Feedback!", "Wie schön!", "Wow, danke!"];

export function ReviewPage({ c, d }: { c: C; d: Design }) {
  const business = s(c.business) || "Dein Geschäft";
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const feedback = s(c.feedback);
  const feedbackHref = /^\S+@\S+\.\S+$/.test(feedback) ? `mailto:${feedback}?subject=${encodeURIComponent(`Feedback für ${business}`)}`
    : /^\+?[\d\s/-]{6,}$/.test(feedback) ? wa(feedback) : /^https?:\/\//.test(feedback) ? feedback : "";
  const shown = hover || stars;
  return (
    <Frame d={d}>
      <PageHead d={d} cover={s(c.cover)} avatar={s(c.logo)} square title={business} eyebrow="Bewerte uns" />
      <section className="pv-pad">
        <div className="pv-rate-card sc-rv">
          <p className="pv-q pg-display">{stars ? MOODS[stars] : "Wie war dein Besuch?"}</p>
          <div className="pv-stars" onPointerLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" aria-label={`${n} Sterne`} className={n <= shown ? "on" : ""} style={{ "--k": n } as React.CSSProperties} onPointerEnter={() => setHover(n)} onClick={() => setStars(n)}>
                <Star />
              </button>
            ))}
          </div>
          <p className="pv-msg">
            {stars >= 4 ? "Teile es mit anderen. Deine Bewertung auf Google hilft uns enorm."
              : stars > 0 ? (feedbackHref ? "Sag uns direkt, was wir besser machen können. Oder bewerte uns auf Google." : "Danke! Deine ehrliche Bewertung auf Google hilft uns, besser zu werden.")
              : s(c.message) || `Danke, dass du bei ${business} warst! Tipp auf die Sterne.`}
          </p>
        </div>
        <div className="pv-stack">
          <div className="sc-rv"><a href={s(c.googleUrl)} {...ext} className={`pv-cta google ${stars >= 4 ? "glow" : ""}`}><GoogleG />Auf Google bewerten</a></div>
          {stars > 0 && stars <= 3 && feedbackHref && <a href={feedbackHref} {...ext} className="pv-cta alt"><MessageCircle className="size-5" />Direkt Feedback geben</a>}
          {s(c.secondaryUrl) && <a href={s(c.secondaryUrl)} {...ext} className="pv-cta alt sc-rv">Andere Plattform <ArrowUpRight className="size-4" /></a>}
          <p className="pv-fine sc-rv"><Clock className="size-3.5" /> Dauert nur 30 Sekunden</p>
        </div>
      </section>
    </Frame>
  );
}

function GoogleG() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 rounded-full bg-white p-[3px]" aria-hidden>
      <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h6a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.7H2.1v2.8A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.7 14a6.6 6.6 0 0 1 0-4.2V7H2.1a11 11 0 0 0 0 9.9z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 0 0 2.1 7l3.6 2.8C6.6 7.3 9.1 5.4 12 5.4z" />
    </svg>
  );
}

// ───────── Coupon ─────────

function useNow(every = 30_000) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, every);
    return () => window.clearInterval(id);
  }, [every]);
  return now;
}

export function CouponPage({ c, d }: { c: C; d: Design }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  const now = useNow();
  const valid = s(c.validUntil);
  const until = valid ? new Date(`${valid}T23:59:59`) : null;
  const left = until && now !== null ? until.getTime() - now : null;
  const expired = left !== null && left < 0;
  const code = s(c.code);
  const copy = () => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  const reveal = () => { setShown(true); copy(); };
  return (
    <Frame d={d} className="pv-coupon">
      <div className="pv-cp-top">
        <TopBar d={d} light />
        <div className="pv-cp-brand sc-rv">
          <Avatar src={s(c.logo)} label={s(c.business) || "G"} square className="pv-av-sm" />
          <span><small>Gutschein von</small><b>{s(c.business) || "Dein Geschäft"}</b></span>
        </div>
      </div>
      <div className="pv-ticket sc-rv">
        <div className="pv-tk-head">
          {s(c.cover) && <span className="pv-tk-bg"><SmartImg src={s(c.cover)} width={1080} eager /></span>}
          <span className="pv-tk-shine" />
          <p className="pv-tk-label"><Ticket className="size-3.5" /> Gutschein</p>
          <p className="pv-tk-off pg-display">{s(c.discount) || "-20 %"}</p>
          {s(c.headline) && <p className="pv-tk-hl">{s(c.headline)}</p>}
        </div>
        <div className="pv-tk-cut"><i /><span /><i /></div>
        <div className="pv-tk-body">
          {code && (
            <>
              <p className="pv-tk-k">Dein Code</p>
              <button type="button" className={`pv-code ${shown ? "on" : ""}`} onClick={shown ? copy : reveal}>
                <span className="pv-code-v">{code}</span>
                {!shown && <span className="pv-code-cover"><Eye className="size-4" /> Tippen zum Aufdecken</span>}
              </button>
              <p className="pv-tk-copy">{copied ? <><Check className="size-3.5" /> Kopiert</> : shown ? <><Copy className="size-3.5" /> Tippen zum Kopieren</> : null}</p>
            </>
          )}
          {until && !isNaN(until.getTime()) && (
            expired ? <p className="pv-valid off">Abgelaufen am {until.toLocaleDateString("de-DE")}</p>
              : left !== null && left < 14 * 86400_000 ? (
                <div className="pv-count">{[[Math.floor(left / 86400_000), "Tage"], [Math.floor((left % 86400_000) / 3600_000), "Std."], [Math.floor((left % 3600_000) / 60_000), "Min."]].map(([v, l]) => <span key={l}><b className="pg-display">{v}</b>{l}</span>)}</div>
              ) : <p className="pv-valid">Gültig bis {until.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}</p>
          )}
        </div>
        {shown && <Confetti />}
      </div>
      <div className="pv-stack pv-pad">
        {s(c.url) && <a href={s(c.url)} {...ext} className="pv-cta sc-rv"><Sparkles className="size-5" />Jetzt einlösen</a>}
        {s(c.terms) && (
          <details className="pv-terms sc-rv"><summary>Bedingungen <ChevronRight className="size-4" /></summary><p>{s(c.terms)}</p></details>
        )}
      </div>
    </Frame>
  );
}

function Confetti() {
  const bits = Array.from({ length: 18 }, (_, k) => k);
  return <span className="pv-confetti" aria-hidden>{bits.map((k) => <i key={k} style={{ "--x": `${(k * 53) % 100}%`, "--r": `${(k * 47) % 360}deg`, "--t": `${0.6 + (k % 5) * 0.12}s`, "--c": ["var(--accent)", "#f5a524", "#ff5a7a", "#4ea8ff", "var(--pg-fg)"][k % 5] } as React.CSSProperties} />)}</span>;
}

// ───────── Event ─────────

export function EventPage({ code, c, d, links }: { code: PublicCode; c: C; d: Design; links?: PageLinks }) {
  const now = useNow();
  const start = s(c.start) ? new Date(s(c.start)) : null;
  const end = s(c.end) ? new Date(s(c.end)) : null;
  const valid = !!start && !isNaN(start.getTime());
  const time = (x: Date) => x.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  const ics = links?.ics ?? `/p/${code.slug}/ics`;
  const demo = code.mode !== "dynamic" || code.id === "preview" || code.slug === "preview";
  const endMs = end && !isNaN(end.getTime()) ? end.getTime() : valid ? start.getTime() + 3 * 3600_000 : 0;
  const state = !valid || now === null ? null : now >= endMs ? "past" : now >= start.getTime() ? "live" : "soon";
  const diff = valid && now !== null ? start.getTime() - now : 0;
  return (
    <Frame d={{ ...d, hero: "full" }} className="pv-event">
      <header>
        <div className={`sc-cover ${s(c.cover) ? "" : "sc-cover-art"}`}>
          <div className="sc-cover-img">{s(c.cover) && <SmartImg src={s(c.cover)} width={1280} eager />}</div>
          <TopBar d={d} />
          <div className="sc-full">
            {valid && (
              <div className="pv-date">
                <span>{start.toLocaleDateString("de-DE", { month: "short" }).replace(".", "")}</span>
                <b className="pg-display">{start.getDate()}</b>
                <small>{start.toLocaleDateString("de-DE", { weekday: "short" })}</small>
              </div>
            )}
            <h1 className="pg-display">{s(c.title) || "Veranstaltung"}</h1>
            {state === "live" && <p className="pv-live"><i /> Läuft gerade</p>}
          </div>
        </div>
        <div className="sc-prof sc-rv">
          <div className="pv-facts">
            {valid && <span><CalendarDays className="size-[18px]" /><b>{start.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" })}</b><small>{time(start)}{end && !isNaN(end.getTime()) ? ` – ${time(end)}` : ""} Uhr</small></span>}
            {s(c.location) && <a href={mapsUrl(s(c.location))} {...ext}><MapPin className="size-[18px]" /><b>{s(c.location).split(",")[0]}</b><small>{s(c.location).split(",").slice(1).join(",").trim() || "Route öffnen"}</small></a>}
          </div>
          {state === "soon" && (
            <div className="pv-count big">{[[Math.floor(diff / 86400_000), "Tage"], [Math.floor((diff % 86400_000) / 3600_000), "Std."], [Math.floor((diff % 3600_000) / 60_000), "Min."]].map(([v, l]) => <span key={l}><b className="pg-display">{v}</b>{l}</span>)}</div>
          )}
          {state === "past" && <p className="pv-valid off">Diese Veranstaltung ist vorbei.</p>}
          <div className="sc-acts">
            <a href={ics} download className="sc-act pri"><CalendarPlus className="size-5" />In Kalender</a>
            {s(c.url) && <a href={s(c.url)} {...ext} className="sc-act" aria-label="Tickets"><Ticket className="size-5" /></a>}
            {s(c.location) && <a href={mapsUrl(s(c.location))} {...ext} className="sc-act" aria-label="Route"><Navigation className="size-5" /></a>}
          </div>
        </div>
      </header>
      {c.rsvp === true && (code.mode === "dynamic" || demo) && <div className="pv-pad sc-rv" style={{ marginTop: 22 }}><RsvpCard slug={code.slug} demo={demo} showCount={c.showCount !== false} /></div>}
      {s(c.description) && <Text title="Details" text={s(c.description)} />}
      {s(c.location) && <MapCard address={s(c.location)} title="Veranstaltungsort" />}
      <FloatBar main={{ href: ics, label: "In Kalender speichern", icon: CalendarPlus, download: true }} side={s(c.url) ? { href: s(c.url), label: "Tickets", icon: Ticket } : undefined} />
    </Frame>
  );
}

// ───────── PDF ─────────

export function PdfPage({ c, d }: { c: C; d: Design }) {
  const file = (c.file as { url: string; name: string } | null) ?? null;
  return (
    <Frame d={d} className="pv-pdf">
      <div className="pv-pdf-stage">
        <TopBar d={d} light />
        <div className="pv-doc sc-rv">
          {s(c.cover) ? <SmartImg src={s(c.cover)} width={900} eager /> : (
            <span className="pv-doc-art"><span className="pv-doc-band" />{[88, 70, 80, 52, 74, 60, 82].map((w, k) => <i key={k} style={{ width: `${w}%` }} />)}<em>PDF</em></span>
          )}
        </div>
      </div>
      <div className="pv-pad pv-pdf-body">
        <p className="pv-eye sc-rv">Dokument</p>
        <h1 className="pg-display sc-rv">{s(c.title) || "Dokument"}</h1>
        {s(c.description) && <p className="pv-sub sc-rv whitespace-pre-line">{s(c.description)}</p>}
        {file && (
          <>
            <div className="pv-file sc-rv"><span className="pv-ic"><FileText className="size-[18px]" /></span><span className="pv-row-t"><b>{file.name || "Dokument.pdf"}</b><small>PDF-Dokument</small></span></div>
            <div className="pv-stack">
              <a href={file.url} {...ext} className="pv-cta sc-rv"><FileText className="size-5" />PDF öffnen</a>
              <a href={file.url} download={file.name} className="pv-cta alt sc-rv"><Download className="size-5" />Herunterladen</a>
            </div>
          </>
        )}
      </div>
      {file && <FloatBar main={{ href: file.url, label: "PDF öffnen", icon: FileText }} side={{ href: file.url, label: "Herunterladen", icon: Download, download: true }} />}
    </Frame>
  );
}
