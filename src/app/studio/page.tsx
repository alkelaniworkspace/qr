import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/marketing/site-header";
import { Wizard } from "@/components/studio/wizard";

export const metadata: Metadata = {
  title: "QR-Code Studio – kostenlos, ohne Anmeldung",
  description: "QR-Codes in 4 Schritten: Typ wählen, Inhalt eingeben, Design anpassen, als Poster von A6 bis A0 drucken. Mit Google-Bewertungslink, Mini-Website, Speisekarte und mehr.",
};

export default function StudioPage() {
  return (
    <>
      <SiteHeader />
      <main className="ambient w-full flex-1 px-5 pb-24 sm:px-8">
        <Suspense>
          <Wizard />
        </Suspense>
      </main>
    </>
  );
}
