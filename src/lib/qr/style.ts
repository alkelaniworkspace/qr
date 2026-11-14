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
  frame: { style: "none", text: "SCAN MICH", color: "#0f1113", textColor: "#d2ff1f" },
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
export const STYLE_PRESETS: { id: string; name: string; style: Partial<QrStyle> }[] = [
  { id: "classic", name: "Klassisch", style: { dots: "square", eyeFrame: "square", eyeBall: "square", fill: { type: "solid", color: "#000000" }, background: "#ffffff", eyeColor: null, eyeBallColor: null } },
  { id: "lime", name: "Lime Noir", style: { dots: "fluid", eyeFrame: "rounded", eyeBall: "circle", fill: { type: "solid", color: "#d2ff1f" }, background: "#0f1113", eyeColor: null, eyeBallColor: null, radius: 8 } },
  { id: "ink", name: "Tinte", style: { dots: "rounded", eyeFrame: "rounded", eyeBall: "rounded", fill: { type: "solid", color: "#0f1113" }, background: "#ffffff", eyeColor: null, eyeBallColor: "#7fa000" } },
  { id: "bubble", name: "Bubbles", style: { dots: "bubble", eyeFrame: "circle", eyeBall: "circle", fill: { type: "solid", color: "#1a1d4e" }, background: "#ffffff", eyeColor: "#1a1d4e", eyeBallColor: "#ff5d6c" } },
  { id: "bars", name: "Barcode", style: { dots: "vertical", eyeFrame: "octagon", eyeBall: "octagon", fill: { type: "solid", color: "#0f1113" }, background: "#d2ff1f", eyeColor: null, eyeBallColor: null, radius: 8 } },
  { id: "leaf", name: "Organic", style: { dots: "classy", eyeFrame: "leaf", eyeBall: "leaf", fill: { type: "solid", color: "#0b4d3b" }, background: "#f4f1e8", eyeColor: null, eyeBallColor: "#d97706" } },
  { id: "shield", name: "Wappen", style: { dots: "mini", eyeFrame: "shield", eyeBall: "shield", fill: { type: "solid", color: "#5a1428" }, background: "#ffffff", eyeColor: null, eyeBallColor: null } },
  { id: "night", name: "Mitternacht", style: { dots: "dots", eyeFrame: "rounded", eyeBall: "circle", fill: { type: "solid", color: "#ffffff" }, background: "#0f1113", eyeColor: null, eyeBallColor: "#d2ff1f", radius: 8 } },
];
