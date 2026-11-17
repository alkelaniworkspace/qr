import type { Metadata } from "next";
import { Suspense } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { getShellData } from "@/lib/shell-data";
import { Wizard } from "@/components/studio/wizard";

export const metadata: Metadata = {
  title: "QR-Code Studio – kostenlos, ohne Anmeldung",
  description: "QR-Codes in 4 Schritten: Typ wählen, Inhalt eingeben, Design anpassen, als Poster von A6 bis A0 drucken. Mit Google-Bewertungslink, Mini-Website, Speisekarte und mehr.",
};

export default async function StudioPage() {
  const { user, plan, admin, suspended } = await getShellData();
  return (
    <AppShell user={user} plan={plan} admin={admin} suspended={suspended}>
      <main className="w-full flex-1 px-5 pb-24 pt-6 sm:px-8 lg:pt-8">
        <Suspense>
          <Wizard />
        </Suspense>
      </main>
    </AppShell>
  );
}
