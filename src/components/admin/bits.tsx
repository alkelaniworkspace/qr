import { daysAgo } from "@/lib/time";
import { cn } from "@/lib/cn";

export const nf = new Intl.NumberFormat("de-DE");
export const dfShort = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short" });
export const df = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short", year: "numeric" });
export const dtf = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function ago(iso: string | null | undefined): string {
  if (!iso) return "nie";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "gerade eben";
  if (s < 3600) return `vor ${Math.floor(s / 60)} Min.`;
  if (s < 86400) return `vor ${Math.floor(s / 3600)} Std.`;
  if (s < 86400 * 30) return `vor ${Math.floor(s / 86400)} ${Math.floor(s / 86400) === 1 ? "Tag" : "Tagen"}`;
  return df.format(new Date(iso));
}

export function Kpi({ label, value, sub, tone }: { label: string; value: number | string; sub?: React.ReactNode; tone?: "lime" | "rose" | "gold" }) {
  return (
    <div className="card relative overflow-hidden p-5">
      {tone && <span className={cn("absolute right-4 top-4 size-2 rounded-full", tone === "lime" ? "bg-lime shadow-[0_0_10px_#bdfb04]" : tone === "rose" ? "bg-rose" : "bg-gold")} />}
      <p className="text-[13px] font-medium text-dim">{label}</p>
      <p className="mt-2 font-display text-4xl leading-none tabular-nums">{typeof value === "number" ? nf.format(value) : value}</p>
      {sub && <p className="mt-2 text-[12.5px] text-faint">{sub}</p>}
    </div>
  );
}

/** Bars for the last N days, newest on the right. Pure CSS, hover shows the value. */
export function Bars({ values, label }: { values: number[]; label: string }) {
  const max = Math.max(1, ...values);
  const total = values.reduce((a, b) => a + b, 0);
  const days = values.length;
  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-[13px] font-medium text-dim">{label}</p>
        <p className="font-display text-2xl tabular-nums">{nf.format(total)}</p>
      </div>
      <div className="mt-5 flex h-36 items-end gap-[3px]">
        {values.map((v, i) => {
          const d = daysAgo(days - 1 - i);
          return (
            <div key={i} className="group relative flex h-full flex-1 items-end">
              <div className={cn("w-full rounded-t-[4px] transition-all duration-500", i === days - 1 ? "bg-lime" : "bg-hi/[0.14] group-hover:bg-hi/30")} style={{ height: `${Math.max(3, (v / max) * 100)}%` }} />
              <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-fg px-2 py-1 text-[11px] font-semibold text-bg opacity-0 transition group-hover:opacity-100">{dfShort.format(d)} · {v}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-faint"><span>vor {days} Tagen</span><span>heute</span></div>
    </div>
  );
}

export const PLAN_TONE: Record<string, string> = {
  free: "bg-hi/[0.08] text-dim",
  start: "bg-sky-500/15 text-sky-500",
  pro: "bg-lime text-night",
  business: "bg-[#c8102e] text-white",
};

export function PlanBadge({ plan, gift, until }: { plan: string; gift?: boolean; until?: string | null }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("rounded-full px-2 py-0.5 text-[11.5px] font-bold capitalize", PLAN_TONE[plan] ?? PLAN_TONE.free)}>{plan}</span>
      {gift && <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[11px] font-semibold text-gold">Geschenk{until ? ` bis ${dfShort.format(new Date(until))}` : ""}</span>}
    </span>
  );
}

export function ProviderBadge({ provider }: { provider: string }) {
  const google = provider === "google";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-edge px-2 py-0.5 text-[11.5px] font-semibold text-dim">
      {google ? (
        <svg viewBox="0 0 24 24" className="size-3" aria-hidden><path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h6a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z" /><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.7H2.1v2.8A11 11 0 0 0 12 23z" /><path fill="#FBBC05" d="M5.7 14a6.6 6.6 0 0 1 0-4.2V7H2.1a11 11 0 0 0 0 9.9z" /><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 0 0 2.1 7l3.6 2.8C6.6 7.3 9.1 5.4 12 5.4z" /></svg>
      ) : <span className="size-1.5 rounded-full bg-dim" />}
      {google ? "Google" : provider === "email" ? "E-Mail" : provider}
    </span>
  );
}

export function Avatar({ name, email, className }: { name?: string | null; email: string; className?: string }) {
  const s = (name || email).trim();
  const hue = [...email].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <span className={cn("grid size-10 shrink-0 place-items-center rounded-full text-[14px] font-bold text-white", className)} style={{ background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${(hue + 40) % 360} 70% 40%))` }}>
      {s.charAt(0).toUpperCase()}
    </span>
  );
}
