import Link from "next/link";
import {
  CalendarPlus, Download, ExternalLink, FileText, Globe, Mail, MapPin, Navigation, Phone, Smartphone, Star, UserPlus,
} from "lucide-react";
import type { PublicCode } from "@/lib/codes/public";
import { contrastRatio } from "@/lib/qr/scannability";
import { mapsUrl } from "@/lib/codes/payload";
import { site } from "@/lib/site";
import { CopyButton } from "./copy-button";

type C = Record<string, unknown>;
const s = (v: unknown) => String(v ?? "").trim();
const onAccent = (accent: string) => (contrastRatio(accent, "#ffffff") >= 3 ? "#ffffff" : "#14130f");
const ugc = { target: "_blank", rel: "noopener nofollow ugc" } as const;

type Theme = "light" | "dark" | "color";

function themeVars(theme: Theme, accent: string): Record<string, string> {
  const on = onAccent(accent);
  if (theme === "dark") return { "--pg-bg": "#0f1113", "--pg-fg": "#f7f7f8", "--pg-card": "#1a1d21", "--pg-line": "rgba(255,255,255,0.1)", "--pg-muted": "#a6abb1", "--pg-soft": "#23272c" };
  if (theme === "color") {
    const light = on === "#ffffff";
    return {
      "--pg-bg": accent,
      "--pg-fg": on,
      "--pg-card": light ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.55)",
      "--pg-line": light ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.12)",
      "--pg-muted": light ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.6)",
      "--pg-soft": light ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.06)",
    };
  }
  return { "--pg-bg": "#f7f5f0", "--pg-fg": "#14130f", "--pg-card": "#ffffff", "--pg-line": "#e2ddd1", "--pg-muted": "#6f6a5f", "--pg-soft": "#efebe2" };
}

function Shell({ accent, theme, children }: { accent: string; theme: Theme; children: React.ReactNode }) {
  // On a colour page the accent IS the background, so buttons switch to the contrast colour.
  const btn = theme === "color" ? { "--accent": onAccent(accent), "--on-accent": accent } : { "--accent": accent, "--on-accent": onAccent(accent) };
  return (
    <div className="min-h-screen bg-[var(--pg-bg)] text-[var(--pg-fg)]" style={{ ...themeVars(theme, accent), ...btn, colorScheme: theme === "dark" ? "dark" : "light" } as React.CSSProperties}>
      <main className="mx-auto max-w-md px-5 pb-16 pt-8 animate-rise">{children}</main>
      <footer className="pb-8 text-center">
        <Link href="/" className="text-xs text-[var(--pg-muted)]/70 hover:text-[var(--pg-muted)]">Erstellt mit {site.name}</Link>
      </footer>
    </div>
  );
}

function PrimaryButton({ href, children, download }: { href: string; children: React.ReactNode; download?: boolean }) {
  return (
    <a
      href={href}
      {...(download ? {} : ugc)}
      className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-[var(--accent)] text-[15px] font-medium text-[var(--on-accent)] shadow-soft transition active:scale-[0.98]"
    >
      {children}
    </a>
  );
}

function SecondaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} {...ugc} className="flex h-13 w-full items-center justify-center gap-2.5 rounded-2xl border border-[var(--pg-line)] bg-[var(--pg-card)] py-3.5 text-[15px] font-medium transition active:scale-[0.98]">
      {children}
    </a>
  );
}

function Initials({ text }: { text: string }) {
  const letters = text.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "•";
  return (
    <span className="grid size-24 place-items-center rounded-full bg-[var(--accent)] font-display text-4xl text-[var(--on-accent)] ring-8 ring-[var(--pg-bg)]">
      {letters}
    </span>
  );
}

// ───────── vCard ─────────
function VCardPage({ code, c, links }: { code: PublicCode; c: C; links?: PageLinks }) {
  const name = [s(c.firstName), s(c.lastName)].filter(Boolean).join(" ");
  const sub = [s(c.title), s(c.company)].filter(Boolean).join(" · ");
  const address = [s(c.street), s(c.city)].filter(Boolean).join(", ");
  const quick = [
    s(c.mobile || c.phone) && { href: `tel:${s(c.mobile || c.phone).replace(/\s/g, "")}`, label: "Anrufen", icon: Phone },
    s(c.email) && { href: `mailto:${s(c.email)}`, label: "E-Mail", icon: Mail },
    s(c.website) && { href: s(c.website), label: "Website", icon: Globe },
    address && { href: mapsUrl(address), label: "Route", icon: Navigation },
  ].filter(Boolean) as { href: string; label: string; icon: typeof Phone }[];

  return (
    <>
      <div className="-mx-5 -mt-8 h-36 bg-[var(--accent)]" />
      <div className="-mt-12 flex flex-col items-center text-center">
        <Initials text={name} />
        <h1 className="mt-4 font-display text-4xl leading-tight">{name}</h1>
        {sub && <p className="mt-1 text-[var(--pg-muted)]">{sub}</p>}
      </div>
      {quick.length > 0 && (
        <div className="mt-7 grid gap-2" style={{ gridTemplateColumns: `repeat(${quick.length}, minmax(0, 1fr))` }}>
          {quick.map(({ href, label, icon: Icon }) => (
            <a key={label} href={href} {...ugc} className="flex flex-col items-center gap-1.5 rounded-2xl border border-[var(--pg-line)] bg-[var(--pg-card)] py-3 text-xs transition active:scale-95">
              <Icon className="size-5" strokeWidth={1.6} /> {label}
            </a>
          ))}
        </div>
      )}
      <div className="mt-4">
        <PrimaryButton href={links?.vcard ?? `/p/${code.slug}/vcard`} download><UserPlus className="size-5" /> Kontakt speichern</PrimaryButton>
      </div>
      <dl className="mt-6 divide-y divide-[var(--pg-line)] rounded-2xl border border-[var(--pg-line)] bg-[var(--pg-card)]">
        {[
          ["Telefon", s(c.phone)], ["Mobil", s(c.mobile)], ["E-Mail", s(c.email)],
          ["Website", s(c.website).replace(/^https?:\/\//, "")], ["Adresse", address],
        ].filter(([, v]) => v).map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-4 py-3.5 text-sm">
            <dt className="text-[var(--pg-muted)]">{k}</dt>
            <dd className="truncate text-right font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      {s(c.note) && <p className="mt-6 whitespace-pre-line text-center text-sm leading-relaxed text-[var(--pg-muted)]">{s(c.note)}</p>}
    </>
  );
}

// ───────── Links ─────────
function LinksPage({ c }: { c: C }) {
  const links = (c.links as { label: string; url: string }[]) ?? [];
  return (
    <div className="flex flex-col items-center pt-6 text-center">
      <Initials text={s(c.title)} />
      <h1 className="mt-5 font-display text-4xl">{s(c.title)}</h1>
      {s(c.bio) && <p className="mt-2 max-w-xs whitespace-pre-line text-[var(--pg-muted)]">{s(c.bio)}</p>}
      <ul className="mt-8 w-full space-y-3">
        {links.map((l, i) => (
          <li key={i}>
            <a
              href={l.url}
              {...ugc}
              className="group flex h-14 w-full items-center justify-between rounded-2xl border border-[var(--pg-line)] bg-[var(--pg-card)] px-5 text-[15px] font-medium transition hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--on-accent)] active:scale-[0.98]"
            >
              <span className="w-4" />
              {l.label}
              <ExternalLink className="size-4 opacity-40 group-hover:opacity-100" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ───────── Menu ─────────
type MenuSection = { title: string; items: { name: string; description: string; price: string; tags: string }[] };
const slugify = (t: string, i: number) => `k-${i}-${t.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

function MenuPage({ c }: { c: C }) {
  const sections = (c.sections as MenuSection[]) ?? [];
  return (
    <>
      <header className="text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent)]">Speisekarte</p>
        <h1 className="mt-2 font-display text-5xl leading-none">{s(c.name)}</h1>
        {s(c.subtitle) && <p className="mt-2 text-[var(--pg-muted)]">{s(c.subtitle)}</p>}
      </header>
      {sections.length > 1 && (
        <nav className="sticky top-0 z-10 -mx-5 mt-6 flex gap-2 overflow-x-auto border-b border-[var(--pg-line)] bg-[var(--pg-bg)]/95 px-5 py-3 backdrop-blur">
          {sections.map((sec, i) => (
            <a key={i} href={`#${slugify(sec.title, i)}`} className="shrink-0 rounded-full border border-[var(--pg-line)] bg-[var(--pg-card)] px-3.5 py-1.5 text-sm">
              {sec.title}
            </a>
          ))}
        </nav>
      )}
      <div className="mt-6 space-y-10">
        {sections.map((sec, i) => (
          <section key={i} id={slugify(sec.title, i)} className="scroll-mt-20">
            <h2 className="mb-4 flex items-center gap-3 font-display text-3xl">
              {sec.title}
              <span className="h-px flex-1 bg-line" />
            </h2>
            <ul className="space-y-5">
              {sec.items.map((item, j) => (
                <li key={j}>
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium">{item.name}</span>
                    <span className="mb-1 flex-1 border-b border-dotted border-muted/40" />
                    {item.price && <span className="font-medium tabular-nums">{/\d$/.test(item.price) ? `${item.price} €` : item.price}</span>}
                  </div>
                  {item.description && <p className="mt-0.5 text-sm leading-relaxed text-[var(--pg-muted)]">{item.description}</p>}
                  {item.tags && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {item.tags.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
                        <span key={t} className="rounded-full bg-[var(--pg-soft)] px-2 py-0.5 text-[11px] text-[var(--pg-fg)]/80">{t}</span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      {s(c.footer) && <p className="mt-12 whitespace-pre-line border-t border-[var(--pg-line)] pt-6 text-center text-xs leading-relaxed text-[var(--pg-muted)]">{s(c.footer)}</p>}
    </>
  );
}

// ───────── Review ─────────
function ReviewPage({ c }: { c: C }) {
  return (
    <div className="flex min-h-[70vh] flex-col justify-center text-center">
      <div className="flex justify-center gap-1.5 text-[var(--accent)]">
        {Array.from({ length: 5 }, (_, i) => <Star key={i} className="size-8 fill-current" strokeWidth={0} />)}
      </div>
      <h1 className="mt-6 font-display text-5xl leading-tight">{s(c.business)}</h1>
      <p className="mx-auto mt-3 max-w-xs whitespace-pre-line text-[var(--pg-muted)]">
        {s(c.message) || "Danke für deinen Besuch! Wir freuen uns sehr über deine ehrliche Bewertung."}
      </p>
      <div className="mt-10 space-y-3">
        <PrimaryButton href={s(c.googleUrl)}><Star className="size-5" /> Auf Google bewerten</PrimaryButton>
        {s(c.secondaryUrl) && <SecondaryButton href={s(c.secondaryUrl)}>Andere Plattform</SecondaryButton>}
      </div>
    </div>
  );
}

// ───────── Coupon ─────────
function CouponPage({ c }: { c: C }) {
  const valid = s(c.validUntil);
  const expired = valid && new Date(`${valid}T23:59:59`) < new Date();
  return (
    <div className="pt-6">
      <p className="text-center text-sm text-[var(--pg-muted)]">{s(c.business)}</p>
      <div className="relative mt-4 overflow-hidden rounded-[28px] bg-[var(--pg-card)] shadow-lift">
        <div className="bg-[var(--accent)] px-6 py-10 text-center text-[var(--on-accent)]">
          <p className="font-display text-7xl leading-none">{s(c.discount)}</p>
          {s(c.headline) && <p className="mt-3 opacity-80">{s(c.headline)}</p>}
        </div>
        <div className="relative border-t-2 border-dashed border-[var(--pg-line)]">
          <span className="absolute -left-4 -top-4 size-8 rounded-full bg-[var(--pg-bg)]" />
          <span className="absolute -right-4 -top-4 size-8 rounded-full bg-[var(--pg-bg)]" />
        </div>
        <div className="space-y-4 p-6 text-center">
          {s(c.code) && (
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--pg-muted)]">Dein Code</p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="rounded-xl border border-dashed border-ink/30 px-5 py-2.5 font-mono text-xl tracking-widest">{s(c.code)}</span>
                <CopyButton value={s(c.code)} />
              </div>
            </div>
          )}
          {valid && (
            <p className={expired ? "text-sm text-red-600" : "text-sm text-[var(--pg-muted)]"}>
              {expired ? "Abgelaufen am " : "Gültig bis "}
              {new Date(valid).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          )}
        </div>
      </div>
      {s(c.url) && !expired && <div className="mt-5"><PrimaryButton href={s(c.url)}>Jetzt einlösen</PrimaryButton></div>}
      {s(c.terms) && <p className="mt-6 whitespace-pre-line text-center text-xs leading-relaxed text-[var(--pg-muted)]">{s(c.terms)}</p>}
    </div>
  );
}

// ───────── PDF ─────────
function PdfPage({ c }: { c: C }) {
  const file = (c.file as { url: string; name: string } | null) ?? null;
  return (
    <div className="pt-10 text-center">
      <span className="mx-auto grid size-20 place-items-center rounded-3xl bg-[var(--accent)] text-[var(--on-accent)]">
        <FileText className="size-9" strokeWidth={1.4} />
      </span>
      <h1 className="mt-6 font-display text-4xl leading-tight">{s(c.title)}</h1>
      {s(c.description) && <p className="mt-3 whitespace-pre-line text-[var(--pg-muted)]">{s(c.description)}</p>}
      {file && (
        <div className="mt-8 space-y-3">
          <PrimaryButton href={file.url}><ExternalLink className="size-5" /> PDF öffnen</PrimaryButton>
          <a href={file.url} download={file.name} className="flex h-13 w-full items-center justify-center gap-2.5 rounded-2xl border border-[var(--pg-line)] bg-[var(--pg-card)] py-3.5 text-[15px] font-medium">
            <Download className="size-5" /> Herunterladen
          </a>
        </div>
      )}
    </div>
  );
}

// ───────── Event ─────────
function EventPage({ code, c, links }: { code: PublicCode; c: C; links?: PageLinks }) {
  const start = s(c.start) ? new Date(s(c.start)) : null;
  const end = s(c.end) ? new Date(s(c.end)) : null;
  const time = (d: Date) => d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="pt-6">
      {start && (
        <div className="mx-auto w-28 overflow-hidden rounded-3xl bg-[var(--pg-card)] text-center shadow-lift">
          <p className="bg-[var(--accent)] py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-[var(--on-accent)]">
            {start.toLocaleDateString("de-DE", { month: "short" })}
          </p>
          <p className="py-2 font-display text-6xl leading-none">{start.getDate()}</p>
          <p className="pb-2 text-xs text-[var(--pg-muted)]">{start.toLocaleDateString("de-DE", { weekday: "long" })}</p>
        </div>
      )}
      <h1 className="mt-6 text-center font-display text-5xl leading-tight">{s(c.title)}</h1>
      {start && (
        <p className="mt-2 text-center text-[var(--pg-muted)]">
          {start.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })} · {time(start)}{end ? ` – ${time(end)}` : ""} Uhr
        </p>
      )}
      {s(c.location) && (
        <a href={mapsUrl(s(c.location))} {...ugc} className="mt-6 flex items-center gap-3 rounded-2xl border border-[var(--pg-line)] bg-[var(--pg-card)] p-4 text-sm">
          <MapPin className="size-5 shrink-0 text-[var(--accent)]" /> <span className="flex-1">{s(c.location)}</span> <Navigation className="size-4 text-[var(--pg-muted)]" />
        </a>
      )}
      {s(c.description) && <p className="mt-6 whitespace-pre-line leading-relaxed text-[var(--pg-fg)]/80">{s(c.description)}</p>}
      <div className="mt-8 space-y-3">
        <PrimaryButton href={links?.ics ?? `/p/${code.slug}/ics`} download><CalendarPlus className="size-5" /> In Kalender speichern</PrimaryButton>
        {s(c.url) && <SecondaryButton href={s(c.url)}><Smartphone className="size-5" /> Tickets & Infos</SecondaryButton>}
      </div>
    </div>
  );
}


// ───────── Mini-Website ─────────
function SitePage({ c }: { c: C }) {
  const lines = (v: unknown) => s(v).split("\n").map((l) => l.trim()).filter(Boolean);
  const links = (c.links as { label: string; url: string }[]) ?? [];
  const services = lines(c.services);
  const hours = lines(c.hours);
  return (
    <div>
      <header className="-mx-5 -mt-8 bg-[var(--accent)] px-6 pb-12 pt-14 text-center text-[var(--on-accent)]">
        <h1 className="font-display text-5xl leading-[0.95]">{s(c.name)}</h1>
        {s(c.tagline) && <p className="mt-3 text-lg opacity-85">{s(c.tagline)}</p>}
        <div className="mt-7 flex justify-center gap-2">
          {s(c.phone) && <a href={`tel:${s(c.phone).replace(/\s/g, "")}`} className="inline-flex items-center gap-2 rounded-full bg-[var(--on-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--accent)]"><Phone className="size-4" /> Anrufen</a>}
          {s(c.address) && <a href={mapsUrl(s(c.address))} {...ugc} className="inline-flex items-center gap-2 rounded-full border border-current px-5 py-2.5 text-sm font-semibold"><Navigation className="size-4" /> Route</a>}
        </div>
      </header>
      {s(c.about) && (
        <section className="mt-8">
          <h2 className="font-display text-2xl">Über uns</h2>
          <p className="mt-2 whitespace-pre-line leading-relaxed text-[var(--pg-fg)]/80">{s(c.about)}</p>
        </section>
      )}
      {services.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-2xl">Leistungen</h2>
          <ul className="mt-3 grid gap-2">
            {services.map((sv) => (
              <li key={sv} className="flex items-center gap-3 rounded-2xl border border-[var(--pg-line)] bg-[var(--pg-card)] px-4 py-3 text-[15px] font-medium">
                <span className="size-2 rounded-full bg-[var(--accent)]" /> {sv}
              </li>
            ))}
          </ul>
        </section>
      )}
      {hours.length > 0 && (
        <section className="mt-8 rounded-2xl border border-[var(--pg-line)] bg-[var(--pg-card)] p-5">
          <h2 className="font-display text-xl">Öffnungszeiten</h2>
          <ul className="mt-2 space-y-1 text-sm text-[var(--pg-fg)]/80">{hours.map((h) => <li key={h}>{h}</li>)}</ul>
        </section>
      )}
      {(s(c.email) || s(c.address)) && (
        <section className="mt-8 space-y-2 text-sm">
          {s(c.address) && <a href={mapsUrl(s(c.address))} {...ugc} className="flex items-center gap-3 rounded-2xl border border-[var(--pg-line)] bg-[var(--pg-card)] p-4"><MapPin className="size-5 shrink-0 text-[var(--accent)]" /> {s(c.address)}</a>}
          {s(c.email) && <a href={`mailto:${s(c.email)}`} className="flex items-center gap-3 rounded-2xl border border-[var(--pg-line)] bg-[var(--pg-card)] p-4"><Mail className="size-5 shrink-0 text-[var(--accent)]" /> {s(c.email)}</a>}
        </section>
      )}
      {links.length > 0 && (
        <div className="mt-8 space-y-2.5">
          {links.map((l, i) => <SecondaryButton key={i} href={l.url}>{l.label} <ExternalLink className="size-4 opacity-50" /></SecondaryButton>)}
        </div>
      )}
    </div>
  );
}

/** Download targets that differ when the page runs without a server (page-in-code). */
export interface PageLinks {
  vcard?: string;
  ics?: string;
}

export function HostedPage({ code, links }: { code: PublicCode; links?: PageLinks }) {
  const c = code.content;
  const accent = /^#[0-9a-fA-F]{6}$/.test(s(c.accent)) ? s(c.accent) : "#d42a4e";
  let body: React.ReactNode = null;
  switch (code.type) {
    case "vcard": body = <VCardPage code={code} c={c} links={links} />; break;
    case "links": body = <LinksPage c={c} />; break;
    case "menu": body = <MenuPage c={c} />; break;
    case "review": body = <ReviewPage c={c} />; break;
    case "coupon": body = <CouponPage c={c} />; break;
    case "pdf": body = <PdfPage c={c} />; break;
    case "event": body = <EventPage code={code} c={c} links={links} />; break;
    case "site": body = <SitePage c={c} />; break;
  }
  const theme: Theme = c.theme === "dark" || c.theme === "color" ? c.theme : "light";
  return <Shell accent={accent} theme={theme}>{body}</Shell>;
}

export function hostedTitle(code: PublicCode): string {
  const c = code.content;
  return s(c.title) || s(c.name) || s(c.business) || [s(c.firstName), s(c.lastName)].filter(Boolean).join(" ") || code.name;
}
