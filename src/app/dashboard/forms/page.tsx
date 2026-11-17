import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FORM_TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/forms/templates";
import type { FormDef } from "@/lib/forms/types";
import { TemplateGallery } from "@/components/forms/template-gallery";
import { FormThumb } from "@/components/forms/form-thumb";

export const metadata: Metadata = { title: "Formulare" };

const ago = (iso: string) => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return d <= 0 ? "heute" : d === 1 ? "gestern" : `vor ${d} Tagen`;
};

export default async function FormsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("forms").select("id, slug, title, description, fields, settings, status, response_count, updated_at").order("updated_at", { ascending: false });
  const forms = data ?? [];
  const items = FORM_TEMPLATES.map((t) => ({ id: t.id, name: t.name, hint: t.hint, icon: t.icon, category: t.category, def: t.build() }));

  return (
    <div className="animate-rise">
      <p className="text-sm text-dim">Sammeln</p>
      <h1 className="mt-1 font-display text-5xl leading-none">Formulare</h1>
      <p className="mt-3 max-w-2xl text-dim">Feedback, Reservierungen, Anmeldungen, Umfragen und mehr. Mit eigenem Design, Logik und Antworten in Echtzeit.</p>
      {error && (
        <p className="mt-6 rounded-2xl border border-rose/30 bg-rose/10 px-4 py-3 text-sm text-rose">
          {error === "limit" ? <>Dein Tarif erlaubt keine weiteren Formulare. <Link href="/dashboard/billing" className="underline">Tarif ansehen</Link></> : "Formular konnte nicht erstellt werden."}
        </p>
      )}

      {forms.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-2xl">Deine Formulare <span className="text-faint">· {forms.length}</span></h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {forms.map((f, i) => (
              <div key={f.id} className="card group flex gap-5 overflow-hidden p-4">
                <Link href={`/dashboard/forms/${f.id}`} className="w-28 shrink-0 pt-1">
                  <FormThumb def={{ title: f.title, description: f.description, fields: f.fields, settings: f.settings } as FormDef} tilt={i % 2 ? 2 : -2.5} />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col py-1">
                  <Link href={`/dashboard/forms/${f.id}`} className="line-clamp-2 font-semibold hover:underline">{f.title}</Link>
                  <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-dim">
                    <span className={f.status === "open" ? "size-1.5 rounded-full bg-lime" : "size-1.5 rounded-full bg-faint"} /> {f.status === "open" ? "Live" : "Geschlossen"} · {ago(f.updated_at)}
                  </p>
                  <p className="mt-3 font-display text-3xl leading-none">{f.response_count}<span className="ml-1.5 font-sans text-[13px] font-normal text-dim">Antworten</span></p>
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
                    <Link href={`/dashboard/forms/${f.id}`} className="btn-cta inline-flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-[13px] font-bold">Bearbeiten <ArrowRight className="size-3.5" /></Link>
                    <Link href={`/dashboard/forms/${f.id}/responses`} className="grid size-9 place-items-center rounded-xl border border-edge hover:bg-hi/[0.06]" aria-label="Antworten"><BarChart3 className="size-4" /></Link>
                    <a href={`/f/${f.slug}`} target="_blank" rel="noreferrer" className="grid size-9 place-items-center rounded-xl border border-edge hover:bg-hi/[0.06]" aria-label="Öffnen"><ExternalLink className="size-4" /></a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mt-14"><TemplateGallery items={items} categories={TEMPLATE_CATEGORIES} /></div>
    </div>
  );
}
