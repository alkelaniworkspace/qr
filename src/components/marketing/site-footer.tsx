import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-edge">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-dim">{site.description}</p>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-faint">Produkt</p>
          <ul className="space-y-2 text-sm text-dim">
            <li><Link href="/create" className="hover:text-lime">Studio</Link></li>
            <li><Link href="/#funktionen" className="hover:text-lime">Funktionen</Link></li>
            <li><Link href="/#preise" className="hover:text-lime">Preise</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-faint">Rechtliches</p>
          <ul className="space-y-2 text-sm text-dim">
            <li><Link href="/impressum" className="hover:text-lime">Impressum</Link></li>
            <li><Link href="/datenschutz" className="hover:text-lime">Datenschutz</Link></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto max-w-7xl border-t border-edge px-5 py-6 text-xs text-faint sm:px-8">
        © {new Date().getFullYear()} {site.name}. QR Code ist eine eingetragene Marke der DENSO WAVE INCORPORATED.
      </div>
    </footer>
  );
}
