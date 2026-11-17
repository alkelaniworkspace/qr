import { AlertTriangle, ArrowDown, CalendarClock, ChevronDown, Download, FileText, Gift, PartyPopper, QrCode, ClipboardList, BarChart3, Receipt } from "lucide-react";
import { PLANS, euro, type PlanId } from "@/lib/plans";
import type { BillingProfile, CardInfo, InvoiceRow } from "@/lib/billing";
import { BillingPlans } from "@/components/dashboard/billing-plans";
import { CancelSubscription, PortalButton } from "@/components/dashboard/billing-controls";
import { cn } from "@/lib/cn";

const dateFmt = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric" });
const shortFmt = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
const fmt = (iso: string | null) => (iso ? dateFmt.format(new Date(iso)) : null);

const STATUS: Record<string, string> = { paid: "Bezahlt", open: "Offen", void: "Storniert", uncollectible: "Uneinbringlich", draft: "Entwurf" };
const BRAND: Record<string, string> = { visa: "Visa", mastercard: "Mastercard", amex: "American Express", sepa_debit: "SEPA-Lastschrift", paypal: "PayPal", link: "Link" };

const FAQ = [
  ["Kann ich jederzeit kündigen?", "Ja. Du kündigst mit einem Klick zum Ende des bezahlten Zeitraums. Bis dahin bleibt alles freigeschaltet, danach läuft dein Konto im Free-Tarif weiter."],
  ["Was passiert mit meinen gedruckten Codes?", "Sie funktionieren weiter, auch nach einer Kündigung. Wir schalten keinen Code ab, nur weil sich dein Tarif ändert."],
  ["Wie funktioniert ein Wechsel des Tarifs?", "Beim Upgrade zahlst du nur die Differenz für die restliche Zeit. Beim Wechsel auf einen kleineren Tarif wird das Guthaben mit der nächsten Rechnung verrechnet."],
  ["Welche Zahlungsarten gibt es?", "Kreditkarte, SEPA-Lastschrift und weitere gängige Methoden. Die Zahlung läuft sicher über Stripe, wir speichern keine Kartendaten."],
  ["Bekomme ich eine Rechnung?", "Ja, zu jeder Zahlung automatisch per E-Mail und hier zum Herunterladen. Firmenname, Adresse und USt-IdNr. gibst du beim Bezahlen an."],
];


export function BillingView({ checkout, configured, plan: planId, planSource, planUntil, used, limit, forms, prof, paid, gift, invoices, card }: {
  checkout?: string; configured: boolean; plan: PlanId; planSource: string; planUntil: string | null; used: number; limit: number | null; forms: number;
  prof: BillingProfile | null; paid: boolean; gift: boolean; invoices: InvoiceRow[]; card: CardInfo | null;
}) {
  const plan = PLANS[planId];
  const quota = { plan: planId, account: { planSource, planUntil } };
  const meters = [
    { icon: QrCode, label: "Dynamische Codes", used, limit },
    { icon: ClipboardList, label: "Formulare", used: forms, limit: plan.forms },
  ];
  const periodEnd = fmt(prof?.current_period_end ?? null);
  const trialing = prof?.subscription_status === "trialing";

  return (
    <div className="animate-rise">
      <p className="text-sm text-dim">Konto</p>
      <h1 className="mt-1 font-display text-5xl leading-none">Tarif & Rechnungen</h1>

      {checkout === "success" && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-lime/15 p-4 ring-1 ring-lime/40 animate-rise">
          <PartyPopper className="mt-0.5 size-5 shrink-0" />
          <p className="text-sm"><b className="font-semibold">Danke, das hat geklappt!</b> Dein Tarif ist freigeschaltet. Die Bestätigung und Rechnung kommen per E-Mail.</p>
        </div>
      )}
      {checkout === "cancel" && <p className="mt-6 rounded-2xl bg-hi/[0.05] p-4 text-sm text-dim">Bezahlung abgebrochen. Es wurde nichts abgebucht.</p>}
      {prof?.subscription_status === "past_due" && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose/40 bg-rose/10 p-4">
          <p className="flex items-start gap-2.5 text-sm"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose" /><span><b className="font-semibold">Die letzte Zahlung ist fehlgeschlagen.</b> Bitte aktualisiere deine Zahlungsmethode, damit dein Tarif aktiv bleibt.</span></p>
          <PortalButton label="Zahlungsmethode aktualisieren" />
        </div>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className={cn("relative overflow-hidden rounded-[28px] p-7", quota.plan === "pro" ? "pr-spot bg-[#0e0e0f] text-white" : quota.plan === "business" ? "pr-biz text-white" : "card card-glow")}>
          <p className={cn("text-sm font-semibold", quota.plan === "pro" || quota.plan === "business" ? "text-white/60" : "text-dim")}>Aktueller Tarif</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <p className={cn("font-display text-6xl leading-none", quota.plan === "pro" && "text-lime", quota.plan === "free" && "text-brand glow-text")}>{plan.label}</p>
            {paid && <span className="rounded-full bg-white/15 px-3 py-1 text-[12px] font-bold backdrop-blur">{trialing ? "Testphase" : prof?.billing_interval === "year" ? "Jährlich" : "Monatlich"}</span>}
            {gift && <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/25 px-3 py-1 text-[12px] font-bold"><Gift className="size-3.5" /> Geschenk</span>}
          </div>
          <div className={cn("mt-5 space-y-1.5 text-[14px]", quota.plan === "pro" || quota.plan === "business" ? "text-white/75" : "text-dim")}>
            {paid && !prof?.cancel_at_period_end && periodEnd && (
              <p className="flex items-center gap-2"><CalendarClock className="size-4" /> {trialing ? `Testphase bis ${periodEnd}, danach ${euro(prof?.billing_interval === "year" ? plan.yearly * 12 : plan.price)} pro ${prof?.billing_interval === "year" ? "Jahr" : "Monat"}` : `Verlängert sich am ${periodEnd}`}</p>
            )}
            {paid && prof?.cancel_at_period_end && <p className="flex items-center gap-2 font-semibold text-[#ffb3c1]"><CalendarClock className="size-4" /> Gekündigt, läuft noch bis {periodEnd}</p>}
            {gift && <p className="flex items-center gap-2"><Gift className="size-4" /> {quota.account.planUntil ? `Geschenkt bis ${fmt(quota.account.planUntil)}. Danach geht es mit Free weiter, außer du buchst ein Abo.` : "Dauerhaft geschenkt. Viel Spaß!"}</p>}
            {quota.plan === "free" && <p>Kostenlos und ohne Ablauf. Upgrade, wenn du mehr dynamische Codes oder Funktionen brauchst.</p>}
          </div>
          {(quota.plan === "free" || gift) && (
            <a href="#tarife" className="btn-cta mt-6 inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-bold">{gift ? "Abo sichern" : "Mehr Codes freischalten"} <ArrowDown className="size-4" /></a>
          )}
          <div>
          </div>
          {paid && (
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
              <PortalButton className={cn(quota.plan !== "start" && "border-white/25 hover:bg-white/10")} />
              <CancelSubscription planLabel={plan.label} endsAt={periodEnd} canceled={!!prof?.cancel_at_period_end} />
            </div>
          )}
        </div>

        <div className="card p-7">
          <p className="text-sm font-semibold text-dim">Nutzung</p>
          <div className="mt-5 space-y-5">
            {meters.map((m) => {
              const pct = m.limit === null ? 8 : Math.min(100, Math.round((m.used / Math.max(1, m.limit)) * 100));
              return (
                <div key={m.label}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium"><m.icon className="size-4 text-dim" /> {m.label}</span>
                    <span className="tabular-nums"><b className="font-semibold">{m.used}</b><span className="text-faint"> / {m.limit === null ? "∞" : m.limit}</span></span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-hi/[0.07]">
                    <div className={cn("h-full rounded-full transition-all", m.limit !== null && pct >= 100 ? "bg-rose" : pct >= 80 ? "bg-gold" : "bg-lime")} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            <div className="flex items-baseline justify-between border-t border-edge pt-4 text-sm">
              <span className="flex items-center gap-2 font-medium"><BarChart3 className="size-4 text-dim" /> Statistik-Verlauf</span>
              <b className="font-semibold">{plan.statsDays >= 365 ? `${Math.round(plan.statsDays / 365)} Jahre` : `${plan.statsDays} Tage`}</b>
            </div>
            <p className="text-[13px] text-faint">Statische Codes sind in jedem Tarif unbegrenzt.</p>
          </div>
        </div>
      </div>

      <div id="tarife" className="mt-14 scroll-mt-24"><BillingPlans current={quota.plan} interval={paid ? prof?.billing_interval ?? null : null} paid={paid} trialAvailable={!prof?.subscription_id} /></div>

      <section className="mt-14 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="card p-6">
          <p className="flex items-center gap-2 font-semibold"><Receipt className="size-4" /> Zahlungsmethode</p>
          {card ? (
            <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#1c1c1e] to-[#0b0b0c] p-5 text-white shadow-lift">
              <p className="text-[13px] text-white/60">{BRAND[card.brand] ?? card.brand}</p>
              <p className="mt-6 font-mono text-lg tracking-wider">{card.last4 ? `•••• ${card.last4}` : "Hinterlegt"}</p>
              {card.exp && <p className="mt-1 text-[12px] text-white/50">Gültig bis {card.exp}</p>}
            </div>
          ) : <p className="mt-3 text-sm text-dim">Noch keine Zahlungsmethode hinterlegt. Du gibst sie beim ersten Upgrade sicher bei Stripe ein.</p>}
          {prof?.stripe_customer_id && configured && <div className="mt-4"><PortalButton label="Ändern" /></div>}
          <p className="mt-4 text-[12.5px] text-faint">Zahlungen laufen verschlüsselt über Stripe. Wir sehen und speichern keine Kartendaten.</p>
        </div>

        <div className="card overflow-hidden">
          <p className="flex items-center gap-2 border-b border-edge px-6 py-4 font-semibold"><FileText className="size-4" /> Rechnungen</p>
          {invoices.length ? invoices.map((i) => (
            <div key={i.id} className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-edge px-6 py-3.5 text-sm last:border-0">
              <span className="w-28 text-dim">{shortFmt.format(new Date(i.created * 1000))}</span>
              <span className="min-w-0 flex-1 truncate font-medium">{i.number ?? "Rechnung"}</span>
              <span className={cn("rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold", i.status === "paid" ? "bg-lime/15" : i.status === "open" ? "bg-gold/20 text-gold" : "bg-hi/[0.07] text-dim")}>{STATUS[i.status ?? ""] ?? i.status}</span>
              <span className="w-24 text-right font-semibold tabular-nums">{euro(i.total / 100)}</span>
              {i.pdf ? <a href={i.pdf} target="_blank" rel="noopener" className="grid size-9 place-items-center rounded-xl text-dim hover:bg-hi/[0.07] hover:text-fg" aria-label="PDF herunterladen"><Download className="size-4" /></a> : <span className="size-9" />}
            </div>
          )) : (
            <div className="px-6 py-14 text-center">
              <Receipt className="mx-auto size-8 text-faint" strokeWidth={1.5} />
              <p className="mt-3 text-sm text-dim">Noch keine Rechnungen. Sobald du ein Abo hast, findest du sie hier.</p>
            </div>
          )}
        </div>
      </section>

      <section className="mt-14 max-w-3xl">
        <h2 className="font-display text-3xl leading-none">Häufige Fragen</h2>
        <div className="mt-6 divide-y divide-edge rounded-[24px] border border-edge">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group px-6 py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">{q}<ChevronDown className="size-4 shrink-0 text-dim transition group-open:rotate-180" /></summary>
              <p className="mt-2 text-sm leading-relaxed text-dim">{a}</p>
            </details>
          ))}
        </div>
        <p className="mt-5 text-sm text-dim">Noch Fragen? Schreib uns an <a className="font-semibold text-fg underline underline-offset-2" href="mailto:info@qlickqr.com">info@qlickqr.com</a>.</p>
      </section>
    </div>
  );
}
