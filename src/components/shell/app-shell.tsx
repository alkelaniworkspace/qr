"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, Check, ChevronRight, ChevronsUpDown, Clapperboard, ClipboardList, CreditCard, FolderOpen, HelpCircle, LayoutTemplate, LogIn, LogOut, Menu,
  Bell, Gem, Moon, PenLine, Plus, Printer, Shapes, Sparkles, Sticker, Sun, Palette, UserRound, X, Zap,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/cn";
import { StudioNavProvider, useStudioNav, type Output } from "./studio-nav";

export interface ShellUser {
  name: string;
  email: string;
}
export interface ShellPlan {
  id: string;
  label: string;
  used: number;
  /** null = unlimited */
  limit: number | null;
}

/**
 * Application frame for the studio and the dashboard: a sidebar with
 * workspace navigation, the create-code path (numbered steps with
 * sub-menus), plan usage and the account. On phones it becomes a drawer.
 */
export function AppShell({ user, plan, localCodes = 0, children }: { user: ShellUser | null; plan: ShellPlan | null; localCodes?: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // eslint-disable-next-line react-hooks/set-state-in-effect -- close the drawer after navigating
  useEffect(() => setOpen(false), [pathname]);

  return (
    <StudioNavProvider>
      <div className="ambient min-h-screen lg:grid lg:grid-cols-[288px_minmax(0,1fr)]">
        {/* phone top bar */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-edge bg-bg/85 px-4 backdrop-blur-xl lg:hidden">
          <button type="button" onClick={() => setOpen(true)} aria-label="Menü öffnen" className="grid size-10 place-items-center rounded-xl border border-edge bg-surface"><Menu className="size-5" /></button>
          <Logo href={user ? "/dashboard" : "/"} />
          <Link href="/studio" className="btn-cta ml-auto inline-flex h-10 items-center gap-1.5 rounded-xl px-3.5 text-sm font-semibold"><Plus className="size-4" /> Neu</Link>
        </header>

        {/* drawer backdrop */}
        <div onClick={() => setOpen(false)} className={cn("fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition lg:hidden", open ? "opacity-100" : "pointer-events-none opacity-0")} />

        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[288px] flex-col border-r border-edge bg-[color-mix(in_srgb,var(--color-bg)_88%,transparent)] backdrop-blur-2xl transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}>
          <div className="flex h-16 shrink-0 items-center justify-between px-5">
            <span className="flex items-center gap-2">
              <Logo href={user ? "/dashboard" : "/"} />
              <span className="rounded-md bg-hi/[0.07] px-1.5 py-0.5 text-[11px] font-semibold text-dim">Studio</span>
            </span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Menü schließen" className="grid size-9 place-items-center rounded-lg text-dim hover:bg-hi/5 lg:hidden"><X className="size-4" /></button>
          </div>
          <SidebarBody user={user} />
          <SidebarFooter user={user} plan={plan} localCodes={localCodes} />
        </aside>

        <div className="relative min-w-0">
          <div className="pointer-events-none absolute right-8 top-6 z-30 hidden items-center gap-2 lg:flex">
            {user ? (
              plan?.id !== "business" && (
                <Link href="/dashboard/billing" className="btn-cta pointer-events-auto inline-flex h-10 items-center gap-2 rounded-full px-4 text-[14px] font-semibold"><Gem className="size-4" /> Upgrade</Link>
              )
            ) : (
              <>
                <Link href="/login" className="pointer-events-auto inline-flex h-10 items-center rounded-full px-4 text-[14px] font-semibold text-dim hover:text-fg">Anmelden</Link>
                <Link href="/signup" className="btn-cta pointer-events-auto inline-flex h-10 items-center gap-2 rounded-full px-4 text-[14px] font-semibold"><Sparkles className="size-4" /> Kostenlos starten</Link>
              </>
            )}
          </div>
          {children}
        </div>
      </div>
    </StudioNavProvider>
  );
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mt-6 first:mt-2">
      <div className="mb-2 flex items-center gap-3 px-3">
        <span className="text-[12px] font-medium text-faint">{title}</span>
        <span className="h-px flex-1 bg-gradient-to-r from-edge to-transparent" />
        {action}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NavItem({ href, icon: Icon, label, active, badge, onClick }: { href?: string; icon: typeof Zap; label: string; active?: boolean; badge?: React.ReactNode; onClick?: () => void }) {
  const cls = cn(
    "nav-item group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium transition",
    active ? "is-active text-fg" : "text-dim hover:bg-hi/[0.05] hover:text-fg",
  );
  const inner = (
    <>
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg transition", active ? "bg-brand text-on-brand shadow-[0_0_20px_-4px_rgb(var(--glow)/0.55)]" : "bg-hi/[0.05] text-dim group-hover:text-fg")}>
        <Icon className="size-[17px]" strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge}
    </>
  );
  return href ? <Link href={href} className={cls}>{inner}</Link> : <button type="button" onClick={onClick} className={cls}>{inner}</button>;
}

function SidebarBody({ user }: { user: ShellUser | null }) {
  const pathname = usePathname();
  const nav = useStudioNav();
  const inStudio = pathname.startsWith("/studio");
  const codesHref = user ? "/dashboard/codes" : "/codes";

  return (
    <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 [scrollbar-width:thin]">
      <Section title="Arbeitsbereich">
        <NavItem href="/studio" icon={Plus} label="Code erstellen" active={inStudio} />
        <NavItem href={codesHref} icon={FolderOpen} label="Meine Codes" active={pathname.startsWith("/codes") || pathname.startsWith("/dashboard/codes")} />
        <NavItem href="/studio#vorlagen" icon={LayoutTemplate} label="Vorlagen" />
        {user && <NavItem href="/dashboard" icon={BarChart3} label="Übersicht" active={pathname === "/dashboard"} />}
        {user && <NavItem href="/dashboard/forms" icon={ClipboardList} label="Formulare" active={pathname.startsWith("/dashboard/forms")} />}
      </Section>

      {inStudio && nav && (
        <Section title="Code erstellen">
          <Steps />
        </Section>
      )}

      <Section title="Mehr">
        {user && <NavItem href="/dashboard/billing" icon={CreditCard} label="Tarif & Rechnungen" active={pathname.startsWith("/dashboard/billing")} />}
        <NavItem href="/#funktionen" icon={Sparkles} label="Funktionen" />
        <NavItem href="/#preise" icon={Zap} label="Preise" />
        <NavItem href="mailto:hallo@qlick.codes" icon={HelpCircle} label="Hilfe & Kontakt" />
      </Section>
    </nav>
  );
}

const STEP_ICONS = [Shapes, PenLine, Palette, Printer];
const OUTPUTS: { id: Output; label: string; icon: typeof Zap }[] = [
  { id: "print", label: "Poster & Druck", icon: Printer },
  { id: "sticker", label: "Sticker", icon: Sticker },
  { id: "motion", label: "Animation & Video", icon: Clapperboard },
];

function Steps() {
  const nav = useStudioNav()!;
  const items = [
    { n: 1, label: "Typ", sub: nav.typeLabel },
    { n: 2, label: "Inhalt", sub: nav.name || "Texte, Bilder, Links" },
    { n: 3, label: "Design", sub: nav.designLabel || "Farben und Formen" },
    { n: 4, label: "Druck & Download", sub: "Poster, Sticker, Video" },
  ];
  return (
    <ol className="relative">
      {items.map((it, i) => {
        const active = nav.step === it.n;
        const done = it.n < nav.step || (it.n <= nav.reached && !active);
        const Icon = STEP_ICONS[i];
        const enabled = it.n <= nav.reached || it.n === nav.step + 1;
        return (
          <li key={it.n} className="relative">
            {i < items.length - 1 && <span className={cn("absolute left-[27px] top-11 h-[calc(100%-28px)] w-px", it.n < nav.reached ? "bg-gradient-to-b from-brand/70 to-brand/20" : "bg-edge")} />}
            <button
              type="button"
              disabled={!enabled}
              onClick={() => nav.go(it.n)}
              className={cn("group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-45", active ? "bg-hi/[0.06]" : "hover:bg-hi/[0.04]")}
            >
              <span className={cn(
                "relative grid size-8 shrink-0 place-items-center rounded-full border text-[13px] font-semibold transition",
                active ? "step-pulse border-brand bg-brand text-on-brand" : done ? "border-brand/50 bg-brand/10 text-fg" : "border-edge-strong text-dim",
              )}>
                {done && !active ? <Check className="size-4" strokeWidth={2.5} /> : it.n}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block truncate text-[14px] font-semibold", active ? "text-fg" : "text-dim")}>{it.label}</span>
                <span className="block truncate text-[12px] text-faint">{it.sub}</span>
              </span>
              <Icon className={cn("size-4 shrink-0 transition", active ? "text-fg" : "text-faint opacity-0 group-hover:opacity-100")} />
            </button>
            {it.n === 4 && nav.step === 4 && (
              <div className="mb-1 ml-[27px] mt-0.5 space-y-0.5 border-l border-edge pl-4">
                {OUTPUTS.map((o) => (
                  <button key={o.id} type="button" onClick={() => nav.setOutput(o.id)} className={cn("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition", nav.output === o.id ? "bg-brand/10 text-fg" : "text-dim hover:bg-hi/[0.04] hover:text-fg")}>
                    <o.icon className={cn("size-4", nav.output === o.id ? "text-fg" : "text-faint")} />
                    {o.label}
                    {nav.output === o.id && <ChevronRight className="ml-auto size-3.5 text-faint" />}
                  </button>
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function SidebarFooter({ user, plan, localCodes }: { user: ShellUser | null; plan: ShellPlan | null; localCodes: number }) {
  const [menu, setMenu] = useState(false);
  const pct = plan && plan.limit ? Math.min(100, Math.round((plan.used / plan.limit) * 100)) : plan ? 100 : 0;
  const left = plan && plan.limit !== null ? Math.max(0, plan.limit - plan.used) : null;
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- theme lives on <html>
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  }, []);
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("scanwerk.theme", next); } catch { /* not remembered */ }
    setTheme(next);
  };

  return (
    <div className="shrink-0 space-y-2 border-t border-edge p-3">
      {plan?.id !== "business" && (
        <Link href="/#preise" className="group flex items-center gap-2.5 rounded-xl px-3 py-2 text-[14px] font-semibold text-[#ff4f9a] transition hover:bg-[#ff2e88]/10">
          <Gem className="size-4" /> Preise
          <span className="sale-pill ml-auto rounded-md px-1.5 py-0.5 text-[11px] font-bold text-white">−40 %</span>
        </Link>
      )}
      {/* plan / usage card */}
      <div className="plan-card relative overflow-hidden rounded-2xl border border-edge p-3.5">
        <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-lime/20 blur-3xl" />
        <div className="relative flex items-center gap-2">
          <span className="plan-pill rounded-md px-2 py-0.5 text-[12px] font-bold text-night">{plan?.label ?? "Gast"}</span>
          <span className="truncate text-[12px] text-dim">{plan ? (plan.limit === null ? "Unbegrenzt dynamisch" : "Dynamische Codes") : "Ohne Konto, im Browser"}</span>
        </div>
        {plan ? (
          <>
            <div className="relative mt-3 flex items-baseline justify-between text-[13px]">
              <span className="font-semibold text-fg">{plan.used}{plan.limit !== null && <span className="font-normal text-faint"> / {plan.limit}</span>}</span>
              <span className="text-[12px] text-faint">{left === null ? "∞" : left === 0 ? "Limit erreicht" : `${left} frei`}</span>
            </div>
            <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-hi/[0.08]">
              <div className="usage-bar h-full rounded-full" style={{ width: `${Math.max(pct, 4)}%` }} />
            </div>
            {plan.id !== "business" && (
              <Link href="/dashboard/billing" className="relative mt-3 flex items-center justify-between text-[13px] font-semibold text-fg hover:underline">
                Mehr Codes freischalten <ChevronRight className="size-4" />
              </Link>
            )}
          </>
        ) : (
          <>
            <p className="relative mt-2.5 text-[13px] text-dim">{localCodes > 0 ? `${localCodes} ${localCodes === 1 ? "Code" : "Codes"} in diesem Browser gespeichert.` : "Statische Codes sind kostenlos und unbegrenzt."}</p>
            <Link href="/signup" className="relative mt-3 flex items-center justify-between text-[13px] font-semibold text-fg hover:underline">
              Kostenloses Konto erstellen <ChevronRight className="size-4" />
            </Link>
          </>
        )}
      </div>

      {/* account */}
      <div className="relative">
        {menu && (
          <div className="absolute bottom-full left-0 z-10 mb-2 w-[300px] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border border-edge bg-solid p-2 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] animate-rise">
            <div className="flex items-center gap-3 rounded-xl px-2.5 py-2">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-hi/[0.08] text-[15px] font-semibold">{user ? user.name.charAt(0).toUpperCase() : <UserRound className="size-4" />}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold">{user ? user.name : "Gast"}</span>
                <span className="block truncate text-[12px] text-faint">{plan ? `${plan.label}-Tarif` : "Ohne Konto"}</span>
              </span>
            </div>
            {plan && (
              <div className="mt-1 rounded-xl bg-hi/[0.04] p-3">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-semibold">Dynamische Codes</span>
                  <span className="text-faint">{plan.limit === null ? "unbegrenzt" : `${Math.max(0, plan.limit - plan.used)} übrig`}</span>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-[5px]" aria-hidden>
                  {Array.from({ length: 24 }, (_, i) => <span key={i} className={cn("meter-dot", (plan.limit === null || i < Math.round((plan.used / Math.max(1, plan.limit)) * 24)) && "on")} style={{ transitionDelay: `${i * 18}ms` }} />)}
                </div>
                {plan.id !== "business" && (
                  <Link href="/dashboard/billing" className="mt-3 flex items-center justify-between rounded-lg px-1 text-[13px] font-semibold">
                    <span className="flex items-center gap-2"><Gem className="size-4 text-faint" /> Mehr Codes</span>
                    <span className="btn-cta rounded-full px-3 py-1 text-[12px]">Upgrade</span>
                  </Link>
                )}
              </div>
            )}
            <div className="mt-1 space-y-0.5">
              <button type="button" onClick={toggleTheme} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-dim hover:bg-hi/5 hover:text-fg">
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />} {theme === "dark" ? "Helles Design" : "Dunkles Design"}
                <span className={cn("ml-auto h-5 w-9 rounded-full p-0.5 transition", theme === "light" ? "bg-cta" : "bg-hi/15")}><span className={cn("block size-4 rounded-full bg-white transition", theme === "light" && "translate-x-4")} /></span>
              </button>
              {user && <Link href="/dashboard" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-dim hover:bg-hi/5 hover:text-fg"><Bell className="size-4" /> Übersicht & Statistik</Link>}
              {user && <Link href="/dashboard/billing" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-dim hover:bg-hi/5 hover:text-fg"><CreditCard className="size-4" /> Konto & Tarif</Link>}
              <a href="mailto:hallo@qlick.codes" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-dim hover:bg-hi/5 hover:text-fg"><HelpCircle className="size-4" /> Hilfecenter</a>
            </div>
            <div className="mt-1 border-t border-edge pt-1">
              {user ? (
                <form action="/auth/signout" method="post">
                  <button className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-dim hover:bg-hi/5 hover:text-fg"><LogOut className="size-4" /> Abmelden</button>
                </form>
              ) : (
                <Link href="/login" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-dim hover:bg-hi/5 hover:text-fg"><LogIn className="size-4" /> Anmelden</Link>
              )}
            </div>
          </div>
        )}
        <button type="button" onClick={() => setMenu((v) => !v)} aria-expanded={menu} className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition hover:bg-hi/[0.05]">
          <span className="avatar-ring relative grid size-10 shrink-0 place-items-center rounded-full">
            <span className="grid size-[34px] place-items-center rounded-full bg-solid text-[14px] font-semibold text-fg">
              {user ? user.name.charAt(0).toUpperCase() : <UserRound className="size-4" />}
            </span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-semibold text-fg">{user ? user.name : "Gast"}</span>
            <span className="block truncate text-[12px] text-faint">{user ? user.email : "Nicht angemeldet"}</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-faint" />
        </button>
      </div>
    </div>
  );
}
