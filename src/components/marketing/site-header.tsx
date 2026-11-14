import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ButtonLink } from "@/components/ui/button";
import { getSessionUser } from "@/lib/supabase/server";

export async function SiteHeader() {
  const user = await getSessionUser().catch(() => null);
  return (
    <header className="relative z-20">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-ink-soft md:flex">
          <Link href="/#funktionen" className="hover:text-ink">Funktionen</Link>
          <Link href="/#versprechen" className="hover:text-ink">Versprechen</Link>
          <Link href="/#preise" className="hover:text-ink">Preise</Link>
          <Link href="/create" className="hover:text-ink">Studio testen</Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <ButtonLink href="/dashboard" size="sm">Zum Dashboard</ButtonLink>
          ) : (
            <>
              <span className="hidden sm:block"><ButtonLink href="/login" variant="ghost" size="sm">Anmelden</ButtonLink></span>
              <ButtonLink href="/signup" size="sm">Kostenlos starten</ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
