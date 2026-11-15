/**
 * Design options for a rendered code. Stored as JSON on every code, so all
 * fields must stay serialisable and backwards compatible (only add, never rename).
 */

export type ErrorCorrection = "L" | "M" | "Q" | "H";
export type DotStyle = "square" | "rounded" | "dots" | "classy" | "diamond" | "fluid" | "mini" | "vertical" | "horizontal" | "bubble";
export type EyeFrameStyle = "square" | "rounded" | "circle" | "leaf" | "octagon" | "shield";
export type EyeBallStyle = "square" | "rounded" | "circle" | "diamond" | "leaf" | "octagon" | "shield";
export type FrameStyle = "none" | "card" | "label" | "ticket";

export type Fill =
  | { type: "solid"; color: string }
  | { type: "linear" | "radial"; colors: [string, string]; rotation: number };

export interface LogoOptions {
  /** data: URL (PNG/JPEG/SVG), resized client side to max 512px */
  src: string;
  /** share of the code width, 0.12 – 0.3 */
  size: number;
  /** remove modules under the logo for a clean look */
  excavate: boolean;
  /** white rounded plate behind the logo */
  plate: boolean;
}

export interface FrameOptions {
  style: FrameStyle;
  text: string;
  color: string;
  textColor: string;
}

export interface QrStyle {
  ecc: ErrorCorrection;
  margin: number;
  dots: DotStyle;
  eyeFrame: EyeFrameStyle;
  eyeBall: EyeBallStyle;
  fill: Fill;
  /** optional separate colour for the outer ring of the three corner eyes */
  eyeColor: string | null;
  /** optional separate colour for the inner square of the corner eyes */
  eyeBallColor: string | null;
  /** rounded corners of the background, in % of the code width (0 – 20) */
  radius: number;
  background: string;
  transparent: boolean;
  logo: LogoOptions | null;
  frame: FrameOptions;
}

export const DEFAULT_STYLE: QrStyle = {
  ecc: "Q",
  margin: 3,
  dots: "fluid",
  eyeFrame: "rounded",
  eyeBall: "rounded",
  fill: { type: "solid", color: "#0f1113" },
  eyeColor: null,
  eyeBallColor: null,
  radius: 0,
  background: "#ffffff",
  transparent: false,
  logo: null,
  frame: { style: "none", text: "SCAN MICH", color: "#191919", textColor: "#bdfb04" },
};

/** Merge a possibly partial / older stored style with the defaults. */
export function normalizeStyle(input: unknown): QrStyle {
  const s = (input && typeof input === "object" ? input : {}) as Partial<QrStyle>;
  return {
    ...DEFAULT_STYLE,
    ...s,
    fill: s.fill ?? DEFAULT_STYLE.fill,
    frame: { ...DEFAULT_STYLE.frame, ...(s.frame ?? {}) },
    eyeBallColor: s.eyeBallColor ?? null,
    radius: typeof s.radius === "number" ? s.radius : 0,
    logo: s.logo ?? null,
  };
}

/** Curated starting points shown in the studio. */
const F = (style: FrameOptions["style"], text: string, color: string, textColor: string): FrameOptions => ({ style, text, color, textColor });
const NO_FRAME = F("none", "SCAN MICH", "#0f1113", "#ffffff");

/** Curated complete designs. Every one is decode-tested in scripts/verify-qr.mts. */
export const STYLE_PRESETS: { id: string; name: string; style: Partial<QrStyle> }[] = [
  { id: "classic", name: "Klassisch", style: { dots: "square", eyeFrame: "square", eyeBall: "square", fill: { type: "solid", color: "#000000" }, background: "#ffffff", eyeColor: null, eyeBallColor: null, radius: 0, frame: NO_FRAME } },
  { id: "qlick", name: "Qlick Lime", style: { dots: "fluid", eyeFrame: "rounded", eyeBall: "rounded", fill: { type: "solid", color: "#191919" }, background: "#bdfb04", eyeColor: null, eyeBallColor: null, radius: 10, frame: NO_FRAME } },
  { id: "lime-night", name: "Lime Nacht", style: { dots: "dots", eyeFrame: "rounded", eyeBall: "circle", fill: { type: "solid", color: "#bdfb04" }, background: "#191919", eyeColor: null, eyeBallColor: "#ffffff", radius: 10, frame: NO_FRAME } },
  { id: "silver", name: "Silver", style: { dots: "rounded", eyeFrame: "rounded", eyeBall: "circle", fill: { type: "solid", color: "#191919" }, background: "#dfded7", eyeColor: null, eyeBallColor: null, radius: 10, frame: NO_FRAME } },
  { id: "ultraviolet", name: "Ultraviolet", style: { dots: "fluid", eyeFrame: "rounded", eyeBall: "circle", fill: { type: "solid", color: "#4f33e6" }, background: "#ffffff", eyeColor: null, eyeBallColor: "#0891b2", radius: 0, frame: NO_FRAME } },
  { id: "granat", name: "Granat", style: { dots: "fluid", eyeFrame: "rounded", eyeBall: "circle", fill: { type: "solid", color: "#b3173a" }, background: "#ffffff", eyeColor: null, eyeBallColor: "#3b0e1a", radius: 0, frame: NO_FRAME } },
  { id: "bordeaux", name: "Bordeaux Gold", style: { dots: "classy", eyeFrame: "leaf", eyeBall: "leaf", fill: { type: "solid", color: "#3b0e1a" }, background: "#fbf4e2", eyeColor: null, eyeBallColor: "#b8860b", radius: 6, frame: NO_FRAME } },
  { id: "marine", name: "Marine", style: { dots: "rounded", eyeFrame: "rounded", eyeBall: "rounded", fill: { type: "solid", color: "#10204d" }, background: "#ffffff", eyeColor: null, eyeBallColor: "#c9971f", radius: 0, frame: NO_FRAME } },
  { id: "marine-night", name: "Marine Nacht", style: { dots: "dots", eyeFrame: "rounded", eyeBall: "circle", fill: { type: "solid", color: "#ffffff" }, background: "#10204d", eyeColor: null, eyeBallColor: "#e9b949", radius: 8, frame: NO_FRAME } },
  { id: "noir", name: "Granat Noir", style: { dots: "fluid", eyeFrame: "rounded", eyeBall: "circle", fill: { type: "solid", color: "#ff4d6d" }, background: "#0f1113", eyeColor: null, eyeBallColor: null, radius: 8, frame: NO_FRAME } },
  { id: "gold", name: "Goldstück", style: { dots: "classy", eyeFrame: "leaf", eyeBall: "circle", fill: { type: "solid", color: "#e9b949" }, background: "#0f1113", eyeColor: null, eyeBallColor: null, radius: 8, frame: NO_FRAME } },
  { id: "bubble", name: "Bubbles", style: { dots: "bubble", eyeFrame: "circle", eyeBall: "circle", fill: { type: "solid", color: "#1a1d4e" }, background: "#ffffff", eyeColor: "#1a1d4e", eyeBallColor: "#d42a4e", radius: 0, frame: NO_FRAME } },
  { id: "bars", name: "Barcode", style: { dots: "vertical", eyeFrame: "octagon", eyeBall: "octagon", fill: { type: "solid", color: "#0f1113" }, background: "#e9b949", eyeColor: null, eyeBallColor: null, radius: 8, frame: NO_FRAME } },
  { id: "leaf", name: "Organic", style: { dots: "classy", eyeFrame: "leaf", eyeBall: "leaf", fill: { type: "solid", color: "#0b4d3b" }, background: "#f4f1e8", eyeColor: null, eyeBallColor: "#d97706", radius: 0, frame: NO_FRAME } },
  { id: "shield", name: "Wappen", style: { dots: "mini", eyeFrame: "shield", eyeBall: "shield", fill: { type: "solid", color: "#5a1428" }, background: "#ffffff", eyeColor: null, eyeBallColor: null, radius: 0, frame: NO_FRAME } },
  { id: "pixel", name: "Pixel Marine", style: { dots: "mini", eyeFrame: "square", eyeBall: "square", fill: { type: "solid", color: "#1f3c88" }, background: "#ffffff", eyeColor: null, eyeBallColor: "#d42a4e", radius: 0, frame: NO_FRAME } },
  { id: "stripes", name: "Streifen", style: { dots: "horizontal", eyeFrame: "rounded", eyeBall: "rounded", fill: { type: "solid", color: "#3b0e1a" }, background: "#ffffff", eyeColor: null, eyeBallColor: "#d42a4e", radius: 0, frame: NO_FRAME } },
  { id: "diamond", name: "Raute", style: { dots: "diamond", eyeFrame: "octagon", eyeBall: "diamond", fill: { type: "solid", color: "#10204d" }, background: "#ffffff", eyeColor: null, eyeBallColor: "#c9971f", radius: 0, frame: NO_FRAME } },
  { id: "banner", name: "Banner Granat", style: { dots: "fluid", eyeFrame: "rounded", eyeBall: "rounded", fill: { type: "solid", color: "#0f1113" }, background: "#ffffff", eyeColor: null, eyeBallColor: "#d42a4e", radius: 0, frame: F("label", "SCAN MICH", "#d42a4e", "#ffffff") } },
  { id: "card", name: "Karte Marine", style: { dots: "rounded", eyeFrame: "rounded", eyeBall: "circle", fill: { type: "solid", color: "#10204d" }, background: "#ffffff", eyeColor: null, eyeBallColor: "#c9971f", radius: 0, frame: F("card", "JETZT SCANNEN", "#10204d", "#e9b949") } },
  { id: "ticket", name: "Ticket Gold", style: { dots: "classy", eyeFrame: "leaf", eyeBall: "leaf", fill: { type: "solid", color: "#3b0e1a" }, background: "#ffffff", eyeColor: null, eyeBallColor: null, radius: 0, frame: F("ticket", "SPEISEKARTE", "#e9b949", "#3b0e1a") } },
  { id: "night", name: "Mitternacht", style: { dots: "dots", eyeFrame: "rounded", eyeBall: "circle", fill: { type: "solid", color: "#ffffff" }, background: "#0f1113", eyeColor: null, eyeBallColor: "#e9b949", radius: 8, frame: NO_FRAME } },
];
