"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Fingerprint, Loader2, MailCheck, Sparkles } from "lucide-react";
import { magicLink, oauthSignIn, signIn, signUp, type AuthState } from "@/app/(auth)/actions";
import { FieldShell, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { AUTH_PROVIDERS, type AuthProvider, type ProviderId } from "@/lib/auth-providers";

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

const LOGOS: Record<ProviderId, React.ReactNode> = {
  google: <GoogleLogo />,
  apple: (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
      <path d="M16.37 12.6c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.15-2.76.83-3.48.83-.72 0-1.82-.81-3-.79-1.54.02-2.96.9-3.76 2.28-1.6 2.78-.41 6.9 1.15 9.16.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.12 2.76-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.4-.92-2.42-3.66l.05-.03ZM14.1 5.86c.63-.77 1.06-1.83.94-2.89-.91.04-2.01.61-2.67 1.37-.58.67-1.1 1.76-.96 2.8 1.02.08 2.06-.52 2.69-1.28Z" />
    </svg>
  ),
  microsoft: (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden>
      <path fill="#F25022" d="M2 2h9.5v9.5H2z" />
      <path fill="#7FBA00" d="M12.5 2H22v9.5h-9.5z" />
      <path fill="#00A4EF" d="M2 12.5h9.5V22H2z" />
      <path fill="#FFB900" d="M12.5 12.5H22V22h-9.5z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <rect width="24" height="24" rx="4" fill="#0A66C2" />
      <path fill="#fff" d="M7.1 9.6h2.6V18H7.1zM8.4 5.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm2.9 4.1h2.5v1.15h.04c.35-.66 1.2-1.36 2.47-1.36 2.64 0 3.13 1.74 3.13 4V18h-2.6v-4.07c0-.97-.02-2.22-1.35-2.22-1.36 0-1.57 1.06-1.57 2.15V18h-2.6z" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path fill="#fff" d="M15.6 15.47 16.1 12.3h-3.04v-2.06c0-.87.42-1.71 1.78-1.71h1.38v-2.7s-1.25-.21-2.45-.21c-2.5 0-4.13 1.51-4.13 4.26v2.42H6.88v3.17h2.76V24c.55.09 1.12.13 1.7.13.57 0 1.14-.04 1.7-.13v-8.53z" />
    </svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
      <path d="M12 1.5A10.5 10.5 0 0 0 8.68 21.96c.53.1.72-.23.72-.5v-1.8c-2.92.63-3.54-1.4-3.54-1.4-.48-1.22-1.17-1.54-1.17-1.54-.95-.65.08-.64.08-.64 1.05.07 1.6 1.08 1.6 1.08.94 1.6 2.46 1.14 3.06.87.1-.68.37-1.14.66-1.4-2.33-.27-4.78-1.17-4.78-5.18 0-1.15.41-2.08 1.08-2.82-.1-.27-.47-1.34.1-2.79 0 0 .89-.28 2.9 1.08a10 10 0 0 1 5.27 0c2-1.36 2.89-1.08 2.89-1.08.58 1.45.21 2.52.1 2.79.68.74 1.08 1.67 1.08 2.82 0 4.02-2.45 4.9-4.79 5.16.38.33.71.97.71 1.96v2.9c0 .28.19.61.73.5A10.5 10.5 0 0 0 12 1.5Z" />
    </svg>
  ),
};

/**
 * Social sign-in buttons. Providers that are not switched on yet stay visible
 * (so the page already looks complete) and explain on click that they follow soon.
 */
function SocialButtons({ next, mode }: { next?: string; mode: "login" | "signup" }) {
  const [soon, setSoon] = useState<string | null>(null);
  const primary = AUTH_PROVIDERS.filter((p) => p.primary);
  const more = AUTH_PROVIDERS.filter((p) => !p.primary);
  const verb = mode === "login" ? "Weiter mit" : "Registrieren mit";

  const button = (p: AuthProvider, compact: boolean) => {
    const cls = cn(
      "group relative flex items-center justify-center gap-3 border font-semibold transition active:scale-[0.98]",
      compact ? "h-12 rounded-2xl" : "h-12 w-full rounded-full",
      p.id === "apple" && !compact ? "border-transparent bg-fg text-bg hover:opacity-90" : "border-edge-strong bg-surface hover:bg-hi/5",
      !p.enabled && "opacity-70 hover:opacity-100",
    );
    const inner = (
      <>
        {LOGOS[p.id]}
        {compact ? <span className="sr-only">{verb} {p.label}</span> : <span>{verb} {p.label}</span>}
        {!p.enabled && (
          compact
            ? <span className="absolute -right-1 -top-1 rounded-full bg-lime px-1.5 py-px text-[9px] font-bold text-night">Bald</span>
            : <span className="badge bg-lime text-night">Bald</span>
        )}
      </>
    );
    if (!p.enabled) {
      return (
        <button key={p.id} type="button" title={`${p.label}: kommt bald`} onClick={() => setSoon(p.label)} className={cls}>
          {inner}
        </button>
      );
    }
    return (
      <form key={p.id} action={oauthSignIn} className={compact ? "contents" : undefined}>
        <input type="hidden" name="provider" value={p.id} />
        <input type="hidden" name="next" value={next ?? ""} />
        <button type="submit" title={`${verb} ${p.label}`} className={cls}>{inner}</button>
      </form>
    );
  };

  return (
    <div className="space-y-2.5">
      {primary.map((p) => button(p, false))}
      <div className="grid grid-cols-5 gap-2">
        {more.map((p) => button(p, true))}
        <button type="button" title="Passkey: kommt bald" onClick={() => setSoon("Passkey")} className="relative flex h-12 items-center justify-center rounded-2xl border border-edge-strong bg-surface opacity-70 transition hover:bg-hi/5 hover:opacity-100 active:scale-[0.98]">
          <Fingerprint className="size-5" />
          <span className="sr-only">Mit Passkey anmelden</span>
          <span className="absolute -right-1 -top-1 rounded-full bg-lime px-1.5 py-px text-[9px] font-bold text-night">Bald</span>
        </button>
      </div>
      {soon && (
        <p role="status" className="flex items-start gap-2 rounded-xl border border-edge bg-hi/5 px-3 py-2.5 text-xs text-dim animate-rise">
          <Sparkles className="mt-px size-3.5 shrink-0 text-fg" />
          <span><b className="text-fg">{soon}</b> kommt in Kürze. Bis dahin geht es mit Google oder per E-Mail am schnellsten.</span>
        </p>
      )}
    </div>
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
      <SocialButtons next={next} mode={mode} />

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
        {mode === "signup" && (
          <p className="text-center text-[11px] leading-relaxed text-faint">
            Mit der Registrierung stimmst du unserer <Link href="/datenschutz" className="underline underline-offset-2 hover:text-fg">Datenschutzerklärung</Link> zu.
          </p>
        )}
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
