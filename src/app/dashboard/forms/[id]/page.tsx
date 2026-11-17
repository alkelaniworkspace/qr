import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { FormBuilder } from "@/components/forms/form-builder";
import { env } from "@/lib/env";
import { effectivePlan } from "@/lib/account";
import type { FormDef } from "@/lib/forms/types";

export const metadata: Metadata = { title: "Formular bearbeiten" };

export default async function FormEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  const supabase = await createClient();
  const [{ data: form }, { data: profile }] = await Promise.all([
    supabase.from("forms").select("id, slug, title, description, fields, settings, status, response_count").eq("id", id).maybeSingle(),
    supabase.from("profiles").select("plan, plan_until").eq("id", user!.id).maybeSingle(),
  ]);
  if (!form) notFound();
  return (
    <div>
      <Link href="/dashboard/forms" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-dim hover:text-fg"><ArrowLeft className="size-4" /> Formulare</Link>
      <FormBuilder
        id={form.id}
        slug={form.slug}
        status={form.status}
        responses={form.response_count}
        url={`${env.appUrl}/f/${form.slug}`}
        branding={effectivePlan(profile?.plan, profile?.plan_until) === "free"}
        initial={{ title: form.title, description: form.description, fields: form.fields, settings: form.settings } as FormDef}
      />
    </div>
  );
}
