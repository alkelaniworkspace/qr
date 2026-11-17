"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";
import { requestReset, updatePassword, type AuthState } from "@/app/(auth)/actions";
import { FieldShell, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function ForgotForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(requestReset, undefined);
  if (state?.info) {
    return (
      <div className="card p-8 text-center">
        <MailCheck className="mx-auto size-10" strokeWidth={1.5} />
        <p className="mt-4 font-semibold">{state.info}</p>
        <p className="mt-1 text-sm text-dim">{state.email}</p>
        <p className="mt-4 text-xs text-faint">Keine E-Mail? Schau im Spam-Ordner nach.</p>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4">
      <FieldShell label="E-Mail" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state?.email} placeholder="du@firma.de" />
      </FieldShell>
      {state?.error && <p className="rounded-xl border border-rose/30 bg-rose/10 px-3 py-2.5 text-sm text-rose">{state.error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />} Link senden
      </Button>
      <p className="text-center text-sm text-dim">Doch wieder eingefallen? <Link href="/login" className="font-semibold text-fg underline-offset-4 hover:underline">Anmelden</Link></p>
    </form>
  );
}

export function ResetForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(updatePassword, undefined);
  return (
    <form action={action} className="space-y-4">
      <FieldShell label="Neues Passwort" htmlFor="password" hint="Mindestens 8 Zeichen">
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </FieldShell>
      <FieldShell label="Passwort wiederholen" htmlFor="confirm">
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={8} />
      </FieldShell>
      {state?.error && <p className="rounded-xl border border-rose/30 bg-rose/10 px-3 py-2.5 text-sm text-rose">{state.error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />} Passwort speichern
      </Button>
    </form>
  );
}
