import Link from "next/link";
import { Plus } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LangSwitch } from "@/components/i18n/lang-provider";
import { getSessionUser } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n-server";

/** Everything works without an account; signing in adds the dashboard. */
export async function SiteHeader() {
  const [user, { T }] = await Promise.all([getSessionUser().catch(() => null), getT()]);
  const nav = [
    { href: "/studio", label: "Studio" },
    { href: "/codes", label: T("Meine Codes", "My codes") },
    { href: "/#designs", label: "Designs" },
    { href: "/#funktionen", label: T("Funktionen", "Features") },
    { href: "/preise", label: T("Preise", "Pricing"), badge: "−40 %" },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-edge bg-bg/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-6 px-5 sm:px-8 lg:gap-10">
        <Logo />
        <nav className="hidden items-center gap-0.5 md:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="nav-link relative rounded-xl px-3 py-2 text-[14px] font-medium text-dim transition hover:text-fg">
              {n.label}
              {n.badge && <span className="ml-1.5 rounded-full bg-lime px-1.5 py-px align-[1px] text-[10px] font-bold text-[#0a0a0b]">{n.badge}</span>}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <LangSwitch className="hidden sm:inline-flex" />
          <ThemeToggle />
          {user ? (
            <span className="hidden sm:block"><ButtonLink href="/dashboard" variant="ghost" size="sm">Dashboard</ButtonLink></span>
          ) : (
            <span className="hidden sm:block"><ButtonLink href="/login" variant="ghost" size="sm">{T("Anmelden", "Sign in")}</ButtonLink></span>
          )}
          <ButtonLink href="/studio" size="sm" className="shine"><Plus className="size-4" /> <span className="hidden sm:inline">{T("Code erstellen", "Create code")}</span><span className="sm:hidden">{T("Erstellen", "Create")}</span></ButtonLink>
        </div>
      </div>
    </header>
  );
}
