import type { Metadata } from "next";
import { Gift } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Registrieren" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ email?: string; gift?: string }> }) {
  const { email, gift } = await searchParams;
  const prefill = typeof email === "string" && email.length < 200 ? email : undefined;
  return (
    <>
      {gift && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-lime/40 bg-lime/10 p-4 animate-rise">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-lime text-night"><Gift className="size-[18px]" /></span>
          <p className="text-sm"><b className="font-semibold">Dein Geschenk wartet.</b><span className="block text-dim">Registriere dich mit der E-Mail-Adresse, an die wir es geschickt haben. Dann ist es sofort aktiv.</span></p>
        </div>
      )}
      <h1 className="font-display text-4xl leading-[0.95] sm:text-5xl">Konto erstellen</h1>
      <p className="mb-7 mt-3 text-dim">Kostenlos starten. Keine Kreditkarte nötig.</p>
      <AuthForm mode="signup" defaultEmail={prefill} />
    </>
  );
}
