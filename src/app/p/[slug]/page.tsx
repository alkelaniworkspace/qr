import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPublicCode } from "@/lib/codes/public";
import { getType } from "@/lib/codes/types";
import { HostedPage, hostedTitle } from "@/components/pages/hosted-pages";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const code = await getPublicCode((await params).slug);
  if (!code) return { title: "Nicht gefunden" };
  return { title: { absolute: hostedTitle(code) }, robots: { index: false, follow: false } };
}

export default async function PublicPage({ params }: Props) {
  const { slug } = await params;
  const code = await getPublicCode(slug);
  if (!code || code.mode !== "dynamic" || !getType(code.type)?.hostedPage) notFound();
  if (code.status === "paused") redirect("/unavailable?reason=paused");
  return <HostedPage code={code} />;
}
