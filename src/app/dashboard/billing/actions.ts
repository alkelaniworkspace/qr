"use server";

import { revalidatePath } from "next/cache";
import { env } from "@/lib/env";
import { getSessionUser } from "@/lib/supabase/server";
import { getAccount } from "@/lib/account";
import {
  billingConfigured, billingProfile, ensureCustomer, ensurePortalConfig, ensurePrice, founderCoupon, isLive, stripe, syncSubscription,
  PAID_PLANS, type Interval, type PaidPlan,
} from "@/lib/billing";

export type BillingResult = { url?: string; error?: string; ok?: boolean };

const NOT_READY = "Die Online-Zahlung wird gerade freigeschaltet. Schreib uns kurz an info@qlickqr.com, dann richten wir deinen Tarif sofort ein.";
const TRIAL_DAYS = 14;
const FAILED = "Das hat nicht geklappt. Bitte versuche es gleich noch einmal.";
const valid = (plan: string, interval: string): plan is PaidPlan => PAID_PLANS.includes(plan as PaidPlan) && (interval === "month" || interval === "year");

/** New subscription → Stripe Checkout. Existing subscription → switch the plan in place. */
export async function startCheckout(plan: string, interval: Interval): Promise<BillingResult> {
  const user = await getSessionUser();
  if (!user) return { error: "Bitte melde dich an." };
  if (!valid(plan, interval)) return { error: "Unbekannter Tarif." };
  if (!billingConfigured()) return { error: NOT_READY };
  try {
    const prof = await billingProfile(user.id);
    if (prof?.subscription_id && isLive(prof.subscription_status)) return changePlan(plan, interval);
    const account = await getAccount(user.id);
    const [customer, price, coupon] = await Promise.all([ensureCustomer(user.id, user.email, account.fullName), ensurePrice(plan, interval), founderCoupon()]);
    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      customer,
      client_reference_id: user.id,
      line_items: [{ price, quantity: 1 }],
      ...(coupon ? { discounts: [{ coupon }] } : { allow_promotion_codes: true }),
      // 14 days free for the first subscription, as promised on the pricing page
      subscription_data: { metadata: { user_id: user.id, plan }, ...(prof?.subscription_id ? {} : { trial_period_days: TRIAL_DAYS }) },
      metadata: { user_id: user.id, plan },
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      customer_update: { address: "auto", name: "auto" },
      automatic_tax: { enabled: process.env.STRIPE_AUTOMATIC_TAX === "1" },
      locale: "de",
      custom_text: { submit: { message: "Es gelten unsere AGB (qlickqr.com/agb) und die Widerrufsbelehrung (qlickqr.com/widerruf). Kündigen kannst du jederzeit zum Ende des Zeitraums." } },
      success_url: `${env.appUrl}/dashboard/billing?checkout=success`,
      cancel_url: `${env.appUrl}/dashboard/billing?checkout=cancel`,
    });
    return { url: session.url ?? undefined };
  } catch (e) {
    console.error("checkout", e);
    return { error: FAILED };
  }
}

/** Upgrade or downgrade a running subscription (prorated). */
export async function changePlan(plan: string, interval: Interval): Promise<BillingResult> {
  const user = await getSessionUser();
  if (!user) return { error: "Bitte melde dich an." };
  if (!valid(plan, interval)) return { error: "Unbekannter Tarif." };
  if (!billingConfigured()) return { error: NOT_READY };
  try {
    const prof = await billingProfile(user.id);
    if (!prof?.subscription_id) return { error: "Kein laufendes Abo gefunden." };
    const sub = await stripe().subscriptions.retrieve(prof.subscription_id);
    const price = await ensurePrice(plan, interval);
    const updated = await stripe().subscriptions.update(sub.id, {
      items: [{ id: sub.items.data[0].id, price }],
      proration_behavior: "create_prorations",
      cancel_at_period_end: false,
      metadata: { ...sub.metadata, user_id: user.id, plan },
    });
    await syncSubscription(updated);
    revalidatePath("/dashboard", "layout");
    return { ok: true };
  } catch (e) {
    console.error("change plan", e);
    return { error: FAILED };
  }
}

/** Cancel at the end of the paid period, or undo that. */
export async function setCancel(cancel: boolean): Promise<BillingResult> {
  const user = await getSessionUser();
  if (!user) return { error: "Bitte melde dich an." };
  if (!billingConfigured()) return { error: NOT_READY };
  try {
    const prof = await billingProfile(user.id);
    if (!prof?.subscription_id) return { error: "Kein laufendes Abo gefunden." };
    const sub = await stripe().subscriptions.update(prof.subscription_id, { cancel_at_period_end: cancel });
    await syncSubscription(sub);
    revalidatePath("/dashboard", "layout");
    return { ok: true };
  } catch (e) {
    console.error("cancel", e);
    return { error: FAILED };
  }
}

/** Stripe customer portal: payment method, billing address, invoices. */
export async function openPortal(): Promise<BillingResult> {
  const user = await getSessionUser();
  if (!user) return { error: "Bitte melde dich an." };
  if (!billingConfigured()) return { error: NOT_READY };
  try {
    const prof = await billingProfile(user.id);
    if (!prof?.stripe_customer_id) return { error: "Noch keine Zahlungsdaten hinterlegt." };
    const s = await stripe().billingPortal.sessions.create({ configuration: await ensurePortalConfig(), customer: prof.stripe_customer_id, return_url: `${env.appUrl}/dashboard/billing`, locale: "de" });
    return { url: s.url };
  } catch (e) {
    console.error("portal", e);
    return { error: FAILED };
  }
}
