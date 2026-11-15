import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Registrieren" };

export default function SignupPage() {
  return (
    <>
      <h1 className="font-display text-4xl leading-[0.95] sm:text-5xl">Konto erstellen</h1>
      <p className="mb-7 mt-3 text-dim">Kostenlos starten. Keine Kreditkarte nötig.</p>
      <AuthForm mode="signup" />
    </>
  );
}
