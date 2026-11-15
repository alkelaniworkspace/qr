import { NextResponse, type NextRequest } from "next/server";
import { resolveReviewLink } from "@/lib/google-review";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { url?: string };
  if (!body.url || body.url.length > 2000) return NextResponse.json({ ok: false, message: "Link fehlt" }, { status: 400 });
  return NextResponse.json(await resolveReviewLink(body.url));
}
