/**
 * Plans. Keep `dynamic` in sync with public.plan_dynamic_limit() in the migrations.
 * null = unlimited. Prices in EUR, yearly price is per month when billed yearly.
 */
export const PLANS = {
  free: {
    label: "Free", price: 0, yearly: 0, dynamic: 1, forms: 1, responses: 100, branding: true, statsDays: 30,
    tagline: "Zum Ausprobieren", taglineEn: "To try it out",
    features: ["Statische Codes unbegrenzt", "1 dynamischer Code", "Alle Designs und Vorlagen", "1 Formular, 100 Antworten/Monat", "Statistik 30 Tage"],
    featuresEn: ["Unlimited static codes", "1 dynamic code", "All designs and templates", "1 form, 100 responses/month", "30-day statistics"],
  },
  start: {
    label: "Start", price: 4.99, yearly: 3.99, dynamic: 15, forms: 3, responses: 1000, branding: false, statsDays: 90,
    tagline: "Für ein Geschäft", taglineEn: "For one business",
    features: ["15 dynamische Codes", "Ohne Qlick-Branding", "3 Formulare, 1.000 Antworten", "Statistik 90 Tage", "Poster, Sticker und Videos"],
    featuresEn: ["15 dynamic codes", "No Qlick branding", "3 forms, 1,000 responses", "90-day statistics", "Posters, stickers and videos"],
  },
  pro: {
    label: "Pro", price: 9.99, yearly: 7.99, dynamic: 50, forms: null, responses: null, branding: false, statsDays: 730,
    tagline: "Am beliebtesten", taglineEn: "Most popular",
    features: ["50 dynamische Codes", "Formulare und Antworten unbegrenzt", "Excel- und PDF-Export", "Speisekarten-Import mit KI", "Volle Statistik und Wochenbericht"],
    featuresEn: ["50 dynamic codes", "Unlimited forms and responses", "Excel and PDF export", "AI menu import", "Full statistics and weekly report"],
  },
  business: {
    label: "Business", price: 24.99, yearly: 19.99, dynamic: 150, forms: null, responses: null, branding: false, statsDays: 730,
    tagline: "Mehrere Standorte", taglineEn: "Several locations",
    features: ["150 dynamische Codes", "Mehrere Standorte und Marken", "Team mit 5 Personen", "Eigene Domain", "White Label"],
    featuresEn: ["150 dynamic codes", "Several locations and brands", "Team of 5", "Custom domain", "White label"],
  },
} as const;

/** Above the largest plan: individual offer. */
export const QUOTE_FROM = 151;
export const SALES_EMAIL = "hallo@qlick.codes";

export type PlanId = keyof typeof PLANS;
export const planOf = (p: string | null | undefined): PlanId => (p && p in PLANS ? (p as PlanId) : p === "starter" ? "start" : p === "agency" ? "business" : "free");
export const euro = (n: number) => (n === 0 ? "0 €" : `${n.toFixed(2).replace(".", ",")} €`);
/** Founder offer: first 100 paying customers keep 40 % off for life. */
export const FOUNDER = { discount: 40, seats: 100 };
