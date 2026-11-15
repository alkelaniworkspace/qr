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
import { CalendarDays, CalendarPlus, ChevronRight, Download, ExternalLink, FileText, Globe, Mail, MapPin, Navigation, Phone, Smartphone, Sparkles, Star, Ticket, UserPlus } from "lucide-react";
import type { PublicCode } from "@/lib/codes/public";
import { mapsUrl } from "@/lib/codes/payload";
import { site } from "@/lib/site";
import { designVars, resolveDesign, type Design } from "@/lib/page-design";
import { menuTemplate } from "@/lib/menu-templates";
import { CopyButton } from "./copy-button";
import { MenuPage } from "./menu-page";
import { PollPage } from "./poll-page";
import { SmartImg } from "./smart-img";
import { brandOf } from "./brand-icons";
import { CouponValidity, Countdown, Hours } from "./live-bits";
import { RsvpCard } from "./rsvp-card";
import { Avatar, Btn, Card, CoverArt, Display, Hero, IconTile, SectionTitle, s, ugc, type C } from "./page-kit";

const i = (n: number) => ({ "--i": n }) as React.CSSProperties;
const lines = (v: unknown) => s(v).split("\n").map((l) => l.trim()).filter(Boolean);

function Shell({ d, children, branding = true }: { d: Design; children: React.ReactNode; branding?: boolean }) {
  return (
    <div
      className="pg relative isolate min-h-screen overflow-hidden bg-[var(--pg-bg)] text-[var(--pg-fg)]"
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

// ───────── vCard ─────────
function VCardPage({ code, c, d, links }: { code: PublicCode; c: C; d: Design; links?: PageLinks }) {
  const name = [s(c.firstName), s(c.lastName)].filter(Boolean).join(" ");
  const role = [s(c.title), s(c.company)].filter(Boolean).join(" · ");
  const address = [s(c.street), s(c.city)].filter(Boolean).join(", ");
  const phone = s(c.mobile || c.phone);
  const quick = [
    phone && { href: `tel:${phone.replace(/\s/g, "")}`, label: "Anrufen", icon: Phone },
    s(c.email) && { href: `mailto:${s(c.email)}`, label: "E-Mail", icon: Mail },
    s(c.website) && { href: s(c.website), label: "Website", icon: Globe },
    address && { href: mapsUrl(address), label: "Route", icon: Navigation },
  ].filter(Boolean) as { href: string; label: string; icon: typeof Phone }[];
  const rows = [
    { k: "Mobil", v: s(c.mobile), href: `tel:${s(c.mobile).replace(/\s/g, "")}`, icon: Smartphone },
    { k: "Telefon", v: s(c.phone), href: `tel:${s(c.phone).replace(/\s/g, "")}`, icon: Phone },
    { k: "E-Mail", v: s(c.email), href: `mailto:${s(c.email)}`, icon: Mail },
    { k: "Website", v: s(c.website).replace(/^https?:\/\//, "").replace(/\/$/, ""), href: s(c.website), icon: Globe },
    { k: "Adresse", v: address, href: mapsUrl(address), icon: MapPin },
  ].filter((r) => r.v);

  return (
    <>
      <Hero d={d} cover={s(c.cover)} avatar={s(c.photo)} title={name || "Dein Name"} subtitle={role} />
      {quick.length > 0 && (
        <div className="mt-7 flex justify-center gap-3">
          {quick.map(({ href, label, icon: Icon }, k) => (
            <a key={label} href={href} {...ugc} className="pg-in pg-lift group flex w-16 flex-col items-center gap-1.5 text-xs font-medium text-[var(--pg-muted)]" style={i(k + 3)}>
              <span className="pg-card grid size-14 place-items-center !rounded-full text-[var(--pg-fg)] transition group-hover:bg-[var(--accent)] group-hover:text-[var(--on-accent)]"><Icon className="size-5" strokeWidth={1.8} /></span>
              {label}
            </a>
          ))}
        </div>
      )}
      <div className="mt-7">
        <Btn href={links?.vcard ?? `/p/${code.slug}/vcard`} download external={false} className="pg-shine" i={6}><UserPlus className="size-5" /> Kontakt speichern</Btn>
      </div>
      {rows.length > 0 && (
        <Card className="mt-5 divide-y divide-[var(--pg-line)] overflow-hidden" i={7}>
          {rows.map(({ k, v, href, icon: Icon }) => (
            <a key={k} href={href} {...ugc} className="flex items-center gap-3.5 px-4 py-3.5 transition hover:bg-[var(--pg-soft)]">
              <IconTile><Icon className="size-[18px]" strokeWidth={1.8} /></IconTile>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold text-[var(--pg-muted)]">{k}</span>
                <span className="block truncate font-medium">{v}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-[var(--pg-muted)]" />
            </a>
          ))}
        </Card>
      )}
      {s(c.note) && <Card className="mt-5 p-5 text-[15px] leading-relaxed" i={8}><p className="whitespace-pre-line">{s(c.note)}</p></Card>}
    </>
  );
}

// ───────── Links ─────────
function LinksPage({ c, d }: { c: C; d: Design }) {
  const links = ((c.links as { label: string; url: string }[]) ?? []).filter((l) => l && l.url);
  const socials = links.filter((l) => brandOf(l.url).social).slice(0, 6);
  return (
    <>
      <Hero d={d} cover={s(c.cover)} avatar={s(c.avatar)} title={s(c.title) || "Dein Name"} subtitle={s(c.bio)}>
        {socials.length > 1 && (
          <div className={`flex gap-2.5 ${d.hero === "minimal" ? "" : "justify-center"}`}>
            {socials.map((l) => (
              <a key={l.url} href={l.url} {...ugc} aria-label={brandOf(l.url).name} className="pg-card pg-lift grid size-11 place-items-center !rounded-full text-[var(--pg-fg)] transition hover:text-[var(--accent)]">
                {brandOf(l.url).icon}
              </a>
            ))}
          </div>
        )}
      </Hero>
      <ul className="mt-8 space-y-3">
        {links.map((l, k) => {
          const b = brandOf(l.url);
          const featured = k === 0 && links.length > 2;
          return (
            <li key={k} className="pg-in" style={i(k + 4)}>
              <a href={l.url} {...ugc} className={`${featured ? "pg-btn pg-shine" : "pg-btn-2"} pg-lift group !justify-between !px-3`}>
                <span className={`grid size-9 shrink-0 place-items-center rounded-[calc(var(--pg-radius)*0.4+6px)] ${featured ? "bg-black/10" : "bg-[var(--pg-soft)]"}`}>{b.icon}</span>
                <span className="min-w-0 flex-1 truncate px-2 text-center">{l.label}</span>
                <ChevronRight className="size-4 shrink-0 opacity-50 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
              </a>
            </li>
          );
        })}
      </ul>
    </>
  );
}

// ───────── Review ─────────
function GoogleG() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 rounded-full bg-white p-0.5" aria-hidden>
      <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h6a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.7H2.1v2.8A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.7 14a6.6 6.6 0 0 1 0-4.2V7H2.1a11 11 0 0 0 0 9.9z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 0 0 2.1 7l3.6 2.8C6.6 7.3 9.1 5.4 12 5.4z" />
    </svg>
  );
}

function ReviewPage({ c, d }: { c: C; d: Design }) {
  const business = s(c.business) || "Dein Geschäft";
  return (
    <div className="flex min-h-[78vh] flex-col">
      {(s(c.logo) || s(c.cover)) ? (
        <Hero d={d} cover={s(c.cover)} avatar={s(c.logo)} square title={business} />
      ) : (
        <p className="pg-in pt-6 text-center text-sm font-semibold text-[var(--pg-muted)]">{business}</p>
      )}
      <div className="my-auto py-10 text-center">
        <div className="flex justify-center gap-2 text-[var(--accent)]">
          {Array.from({ length: 5 }, (_, k) => <Star key={k} className="pg-star size-11 fill-current drop-shadow-[0_6px_14px_color-mix(in_srgb,var(--accent)_45%,transparent)]" strokeWidth={0} style={i(k)} />)}
        </div>
        <Display size="2.6rem" className="pg-in mt-8" style={i(6)}>Wie war dein Besuch?</Display>
        <p className="pg-in mx-auto mt-4 max-w-xs whitespace-pre-line text-[17px] leading-relaxed text-[var(--pg-muted)]" style={i(7)}>
          {s(c.message) || `Danke, dass du bei ${business} warst! Deine Bewertung hilft uns sehr.`}
        </p>
      </div>
      <div className="space-y-3">
        <Btn href={s(c.googleUrl)} className="pg-shine !min-h-[60px] text-base" i={8}><GoogleG /> Auf Google bewerten</Btn>
        {s(c.secondaryUrl) && <Btn href={s(c.secondaryUrl)} secondary i={9}>Andere Plattform</Btn>}
        <p className="pg-in pt-1 text-center text-xs text-[var(--pg-muted)]" style={i(10)}>Dauert nur 30 Sekunden · Öffnet direkt das Bewertungsfenster</p>
      </div>
    </div>
  );
}

// ───────── Coupon ─────────
function CouponPage({ c }: { c: C }) {
  const valid = s(c.validUntil);
  return (
    <div className="pt-4">
      <div className="flex items-center justify-center gap-3">
        {s(c.logo) && <Avatar src={s(c.logo)} label={s(c.business)} size={44} square />}
        <p className="pg-in text-sm font-semibold text-[var(--pg-muted)]">{s(c.business)}</p>
      </div>
      <div className="pg-pop relative mt-6 overflow-hidden rounded-[calc(var(--pg-radius)+8px)] bg-[var(--pg-card)] shadow-[0_30px_60px_-30px_rgb(0_0_0/0.45)]">
        <div className="pg-shine relative overflow-hidden px-6 pb-9 pt-8 text-center text-[var(--on-accent)]">
          {s(c.cover) ? (
            <SmartImg src={s(c.cover)} width={1080} eager className="absolute inset-0 size-full object-cover" fallback={<div className="absolute inset-0 bg-[linear-gradient(135deg,var(--accent),var(--accent-2))]" />} />
          ) : (
            <div className="absolute inset-0"><CoverArt /></div>
          )}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--accent)_45%,transparent),color-mix(in_srgb,var(--accent)_85%,transparent))]" />
          <div className="relative">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-black/15 px-3 py-1 text-[11px] font-bold"><Ticket className="size-3.5" /> Gutschein</p>
            <Display size="5.5rem" className="mt-3 leading-[0.9]">{s(c.discount) || "-20 %"}</Display>
            {s(c.headline) && <p className="mx-auto mt-3 max-w-xs text-[17px] font-medium opacity-90">{s(c.headline)}</p>}
          </div>
        </div>
        <div className="relative h-0 border-t-2 border-dashed border-[var(--pg-line)]">
          <span className="absolute -left-5 -top-5 size-10 rounded-full bg-[var(--pg-bg)]" />
          <span className="absolute -right-5 -top-5 size-10 rounded-full bg-[var(--pg-bg)]" />
        </div>
        <div className="space-y-4 px-6 pb-7 pt-6 text-center">
          {s(c.code) && (
            <div>
              <p className="text-[11px] font-semibold text-[var(--pg-muted)]">Dein Code</p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="rounded-[calc(var(--pg-radius)*0.5+6px)] border-2 border-dashed border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] px-5 py-2.5 font-mono text-2xl font-bold">{s(c.code)}</span>
                <CopyButton value={s(c.code)} />
              </div>
            </div>
          )}
          {valid && <CouponValidity date={valid} />}
        </div>
      </div>
      {s(c.url) && <div className="mt-6"><Btn href={s(c.url)} className="pg-shine" i={3}><Sparkles className="size-5" /> Jetzt einlösen</Btn></div>}
      {s(c.terms) && <p className="pg-in mt-6 whitespace-pre-line text-center text-xs leading-relaxed text-[var(--pg-muted)]" style={i(4)}>{s(c.terms)}</p>}
    </div>
  );
}

// ───────── PDF ─────────
function PdfPage({ c }: { c: C }) {
  const file = (c.file as { url: string; name: string; size?: number } | null) ?? null;
  return (
    <div className="pt-6">
      {s(c.cover) ? (
        <SmartImg src={s(c.cover)} width={1080} eager className="pg-pop pg-radius mx-auto aspect-[3/4] w-56 object-cover shadow-[0_30px_60px_-25px_rgb(0_0_0/0.5)]" />
      ) : (
        <div className="pg-pop pg-float relative mx-auto h-64 w-48">
          <span className="pg-card absolute inset-0 translate-x-5 translate-y-4 rotate-6 opacity-50" />
          <span className="pg-card absolute inset-0 translate-x-2.5 translate-y-2 rotate-3 opacity-75" />
          <span className="pg-card absolute inset-0 flex flex-col overflow-hidden shadow-[0_30px_60px_-25px_rgb(0_0_0/0.45)]">
            <span className="h-20 bg-[linear-gradient(135deg,var(--accent),var(--accent-2))]" />
            <span className="flex flex-1 flex-col gap-2 p-4">
              {[90, 70, 80, 55, 75].map((w, k) => <span key={k} className="h-1.5 rounded-full bg-[var(--pg-line)]" style={{ width: `${w}%` }} />)}
            </span>
            <span className="absolute bottom-3 right-3 rounded-md bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--on-accent)]">PDF</span>
          </span>
        </div>
      )}
      <Display size="2.4rem" className="pg-in mt-10 text-center" style={i(1)}>{s(c.title) || "Dokument"}</Display>
      {s(c.description) && <p className="pg-in mx-auto mt-3 max-w-sm whitespace-pre-line text-center leading-relaxed text-[var(--pg-muted)]" style={i(2)}>{s(c.description)}</p>}
      {file && (
        <div className="mt-8 space-y-3">
          <Btn href={file.url} className="pg-shine" i={3}><FileText className="size-5" /> PDF öffnen</Btn>
          <Btn href={file.url} download={file.name} secondary external={false} i={4}><Download className="size-5" /> Herunterladen</Btn>
          <p className="pg-in truncate text-center text-xs text-[var(--pg-muted)]" style={i(5)}>{file.name}</p>
        </div>
      )}
    </div>
  );
}

// ───────── Event ─────────
function EventPage({ code, c, links }: { code: PublicCode; c: C; links?: PageLinks }) {
  const start = s(c.start) ? new Date(s(c.start)) : null;
  const end = s(c.end) ? new Date(s(c.end)) : null;
  const time = (x: Date) => x.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  const valid = start && !isNaN(start.getTime());
  return (
    <div>
      <div className="relative -mx-5 -mt-8 overflow-hidden px-5 pb-10 pt-12">
        <div className="absolute inset-0">
          {s(c.cover) ? <SmartImg src={s(c.cover)} width={1280} eager className="size-full object-cover" fallback={<CoverArt />} /> : <CoverArt />}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-[var(--pg-bg)]" />
        </div>
        <div className="relative text-center text-white">
          {valid && (
            <div className="pg-pop mx-auto w-24 overflow-hidden rounded-[calc(var(--pg-radius)*0.6+10px)] bg-white text-center text-[#111] shadow-[0_20px_40px_-15px_rgb(0_0_0/0.6)]">
              <p className="bg-[var(--accent)] py-1 text-[11px] font-bold text-[var(--on-accent)]">{start.toLocaleDateString("de-DE", { month: "short" }).replace(".", "")}</p>
              <p className="pg-display py-1.5 text-5xl leading-none">{start.getDate()}</p>
              <p className="pb-2 text-[11px] font-semibold text-black/50">{start.toLocaleDateString("de-DE", { weekday: "long" })}</p>
            </div>
          )}
          <Display size="2.6rem" className="pg-in mt-7 drop-shadow-[0_2px_12px_rgb(0_0_0/0.35)]" style={i(1)}>{s(c.title) || "Veranstaltung"}</Display>
        </div>
      </div>
      {valid && <div className="mt-2"><Countdown start={s(c.start)} end={s(c.end) || undefined} /></div>}
      {c.rsvp === true && (code.mode === "dynamic" || code.id === "preview" || code.slug === "preview") && (
        <div className="mt-6"><RsvpCard slug={code.slug} demo={code.mode !== "dynamic" || code.id === "preview" || code.slug === "preview"} showCount={c.showCount !== false} /></div>
      )}
      <div className="mt-6 space-y-3">
        {valid && (
          <Card className="flex items-center gap-3.5 p-4" i={2}>
            <IconTile><CalendarDays className="size-[18px]" /></IconTile>
            <span>
              <span className="block font-semibold">{start.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</span>
              <span className="block text-sm text-[var(--pg-muted)]">{time(start)}{end && !isNaN(end.getTime()) ? ` – ${time(end)}` : ""} Uhr</span>
            </span>
          </Card>
        )}
        {s(c.location) && (
          <a href={mapsUrl(s(c.location))} {...ugc} className="pg-card pg-in pg-lift flex items-center gap-3.5 p-4" style={i(3)}>
            <IconTile><MapPin className="size-[18px]" /></IconTile>
            <span className="min-w-0 flex-1 font-medium">{s(c.location)}</span>
            <Navigation className="size-4 shrink-0 text-[var(--pg-muted)]" />
          </a>
        )}
      </div>
      {s(c.description) && <p className="pg-in mt-6 whitespace-pre-line text-[16px] leading-relaxed" style={i(4)}>{s(c.description)}</p>}
      <div className="mt-8 space-y-3">
        <Btn href={links?.ics ?? `/p/${code.slug}/ics`} download external={false} className="pg-shine" i={5}><CalendarPlus className="size-5" /> In Kalender speichern</Btn>
        {s(c.url) && <Btn href={s(c.url)} secondary i={6}><Ticket className="size-5" /> Tickets & Infos</Btn>}
      </div>
    </div>
  );
}

// ───────── Mini-Website ─────────
function SitePage({ c, d }: { c: C; d: Design }) {
  const links = ((c.links as { label: string; url: string }[]) ?? []).filter((l) => l && l.url);
  const services = lines(c.services);
  const hours = lines(c.hours);
  const actions = [
    s(c.phone) && { href: `tel:${s(c.phone).replace(/\s/g, "")}`, label: "Anrufen", icon: Phone },
    s(c.address) && { href: mapsUrl(s(c.address)), label: "Route", icon: Navigation },
    s(c.email) && { href: `mailto:${s(c.email)}`, label: "E-Mail", icon: Mail },
  ].filter(Boolean) as { href: string; label: string; icon: typeof Phone }[];
  return (
    <>
      <Hero d={d} cover={s(c.cover)} avatar={s(c.logo)} square title={s(c.name) || "Dein Unternehmen"} subtitle={s(c.tagline)}>
        {actions.length > 0 && (
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${actions.length}, minmax(0, 1fr))` }}>
            {actions.map(({ href, label, icon: Icon }, k) => (
              <a key={label} href={href} {...ugc} className={`${k === 0 ? "pg-btn" : "pg-btn-2"} pg-lift !min-h-12 !gap-2 !px-3 text-sm`}><Icon className="size-4" /> {label}</a>
            ))}
          </div>
        )}
      </Hero>
      {s(c.about) && (
        <section className="mt-10">
          <SectionTitle>Über uns</SectionTitle>
          <p className="pg-in whitespace-pre-line text-[16px] leading-relaxed text-[color-mix(in_srgb,var(--pg-fg)_82%,transparent)]">{s(c.about)}</p>
        </section>
      )}
      {services.length > 0 && (
        <section className="mt-10">
          <SectionTitle>Leistungen</SectionTitle>
          <ul className="grid grid-cols-2 gap-2.5">
            {services.map((sv, k) => (
              <li key={sv} className={`pg-card pg-in pg-lift p-4 ${services.length % 2 === 1 && k === services.length - 1 ? "col-span-2" : ""}`} style={i(k)}>
                <span className="pg-display block text-[var(--accent)]" style={{ fontSize: "calc(1.4rem * var(--pg-display-scale))" }}>{String(k + 1).padStart(2, "0")}</span>
                <span className="mt-2 block font-semibold leading-snug">{sv}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {hours.length > 0 && (
        <section className="mt-10">
          <SectionTitle>Öffnungszeiten</SectionTitle>
          <Card className="p-3"><Hours lines={hours} /></Card>
        </section>
      )}
      {(s(c.address) || s(c.email) || s(c.phone)) && (
        <section className="mt-10 space-y-2.5">
          <SectionTitle>Kontakt</SectionTitle>
          {s(c.address) && <a href={mapsUrl(s(c.address))} {...ugc} className="pg-card pg-in pg-lift flex items-center gap-3.5 p-4"><IconTile><MapPin className="size-[18px]" /></IconTile><span className="flex-1 font-medium">{s(c.address)}</span><ChevronRight className="size-4 text-[var(--pg-muted)]" /></a>}
          {s(c.phone) && <a href={`tel:${s(c.phone).replace(/\s/g, "")}`} className="pg-card pg-in pg-lift flex items-center gap-3.5 p-4"><IconTile><Phone className="size-[18px]" /></IconTile><span className="flex-1 font-medium">{s(c.phone)}</span><ChevronRight className="size-4 text-[var(--pg-muted)]" /></a>}
          {s(c.email) && <a href={`mailto:${s(c.email)}`} className="pg-card pg-in pg-lift flex items-center gap-3.5 p-4"><IconTile><Mail className="size-[18px]" /></IconTile><span className="flex-1 truncate font-medium">{s(c.email)}</span><ChevronRight className="size-4 text-[var(--pg-muted)]" /></a>}
        </section>
      )}
      {links.length > 0 && (
        <section className="mt-10 space-y-2.5">
          {links.map((l, k) => <Btn key={k} href={l.url} secondary i={k}>{brandOf(l.url).icon} {l.label} <ExternalLink className="ml-auto size-4 opacity-40" /></Btn>)}
        </section>
      )}
    </>
  );
}

/** Download targets that differ when the page runs without a server (page-in-code). */
export interface PageLinks {
  vcard?: string;
  ics?: string;
}

export function HostedPage({ code, links }: { code: PublicCode; links?: PageLinks }) {
  // Menu templates bring their own colours/fonts unless the owner customised the design.
  const tpl = code.type === "menu" ? menuTemplate(code.content.template) : null;
  const c = tpl && !code.content.design ? { ...code.content, design: tpl.design } : code.content;
  const d = resolveDesign(c);
  let body: React.ReactNode = null;
  switch (code.type) {
    case "vcard": body = <VCardPage code={code} c={c} d={d} links={links} />; break;
    case "links": body = <LinksPage c={c} d={d} />; break;
    case "menu": body = <MenuPage c={c} />; break;
    case "review": body = <ReviewPage c={c} d={d} />; break;
    case "coupon": body = <CouponPage c={c} />; break;
    case "pdf": body = <PdfPage c={c} />; break;
    case "event": body = <EventPage code={code} c={c} links={links} />; break;
    case "site": body = <SitePage c={c} d={d} />; break;
    case "poll": body = <PollPage c={c} slug={code.slug} demo={code.mode !== "dynamic" || code.id === "preview" || code.slug === "preview"} />; break;
  }
  return <Shell d={d} branding={code.branding !== false}>{body}</Shell>;
}

export function hostedTitle(code: PublicCode): string {
  const c = code.content;
  return s(c.title) || s(c.name) || s(c.business) || s(c.question) || [s(c.firstName), s(c.lastName)].filter(Boolean).join(" ") || code.name;
}

