import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicForm } from "@/lib/forms/public";
import { PublicForm } from "./public-form";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const form = await getPublicForm((await params).slug);
  return { title: { absolute: form?.title ?? "Formular" }, robots: { index: false } };
}

export default async function FormPage({ params }: Props) {
  const form = await getPublicForm((await params).slug);
  if (!form) notFound();
  return <PublicForm form={form} />;
}
