import { createClient, getSessionUser } from "@/lib/supabase/server";

/** GDPR export (Art. 20): everything stored for the signed-in account as JSON. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const supabase = await createClient();
  const [profile, codes, forms, responses] = await Promise.all([
    supabase.from("profiles").select("full_name, plan, plan_until, plan_source, notify_product, notify_reports, created_at").eq("id", user.id).maybeSingle(),
    supabase.from("qr_codes").select("name, slug, type, mode, status, content, style, scan_count, created_at, updated_at, archived_at, deleted_at"),
    supabase.from("forms").select("slug, title, description, fields, settings, status, response_count, created_at"),
    supabase.from("form_responses").select("form_id, answers, created_at").limit(10000),
  ]);
  const data = {
    exported_at: new Date().toISOString(),
    account: { email: user.email, ...(profile.data ?? {}) },
    qr_codes: codes.data ?? [],
    forms: forms.data ?? [],
    form_responses: responses.data ?? [],
  };
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="qlick-daten-${new Date().toISOString().slice(0, 10)}.json"`,
      "cache-control": "no-store",
    },
  });
}
