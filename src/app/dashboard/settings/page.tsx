import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { LANG_COOKIE } from "@/lib/i18n";
import { SettingsView } from "@/components/dashboard/settings-view";

export const metadata: Metadata = { title: "Einstellungen" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/settings");
  const { data: prof } = await supabase.from("profiles").select("full_name, notify_product, notify_reports, role, avatar_url").eq("id", user.id).maybeSingle();
  const p = prof as { full_name: string | null; notify_product: boolean; notify_reports: boolean; role: string; avatar_url: string | null } | null;
  const providers = Array.from(new Set((user.identities ?? []).map((i) => i.provider)));
  const lang = (await cookies()).get(LANG_COOKIE)?.value === "en" ? "en" : "de";
  return (
    <SettingsView
      userId={user.id}
      name={p?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? ""}
      email={user.email ?? ""}
      pendingEmail={user.new_email ?? null}
      createdAt={user.created_at}
      lastSignIn={user.last_sign_in_at ?? null}
      providers={providers}
      avatar={p?.avatar_url ?? (user.user_metadata?.avatar_url as string | undefined) ?? null}
      notifyProduct={p?.notify_product ?? true}
      notifyReports={p?.notify_reports ?? true}
      admin={p?.role === "admin"}
      lang={lang}
    />
  );
}
