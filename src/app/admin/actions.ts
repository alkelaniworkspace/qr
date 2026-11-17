"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, type AdminUser } from "@/lib/admin";
import { sendMail, mailConfigured } from "@/lib/email";
import { renderGiftEmail } from "@/lib/gift-email";
import { planOf } from "@/lib/plans";

const ERR: Record<string, string> = {
  NOT_SELF: "Das geht nicht mit deinem eigenen Konto.",
  BAD_PLAN: "Unbekannter Tarif.",
  NOT_ADMIN: "Keine Berechtigung.",
  BAD_EMAIL: "Bitte eine gültige E-Mail-Adresse eingeben.",
  BAD_LIMIT: "Ungültiges Limit.",
};
const msg = (e: { message: string } | null) => (e ? Object.entries(ERR).find(([k]) => e.message.includes(k))?.[1] ?? "Das hat nicht geklappt." : null);

function refresh() {
  revalidatePath("/admin", "layout");
}

/** Gift a plan until a date (null = no end), or reset to Free. Optionally tells the person by e-mail. */
export async function giftPlan(userId: string, plan: string, until: string | null, note: string, notify = false, message = ""): Promise<string | null> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("admin_set_plan", { p_user: userId, p_plan: plan, p_until: until, p_note: note } as never);
  refresh();
  if (error) return msg(error);
  if (notify && plan !== "free") {
    const { data } = await supabase.rpc("admin_user", { p_user: userId } as never);
    const u = (data as (AdminUser & { code_limit: number | null })[] | null)?.[0];
    if (u) {
      const m = renderGiftEmail({ plan: planOf(plan), months: null, until, limit: u.code_limit, message: message.trim(), name: u.full_name ?? undefined, email: u.email, pending: false });
      if (!(await sendMail(u.email, m.subject, m.html, m.text))) return "Tarif verschenkt, aber die E-Mail konnte nicht gesendet werden.";
    }
  }
  return null;
}

export interface GiftResult { error?: string; status?: "applied" | "pending"; mailed?: boolean }

/** Gift a plan to any e-mail address. Applied now if the account exists, otherwise on sign-up. */
export async function giftByEmail(input: {
  email: string; plan: string; months: number | null; until: string | null; limit: number | null; note: string; message: string; notify: boolean;
}): Promise<GiftResult> {
  const { supabase } = await requireAdmin();
  const email = input.email.trim().toLowerCase();
  const { data, error } = await supabase.rpc("admin_gift_email", {
    p_email: email, p_plan: input.plan, p_months: input.months, p_until: input.until, p_code_limit: input.limit, p_note: input.note,
  } as never);
  refresh();
  if (error) return { error: msg(error) ?? undefined };
  const r = data as { status: "applied" | "pending"; user_id: string | null };
  let mailed = false;
  if (input.notify && mailConfigured()) {
    let name: string | undefined;
    if (r.user_id) {
      const { data: u } = await supabase.rpc("admin_user", { p_user: r.user_id } as never);
      name = (u as AdminUser[] | null)?.[0]?.full_name ?? undefined;
    }
    const m = renderGiftEmail({ plan: planOf(input.plan), months: input.months, until: input.until, limit: input.limit, message: input.message.trim(), name, email, pending: r.status === "pending" });
    mailed = await sendMail(email, m.subject, m.html, m.text);
  }
  return { status: r.status, mailed };
}

export async function revokeGrant(id: string): Promise<string | null> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("admin_revoke_grant", { p_grant: id } as never);
  refresh();
  return msg(error);
}

/** null = plan default, -1 = unlimited, n = exactly n dynamic codes. */
export async function setCodeLimit(userId: string, limit: number | null): Promise<string | null> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("admin_set_limit", { p_user: userId, p_limit: limit } as never);
  refresh();
  return msg(error);
}

export async function suspendUser(userId: string, suspend: boolean, reason: string): Promise<string | null> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("admin_suspend_user", { p_user: userId, p_suspend: suspend, p_reason: reason } as never);
  refresh();
  return msg(error);
}

export async function setRole(userId: string, role: "user" | "admin"): Promise<string | null> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("admin_set_role", { p_user: userId, p_role: role } as never);
  refresh();
  return msg(error);
}

export type CodeAction = "pause" | "resume" | "lock" | "unlock" | "archive" | "unarchive" | "trash" | "restore" | "purge";
export async function codeAction(codeId: string, action: CodeAction, reason = ""): Promise<string | null> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("admin_code_action", { p_code: codeId, p_action: action, p_reason: reason } as never);
  refresh();
  return msg(error);
}
