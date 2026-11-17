import "server-only";
import { createClient } from "@/lib/supabase/server";
import { planOf, type PlanId } from "@/lib/plans";

export interface Account {
  fullName: string;
  /** The plan that counts right now (a gift or paid plan ends at planUntil). */
  plan: PlanId;
  planUntil: string | null;
  planSource: "free" | "paid" | "gift";
  role: "user" | "admin";
  suspended: boolean;
  suspendedReason: string | null;
}

export function effectivePlan(plan: string | null | undefined, until: string | null | undefined): PlanId {
  if (until && new Date(until).getTime() < Date.now()) return "free";
  return planOf(plan);
}

export async function getAccount(userId: string): Promise<Account> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name, plan, plan_until, plan_source, role, suspended_at, suspended_reason")
    .eq("id", userId)
    .maybeSingle();
  return {
    fullName: data?.full_name ?? "",
    plan: effectivePlan(data?.plan, data?.plan_until),
    planUntil: data?.plan_until ?? null,
    planSource: (data?.plan_source as Account["planSource"]) ?? "free",
    role: data?.role === "admin" ? "admin" : "user",
    suspended: !!data?.suspended_at,
    suspendedReason: data?.suspended_reason ?? null,
  };
}
