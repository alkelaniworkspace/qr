"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export type AuthState = { error?: string; info?: string; email?: string } | undefined;

const safeNext = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/dashboard";
};

export async function signIn(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Bitte E-Mail und Passwort eingeben", email };

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
