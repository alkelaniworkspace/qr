/** Keep `dynamic` in sync with public.plan_dynamic_limit() in the migration. */
export const PLANS = {
  free: { label: "Free", price: 0, dynamic: 1, features: ["Unbegrenzt statische Codes", "1 dynamischer Code", "Voller Design-Studio", "Basis-Statistik"] },
  starter: { label: "Starter", price: 9, dynamic: 10, features: ["10 dynamische Codes", "Alle Seitentypen", "Statistik 12 Monate", "Logo & Farbverläufe"] },
  business: { label: "Business", price: 24, dynamic: 100, features: ["100 dynamische Codes", "Eigene Domain", "Brand-Kit", "Team mit 3 Personen"] },
  agency: { label: "Agency", price: 79, dynamic: 1000, features: ["1.000 dynamische Codes", "White Label", "Kunden-Arbeitsbereiche", "API-Zugang"] },
} as const;

export type PlanId = keyof typeof PLANS;
export const planOf = (p: string | null | undefined): PlanId => (p && p in PLANS ? (p as PlanId) : "free");
