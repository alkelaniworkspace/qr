"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { env, supabaseConfigured } from "@/lib/env";
import { findProvider } from "@/lib/auth-providers";

const NOT_READY = "Die Anmeldung ist gleich verfügbar. Wir richten gerade die Datenbank ein.";

export type AuthState = { error?: string; info?: string; email?: string } | undefined;

const safeNext = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/dashboard";
};

export async function signIn(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Bitte E-Mail und Passwort eingeben", email };
  if (!supabaseConfigured) return { error: NOT_READY, email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      error: error.code === "email_not_confirmed" ? "Bitte bestätige zuerst deine E-Mail-Adresse." : "E-Mail oder Passwort ist falsch.",
      email,
    };
  }
  redirect(safeNext(form.get("next")));
}

const signUpSchema = z.object({
  name: z.string().trim().max(80),
  email: z.email("Bitte eine gültige E-Mail eingeben"),
  password: z.string().min(8, "Das Passwort braucht mindestens 8 Zeichen").max(72),
});

export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    name: form.get("name") ?? "",
    email: String(form.get("email") ?? "").trim(),
    password: form.get("password") ?? "",
  });
  const email = String(form.get("email") ?? "");
  if (!parsed.success) return { error: parsed.error.issues[0].message, email };
  if (!supabaseConfigured) return { error: NOT_READY, email };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.name },
      emailRedirectTo: `${env.appUrl}/auth/confirm?next=/dashboard`,
    },
  });
  if (error) {
    return { error: error.code === "user_already_exists" ? "Diese E-Mail ist schon registriert." : "Registrierung fehlgeschlagen. Bitte erneut versuchen.", email };
  }
  if (data.session) redirect("/dashboard/new");
  return { info: "Fast geschafft! Wir haben dir eine E-Mail geschickt. Bitte bestätige deine Adresse.", email };
}

/** Passwordless: sends a one-time sign-in link (also creates the account on first use). */
export async function magicLink(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim();
  if (!z.email().safeParse(email).success) return { error: "Bitte eine gültige E-Mail eingeben", email };
  if (!supabaseConfigured) return { error: NOT_READY, email };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${env.appUrl}/auth/confirm?next=${encodeURIComponent(safeNext(form.get("next")))}`, shouldCreateUser: true },
  });
  if (error) {
    return { error: error.status === 429 ? "Zu viele Versuche. Bitte in einer Minute erneut." : "Der Link konnte nicht gesendet werden. Bitte erneut versuchen.", email };
  }
  return { info: "Prüfe dein Postfach. Wir haben dir einen Anmelde-Link geschickt.", email };
}

/** Social sign-in. Only providers marked `enabled` in src/lib/auth-providers.ts are accepted. */
export async function oauthSignIn(form: FormData) {
  const provider = findProvider(form.get("provider"));
  if (!provider || !provider.enabled) redirect("/login?error=provider");
  if (!supabaseConfigured) redirect(`/login?error=provider&p=${provider.id}`);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider.supabase,
    options: { redirectTo: `${env.appUrl}/auth/confirm?next=${encodeURIComponent(safeNext(form.get("next")))}` },
  });
  if (error || !data.url) redirect(`/login?error=provider&p=${provider.id}`);
  redirect(data.url);
}
