import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Anmelden" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (
    <>
      <h1 className="font-display text-5xl uppercase leading-[0.95]">Willkommen zurück</h1>
      <p className="mb-8 mt-3 text-dim">Melde dich an, um deine Codes zu verwalten.</p>
      <AuthForm mode="login" next={next} initialError={error === "confirm" ? "Der Bestätigungslink ist ungültig oder abgelaufen." : undefined} />
    </>
  );
}
