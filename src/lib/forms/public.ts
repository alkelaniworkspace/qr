import "server-only";
import { cache } from "react";
import { anonClient } from "@/lib/supabase/anon";
import { supabaseConfigured } from "@/lib/env";
import type { PublicFormData } from "@/components/forms/form-view";

export const getPublicForm = cache(async (slug: string): Promise<PublicFormData | null> => {
  if (!supabaseConfigured || !/^[A-Za-z0-9_-]{4,64}$/.test(slug)) return null;
  const { data } = await anonClient().rpc("public_form", { p_slug: slug } as never);
  const row = (Array.isArray(data) ? data[0] : data) as unknown as PublicFormData | undefined;
  return row ?? null;
});
