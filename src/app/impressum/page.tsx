import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export const metadata: Metadata = { title: "Impressum", robots: { index: false } };

// TODO(legal): Vor dem Livegang durch rechtssicheren Text ersetzen (z. B. von einer IT-Rechtskanzlei).
export default function Page() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-16 sm:px-8">
        <h1 className="font-display text-5xl uppercase">Impressum</h1>
        <p className="mt-6 rounded-2xl border border-gold/30 bg-gold/10 p-5 text-sm text-gold">
          Platzhalter: Dieser Text muss vor dem Livegang mit den echten Angaben ersetzt werden.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
