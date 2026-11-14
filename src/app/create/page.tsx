import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Studio } from "@/components/studio/studio";

export const metadata: Metadata = {
  title: "QR-Code Generator kostenlos – mit Logo, Farben & Rahmen",
  description: "Kostenloser QR-Code Generator ohne Anmeldung: Website, WLAN, Visitenkarte, E-Mail. Mit Logo, Farbverlauf, Rahmen und echtem Lesbarkeitstest. Download als PNG und SVG.",
};

export default function CreatePage() {
  return (
    <>
      <SiteHeader />
      <main className="ambient mx-auto w-full max-w-7xl flex-1 px-5 pb-20 pt-10 sm:px-8">
        <Studio variant="public" />
      </main>
      <SiteFooter />
    </>
  );
}
