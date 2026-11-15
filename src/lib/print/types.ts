import type { CodeTypeId } from "@/lib/codes/types";

export type FormatId = "a6" | "a5" | "a4" | "a3" | "a2" | "a1" | "a0" | "dl" | "square" | "card" | "sticker" | "custom";

export const FORMATS: Record<FormatId, { label: string; hint: string; w: number; h: number }> = {
  a6: { label: "A6", hint: "Flyer, Tischkarte", w: 105, h: 148 },
  a5: { label: "A5", hint: "Flyer, Aufsteller", w: 148, h: 210 },
  a4: { label: "A4", hint: "Aushang, Fenster", w: 210, h: 297 },
  a3: { label: "A3", hint: "Poster", w: 297, h: 420 },
  a2: { label: "A2", hint: "Großes Poster", w: 420, h: 594 },
  a1: { label: "A1", hint: "Plakat", w: 594, h: 841 },
  a0: { label: "A0", hint: "Großplakat", w: 841, h: 1189 },
  dl: { label: "DL", hint: "Tischaufsteller", w: 99, h: 210 },
  square: { label: "Quadrat", hint: "10 × 10 cm", w: 100, h: 100 },
  card: { label: "Karte", hint: "Visitenkarte 85×55", w: 85, h: 55 },
  sticker: { label: "Sticker", hint: "5 × 5 cm", w: 50, h: 50 },
  custom: { label: "Eigenes", hint: "Maße in mm", w: 200, h: 200 },
};

export type PosterTemplateId = "classic" | "bold" | "minimal" | "menu" | "review" | "wifi" | "split" | "ticket" | "social" | "luxe";

export const POSTER_TEMPLATES: { id: PosterTemplateId; name: string }[] = [
  { id: "classic", name: "Klassik" },
  { id: "bold", name: "Bold" },
  { id: "luxe", name: "Luxus" },
  { id: "minimal", name: "Minimal" },
  { id: "menu", name: "Speisekarte" },
  { id: "review", name: "Bewertung" },
  { id: "wifi", name: "WLAN" },
  { id: "split", name: "Geteilt" },
  { id: "ticket", name: "Gutschein" },
  { id: "social", name: "Social" },
];

export interface PosterSettings {
  template: PosterTemplateId;
  format: FormatId;
  customW: number;
  customH: number;
  landscape: boolean;
  bleed: boolean;
  headline: string;
  subline: string;
  cta: string;
  info: string;
  footer: string;
  bg: string;
  accent: string;
  text: string;
}

export const POSTER_PALETTES: { name: string; bg: string; accent: string; text: string }[] = [
  { name: "Granat", bg: "#ffffff", accent: "#b3173a", text: "#1b0a10" },
  { name: "Bordeaux", bg: "#3b0e1a", accent: "#e9b949", text: "#fff7ec" },
  { name: "Marine", bg: "#10204d", accent: "#e9b949", text: "#ffffff" },
  { name: "Gold", bg: "#fbf4e2", accent: "#1f3c88", text: "#1a1a1a" },
  { name: "Nacht", bg: "#0f1113", accent: "#d42a4e", text: "#f7f7f8" },
  { name: "Papier", bg: "#f4f1e8", accent: "#0f1113", text: "#0f1113" },
];

const COPY: Partial<Record<CodeTypeId, { template: PosterTemplateId; headline: string; subline: string; cta: string }>> = {
  menu: { template: "menu", headline: "Unsere Speisekarte", subline: "Alle Gerichte, Preise und Allergene auf einen Blick.", cta: "Scannen & entdecken" },
  review: { template: "review", headline: "Hat es dir gefallen?", subline: "Bewerte uns auf Google. Es dauert nur 30 Sekunden.", cta: "Jetzt bewerten" },
  wifi: { template: "wifi", headline: "Gratis WLAN", subline: "Scannen und sofort verbunden. Ohne Passwort-Tippen.", cta: "Scannen & surfen" },
  links: { template: "social", headline: "Folge uns", subline: "Instagram, TikTok und mehr. Alles an einem Ort.", cta: "Jetzt folgen" },
  coupon: { template: "ticket", headline: "-20 %", subline: "Auf deinen nächsten Besuch. Einfach scannen und sparen.", cta: "Gutschein holen" },
  vcard: { template: "minimal", headline: "Kontakt speichern", subline: "Ein Scan und meine Daten sind in deinem Handy.", cta: "Scannen" },
  event: { template: "bold", headline: "Sei dabei", subline: "Alle Infos und den Termin direkt in deinen Kalender.", cta: "Jetzt scannen" },
  pdf: { template: "classic", headline: "Unser Katalog", subline: "Alle Produkte und Preise als PDF.", cta: "Katalog öffnen" },
  app: { template: "bold", headline: "Hol dir die App", subline: "iPhone und Android landen automatisch im richtigen Store.", cta: "Jetzt laden" },
  site: { template: "classic", headline: "Besuch uns online", subline: "Leistungen, Öffnungszeiten und Kontakt.", cta: "Scannen" },
  location: { template: "classic", headline: "So findest du uns", subline: "Scannen und direkt in Google Maps öffnen.", cta: "Route starten" },
};

export function defaultPoster(type: CodeTypeId, content: Record<string, unknown>, name: string): PosterSettings {
  const copy = COPY[type] ?? { template: "classic" as const, headline: "Scan mich", subline: "Mehr erfahren mit einem Scan.", cta: "Jetzt scannen" };
  const s = (v: unknown) => String(v ?? "").trim();
  const info = type === "wifi" ? [s(content.ssid) && `Netzwerk: ${s(content.ssid)}`, s(content.password) && `Passwort: ${s(content.password)}`].filter(Boolean).join("\n") : "";
  const business = s(content.business) || s(content.name) || s(content.title) || name;
  return {
    template: copy.template,
    format: "a5",
    customW: 200,
    customH: 200,
    landscape: false,
    bleed: false,
    headline: copy.headline,
    subline: copy.subline,
    cta: copy.cta,
    info,
    footer: business,
    ...POSTER_PALETTES[0],
  };
}

export function posterSize(p: PosterSettings): { w: number; h: number } {
  if (p.format === "custom") return { w: clampMm(p.customW), h: clampMm(p.customH) };
  const f = FORMATS[p.format];
  return p.landscape ? { w: f.h, h: f.w } : { w: f.w, h: f.h };
}

export function clampMm(v: number): number {
  return Math.max(30, Math.min(2000, Math.round(Number(v) || 0)));
}
