import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, ClipboardList, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FORM_TEMPLATES } from "@/lib/forms/types";
import { TypeIcon } from "@/components/type-icon";
import { createForm } from "./actions";

export const metadata: Metadata = { title: "Formulare" };

export default async function FormsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: forms } = await supabase.from("forms").select("id, slug, title, status, response_count, updated_at").order("updated_at", { ascending: false });

  return (
    <div className="animate-rise">
      <h1 className="font-display text-5xl leading-none">Formulare</h1>
      <p className="mt-3 text-dim">Feedback, Reservierungen, Umfragen und Gewinnspiele. Antworten mit Statistik und Export.</p>
      {error && (
        <p className="mt-6 rounded-2xl border border-rose/30 bg-rose/10 px-4 py-3 text-sm text-rose">
          {error === "limit" ? <>Dein Tarif erlaubt keine weiteren Formulare. <Link href="/dashboard/billing" className="underline">Tarif ansehen</Link></> : "Formular konnte nicht erstellt werden."}
        </p>
      )}

      {!!forms?.length && (
        <div className="mt-10 grid gap-3">
          {forms.map((f) => (
            <div key={f.id} className="card flex flex-wrap items-center gap-4 p-5">
              <span className="grid size-11 place-items-center rounded-2xl bg-hi/10"><ClipboardList className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <Link href={`/dashboard/forms/${f.id}`} className="block truncate font-semibold hover:underline">{f.title}</Link>
                <p className="text-sm text-dim">{f.status === "open" ? "Offen" : "Geschlossen"} · {f.response_count} Antworten · /f/{f.slug}</p>
              </div>
              <Link href={`/dashboard/forms/${f.id}/responses`} className="inline-flex items-center gap-2 rounded-full border border-edge px-4 py-2 text-sm font-semibold hover:bg-hi/5"><BarChart3 className="size-4" /> Antworten</Link>
              <Link href={`/dashboard/forms/${f.id}`} className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-on-brand">Bearbeiten <ArrowRight className="size-4" /></Link>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-14 font-display text-2xl">Neues Formular</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <form action={createForm}>
          <button className="card flex h-full w-full flex-col items-start gap-3 border-dashed p-5 text-left transition hover:border-edge-strong">
            <span className="grid size-10 place-items-center rounded-xl bg-brand text-on-brand"><Plus className="size-5" /></span>
            <span className="font-semibold">Leeres Formular</span>
            <span className="text-sm text-dim">Von null aufbauen</span>
          </button>
        </form>
        {FORM_TEMPLATES.map((t) => (
          <form key={t.id} action={createForm}>
            <input type="hidden" name="template" value={t.id} />
            <button className="card flex h-full w-full flex-col items-start gap-3 p-5 text-left transition hover:-translate-y-0.5 hover:border-edge-strong">
              <span className="grid size-10 place-items-center rounded-xl bg-hi/10"><TypeIcon name={t.icon} className="size-5" /></span>
              <span className="font-semibold">{t.name}</span>
              <span className="text-sm text-dim">{t.hint}</span>
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
