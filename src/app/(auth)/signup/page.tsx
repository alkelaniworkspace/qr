import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Registrieren" };

export default function SignupPage() {
  return (
    <>
      <h1 className="font-display text-5xl leading-[0.95]">Konto erstellen</h1>
      <p className="mb-8 mt-3 text-dim">Kostenlos starten. Keine Kreditkarte nötig.</p>
      <AuthForm mode="signup" />
    </>
  );
}
