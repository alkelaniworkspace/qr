import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Studio, type StudioCode } from "@/components/studio/studio";
import { createClient, getSessionUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Code bearbeiten" };

export default async function EditCodePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const supabase = await createClient();
  const { data } = await supabase.from("qr_codes").select("id, name, slug, type, mode, content, style").eq("id", id).maybeSingle();
  if (!data) notFound();
  return <Studio variant="edit" userId={user.id} code={data as StudioCode} />;
}
