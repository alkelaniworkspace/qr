import "server-only";
import { connection } from "next/server";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { PLANS } from "@/lib/plans";
import { dynamicLimit, getAccount } from "@/lib/account";
import type { ShellPlan, ShellUser } from "@/components/shell/app-shell";

/** Account + plan usage for the sidebar (null for guests). */
export async function getShellData(): Promise<{ user: ShellUser | null; plan: ShellPlan | null; admin: boolean; suspended: string | false }> {
  // Per request: the sidebar shows the signed-in account (never prerender it as a guest).
  await connection();
  const session = await getSessionUser().catch(() => null);
  if (!session) return { user: null, plan: null, admin: false, suspended: false };
  const supabase = await createClient();
  const [account, { count }] = await Promise.all([
    getAccount(session.id),
    supabase.from("qr_codes").select("id", { count: "exact", head: true }).eq("user_id", session.id).eq("mode", "dynamic").is("deleted_at", null),
  ]);
  const def = PLANS[account.plan];
  return {
    user: { name: account.fullName || session.email.split("@")[0], email: session.email },
    plan: { id: account.plan, label: def.label, used: count ?? 0, limit: dynamicLimit(account) },
    admin: account.role === "admin" && !account.suspended,
    suspended: account.suspended ? account.suspendedReason ?? "" : false,
  };
}
