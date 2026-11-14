import { NextResponse } from "next/server";
import { getPublicCode } from "@/lib/codes/public";
import { buildVCard } from "@/lib/codes/vcard";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const code = await getPublicCode(slug);
  if (!code || code.type !== "vcard" || code.status !== "active") return new NextResponse("Not found", { status: 404 });
  const filename = (String(code.content.firstName ?? "kontakt") + "-" + String(code.content.lastName ?? "")).replace(/[^a-zA-Z0-9-]/g, "").replace(/-$/, "") || "kontakt";
  return new NextResponse(buildVCard(code.content), {
    headers: { "Content-Type": "text/vcard; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}.vcf"` },
  });
}
