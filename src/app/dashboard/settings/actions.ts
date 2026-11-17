"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { env } from "@/lib/env";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { billingConfigured, billingProfile, isLive, stripe } from "@/lib/billing";

export type SettingsResult = { ok?: string; error?: string; needCode?: boolean };

export async function updateName(name: string): Promise<SettingsResult> {
  const user = await getSessionUser();
  if (!user) return { error: "Bitte melde dich an." };
  const clean = name.trim().slice(0, 80);
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ full_name: clean } as never).eq("id", user.id);
  await supabase.auth.updateUser({ data: { full_name: clean } });
  revalidatePath("/", "layout");
  return error ? { error: "Speichern hat nicht geklappt." } : { ok: "Name gespeichert." };
}

export async function changeEmail(email: string): Promise<SettingsResult> {
  const user = await getSessionUser();
  if (!user) return { error: "Bitte melde dich an." };
  const next = email.trim().toLowerCase();
  if (!z.email().safeParse(next).success) return { error: "Bitte eine gültige E-Mail eingeben." };
  if (next === user.email.toLowerCase()) return { error: "Das ist schon deine E-Mail-Adresse." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email: next }, { emailRedirectTo: `${env.appUrl}/auth/confirm?next=/dashboard/settings` });
  if (error) return { error: error.code === "email_exists" ? "Diese E-Mail gehört schon zu einem anderen Konto." : error.status === 429 ? "Zu viele Versuche. Bitte gleich erneut." : "Das hat nicht geklappt." };
  return { ok: `Fast geschafft: Bestätige die Änderung über den Link, den wir an ${next} geschickt haben.` };
}

/** Password changes go through a link by e-mail (proves access to the inbox). */
export async function sendPasswordLink(): Promise<SettingsResult> {
  const user = await getSessionUser();
  if (!user) return { error: "Bitte melde dich an." };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: `${env.appUrl}/auth/confirm?next=/reset-password` });
  if (error) return { error: error.status === 429 ? "Du hast gerade erst einen Link bekommen. Bitte warte eine Minute." : "Der Link konnte nicht gesendet werden." };
  return { ok: `Link gesendet an ${user.email}. Er ist eine Stunde gültig.` };
}

/** Saves the uploaded profile photo (must live in the user's own folder) or removes it. */
export async function setAvatar(url: string | null): Promise<SettingsResult> {
  const user = await getSessionUser();
  if (!user) return { error: "Bitte melde dich an." };
  const prefix = `${env.supabaseUrl}/storage/v1/object/public/assets/${user.id}/`;
  if (url !== null && !url.startsWith(prefix)) return { error: "Ungültiges Bild." };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ avatar_url: url } as never).eq("id", user.id);
  revalidatePath("/", "layout");
  return error ? { error: "Speichern hat nicht geklappt." } : { ok: url ? "Profilbild gespeichert." : "Profilbild entfernt." };
}

export async function savePrefs(prefs: { notify_product: boolean; notify_reports: boolean }): Promise<SettingsResult> {
  const user = await getSessionUser();
  if (!user) return { error: "Bitte melde dich an." };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ notify_product: !!prefs.notify_product, notify_reports: !!prefs.notify_reports } as never).eq("id", user.id);
  return error ? { error: "Speichern hat nicht geklappt." } : { ok: "Gespeichert." };
}

export async function signOutEverywhere() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/login");
}

/** Deletes the account and everything in it. A running subscription is ended first. */
export async function deleteAccount(confirmText: string): Promise<SettingsResult> {
  const user = await getSessionUser();
  if (!user) return { error: "Bitte melde dich an." };
  if (confirmText.trim().toUpperCase() !== "LÖSCHEN") return { error: "Bitte tippe LÖSCHEN zur Bestätigung." };
  const { data: prof } = await adminClient().from("profiles").select("role").eq("id", user.id).maybeSingle();
  if ((prof as { role?: string } | null)?.role === "admin") return { error: "Admin-Konten können nicht selbst gelöscht werden." };
  if (billingConfigured()) {
    const b = await billingProfile(user.id);
    if (b?.subscription_id && isLive(b.subscription_status)) {
      try { await stripe().subscriptions.cancel(b.subscription_id); } catch { return { error: "Dein Abo konnte nicht beendet werden. Bitte versuche es erneut." }; }
    }
  }
  const { error } = await adminClient().auth.admin.deleteUser(user.id);
  if (error) return { error: "Löschen hat nicht geklappt. Schreib uns an info@qlickqr.com." };
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/?konto=geloescht");
}
