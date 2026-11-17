import type { Metadata } from "next";
import { AppShell } from "@/components/shell/app-shell";
import { getShellData } from "@/lib/shell-data";
import { LocalCodes } from "@/components/studio/local-codes";

export const metadata: Metadata = { title: "Meine Codes" };

export default async function CodesPage() {
  const { user, plan, admin, suspended } = await getShellData();
  return (
    <AppShell user={user} plan={plan} admin={admin} suspended={suspended}>
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 pb-24 pt-8 sm:px-8 lg:pt-10">
        <LocalCodes />
      </main>
    </AppShell>
  );
}
