import "server-only";

/**
 * Transactional e-mail via Resend (https://resend.com). Configure on Vercel:
 *   RESEND_API_KEY = re_...
 *   MAIL_FROM      = "Qlick <events@deine-domain.de>"   (verified sender domain)
 * Without them, features that need mail fall back gracefully.
 */
export const mailConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);

export async function sendMail(to: string, subject: string, html: string, text: string): Promise<boolean> {
  if (!mailConfigured()) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: process.env.MAIL_FROM, to: [to], subject, html, text }),
    signal: AbortSignal.timeout(10000),
  }).catch(() => null);
  if (!res?.ok) console.error("sendMail failed", res?.status);
  return !!res?.ok;
}

export const escapeHtml = (v: string) => v.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);
