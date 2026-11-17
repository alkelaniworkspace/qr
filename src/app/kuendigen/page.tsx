import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { CancelForm } from "@/components/marketing/cancel-form";

export const metadata: Metadata = { title: "Verträge hier kündigen", description: "Kündige dein Qlick-Abo ohne Anmeldung." };

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16 sm:px-8">
        <h1 className="font-display text-5xl leading-tight">Verträge hier kündigen</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-dim">Hier kannst du dein Abo ohne Anmeldung kündigen. Gib die E-Mail-Adresse deines Kontos an. Du bekommst sofort eine Bestätigung mit Datum und Uhrzeit per E-Mail. Angemeldet geht es noch schneller unter <a href="/dashboard/billing" className="font-semibold text-fg underline underline-offset-2">Tarif & Rechnungen</a>.</p>
        <div className="mt-10"><CancelForm /></div>
      </main>
      <SiteFooter />
    </>
  );
}
