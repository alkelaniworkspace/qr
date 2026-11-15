import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/app-shell";
import { getShellData } from "@/lib/shell-data";
import { ClaimGuestCodes } from "@/components/dashboard/claim-guest-codes";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard");
  const { user: shellUser, plan } = await getShellData();

  return (
    <AppShell user={shellUser} plan={plan}>
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-10"><ClaimGuestCodes />{children}</main>
    </AppShell>
  );
}
