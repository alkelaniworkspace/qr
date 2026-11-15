"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";
import { signIn, signUp, type AuthState } from "@/app/(auth)/actions";
import { FieldShell, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function AuthForm({ mode, next, initialError }: { mode: "login" | "signup"; next?: string; initialError?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "login" ? signIn : signUp, initialError ? { error: initialError } : undefined);

  if (state?.info) {
    return (
      <div className="card card-glow p-7 text-center">
        <MailCheck className="mx-auto size-9 text-brand" strokeWidth={1.6} />
        <p className="mt-3 font-medium">{state.info}</p>
        <p className="mt-1 text-sm text-dim">{state.email}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      {mode === "signup" && (
        <FieldShell label="Name" htmlFor="name">
          <Input id="name" name="name" autoComplete="name" placeholder="Vor- und Nachname" />
        </FieldShell>
      )}
      <FieldShell label="E-Mail" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state?.email} placeholder="du@firma.de" />
      </FieldShell>
      <FieldShell label="Passwort" htmlFor="password" hint={mode === "signup" ? "Mindestens 8 Zeichen" : undefined}>
        <Input id="password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "signup" ? 8 : undefined} />
      </FieldShell>
      {state?.error && <p className="rounded-xl border border-rose/30 bg-rose/10 px-3 py-2.5 text-sm text-rose">{state.error}</p>}
      <Button type="submit" size="lg" className="w-full shine" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {mode === "login" ? "Anmelden" : "Kostenlos registrieren"}
      </Button>
      <p className="text-center text-sm text-dim">
        {mode === "login" ? (
          <>Noch kein Konto? <Link href="/signup" className="font-semibold text-brand underline-offset-4 hover:underline">Registrieren</Link></>
        ) : (
          <>Schon dabei? <Link href="/login" className="font-semibold text-brand underline-offset-4 hover:underline">Anmelden</Link></>
        )}
      </p>
    </form>
  );
}
