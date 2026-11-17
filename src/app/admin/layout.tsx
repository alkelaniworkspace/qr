import type { Metadata } from "next";
import { AppShell } from "@/components/shell/app-shell";
import { getShellData } from "@/lib/shell-data";
import { requireAdmin } from "@/lib/admin";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const { user, plan, admin } = await getShellData();
  return (
    <AppShell user={user} plan={plan} admin={admin}>
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm text-dim"><span className="size-2 rounded-full bg-lime shadow-[0_0_10px_#bdfb04]" /> Verwaltung</p>
            <h1 className="mt-1 font-display text-5xl leading-none">Admin</h1>
          </div>
        </div>
        <AdminNav />
        {children}
      </main>
    </AppShell>
  );
}
