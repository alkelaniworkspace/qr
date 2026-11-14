import QRCode from "qrcode";
import type { ErrorCorrection, EyeBallStyle, EyeFrameStyle, Fill, QrStyle } from "./style";

/**
 * Pure SVG renderer. Runs on the server (thumbnails, downloads) and in the
 * browser (live studio preview) and returns a self-contained SVG string.
 * One unit in the viewBox = one QR module.
 */

export interface RenderOptions {
  /** rendered pixel width; height follows the aspect ratio */
  size?: number;
  /** unique prefix so several SVGs on one page do not share gradient ids */
  id?: string;
}

export interface QrMatrix {
  size: number;
  isDark: (row: number, col: number) => boolean;
  ecc: ErrorCorrection;
}

export function buildMatrix(data: string, ecc: ErrorCorrection): QrMatrix {
  const qr = QRCode.create(data || " ", { errorCorrectionLevel: ecc });
  const size = qr.modules.size;
  return { size, ecc, isDark: (r, c) => r >= 0 && c >= 0 && r < size && c < size && Boolean(qr.modules.get(r, c)) };
}

/** A logo hides modules, so it always needs the strongest error correction. */
export function effectiveEcc(style: QrStyle): ErrorCorrection {
  return style.logo ? "H" : style.ecc;
}

const f = (n: number) => Number(n.toFixed(3)).toString();

function rrect(x: number, y: number, w: number, h: number, [tl, tr, br, bl]: [number, number, number, number]) {
  let p = `M${f(x + tl)} ${f(y)}H${f(x + w - tr)}`;
  if (tr) p += `A${f(tr)} ${f(tr)} 0 0 1 ${f(x + w)} ${f(y + tr)}`;
  p += `V${f(y + h - br)}`;
  if (br) p += `A${f(br)} ${f(br)} 0 0 1 ${f(x + w - br)} ${f(y + h)}`;
  p += `H${f(x + bl)}`;
  if (bl) p += `A${f(bl)} ${f(bl)} 0 0 1 ${f(x)} ${f(y + h - bl)}`;
  p += `V${f(y + tl)}`;
  if (tl) p += `A${f(tl)} ${f(tl)} 0 0 1 ${f(x + tl)} ${f(y)}`;
  return p + "Z";
}

function circle(cx: number, cy: number, r: number) {
  return `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(r * 2)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-r * 2)} 0Z`;
}

function diamond(cx: number, cy: number, r: number) {
  return `M${f(cx)} ${f(cy - r)}L${f(cx + r)} ${f(cy)}L${f(cx)} ${f(cy + r)}L${f(cx - r)} ${f(cy)}Z`;
}

function eyeFrame(x: number, y: number, style: EyeFrameStyle) {
  switch (style) {
    case "circle":
      return circle(x + 3.5, y + 3.5, 3.5) + circle(x + 3.5, y + 3.5, 2.5);
    case "rounded":
      return rrect(x, y, 7, 7, [2, 2, 2, 2]) + rrect(x + 1, y + 1, 5, 5, [1.2, 1.2, 1.2, 1.2]);
    case "leaf":
      return rrect(x, y, 7, 7, [3, 0.6, 3, 0.6]) + rrect(x + 1, y + 1, 5, 5, [2, 0.3, 2, 0.3]);
    default:
      return rrect(x, y, 7, 7, [0, 0, 0, 0]) + rrect(x + 1, y + 1, 5, 5, [0, 0, 0, 0]);
  }
}

function eyeBall(x: number, y: number, style: EyeBallStyle) {
  const bx = x + 2;
  const by = y + 2;
  switch (style) {
    case "circle":
      return circle(bx + 1.5, by + 1.5, 1.5);
    case "rounded":
      return rrect(bx, by, 3, 3, [0.9, 0.9, 0.9, 0.9]);
    case "diamond":
      return diamond(bx + 1.5, by + 1.5, 1.85);
    case "leaf":
      return rrect(bx, by, 3, 3, [1.5, 0.3, 1.5, 0.3]);
    default:
      return rrect(bx, by, 3, 3, [0, 0, 0, 0]);
  }
}

function fillDefs(id: string, fill: Fill) {
  if (fill.type === "solid") return "";
  const [a, b] = fill.colors;
  if (fill.type === "radial") {
    return `<radialGradient id="${id}" cx="0.5" cy="0.5" r="0.75"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>`;
  }
  return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0" gradientTransform="rotate(${f(fill.rotation)} 0.5 0.5)"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function renderQrSvg(data: string, style: QrStyle, opts: RenderOptions = {}): string {
  const id = (opts.id ?? "qr").replace(/[^a-zA-Z0-9_-]/g, "");
  const m = buildMatrix(data, effectiveEcc(style));
  const n = m.size;
  const pad = Math.max(0, Math.min(8, style.margin));

  // ---- logo area (in module coordinates of the bare code) ----
  let logoBox: { x: number; y: number; w: number } | null = null;
  if (style.logo) {
    const ratio = Math.min(0.3, Math.max(0.1, style.logo.size));
    let w = Math.ceil(n * ratio);
    if ((n - w) % 2 !== 0) w += 1;
    const start = (n - w) / 2;
    logoBox = { x: start, y: start, w };
  }
  const inFinder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  const hidden = (r: number, c: number) =>
    !!logoBox &&
    !!style.logo?.excavate &&
    r >= logoBox.y - 0.5 && r < logoBox.y + logoBox.w + 0.5 &&
    c >= logoBox.x - 0.5 && c < logoBox.x + logoBox.w + 0.5;
  const on = (r: number, c: number) => m.isDark(r, c) && !inFinder(r, c) && !hidden(r, c);

  // ---- data modules ----
  let dots = "";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!on(r, c)) continue;
      const x = c + pad;
      const y = r + pad;
      const top = on(r - 1, c), bottom = on(r + 1, c), left = on(r, c - 1), right = on(r, c + 1);
      switch (style.dots) {
        case "dots":
          dots += circle(x + 0.5, y + 0.5, 0.5);
          break;
        case "diamond":
          dots += diamond(x + 0.5, y + 0.5, 0.6);
          break;
        case "rounded":
          dots += rrect(x + 0.04, y + 0.04, 0.92, 0.92, [0.3, 0.3, 0.3, 0.3]);
          break;
        case "fluid": {
          const R = 0.5;
          dots += rrect(x, y, 1, 1, [
            !top && !left ? R : 0,
            !top && !right ? R : 0,
            !bottom && !right ? R : 0,
            !bottom && !left ? R : 0,
          ]);
          break;
        }
        case "classy": {
          const R = 0.5;
          dots += rrect(x, y, 1, 1, [!top && !left ? R : 0, 0, !bottom && !right ? R : 0, 0]);
          break;
        }
        default:
          dots += `M${x} ${y}h1v1h-1Z`;
      }
    }
  }

  // ---- finder eyes ----
  let frames = "";
  let balls = "";
  for (const [r, c] of [[0, 0], [0, n - 7], [n - 7, 0]] as const) {
    frames += eyeFrame(c + pad, r + pad, style.eyeFrame);
    balls += eyeBall(c + pad, r + pad, style.eyeBall);
  }

  // ---- layout incl. optional frame ----
  const codeW = n + pad * 2;
  const fr = style.frame;
  const border = fr.style === "card" ? 2 : 0;
  const labelH = fr.style === "none" ? 0 : Math.max(5, codeW * 0.2);
  const gap = fr.style === "none" ? 0 : codeW * 0.04;
  const totalW = codeW + border * 2;
  const totalH = codeW + border * 2 + labelH + (fr.style === "card" ? 0 : gap);
  const codeX = border;
  const codeY = fr.style === "ticket" ? labelH + gap : border;

  const gradId = `${id}-fill`;
  const fillAttr = style.fill.type === "solid" ? style.fill.color : `url(#${gradId})`;
  const eyeFill = style.eyeColor ?? fillAttr;
  const bg = style.transparent ? null : style.background;

  const parts: string[] = [];
  parts.push(`<defs>${fillDefs(gradId, style.fill)}</defs>`);

  const textEl = (cx: number, cy: number) =>
    `<text x="${f(cx)}" y="${f(cy)}" text-anchor="middle" dominant-baseline="central" font-family="Inter Variable, Inter, Helvetica Neue, Arial, sans-serif" font-weight="600" font-size="${f(labelH * 0.42)}" letter-spacing="${f(labelH * 0.02)}" fill="${fr.textColor}">${esc(fr.text.slice(0, 40))}</text>`;

  if (fr.style === "card") {
    parts.push(`<rect width="${f(totalW)}" height="${f(totalH)}" rx="${f(totalW * 0.06)}" fill="${fr.color}"/>`);
    parts.push(`<rect x="${f(codeX)}" y="${f(codeY)}" width="${f(codeW)}" height="${f(codeW)}" rx="${f(codeW * 0.04)}" fill="${bg ?? "#ffffff"}"/>`);
    parts.push(textEl(totalW / 2, codeW + border * 2 + labelH / 2 - border * 0.5));
  } else {
    if (bg) parts.push(`<rect x="${f(codeX)}" y="${f(codeY)}" width="${f(codeW)}" height="${f(codeW)}" rx="${fr.style === "none" ? 0 : f(codeW * 0.03)}" fill="${bg}"/>`);
    if (fr.style === "label") {
      const ly = codeW + gap;
      parts.push(`<rect x="0" y="${f(ly)}" width="${f(totalW)}" height="${f(labelH)}" rx="${f(labelH / 2)}" fill="${fr.color}"/>`);
      parts.push(textEl(totalW / 2, ly + labelH / 2));
    }
    if (fr.style === "ticket") {
      parts.push(`<rect x="0" y="0" width="${f(totalW)}" height="${f(labelH)}" rx="${f(labelH * 0.25)}" fill="${fr.color}"/>`);
      const tw = labelH * 0.35;
      parts.push(`<path d="M${f(totalW / 2 - tw)} ${f(labelH - 0.01)}L${f(totalW / 2)} ${f(labelH + tw * 0.8)}L${f(totalW / 2 + tw)} ${f(labelH - 0.01)}Z" fill="${fr.color}"/>`);
      parts.push(textEl(totalW / 2, labelH / 2));
    }
  }

  parts.push(`<g transform="translate(${f(codeX)} ${f(codeY)})">`);
  parts.push(`<path d="${dots}" fill="${fillAttr}"/>`);
  parts.push(`<path d="${frames}" fill="${eyeFill}" fill-rule="evenodd"/>`);
  parts.push(`<path d="${balls}" fill="${eyeFill}"/>`);
  if (style.logo && logoBox) {
    const lx = logoBox.x + pad;
    const ly = logoBox.y + pad;
    const lw = logoBox.w;
    if (style.logo.plate) {
      parts.push(`<rect x="${f(lx - 0.6)}" y="${f(ly - 0.6)}" width="${f(lw + 1.2)}" height="${f(lw + 1.2)}" rx="${f(lw * 0.2)}" fill="${bg ?? "#ffffff"}"/>`);
    }
    const inset = style.logo.plate ? lw * 0.08 : 0;
    parts.push(`<image href="${esc(style.logo.src)}" x="${f(lx + inset)}" y="${f(ly + inset)}" width="${f(lw - inset * 2)}" height="${f(lw - inset * 2)}" preserveAspectRatio="xMidYMid meet"/>`);
  }
  parts.push(`</g>`);

  const px = opts.size ?? 512;
  const height = Math.round((px * totalH) / totalW);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(totalW)} ${f(totalH)}" width="${px}" height="${height}" shape-rendering="geometricPrecision">${parts.join("")}</svg>`;
}

/** Single finder pattern, used for the corner-style pickers in the studio. */
export function eyeGlyph(frame: EyeFrameStyle, ball: EyeBallStyle, color = "#14130f"): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-0.5 -0.5 8 8"><path d="${eyeFrame(0, 0, frame)}" fill="${color}" fill-rule="evenodd"/><path d="${eyeBall(0, 0, ball)}" fill="${color}"/></svg>`;
}
