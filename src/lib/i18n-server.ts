import "server-only";
import { cookies } from "next/headers";
import { LANG_COOKIE, pick, type Lang } from "@/lib/i18n";

export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return v === "en" ? "en" : "de";
}

export async function getT() {
  const lang = await getLang();
  return { lang, T: pick(lang) };
}
