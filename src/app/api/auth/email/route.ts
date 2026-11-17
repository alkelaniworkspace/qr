import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { mailConfigured, sendMail } from "@/lib/email";
import { renderAuthEmail, type AuthEmailType } from "@/lib/auth-email";

/**
 * Supabase Auth "Send Email" hook. Supabase calls this instead of sending its own
 * mail, so every auth e-mail comes from our domain in our design.
 * Env: SEND_EMAIL_HOOK_SECRET = the "v1,whsec_…" secret shown in the Supabase dashboard.
 */
export const runtime = "nodejs";

interface Payload {
  user: { email: string; new_email?: string; user_metadata?: { full_name?: string; name?: string } };
  email_data: { token: string; token_hash: string; redirect_to: string; email_action_type: AuthEmailType; token_new?: string; token_hash_new?: string };
}

function verify(body: string, headers: Headers): boolean {
  const raw = process.env.SEND_EMAIL_HOOK_SECRET ?? "";
  const id = headers.get("webhook-id");
  const ts = headers.get("webhook-timestamp");
  const sigs = headers.get("webhook-signature");
  if (!raw || !id || !ts || !sigs) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const key = Buffer.from(raw.replace(/^v1,/, "").replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${ts}.${body}`).digest();
  return sigs.split(" ").some((s) => {
    const [, sig] = s.split(",");
    if (!sig) return false;
    const got = Buffer.from(sig, "base64");
    return got.length === expected.length && timingSafeEqual(got, expected);
  });
}

/** Keeps only a same-site `next` path from the redirect URL the app passed to Supabase. */
function nextFrom(redirectTo: string, fallback: string): string {
  try {
    const u = new URL(redirectTo);
    const n = u.searchParams.get("next");
    if (n && n.startsWith("/") && !n.startsWith("//")) return n;
  } catch {}
  return fallback;
}

const VERIFY_TYPE: Record<AuthEmailType, string> = {
  signup: "email", magiclink: "email", email: "email", recovery: "recovery", invite: "invite", email_change: "email_change", reauthentication: "",
};

function confirmLink(hash: string, type: AuthEmailType, next: string) {
  const q = new URLSearchParams({ token_hash: hash, type: VERIFY_TYPE[type], next });
  return `${env.appUrl}/auth/confirm?${q}`;
}

const fail = (status: number, message: string) => Response.json({ error: { http_code: status, message } }, { status });

export async function POST(request: Request) {
  const body = await request.text();
  if (!verify(body, request.headers)) return fail(401, "Invalid signature");
  if (!mailConfigured()) return fail(500, "Mail is not configured");

  let p: Payload;
  try { p = JSON.parse(body); } catch { return fail(400, "Bad payload"); }
  const { user, email_data: d } = p;
  const type = d.email_action_type;
  const name = user.user_metadata?.full_name || user.user_metadata?.name;
  const next = nextFrom(d.redirect_to, type === "recovery" ? "/reset-password" : "/dashboard");

  const jobs: Promise<boolean>[] = [];
  if (type === "email_change") {
    // Supabase: token_hash_new belongs to the current address, token_hash to the new one.
    if (d.token_hash_new) {
      const m = renderAuthEmail("email_change", { link: confirmLink(d.token_hash_new, type, next), name, newEmail: user.new_email });
      jobs.push(sendMail(user.email, m.subject, m.html, m.text));
    }
    if (user.new_email && d.token_hash) {
      const m = renderAuthEmail("email_change", { link: confirmLink(d.token_hash, type, next), name, newEmail: user.new_email });
      jobs.push(sendMail(user.new_email, m.subject, m.html, m.text));
    }
  } else if (type === "reauthentication") {
    const m = renderAuthEmail(type, { code: d.token, name });
    jobs.push(sendMail(user.email, m.subject, m.html, m.text));
  } else {
    const m = renderAuthEmail(type, { link: confirmLink(d.token_hash, type, next), name });
    jobs.push(sendMail(user.email, m.subject, m.html, m.text));
  }

  const results = await Promise.all(jobs);
  if (!results.length || results.some((ok) => !ok)) return fail(500, "Sending failed");
  return Response.json({});
}
