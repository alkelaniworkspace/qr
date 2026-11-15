import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ResponsesView, type ResponseRow } from "@/components/forms/responses-view";
import type { FormField } from "@/lib/forms/types";

export const metadata: Metadata = { title: "Antworten" };

export default async function ResponsesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: form }, { data: rows }] = await Promise.all([
    supabase.from("forms").select("id, title, fields").eq("id", id).maybeSingle(),
    supabase.from("form_responses").select("id, created_at, answers, meta").eq("form_id", id).order("created_at", { ascending: false }).limit(5000),
  ]);
  if (!form) notFound();
  return (
    <div className="animate-rise">
      <Link href={`/dashboard/forms/${id}`} className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-dim hover:text-fg"><ArrowLeft className="size-4" /> Zum Formular</Link>
      <h1 className="mb-8 font-display text-4xl leading-tight sm:text-5xl">{form.title}</h1>
      <ResponsesView formId={form.id} title={form.title} fields={form.fields as FormField[]} rows={(rows ?? []) as ResponseRow[]} />
    </div>
  );
}
