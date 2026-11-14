import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/ui/logo";
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

  const account = (
    <div className="flex items-center gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink font-display text-lg text-gold-soft">
        {displayName.charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-medium">{displayName}</p>
        <p className="truncate text-xs text-muted">Tarif {plan.label}</p>
      </div>
      <form action="/auth/signout" method="post">
        <button className="grid size-8 place-items-center rounded-lg text-muted hover:bg-white hover:text-ink" aria-label="Abmelden" title="Abmelden">
          <LogOut className="size-4" />
        </button>
      </form>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-sand/50 px-4 py-6 lg:flex">
        <div className="px-2"><Logo href="/dashboard" /></div>
        <div className="mt-10 flex-1"><DashboardNav /></div>
        <div className="rounded-2xl border border-line bg-paper p-3">{account}</div>
      </aside>
      <header className="border-b border-line bg-sand/50 px-4 pt-4 lg:hidden">
        <div className="flex items-center justify-between"><Logo href="/dashboard" />{account}</div>
        <div className="mt-3 pb-3"><DashboardNav horizontal /></div>
      </header>
      <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
