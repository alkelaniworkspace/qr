import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ButtonLink } from "@/components/ui/button";
import { getSessionUser } from "@/lib/supabase/server";

const NAV = [
  { href: "/#funktionen", label: "Funktionen" },
  { href: "/#designs", label: "Designs" },
  { href: "/#versprechen", label: "Versprechen" },
  { href: "/#preise", label: "Preise" },
];

export async function SiteHeader() {
  const user = await getSessionUser().catch(() => null);
  return (
    <header className="sticky top-0 z-40 border-b border-edge bg-bg/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-xl px-3.5 py-2 text-sm font-medium text-dim transition hover:bg-white/5 hover:text-fg">
              {n.label}
            </Link>
          ))}
          <Link href="/create" className="ml-1 rounded-xl px-3.5 py-2 text-sm font-medium text-lime transition hover:bg-lime/10">
            Studio
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <ButtonLink href="/dashboard" size="sm">Dashboard</ButtonLink>
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
