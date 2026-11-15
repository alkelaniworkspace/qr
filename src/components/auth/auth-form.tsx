"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";
import { googleSignIn, magicLink, signIn, signUp, type AuthState } from "@/app/(auth)/actions";
import { FieldShell, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h6a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.7H2.1v2.8A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.7 14a6.6 6.6 0 0 1 0-4.2V7H2.1a11 11 0 0 0 0 9.9z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 0 0 2.1 7l3.6 2.8C6.6 7.3 9.1 5.4 12 5.4z" />
    </svg>
  );
}

export function AuthForm({ mode, next, initialError }: { mode: "login" | "signup"; next?: string; initialError?: string }) {
  const [method, setMethod] = useState<"link" | "password">("link");
  const passwordAction = mode === "login" ? signIn : signUp;
  const [state, action, pending] = useActionState<AuthState, FormData>(
    (prev, form) => (method === "link" ? magicLink(prev, form) : passwordAction(prev, form)),
    initialError ? { error: initialError } : undefined,
  );

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
    <div className="space-y-5">
      <form action={googleSignIn}>
        <input type="hidden" name="next" value={next ?? ""} />
        <button type="submit" className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-edge-strong bg-surface font-semibold transition hover:bg-hi/5 active:scale-[0.98]">
          <GoogleLogo /> Mit Google fortfahren
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs text-faint"><span className="h-px flex-1 bg-edge" /> oder mit E-Mail <span className="h-px flex-1 bg-edge" /></div>

      <div className="grid grid-cols-2 rounded-full border border-edge bg-hi/5 p-1 text-sm font-semibold">
        {(["link", "password"] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMethod(m)} className={cn("rounded-full py-2 transition", method === m ? "bg-brand text-on-brand" : "text-dim")}>
            {m === "link" ? "Anmelde-Link" : "Passwort"}
          </button>
        ))}
      </div>

      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next ?? ""} />
        {mode === "signup" && method === "password" && (
          <FieldShell label="Name" htmlFor="name">
            <Input id="name" name="name" autoComplete="name" placeholder="Vor- und Nachname" />
          </FieldShell>
        )}
        <FieldShell label="E-Mail" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state?.email} placeholder="du@firma.de" />
        </FieldShell>
        {method === "password" && (
          <FieldShell label="Passwort" htmlFor="password" hint={mode === "signup" ? "Mindestens 8 Zeichen" : undefined}>
            <Input id="password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "signup" ? 8 : undefined} />
          </FieldShell>
        )}
        {state?.error && <p className="rounded-xl border border-rose/30 bg-rose/10 px-3 py-2.5 text-sm text-rose">{state.error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {method === "link" ? "Link senden" : mode === "login" ? "Anmelden" : "Konto erstellen"}
        </Button>
        {method === "link" && <p className="text-center text-xs text-faint">Ohne Passwort. Der Link meldet dich an oder erstellt dein Konto.</p>}
        <p className="text-center text-sm text-dim">
          {mode === "login" ? (
            <>Noch kein Konto? <Link href="/signup" className="font-semibold text-fg underline-offset-4 hover:underline">Registrieren</Link></>
          ) : (
            <>Schon dabei? <Link href="/login" className="font-semibold text-fg underline-offset-4 hover:underline">Anmelden</Link></>
          )}
        </p>
      </form>
    </div>
  );
}
