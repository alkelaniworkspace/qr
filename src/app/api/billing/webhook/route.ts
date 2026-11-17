import type Stripe from "stripe";
import { billingConfigured, stripe, syncSubscription } from "@/lib/billing";
import { adminClient } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/email";
import { mailLayout } from "@/lib/mail-layout";
import { env } from "@/lib/env";
import { PLANS, planOf } from "@/lib/plans";
import { site } from "@/lib/site";

export const runtime = "nodejs";

/** Stripe → Qlick. Keeps the plan in the profile in step with the subscription. */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!billingConfigured() || !secret) return new Response("Billing not configured", { status: 503 });
  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, request.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object;
        if (s.mode === "subscription" && typeof s.subscription === "string") {
          const sub = await stripe().subscriptions.retrieve(s.subscription);
          const userId = await syncSubscription(sub);
          if (userId) await welcome(userId, planOf(sub.metadata?.plan));
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.paused":
      case "customer.subscription.resumed":
        // re-read with the SDK's API version: the endpoint may send an older payload shape
        await syncSubscription(await stripe().subscriptions.retrieve(event.data.object.id));
        break;
      case "invoice.payment_failed":
      case "invoice.paid": {
        const inv = event.data.object;
        const subId = inv.parent?.subscription_details?.subscription;
        if (typeof subId === "string") await syncSubscription(await stripe().subscriptions.retrieve(subId));
        break;
      }
    }
  } catch (e) {
    console.error("stripe webhook", event.type, e);
    return new Response("Handler failed", { status: 500 });
  }
  return Response.json({ received: true });
}

async function welcome(userId: string, plan: ReturnType<typeof planOf>) {
  const { data } = await adminClient().auth.admin.getUserById(userId);
  const email = data.user?.email;
  if (!email || plan === "free") return;
  const name = (data.user?.user_metadata?.full_name as string | undefined)?.split(" ")[0];
  const label = `${site.name} ${PLANS[plan].label}`;
  await sendMail(
    email,
    `Willkommen bei ${label}`,
    mailLayout({
      preheader: `Dein ${label} ist aktiv.`,
      title: `${label} ist aktiv`,
      intro: `${name ? `Hallo ${name},` : "Hallo,"}<br>danke für dein Vertrauen! Dein Konto ist ab sofort auf <b>${label}</b> freigeschaltet. Die Rechnung bekommst du separat per E-Mail.`,
      cta: "Jetzt loslegen",
      link: `${env.appUrl}/studio`,
      after: "Dein Abo verwaltest du jederzeit unter Tarif & Rechnungen. Kündigen geht mit einem Klick zum Ende des Zeitraums.",
      accent: plan === "business" ? "#c8102e" : "#c8ff2e",
    }),
    `Dein ${label} ist aktiv. Los geht's: ${env.appUrl}/studio`,
  );
}
