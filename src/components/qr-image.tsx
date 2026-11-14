import { renderQrSvg } from "@/lib/qr/render";
import { normalizeStyle } from "@/lib/qr/style";
import { cn } from "@/lib/cn";

/** Server-rendered QR code. Same renderer as the studio, so what you see is what prints. */
export function QrImage({ data, style, id, className }: { data: string; style: unknown; id: string; className?: string }) {
  const svg = renderQrSvg(data, normalizeStyle(style), { size: 320, id });
  return <div className={cn("[&>svg]:h-auto [&>svg]:w-full", className)} dangerouslySetInnerHTML={{ __html: svg }} />;
}
