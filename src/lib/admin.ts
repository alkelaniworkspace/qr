import "server-only";
import { notFound } from "next/navigation";
import { createClient, getSessionUser } from "@/lib/supabase/server";

/** Every admin page and action starts here; the database checks again in each RPC. */
export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) notFound();
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_admin");
  if (data !== true) notFound();
  return { user, supabase };
}

export interface AdminUser {
  id: string; email: string; full_name: string | null; role: "user" | "admin"; provider: string;
  created_at: string; last_sign_in_at: string | null; email_confirmed: boolean;
  plan: string; effective_plan: string; plan_until: string | null; plan_source: "free" | "paid" | "gift"; plan_note: string | null;
  suspended_at: string | null; suspended_reason: string | null; codes: number; dynamic_codes: number; scans: number; total?: number;
}

export interface AdminCode {
  id: string; slug: string; name: string; type: string; mode: "dynamic" | "static"; status: "active" | "paused";
  user_id: string | null; owner_email: string | null; scan_count: number; last_scanned_at: string | null;
  created_at: string; updated_at: string; archived_at: string | null; deleted_at: string | null; locked_at: string | null; locked_reason: string | null; total?: number;
}

export interface AdminOverview {
  users: number; users_7d: number; users_30d: number; active_7d: number; suspended: number; gifts: number;
  plans: Record<string, number>; codes: number; codes_dynamic: number; codes_guest: number; codes_trash: number; codes_paused: number;
  scans_total: number; scans_7d: number; scans_today: number; signups_series: number[]; scans_series: number[]; types: { type: string; n: number }[];
}

export interface AuditRow { id: number; created_at: string; action: string; admin_email: string | null; target_email: string | null; target_code: string | null; details: Record<string, unknown> }

export const ACTION_LABEL: Record<string, string> = {
  "plan.gift": "Tarif verschenkt", "plan.reset": "Tarif auf Free", "user.suspend": "Konto gesperrt", "user.unsuspend": "Konto entsperrt", "user.role": "Rolle geändert",
  "code.pause": "Code pausiert", "code.resume": "Code aktiviert", "code.lock": "Code gesperrt", "code.unlock": "Code entsperrt", "code.archive": "Code archiviert",
  "code.unarchive": "Aus Archiv geholt", "code.trash": "In den Papierkorb", "code.restore": "Wiederhergestellt", "code.purge": "Endgültig gelöscht",
};
