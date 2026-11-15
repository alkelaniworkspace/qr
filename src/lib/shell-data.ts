import "server-only";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { PLANS, planOf } from "@/lib/plans";
import type { ShellPlan, ShellUser } from "@/components/shell/app-shell";

/** Account + plan usage for the sidebar (null for guests). */
export async function getShellData(): Promise<{ user: ShellUser | null; plan: ShellPlan | null }> {
  const session = await getSessionUser().catch(() => null);
  if (!session) return { user: null, plan: null };
  const supabase = await createClient();
  const [{ data: profile }, { count }] = await Promise.all([
    supabase.from("profiles").select("full_name, plan").eq("id", session.id).maybeSingle(),
    supabase.from("qr_codes").select("id", { count: "exact", head: true }).eq("user_id", session.id).eq("mode", "dynamic"),
  ]);
  const id = planOf(profile?.plan);
  const def = PLANS[id];
  return {
    user: { name: profile?.full_name || session.email.split("@")[0], email: session.email },
    plan: { id, label: def.label, used: count ?? 0, limit: def.dynamic },
  };
}
