import { NextResponse } from "next/server";
import { getPublicCode } from "@/lib/codes/public";
import { buildIcs } from "@/lib/codes/ics";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const code = await getPublicCode(slug);
  if (!code || code.type !== "event" || code.status !== "active") return new NextResponse("Not found", { status: 404 });
  return new NextResponse(buildIcs(code.content, `${code.id}@scanwerk`), {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="event.ics"` },
  });
}
