"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getUserId } from "@/lib/supabase/server";
import { FORM_TEMPLATES, formSchema, newFieldId } from "@/lib/forms/types";
import { newSlug } from "@/lib/codes/slug";

export async function createForm(form: FormData) {
  if (!(await getUserId())) redirect("/login?next=/dashboard/forms");
  const tpl = FORM_TEMPLATES.find((t) => t.id === form.get("template"));
  const def = tpl ? tpl.build() : { title: "Neues Formular", description: "", settings: {}, fields: [{ id: newFieldId(), type: "short" as const, label: "Deine Frage", required: false }] };
  const supabase = await createClient();
  const { data, error } = await supabase.from("forms").insert({ slug: newSlug(8), title: def.title, description: def.description, fields: def.fields, settings: def.settings }).select("id").single();
  if (error) redirect(`/dashboard/forms?error=${error.message.includes("FORM_LIMIT") ? "limit" : "save"}`);
  revalidatePath("/dashboard/forms");
  redirect(`/dashboard/forms/${data!.id}`);
}

export async function saveForm(id: string, input: unknown): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!(await getUserId())) return { ok: false, message: "Bitte anmelden" };
  const parsed = formSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Ungültig" };
  const d = parsed.data;
  for (const f of d.fields) {
    if ((f.type === "single" || f.type === "multi" || f.type === "dropdown") && !(f.options ?? []).length) return { ok: false, message: `„${f.label}“ braucht Antwortmöglichkeiten` };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("forms").update({ title: d.title, description: d.description, fields: d.fields, settings: d.settings }).eq("id", id);
  if (error) return { ok: false, message: "Speichern fehlgeschlagen" };
  revalidatePath(`/dashboard/forms/${id}`);
  return { ok: true };
}

export async function setFormStatus(id: string, status: "open" | "closed") {
  const supabase = await createClient();
  await supabase.from("forms").update({ status }).eq("id", id);
  revalidatePath(`/dashboard/forms/${id}`);
  revalidatePath("/dashboard/forms");
}

export async function deleteForm(id: string) {
  const supabase = await createClient();
  await supabase.from("forms").delete().eq("id", id);
  revalidatePath("/dashboard/forms");
  redirect("/dashboard/forms");
}

export async function deleteResponse(formId: string, responseId: number) {
  const supabase = await createClient();
  await supabase.from("form_responses").delete().eq("id", responseId).eq("form_id", formId);
  revalidatePath(`/dashboard/forms/${formId}/responses`);
}
