/**
 * Two languages for the public site. Texts live next to the markup as
 * pairs: T("Preise", "Pricing"). The choice is a cookie, read on the server.
 */
export type Lang = "de" | "en";
export const LANG_COOKIE = "qlick.lang";
export type Translate = (de: string, en: string) => string;
export const pick = (lang: Lang): Translate => (de, en) => (lang === "en" ? en : de);
