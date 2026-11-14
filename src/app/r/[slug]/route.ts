import { after, NextResponse, type NextRequest } from "next/server";
import { getPublicCode } from "@/lib/codes/public";
import { resolveRedirect } from "@/lib/codes/resolve";
import { recordScan } from "@/lib/analytics/record-scan";
import { env } from "@/lib/env";

/**
 * The scan endpoint printed inside every dynamic code. It must stay fast and
 * must never break: no session, one indexed lookup, logging after the response.
 * Plan or billing status is deliberately NOT checked: codes work forever.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const code = await getPublicCode(slug);

  const noStore = { "Cache-Control": "no-store, max-age=0", "X-Robots-Tag": "noindex" };
  if (!code || code.mode !== "dynamic") {
    return NextResponse.redirect(new URL("/unavailable", env.appUrl), { status: 302, headers: noStore });
  }
  if (code.status === "paused") {
    return NextResponse.redirect(new URL("/unavailable?reason=paused", env.appUrl), { status: 302, headers: noStore });
  }

  const headers = new Headers(request.headers);
  after(() => recordScan(code.id, headers));

  const target = resolveRedirect(code.type, code.content, request.headers.get("user-agent") ?? "") ?? `${env.appUrl}/p/${code.slug}`;
  return NextResponse.redirect(target, { status: 302, headers: noStore });
}
