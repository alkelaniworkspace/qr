import { NextResponse, type NextRequest } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { env, serverEnv } from "@/lib/env";

/** Link from the confirmation e-mail: marks the registration as attending, then shows the event page. */
export async function GET(request: NextRequest) {
  const t = request.nextUrl.searchParams.get("t") ?? "";
  if (!/^[a-f0-9]{48}$/.test(t) || !serverEnv().secretKey) return NextResponse.redirect(new URL("/unavailable", env.appUrl));
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  const hash = Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
  const { data: slug } = await adminClient().rpc("rsvp_confirm", { p_token_hash: hash } as never);
  if (!slug) return NextResponse.redirect(new URL("/unavailable?reason=rsvp", env.appUrl));
  return NextResponse.redirect(new URL(`/p/${slug}?rsvp=bestaetigt`, env.appUrl));
}
