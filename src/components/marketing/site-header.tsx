import Link from "next/link";
import { Plus } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getSessionUser } from "@/lib/supabase/server";

const NAV = [
  { href: "/studio", label: "Studio" },
  { href: "/codes", label: "Meine Codes" },
  { href: "/#designs", label: "Designs" },
  { href: "/#funktionen", label: "Funktionen" },
  { href: "/#preise", label: "Preise" },
];

/** Everything works without an account; signing in adds the dashboard. */
export async function SiteHeader() {
  const user = await getSessionUser().catch(() => null);
  return (
    <header className="sticky top-0 z-40 border-b border-edge bg-bg/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-6 px-5 sm:px-8">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-xl px-3.5 py-2 text-sm font-medium text-dim transition hover:bg-hi/5 hover:text-fg">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <span className="hidden sm:block"><ButtonLink href="/dashboard" variant="ghost" size="sm">Dashboard</ButtonLink></span>
          ) : (
            <span className="hidden sm:block"><ButtonLink href="/login" variant="ghost" size="sm">Anmelden</ButtonLink></span>
          )}
          <ButtonLink href="/studio" size="sm"><Plus className="size-4" /> <span className="hidden sm:inline">Code erstellen</span><span className="sm:hidden">Erstellen</span></ButtonLink>
        </div>
      </div>
    </header>
  );
}
