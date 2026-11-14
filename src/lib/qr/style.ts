/**
 * Design options for a rendered code. Stored as JSON on every code, so all
 * fields must stay serialisable and backwards compatible (only add, never rename).
 */

export type ErrorCorrection = "L" | "M" | "Q" | "H";
export type DotStyle = "square" | "rounded" | "dots" | "classy" | "diamond" | "fluid";
export type EyeFrameStyle = "square" | "rounded" | "circle" | "leaf";
export type EyeBallStyle = "square" | "rounded" | "circle" | "diamond" | "leaf";
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
  /** optional separate colour for the three corner eyes */
  eyeColor: string | null;
  background: string;
  transparent: boolean;
  logo: LogoOptions | null;
  frame: FrameOptions;
}

export const DEFAULT_STYLE: QrStyle = {
  ecc: "Q",
  margin: 3,
  dots: "rounded",
  eyeFrame: "rounded",
  eyeBall: "rounded",
  fill: { type: "solid", color: "#14130f" },
  eyeColor: null,
  background: "#ffffff",
  transparent: false,
  logo: null,
  frame: { style: "none", text: "Scan mich", color: "#14130f", textColor: "#ffffff" },
};

/** Merge a possibly partial / older stored style with the defaults. */
export function normalizeStyle(input: unknown): QrStyle {
  const s = (input && typeof input === "object" ? input : {}) as Partial<QrStyle>;
  return {
    ...DEFAULT_STYLE,
    ...s,
    fill: s.fill ?? DEFAULT_STYLE.fill,
    frame: { ...DEFAULT_STYLE.frame, ...(s.frame ?? {}) },
    logo: s.logo ?? null,
  };
}

/** Curated starting points shown in the studio. */
export const STYLE_PRESETS: { id: string; name: string; style: Partial<QrStyle> }[] = [
  { id: "classic", name: "Klassisch", style: { dots: "square", eyeFrame: "square", eyeBall: "square", fill: { type: "solid", color: "#000000" } } },
  { id: "noir", name: "Noir", style: { dots: "rounded", eyeFrame: "rounded", eyeBall: "rounded", fill: { type: "solid", color: "#14130f" } } },
  { id: "champagne", name: "Champagner", style: { dots: "classy", eyeFrame: "leaf", eyeBall: "leaf", fill: { type: "linear", colors: ["#5c4519", "#8a6a2f"], rotation: 45 }, eyeColor: "#3f2f10" } },
  { id: "emerald", name: "Smaragd", style: { dots: "dots", eyeFrame: "circle", eyeBall: "circle", fill: { type: "radial", colors: ["#0f5b46", "#06261d"], rotation: 0 } } },
  { id: "midnight", name: "Mitternacht", style: { dots: "fluid", eyeFrame: "rounded", eyeBall: "circle", fill: { type: "linear", colors: ["#1e2a78", "#7b2ff7"], rotation: 135 } } },
  { id: "bordeaux", name: "Bordeaux", style: { dots: "diamond", eyeFrame: "square", eyeBall: "diamond", fill: { type: "solid", color: "#5a1428" } } },
];
