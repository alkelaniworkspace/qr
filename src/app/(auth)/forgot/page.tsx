import type { Metadata } from "next";
import { ForgotForm } from "@/components/auth/password-forms";

export const metadata: Metadata = { title: "Passwort vergessen" };

export default function ForgotPage() {
  return (
    <>
      <h1 className="font-display text-4xl leading-[0.95] sm:text-5xl">Passwort vergessen?</h1>
      <p className="mb-7 mt-3 text-dim">Kein Problem. Gib deine E-Mail ein und wir schicken dir einen Link für ein neues Passwort.</p>
      <ForgotForm />
    </>
  );
}
