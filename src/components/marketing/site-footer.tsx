import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 md:grid-cols-[1fr_auto]">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-muted">{site.description}</p>
        </div>
        <nav className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-ink-soft">
          <Link href="/create" className="hover:text-ink">Studio</Link>
          <Link href="/#preise" className="hover:text-ink">Preise</Link>
          <Link href="/impressum" className="hover:text-ink">Impressum</Link>
          <Link href="/datenschutz" className="hover:text-ink">Datenschutz</Link>
        </nav>
      </div>
      <div className="mx-auto max-w-7xl px-5 pb-10 text-xs text-muted sm:px-8">
        © {new Date().getFullYear()} {site.name}. QR Code ist eine eingetragene Marke der DENSO WAVE INCORPORATED.
      </div>
    </footer>
  );
}
