import "server-only";
import { createClient } from "@/lib/supabase/server";
import { PLANS } from "@/lib/plans";
import { getAccount } from "@/lib/account";

export async function getQuota(userId: string) {
  const supabase = await createClient();
  const [account, { count }] = await Promise.all([
    getAccount(userId),
    supabase.from("qr_codes").select("id", { count: "exact", head: true }).eq("mode", "dynamic").is("deleted_at", null),
  ]);
  const plan = account.plan;
  const used = count ?? 0;
  const limit: number = PLANS[plan].dynamic ?? Infinity;
  return { plan, used, limit, locked: used >= limit || account.suspended, account };
}
