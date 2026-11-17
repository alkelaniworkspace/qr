import Link from "next/link";
import { ArrowRight, Cookie, Infinity as InfinityIcon, Mail, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LangSwitch } from "@/components/i18n/lang-provider";
import { site } from "@/lib/site";
import { getT } from "@/lib/i18n-server";

export async function SiteFooter() {
  const { T } = await getT();
  const cols: { title: string; links: [string, string][] }[] = [
    { title: T("Produkt", "Product"), links: [
      ["/studio", "Studio"], ["/codes", T("Meine Codes", "My codes")], ["/#designs", "Designs"], ["/#funktionen", T("Funktionen", "Features")], ["/preise", T("Preise", "Pricing")], ["/dashboard", "Dashboard"],
    ] },
    { title: T("QR-Codes für", "QR codes for"), links: [
      ["/studio?type=menu", T("Speisekarte", "Restaurant menu")], ["/studio?type=review", T("Google-Bewertungen", "Google reviews")], ["/studio?type=wifi", T("WLAN-Zugang", "Wi-Fi access")],
      ["/studio?type=vcard", T("Visitenkarte", "Business card")], ["/studio?type=links", T("Link-Seite", "Link page")], ["/studio?type=poll", T("Umfrage", "Poll")], ["/studio?type=event", T("Event mit Anmeldung", "Event with sign-up")],
    ] },
    { title: T("Druck & Video", "Print & video"), links: [
      ["/studio", T("Poster A6 bis A0", "Posters A6 to A0")], ["/studio", T("Tischaufsteller", "Table tents")], ["/studio", T("Sticker mit Schnittkante", "Stickers with cut line")], ["/studio", T("Animation als MP4", "Animation as MP4")],
    ] },
    { title: T("Hilfe & Rechtliches", "Help & legal"), links: [
      ["/hilfe", T("Hilfe & Kontakt", "Help & contact")], ["/impressum", T("Impressum", "Legal notice")], ["/datenschutz", T("Datenschutz", "Privacy")],
      ["/agb", T("AGB", "Terms")], ["/widerruf", T("Widerrufsbelehrung", "Right of withdrawal")], ["/kuendigen", T("Verträge hier kündigen", "Cancel contract")],
    ] },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-edge">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        {/* top: pitch + CTA */}
        <div className="flex flex-col gap-6 border-b border-edge py-12 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-display text-[28px] leading-tight sm:text-[36px]">{T("Dein nächster Code ist", "Your next code is")} <span className="glow-text">{T("zwei Minuten", "two minutes")}</span> {T("entfernt.", "away.")}</p>
            <p className="mt-2 text-[15px] text-dim">{T("Kostenlos, ohne Anmeldung, in 4 Schritten fertig.", "Free, no sign-up, done in 4 steps.")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/studio" className="btn-cta shine inline-flex h-12 items-center gap-2 rounded-full px-6 text-[15px] font-semibold">{T("Code erstellen", "Create a code")} <ArrowRight className="size-4" /></Link>
            <a href={`mailto:${site.email}`} className="inline-flex h-12 items-center gap-2 rounded-full border border-edge-strong px-5 text-[15px] font-semibold hover:bg-hi/[0.05]"><Mail className="size-4" /> {site.email}</a>
          </div>
        </div>

        {/* links */}
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-dim">{T(site.description, "Design QR codes that fit your brand. Dynamic, measurable, GDPR-compliant and working forever.")}</p>
            <ul className="mt-6 space-y-2.5 text-[13px] text-dim">
              <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-lime-ink" /> {T("DSGVO-konform", "GDPR-compliant")}</li>
              <li className="flex items-center gap-2"><Cookie className="size-4 text-lime-ink" /> {T("Statistik ohne Cookies", "Cookie-free statistics")}</li>
              <li className="flex items-center gap-2"><InfinityIcon className="size-4 text-lime-ink" /> {T("Statische Codes für immer gratis", "Static codes free forever")}</li>
            </ul>
            <div className="mt-6 flex items-center gap-2"><LangSwitch /><ThemeToggle /></div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <p className="mb-4 text-[13px] font-semibold text-fg">{c.title}</p>
              <ul className="space-y-2.5 text-[14px] text-dim">
                {c.links.map(([href, label]) => (
                  <li key={label}><Link href={href} className="footer-link inline-block transition hover:translate-x-0.5 hover:text-fg">{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* giant wordmark */}
      <div aria-hidden className="footer-mark pointer-events-none select-none text-center font-display leading-[0.75] tracking-[-0.07em]">{site.name.toLowerCase()}</div>

      <div className="relative border-t border-edge">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-5 py-6 text-[12px] text-faint sm:flex-row sm:justify-between sm:px-8">
          <span>© {new Date().getFullYear()} {site.name}. {T("Alle Rechte vorbehalten.", "All rights reserved.")}</span>
          <span>{T("QR Code ist eine eingetragene Marke der DENSO WAVE INCORPORATED.", "QR Code is a registered trademark of DENSO WAVE INCORPORATED.")}</span>
        </div>
      </div>
    </footer>
  );
}
