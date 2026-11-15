import { NextResponse, type NextRequest } from "next/server";
import { importMenu } from "@/lib/menu-import";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { url?: unknown; text?: unknown };
  const result = await importMenu({
    url: typeof body.url === "string" ? body.url.slice(0, 2000) : undefined,
    text: typeof body.text === "string" ? body.text.slice(0, 150000) : undefined,
  });
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
