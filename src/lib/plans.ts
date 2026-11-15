/**
 * Plans. Keep `dynamic` in sync with public.plan_dynamic_limit() in the migrations.
 * null = unlimited. Prices in EUR, yearly price is per month when billed yearly.
 */
export const PLANS = {
  free: {
    label: "Free", price: 0, yearly: 0, dynamic: 3, forms: 1, responses: 100, branding: true, statsDays: 30,
    tagline: "Zum Ausprobieren",
    features: ["Statische Codes unbegrenzt", "3 dynamische Codes", "Alle Designs und Vorlagen", "1 Formular, 100 Antworten/Monat", "Statistik 30 Tage"],
  },
  start: {
    label: "Start", price: 4.99, yearly: 3.99, dynamic: 15, forms: 3, responses: 1000, branding: false, statsDays: 90,
    tagline: "Für ein Geschäft",
    features: ["15 dynamische Codes", "Ohne Qlick-Branding", "3 Formulare, 1.000 Antworten", "Statistik 90 Tage", "Poster, Sticker und Videos"],
  },
  pro: {
    label: "Pro", price: 9.99, yearly: 7.99, dynamic: 100, forms: null, responses: null, branding: false, statsDays: 730,
    tagline: "Am beliebtesten",
    features: ["100 dynamische Codes", "Formulare und Antworten unbegrenzt", "Excel- und PDF-Export", "Speisekarten-Import mit KI", "Volle Statistik und Wochenbericht"],
  },
  business: {
    label: "Business", price: 24.99, yearly: 19.99, dynamic: null, forms: null, responses: null, branding: false, statsDays: 730,
    tagline: "Mehrere Standorte",
    features: ["Unbegrenzt dynamische Codes", "Mehrere Standorte und Marken", "Team mit 5 Personen", "Eigene Domain", "White Label"],
  },
} as const;

export type PlanId = keyof typeof PLANS;
export const planOf = (p: string | null | undefined): PlanId => (p && p in PLANS ? (p as PlanId) : p === "starter" ? "start" : p === "agency" ? "business" : "free");
export const euro = (n: number) => (n === 0 ? "0 €" : `${n.toFixed(2).replace(".", ",")} €`);
/** Founder offer: first 100 paying customers keep 40 % off for life. */
export const FOUNDER = { discount: 40, seats: 100 };
