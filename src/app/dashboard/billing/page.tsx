import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { getQuota } from "@/lib/codes/quota";
import {
  billingConfigured, billingProfile, defaultCard, isLive, listInvoices, stripe, syncSubscription,
  type CardInfo, type InvoiceRow,
} from "@/lib/billing";
import { BillingView } from "@/components/dashboard/billing-view";

export const metadata: Metadata = { title: "Tarif & Rechnungen" };

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard/billing");
  const { checkout } = await searchParams;
  const configured = billingConfigured();

  let prof = await billingProfile(user.id);
  // Back from Checkout before the webhook arrived: pick up the subscription directly.
  if (configured && checkout === "success" && prof?.stripe_customer_id && !isLive(prof.subscription_status)) {
    try {
      const subs = await stripe().subscriptions.list({ customer: prof.stripe_customer_id, limit: 1 });
      if (subs.data[0]) { await syncSubscription(subs.data[0]); prof = await billingProfile(user.id); }
    } catch { /* the webhook will catch up */ }
  }

  const supabase = await createClient();
  const [quota, { count: formCount }] = await Promise.all([
    getQuota(user.id),
    supabase.from("forms").select("id", { count: "exact", head: true }),
  ]);
  const paid = quota.account.planSource === "paid" && isLive(prof?.subscription_status);
  const gift = quota.account.planSource === "gift" && quota.plan !== "free";

  let invoices: InvoiceRow[] = [];
  let card: CardInfo | null = null;
  if (configured && prof?.stripe_customer_id) {
    [invoices, card] = await Promise.all([
      listInvoices(prof.stripe_customer_id).catch(() => []),
      defaultCard(prof.stripe_customer_id).catch(() => null),
    ]);
  }

  return (
    <BillingView
      checkout={checkout} configured={configured} plan={quota.plan} planSource={quota.account.planSource} planUntil={quota.account.planUntil}
      used={quota.used} limit={isFinite(quota.limit) ? quota.limit : null} forms={formCount ?? 0} prof={prof} paid={paid} gift={gift}
      invoices={invoices} card={card}
    />
  );
}
