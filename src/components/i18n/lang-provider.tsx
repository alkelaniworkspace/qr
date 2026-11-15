"use client";

import { createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { LANG_COOKIE, pick, type Lang } from "@/lib/i18n";

const Ctx = createContext<Lang>("de");

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <Ctx.Provider value={lang}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);
export const useT = () => pick(useContext(Ctx));

/** DE | EN switch. Stores the choice for a year and re-renders on the server. */
function saveLang(l: Lang) {
  document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.setAttribute("lang", l);
}

export function LangSwitch({ className = "" }: { className?: string }) {
  const lang = useLang();
  const router = useRouter();
  const set = (l: Lang) => {
    if (l === lang) return;
    saveLang(l);
    router.refresh();
  };
  return (
    <div role="radiogroup" aria-label="Sprache / Language" className={`relative inline-flex h-9 items-center rounded-xl border border-edge p-0.5 text-[12px] font-bold ${className}`}>
      {(["de", "en"] as const).map((l) => (
        <button key={l} type="button" role="radio" aria-checked={lang === l} onClick={() => set(l)}
          className={`h-full rounded-[10px] px-2.5 transition ${lang === l ? "bg-fg text-bg" : "text-dim hover:text-fg"}`}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
