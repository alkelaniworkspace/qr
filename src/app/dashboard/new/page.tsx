import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Studio } from "@/components/studio/studio";
import { getSessionUser } from "@/lib/supabase/server";
import { getQuota } from "@/lib/codes/quota";
import { getType } from "@/lib/codes/types";

export const metadata: Metadata = { title: "Neuer Code" };

export default async function NewCodePage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { type } = await searchParams;
  const quota = await getQuota(user.id);
  return <Studio key={type ?? "new"} variant="create" userId={user.id} dynamicLocked={quota.locked} initialType={getType(type ?? "")?.id} />;
}
