import { NextResponse, type NextRequest } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { anonClient } from "@/lib/supabase/anon";
import { createClient } from "@/lib/supabase/server";
import { serverEnv, supabaseConfigured } from "@/lib/env";
import { isBot } from "@/lib/analytics/user-agent";

const noStore = { "Cache-Control": "no-store, max-age=0" };
const SLUG = /^[A-Za-z0-9_-]{4,64}$/;

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("").slice(0, 40);
}

type Tally = { total: number; counts: number[] } | null;

/**
 * Results. The database decides who may see them: everyone (public polls),
 * the signed-in owner, or whoever holds the guest edit token (x-edit-token).
 */
async function tally(slug: string, token: string | null): Promise<Tally> {
  // The owner's session makes auth.uid() match inside poll_results.
  const client = token ? anonClient() : await createClient().catch(() => anonClient());
  const { data, error } = await client.rpc("poll_results", { p_slug: slug, p_token: token } as never);
  if (error) {
    console.error("poll_results", error.message);
    return null;
  }
  return (data as Tally) ?? null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!SLUG.test(slug) || !supabaseConfigured) return NextResponse.json({ results: null }, { headers: noStore });
  const token = request.headers.get("x-edit-token");
  return NextResponse.json({ results: await tally(slug, token && token.length <= 200 ? token : null) }, { headers: noStore });
}

const MESSAGES: Record<string, string> = {
  ALREADY: "Von diesem Gerät wurde schon abgestimmt.",
  CLOSED: "Diese Abstimmung ist beendet.",
  INVALID: "Bitte eine gültige Antwort wählen.",
  NOT_FOUND: "Diese Abstimmung gibt es nicht.",
  RATE_LIMIT: "Gerade stimmen sehr viele ab. Bitte gleich noch einmal versuchen.",
};

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!SLUG.test(slug)) return NextResponse.json({ ok: false, message: MESSAGES.NOT_FOUND }, { status: 404, headers: noStore });
  if (!supabaseConfigured || !serverEnv().secretKey) {
    return NextResponse.json({ ok: false, message: "Abstimmungen sind gleich verfügbar. Wir richten gerade die Datenbank ein." }, { status: 503, headers: noStore });
  }
  const ua = request.headers.get("user-agent") ?? "";
  if (!ua || isBot(ua)) return NextResponse.json({ ok: false, message: MESSAGES.INVALID }, { status: 400, headers: noStore });

  const body = (await request.json().catch(() => ({}))) as { choices?: unknown; device?: unknown };
  const choices = Array.isArray(body.choices) ? body.choices.filter((c): c is number => Number.isInteger(c) && c >= 0 && c < 12).slice(0, 12) : [];
  if (!choices.length) return NextResponse.json({ ok: false, message: MESSAGES.INVALID }, { status: 400, headers: noStore });

  // One vote per device: salted hash of IP + browser + a random id the page keeps
  // in localStorage. Nothing personal is stored.
  const ip = (request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "").split(",")[0].trim();
  const device = typeof body.device === "string" ? body.device.slice(0, 64) : "";
  const voter = await sha256(`${serverEnv().visitorSalt}|poll|${slug}|${ip}|${ua}|${device}`);

  const { data, error } = await adminClient().rpc("cast_vote", { p_slug: slug, p_choices: choices, p_voter_hash: voter } as never);
  if (error) {
    console.error("cast_vote", error.message);
    return NextResponse.json({ ok: false, message: "Die Stimme konnte nicht gespeichert werden. Bitte erneut versuchen." }, { status: 500, headers: noStore });
  }
  const status = String(data);
  const results = status === "OK" || status === "ALREADY" ? await tally(slug, null) : null;
  if (status === "OK") return NextResponse.json({ ok: true, results }, { headers: noStore });
  return NextResponse.json({ ok: false, status, message: MESSAGES[status] ?? "Fehler", results }, { status: status === "ALREADY" ? 409 : 400, headers: noStore });
}
