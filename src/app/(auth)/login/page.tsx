import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Anmelden" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (
    <>
      <h1 className="font-display text-4xl leading-[0.95] sm:text-5xl">Willkommen zurück</h1>
      <p className="mb-7 mt-3 text-dim">Melde dich an, um deine Codes zu verwalten.</p>
      <AuthForm mode="login" next={next} initialError={error === "confirm" ? "Der Anmelde-Link ist ungültig oder abgelaufen." : error === "provider" || error === "google" ? "Diese Anmeldung ist gerade nicht verfügbar. Bitte den E-Mail-Link nutzen." : undefined} />
    </>
  );
}
