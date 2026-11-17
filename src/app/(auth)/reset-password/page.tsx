import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { ResetForm } from "@/components/auth/password-forms";

export const metadata: Metadata = { title: "Neues Passwort", robots: { index: false } };

export default async function ResetPasswordPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?error=confirm");
  return (
    <>
      <h1 className="font-display text-4xl leading-[0.95] sm:text-5xl">Neues Passwort</h1>
      <p className="mb-7 mt-3 text-dim">Für <b className="text-fg">{user.email}</b>. Danach bist du direkt angemeldet.</p>
      <ResetForm />
    </>
  );
}
