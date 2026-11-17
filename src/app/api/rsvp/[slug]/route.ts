import { mailLayout } from "@/lib/mail-layout";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";
import { anonClient } from "@/lib/supabase/anon";
import { createClient } from "@/lib/supabase/server";
import { env, serverEnv, supabaseConfigured } from "@/lib/env";
import { escapeHtml, mailConfigured, sendMail } from "@/lib/email";
import { getPublicCode } from "@/lib/codes/public";

const noStore = { "Cache-Control": "no-store, max-age=0" };
const SLUG = /^[A-Za-z0-9_-]{4,64}$/;

async function sha256(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** GET: public counts; with the guest edit token (x-edit-token) or the owner session also the guest list. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!SLUG.test(slug) || !supabaseConfigured) return NextResponse.json({ stats: null }, { headers: noStore });
  const { data: stats } = await anonClient().rpc("rsvp_stats", { p_slug: slug } as never);
  if (request.nextUrl.searchParams.get("list") !== "1") return NextResponse.json({ stats }, { headers: noStore });
  const token = request.headers.get("x-edit-token");
  const client = token ? anonClient() : await createClient().catch(() => anonClient());
  const { data: list } = await client.rpc("rsvp_list", { p_slug: slug, p_token: token } as never);
  return NextResponse.json({ stats, list }, { headers: noStore });
}

const body = z.object({
  name: z.string().trim().max(80).default(""),
  email: z.email("Bitte eine gültige E-Mail eingeben").max(254),
  guests: z.coerce.number().int().min(1).max(10).default(1),
});

const MESSAGES: Record<string, string> = {
  CONFIRMED: "Mit dieser E-Mail bist du schon angemeldet.",
  FULL: "Leider ausgebucht. Es sind keine Plätze mehr frei.",
  CLOSED: "Die Anmeldung ist geschlossen.",
  NOT_FOUND: "Diese Veranstaltung gibt es nicht.",
  RATE_LIMIT: "Gerade melden sich sehr viele an. Bitte gleich noch einmal versuchen.",
};

/** POST: register. With a mail service: double opt-in link; without: confirmed directly. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!SLUG.test(slug)) return NextResponse.json({ ok: false, message: MESSAGES.NOT_FOUND }, { status: 404, headers: noStore });
  if (!supabaseConfigured || !serverEnv().secretKey) {
    return NextResponse.json({ ok: false, message: "Die Anmeldung ist gleich verfügbar. Wir richten gerade die Datenbank ein." }, { status: 503, headers: noStore });
  }
  const parsed = body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, message: parsed.error.issues[0].message }, { status: 400, headers: noStore });
  const { name, email, guests } = parsed.data;

  const token = Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, "0")).join("");
  const withMail = mailConfigured();
  const { data, error } = await adminClient().rpc("rsvp_register", { p_slug: slug, p_name: name, p_email: email, p_guests: guests, p_token_hash: await sha256(token), p_auto_confirm: !withMail } as never);
  if (error) {
    console.error("rsvp_register", error.message);
    return NextResponse.json({ ok: false, message: "Die Anmeldung konnte nicht gespeichert werden. Bitte erneut versuchen." }, { status: 500, headers: noStore });
  }
  const status = String(data);
  if (status !== "OK") return NextResponse.json({ ok: false, status, message: MESSAGES[status] ?? "Fehler" }, { status: 400, headers: noStore });

  if (withMail) {
    const code = await getPublicCode(slug);
    const title = String(code?.content.title ?? "Veranstaltung");
    const link = `${env.appUrl}/api/rsvp/confirm?t=${token}`;
    const sent = await sendMail(
      email,
      `Bitte bestätige deine Anmeldung: ${title}`,
      mailLayout({
        preheader: `Ein Klick und dein Platz bei ${title} ist bestätigt.`,
        title: "Bestätige deine Anmeldung",
        intro: `${name ? `Hallo ${escapeHtml(name.split(" ")[0])},` : "Hallo,"}<br>du hast dich für <b>${escapeHtml(title)}</b> angemeldet${guests > 1 ? ` (${guests} Personen)` : ""}. Bitte bestätige mit einem Klick, dann ist dein Platz reserviert.`,
        cta: "Teilnahme bestätigen",
        link,
        after: "Du hast dich nicht angemeldet? Dann ignoriere diese E-Mail einfach.",
      }),
      `${name ? `Hallo ${name},` : "Hallo,"}\n\ndu hast dich für ${title} angemeldet. Bitte bestätige hier:\n${link}\n\nNicht angemeldet? Einfach ignorieren.`,
    );
    if (!sent) return NextResponse.json({ ok: false, message: "Die Bestätigungs-E-Mail konnte nicht gesendet werden. Bitte erneut versuchen." }, { status: 502, headers: noStore });
  }
  const { data: stats } = await anonClient().rpc("rsvp_stats", { p_slug: slug } as never);
  return NextResponse.json({ ok: true, state: withMail ? "pending" : "confirmed", stats }, { headers: noStore });
}
