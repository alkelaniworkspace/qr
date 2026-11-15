import "server-only";
import { createClient } from "@/lib/supabase/server";
import { PLANS, planOf } from "@/lib/plans";

export async function getQuota(userId: string) {
  const supabase = await createClient();
  const [{ data: profile }, { count }] = await Promise.all([
    supabase.from("profiles").select("plan").eq("id", userId).maybeSingle(),
    supabase.from("qr_codes").select("id", { count: "exact", head: true }).eq("mode", "dynamic"),
  ]);
  const plan = planOf(profile?.plan);
  const used = count ?? 0;
  const limit: number = PLANS[plan].dynamic ?? Infinity;
  return { plan, used, limit, locked: used >= limit };
}
