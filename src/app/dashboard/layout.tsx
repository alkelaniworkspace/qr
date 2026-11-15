import { redirect } from "next/navigation";
import { LogOut, Plus } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { ButtonLink } from "@/components/ui/button";
import { DashboardNav } from "@/components/dashboard/nav";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { PLANS, planOf } from "@/lib/plans";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard");

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("full_name, plan").eq("id", user.id).maybeSingle();
  const plan = PLANS[planOf(profile?.plan)];
  const displayName = profile?.full_name || user.email.split("@")[0];

  return (
    <div className="ambient min-h-screen">
      <header className="sticky top-0 z-40 border-b border-edge bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <Logo href="/dashboard" />
            <span className="badge bg-brand text-on-brand">{plan.label}</span>
          </div>
          <div className="hidden flex-1 md:block"><DashboardNav /></div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:block"><ButtonLink href="/dashboard/new" size="sm"><Plus className="size-4" /> Neuer Code</ButtonLink></span>
            <span className="hidden items-center gap-2 rounded-xl border border-edge bg-surface px-3 py-1.5 text-sm font-semibold lg:flex">
              <span className="grid size-6 place-items-center rounded-lg bg-brand font-display text-xs text-on-brand">{displayName.charAt(0).toUpperCase()}</span>
              {displayName}
            </span>
            <form action="/auth/signout" method="post">
              <button className="grid size-9 place-items-center rounded-xl text-dim transition hover:bg-white/5 hover:text-fg" aria-label="Abmelden" title="Abmelden">
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>
        <div className="border-t border-edge px-5 py-2 md:hidden"><DashboardNav /></div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">{children}</main>
    </div>
  );
}
