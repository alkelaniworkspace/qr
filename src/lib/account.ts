import "server-only";
import { createClient } from "@/lib/supabase/server";
import { PLANS, planOf, type PlanId } from "@/lib/plans";

export interface Account {
  fullName: string;
  /** The plan that counts right now (a gift or paid plan ends at planUntil). */
  plan: PlanId;
  planUntil: string | null;
  planSource: "free" | "paid" | "gift";
  role: "user" | "admin";
  suspended: boolean;
  suspendedReason: string | null;
  /** Admin override: null = plan default, -1 = unlimited, n = exactly n dynamic codes. */
  codeLimit: number | null;
  avatarUrl: string | null;
}

/** Dynamic-code limit that counts right now (null = unlimited). Mirrors public.dynamic_limit(). */
export function dynamicLimit(a: Pick<Account, "plan" | "codeLimit">): number | null {
  if (a.codeLimit === -1) return null;
  if (a.codeLimit !== null) return a.codeLimit;
  return PLANS[a.plan].dynamic;
}

export function effectivePlan(plan: string | null | undefined, until: string | null | undefined): PlanId {
  if (until && new Date(until).getTime() < Date.now()) return "free";
  return planOf(plan);
}

export async function getAccount(userId: string): Promise<Account> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name, plan, plan_until, plan_source, role, suspended_at, suspended_reason, code_limit, avatar_url")
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
    codeLimit: typeof data?.code_limit === "number" ? data.code_limit : null,
    avatarUrl: data?.avatar_url ?? null,
  };
}
