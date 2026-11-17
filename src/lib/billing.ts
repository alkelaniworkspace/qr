import "server-only";
import Stripe from "stripe";
import { adminClient } from "@/lib/supabase/admin";
import { FOUNDER, PLANS, planOf, type PlanId } from "@/lib/plans";
import { site } from "@/lib/site";

/**
 * Subscriptions with Stripe. Everything switches on as soon as these env vars exist:
 *   STRIPE_SECRET_KEY      sk_live_… / sk_test_…  (Qlick's own Stripe account)
 *   STRIPE_WEBHOOK_SECRET  whsec_…  (endpoint https://www.qlickqr.com/api/billing/webhook)
 *   STRIPE_AUTOMATIC_TAX   "1" to let Stripe Tax add VAT (optional)
 * Products and prices are created on first use with fixed IDs / lookup keys.
 */
export const billingConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);

export type Interval = "month" | "year";
export type PaidPlan = Exclude<PlanId, "free">;
export const PAID_PLANS: PaidPlan[] = ["start", "pro", "business"];
const PRICE_VERSION = "v1";

let client: Stripe | null = null;
export function stripe(): Stripe {
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY as string);
  return client;
}

/** Cents charged per billing period. Yearly = monthly-equivalent price × 12. */
export function amountFor(plan: PaidPlan, interval: Interval): number {
  const p = PLANS[plan];
  return Math.round((interval === "year" ? p.yearly * 12 : p.price) * 100);
}

async function ensureProduct(plan: PaidPlan): Promise<string> {
  const id = `qlick_${plan}`;
  try {
    const p = await stripe().products.retrieve(id);
    if (!p.active) await stripe().products.update(id, { active: true });
    return id;
  } catch {
    await stripe().products.create({ id, name: `${site.name} ${PLANS[plan].label}`, metadata: { plan } });
    return id;
  }
}

/** Price ID for a plan and interval (created once, found again via lookup key). */
export async function ensurePrice(plan: PaidPlan, interval: Interval): Promise<string> {
  const key = `qlick_${plan}_${interval}_${PRICE_VERSION}`;
  const found = await stripe().prices.list({ lookup_keys: [key], active: true, limit: 1 });
  if (found.data[0]) return found.data[0].id;
  const product = await ensureProduct(plan);
  const price = await stripe().prices.create({
    product, currency: "eur", unit_amount: amountFor(plan, interval), recurring: { interval },
    lookup_key: key, metadata: { plan, interval },
  });
  return price.id;
}

/** Founder discount (40 % for life) while seats are left. */
export async function founderCoupon(): Promise<string | null> {
  const id = "QLICK_FOUNDER";
  try {
    const c = await stripe().coupons.retrieve(id);
    return c.valid ? id : null;
  } catch {
    await stripe().coupons.create({ id, name: "Gründer-Rabatt", percent_off: FOUNDER.discount, duration: "forever", max_redemptions: FOUNDER.seats });
    return id;
  }
}

export interface BillingProfile {
  stripe_customer_id: string | null;
  subscription_id: string | null;
  subscription_status: string | null;
  billing_interval: Interval | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  plan: string;
  plan_source: string;
}

export async function billingProfile(userId: string): Promise<BillingProfile | null> {
  const { data } = await adminClient().from("profiles")
    .select("stripe_customer_id, subscription_id, subscription_status, billing_interval, current_period_end, cancel_at_period_end, plan, plan_source")
    .eq("id", userId).maybeSingle();
  return (data as BillingProfile | null) ?? null;
}

export async function ensureCustomer(userId: string, email: string, name?: string): Promise<string> {
  const prof = await billingProfile(userId);
  if (prof?.stripe_customer_id) return prof.stripe_customer_id;
  const c = await stripe().customers.create({ email, name: name || undefined, metadata: { user_id: userId }, preferred_locales: ["de"] });
  await adminClient().from("profiles").update({ stripe_customer_id: c.id } as never).eq("id", userId);
  return c.id;
}

const LIVE = new Set(["active", "trialing", "past_due"]);
export const isLive = (status: string | null | undefined) => !!status && LIVE.has(status);

/** Writes a Stripe subscription into the profile: the paid plan while it is live, Free when it ends. */
export async function syncSubscription(sub: Stripe.Subscription): Promise<string | null> {
  const customer = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  let userId = sub.metadata?.user_id || null;
  if (!userId) {
    const { data } = await adminClient().from("profiles").select("id").eq("stripe_customer_id", customer).maybeSingle();
    userId = (data as { id: string } | null)?.id ?? null;
  }
  if (!userId) return null;
  const item = sub.items.data[0];
  const plan = planOf(sub.metadata?.plan || item?.price.metadata?.plan);
  const interval = (item?.price.recurring?.interval ?? null) as Interval | null;
  const live = isLive(sub.status);
  const { data: cur } = await adminClient().from("profiles").select("plan_source, subscription_id").eq("id", userId).maybeSingle();
  const current = cur as { plan_source: string; subscription_id: string | null } | null;
  // an old, ended subscription must not overwrite a newer one
  if (!live && current?.subscription_id && current.subscription_id !== sub.id) return userId;

  const patch: Record<string, unknown> = {
    stripe_customer_id: customer,
    subscription_id: sub.id,
    subscription_status: sub.status,
    billing_interval: interval,
    current_period_end: item?.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null,
    cancel_at_period_end: !!sub.cancel_at_period_end || !!sub.cancel_at,
  };
  if (live && plan !== "free") Object.assign(patch, { plan, plan_source: "paid", plan_until: null, plan_note: null });
  else if (!live && current?.plan_source === "paid") Object.assign(patch, { plan: "free", plan_source: "free", plan_until: null });
  await adminClient().from("profiles").update(patch as never).eq("id", userId);
  return userId;
}

export interface InvoiceRow { id: string; number: string | null; created: number; total: number; status: string | null; url: string | null; pdf: string | null }

export async function listInvoices(customer: string): Promise<InvoiceRow[]> {
  const res = await stripe().invoices.list({ customer, limit: 24 });
  return res.data.map((i) => ({ id: i.id ?? "", number: i.number, created: i.created, total: i.total, status: i.status, url: i.hosted_invoice_url ?? null, pdf: i.invoice_pdf ?? null }));
}

export interface CardInfo { brand: string; last4: string; exp: string }
export async function defaultCard(customer: string): Promise<CardInfo | null> {
  const c = await stripe().customers.retrieve(customer, { expand: ["invoice_settings.default_payment_method"] });
  if (c.deleted) return null;
  const pm = c.invoice_settings?.default_payment_method;
  if (!pm || typeof pm === "string") {
    const list = await stripe().paymentMethods.list({ customer, limit: 1 });
    const first = list.data[0];
    if (!first) return null;
    return first.card ? { brand: first.card.brand, last4: first.card.last4, exp: `${String(first.card.exp_month).padStart(2, "0")}/${String(first.card.exp_year).slice(-2)}` } : { brand: first.type, last4: "", exp: "" };
  }
  if (pm.card) return { brand: pm.card.brand, last4: pm.card.last4, exp: `${String(pm.card.exp_month).padStart(2, "0")}/${String(pm.card.exp_year).slice(-2)}` };
  return { brand: pm.type, last4: "", exp: "" };
}

/** Customer portal settings for Qlick (payment method, address, tax ID, invoices). Created once, found via metadata. */
export async function ensurePortalConfig(): Promise<string> {
  const list = await stripe().billingPortal.configurations.list({ active: true, limit: 100 });
  const found = list.data.find((c) => c.metadata?.app === "qlick");
  if (found) return found.id;
  const c = await stripe().billingPortal.configurations.create({
    business_profile: { headline: `${site.name}: Zahlungsdaten und Rechnungen` },
    features: {
      customer_update: { enabled: true, allowed_updates: ["email", "address", "name", "tax_id"] },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
    },
    metadata: { app: "qlick" },
  });
  return c.id;
}
