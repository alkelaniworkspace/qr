/**
 * Renders every style combination, rasterises it and decodes it with a real
 * QR reader. Run with: npm run verify:qr
 */
import { Resvg } from "@resvg/resvg-js";
import jsQR from "jsqr";
import { renderQrSvg } from "../src/lib/qr/render";
import { DECODE_PX_PER_MODULE } from "../src/lib/qr/decode";
import { DEFAULT_STYLE, STYLE_PRESETS, type QrStyle } from "../src/lib/qr/style";

const LOGO =
  "data:image/svg+xml;base64," +
  Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="#c9a961"/></svg>').toString("base64");

const data = "https://scanwerk.de/r/Ab3xK9";
const variants: [string, QrStyle][] = [];
for (const p of STYLE_PRESETS) variants.push([p.name, { ...DEFAULT_STYLE, ...p.style } as QrStyle]);
for (const dots of ["square", "rounded", "dots", "classy", "diamond", "fluid"] as const)
  for (const frame of ["none", "card", "label", "ticket"] as const)
    variants.push([`${dots}/${frame}/logo`, { ...DEFAULT_STYLE, dots, frame: { ...DEFAULT_STYLE.frame, style: frame }, logo: { src: LOGO, size: 0.22, excavate: true, plate: true } }]);

let failed = 0;
for (const [name, style] of variants) {
  const svg = renderQrSvg(data, style, { size: 600 });
  const units = Number(svg.match(/viewBox="0 0 ([\d.]+)/)?.[1] ?? 40);
  // Same strategy as the studio: decode at phone-camera-like resolutions.
  const ok = DECODE_PX_PER_MODULE.some((ppm) => {
    const png = new Resvg(svg, { background: "#ffffff", fitTo: { mode: "width", value: Math.round(units * ppm) } }).render();
    return jsQR(new Uint8ClampedArray(png.pixels), png.width, png.height)?.data === data;
  });
  if (!ok) failed++;
  console.log(`${ok ? "OK  " : "FAIL"} ${name}`);
}
console.log(failed ? `\n${failed} variant(s) failed` : `\nAll ${variants.length} variants decode correctly`);
process.exit(failed ? 1 : 0);
