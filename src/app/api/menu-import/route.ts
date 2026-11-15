import { gunzipSync } from "node:zlib";
import { NextResponse, type NextRequest } from "next/server";
import { importMenu } from "@/lib/menu-import";

export const maxDuration = 60;

const MAX_HTML = 20 * 1024 * 1024; // decompressed page captured in the browser

/**
 * JSON body: { url } fetches the page on the server, { text } parses pasted text,
 * { html, url } parses a page the user copied or captured in their own browser.
 * A gzip body (content-type application/gzip, page URL in x-page-url) is the
 * compressed form of { html } for large pages captured by the browser helper.
 */
export async function POST(request: NextRequest) {
  const noStore = { "Cache-Control": "no-store" };
  let input: { url?: string; text?: string; html?: string };

  if ((request.headers.get("content-type") ?? "").startsWith("application/gzip")) {
    let html = "";
    try {
      const buf = gunzipSync(Buffer.from(await request.arrayBuffer()), { maxOutputLength: MAX_HTML });
      html = buf.toString("utf8");
    } catch {
      return NextResponse.json({ ok: false, message: "Die Seite war zu groß oder beschädigt. Bitte direkt die Speisekarten-Seite öffnen und erneut versuchen." }, { status: 413, headers: noStore });
    }
    input = { html, url: (request.headers.get("x-page-url") ?? "").slice(0, 2000) };
  } else {
    const body = (await request.json().catch(() => ({}))) as { url?: unknown; text?: unknown; html?: unknown };
    input = {
      url: typeof body.url === "string" ? body.url.slice(0, 2000) : undefined,
      text: typeof body.text === "string" ? body.text.slice(0, 150000) : undefined,
      html: typeof body.html === "string" ? body.html.slice(0, MAX_HTML) : undefined,
    };
  }

  const result = await importMenu(input);
  return NextResponse.json(result, { headers: noStore });
}
