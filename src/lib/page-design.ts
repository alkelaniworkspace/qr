import { z } from "zod";

/**
 * Design system for every hosted page (menu, links, vCard, review, coupon,
 * event, PDF, mini website, poll).
 *
 * A page stores `design: { preset, ...overrides }`. Only what differs from the
 * preset is stored, so codes that carry their page inside the QR stay small.
 * Pages created before this system keep working: `resolveDesign` derives a
 * design from their old `accent` / `theme` / menu `style` fields.
 */

export const FONTS = {
  modern: { label: "Modern", display: "'Inter Variable', Inter, system-ui, sans-serif", weight: 700, tracking: "-0.03em", sample: "Aa" },
  grotesk: { label: "Grotesk", display: "'Space Grotesk', 'Inter Variable', sans-serif", weight: 700, tracking: "-0.04em", sample: "Aa" },
  editorial: { label: "Editorial", display: "'Fraunces Variable', Georgia, serif", weight: 600, tracking: "-0.02em", sample: "Aa" },
  classic: { label: "Klassisch", display: "'Playfair Display Variable', Georgia, serif", weight: 600, tracking: "-0.01em", sample: "Aa" },
  elegant: { label: "Elegant", display: "'Cormorant Garamond', Garamond, serif", weight: 600, tracking: "0", sample: "Aa" },
  bold: { label: "Plakativ", display: "'Bebas Neue', Impact, sans-serif", weight: 400, tracking: "0.01em", sample: "AA", upper: true, scale: 1.25 },
  script: { label: "Handschrift", display: "'Caveat', 'Segoe Script', cursive", weight: 700, tracking: "0", sample: "Aa", scale: 1.3 },
} as const;
export type FontId = keyof typeof FONTS;

export const RADII = { none: 0, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export type RadiusId = keyof typeof RADII;

export const BUTTONS = ["solid", "soft", "outline", "shadow", "glass", "pill"] as const;
export const CARDS = ["flat", "outline", "elevated", "glass"] as const;
export const BACKGROUNDS = ["solid", "gradient", "mesh", "dots", "grid", "waves", "image"] as const;
export const HEROES = ["cover", "centered", "minimal"] as const;
export const MOTION = ["none", "subtle", "lively"] as const;

export interface Design {
  preset: string;
  bg: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  accent2: string;
  font: FontId;
  radius: RadiusId;
  button: (typeof BUTTONS)[number];
  card: (typeof CARDS)[number];
  background: (typeof BACKGROUNDS)[number];
  bgImage: string;
  hero: (typeof HEROES)[number];
  motion: (typeof MOTION)[number];
}

type Preset = Omit<Design, "preset" | "bgImage"> & { id: string; name: string; mood: string; dark: boolean };

export const PRESETS: Preset[] = [
  { id: "studio", name: "Studio", mood: "Hell, klar, modern", dark: false, bg: "#f6f5f1", surface: "#ffffff", text: "#141414", muted: "#6b6a64", accent: "#141414", accent2: "#bdfb04", font: "modern", radius: "lg", button: "solid", card: "elevated", background: "solid", hero: "cover", motion: "subtle" },
  { id: "midnight", name: "Mitternacht", mood: "Dunkel mit Neon-Lime", dark: true, bg: "#0b0b0e", surface: "#16161b", text: "#f5f5f4", muted: "#a1a1aa", accent: "#bdfb04", accent2: "#5b21b6", font: "grotesk", radius: "lg", button: "shadow", card: "glass", background: "mesh", hero: "cover", motion: "lively" },
  { id: "espresso", name: "Espresso", mood: "Kaffee, warm, edel", dark: true, bg: "#1b1310", surface: "#271c17", text: "#f6ece2", muted: "#c3ad9a", accent: "#d9a066", accent2: "#7a3e1d", font: "editorial", radius: "md", button: "solid", card: "flat", background: "gradient", hero: "cover", motion: "subtle" },
  { id: "latte", name: "Latte", mood: "Café, weich, freundlich", dark: false, bg: "#f5ece2", surface: "#fffaf4", text: "#3b2a20", muted: "#8a7262", accent: "#b06a3b", accent2: "#f2c9a8", font: "script", radius: "xl", button: "pill", card: "elevated", background: "mesh", hero: "centered", motion: "lively" },
  { id: "matcha", name: "Matcha", mood: "Frisch, grün, natürlich", dark: false, bg: "#edf2e6", surface: "#ffffff", text: "#1d2b1c", muted: "#5f6f5c", accent: "#4f7a3a", accent2: "#c7dbb0", font: "grotesk", radius: "lg", button: "soft", card: "outline", background: "dots", hero: "cover", motion: "subtle" },
  { id: "terracotta", name: "Terracotta", mood: "Mediterran, sonnig", dark: false, bg: "#f6ebe1", surface: "#fff8f2", text: "#2d1a12", muted: "#7c6253", accent: "#c4572e", accent2: "#e9b949", font: "classic", radius: "md", button: "solid", card: "elevated", background: "waves", hero: "cover", motion: "subtle" },
  { id: "bordeaux", name: "Bordeaux & Gold", mood: "Fine Dining, festlich", dark: true, bg: "#220a12", surface: "#30111b", text: "#f8ead8", muted: "#cfb3a0", accent: "#d9b26b", accent2: "#5c1a2b", font: "elegant", radius: "none", button: "outline", card: "outline", background: "gradient", hero: "centered", motion: "subtle" },
  { id: "ocean", name: "Ozean", mood: "Blau, ruhig, vertrauensvoll", dark: false, bg: "#e8f1f8", surface: "#ffffff", text: "#0c2236", muted: "#5a7186", accent: "#1d6fb8", accent2: "#7cc4f5", font: "modern", radius: "lg", button: "shadow", card: "elevated", background: "gradient", hero: "cover", motion: "subtle" },
  { id: "neon", name: "Street", mood: "Laut, Street Food, Nacht", dark: true, bg: "#0a0a0a", surface: "#151515", text: "#ffffff", muted: "#a3a3a3", accent: "#ffd60a", accent2: "#ff2e88", font: "bold", radius: "sm", button: "shadow", card: "flat", background: "grid", hero: "cover", motion: "lively" },
  { id: "peach", name: "Pfirsich", mood: "Fröhlich, verspielt", dark: false, bg: "#ffe8dc", surface: "#ffffff", text: "#3a1d1d", muted: "#8b5e57", accent: "#ff6b4a", accent2: "#ffc2d1", font: "grotesk", radius: "xl", button: "pill", card: "elevated", background: "mesh", hero: "centered", motion: "lively" },
  { id: "nordic", name: "Nordisch", mood: "Minimal, skandinavisch", dark: false, bg: "#f1f1ee", surface: "#ffffff", text: "#222222", muted: "#7a7a75", accent: "#56707f", accent2: "#d9dfe2", font: "elegant", radius: "sm", button: "outline", card: "outline", background: "solid", hero: "minimal", motion: "subtle" },
  { id: "citrus", name: "Zitrus", mood: "Sommer, Energie", dark: false, bg: "#fff6cf", surface: "#ffffff", text: "#1c1a12", muted: "#6f6a52", accent: "#ff7a00", accent2: "#ffd84d", font: "bold", radius: "md", button: "shadow", card: "outline", background: "dots", hero: "cover", motion: "lively" },
  { id: "lavender", name: "Lavendel", mood: "Sanft, kreativ, Beauty", dark: false, bg: "#f0ecfb", surface: "#ffffff", text: "#21173d", muted: "#6c6390", accent: "#7c5cff", accent2: "#f3a6d8", font: "editorial", radius: "xl", button: "soft", card: "glass", background: "mesh", hero: "centered", motion: "lively" },
  { id: "slate", name: "Schiefer", mood: "Tech, seriös, dunkel", dark: true, bg: "#14181d", surface: "#1d232a", text: "#eef2f5", muted: "#93a0ad", accent: "#5eead4", accent2: "#2563eb", font: "modern", radius: "md", button: "solid", card: "outline", background: "grid", hero: "minimal", motion: "subtle" },
];

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
/** Stored form: preset plus overrides only. */
export const designSchema = z.object({
  preset: z.string().max(24),
  bg: hex.optional(),
  surface: hex.optional(),
  text: hex.optional(),
  muted: hex.optional(),
  accent: hex.optional(),
  accent2: hex.optional(),
  font: z.enum(Object.keys(FONTS) as [FontId, ...FontId[]]).optional(),
  radius: z.enum(Object.keys(RADII) as [RadiusId, ...RadiusId[]]).optional(),
  button: z.enum(BUTTONS).optional(),
  card: z.enum(CARDS).optional(),
  background: z.enum(BACKGROUNDS).optional(),
  bgImage: z.string().trim().max(600).refine((v) => !v || /^https:\/\/[^\s"'<>]+$/.test(v), "Ungültiges Bild").optional(),
  hero: z.enum(HEROES).optional(),
  motion: z.enum(MOTION).optional(),
}).partial({ preset: true });
export type StoredDesign = z.infer<typeof designSchema>;

export function presetById(id: unknown): Preset {
  return PRESETS.find((p) => p.id === id) ?? PRESETS[0];
}

function luminance(h: string): number {
  const n = parseInt(h.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
export const isDark = (h: string) => /^#[0-9a-f]{6}$/i.test(h) && luminance(h) < 0.22;
/** Text colour that reads well on `h`. */
export const onColor = (h: string) => (/^#[0-9a-f]{6}$/i.test(h) && luminance(h) > 0.36 ? "#111111" : "#ffffff");

/** Legacy pages (accent + light/dark/color theme, menu style) mapped onto the new system. */
function legacy(c: Record<string, unknown>): StoredDesign {
  const accent = /^#[0-9a-fA-F]{6}$/.test(String(c.accent)) ? String(c.accent) : "#191919";
  const custom = accent.toLowerCase() !== "#191919";
  const style = String(c.style ?? "");
  const byStyle: Record<string, string> = { bistro: "terracotta", cafe: "latte", street: "neon", fine: "bordeaux", trattoria: "terracotta" };
  if (byStyle[style]) return { preset: byStyle[style], ...(custom ? { accent } : {}), ...(style === "trattoria" ? { accent: custom ? accent : "#b3261e", font: "classic" as const } : {}) };
  if (c.theme === "dark") return { preset: "midnight", ...(custom ? { accent } : { accent: "#f5f5f4" }), background: "solid" };
  if (c.theme === "color") return { preset: "studio", bg: accent, surface: isDark(accent) ? "#ffffff" : "#ffffff", text: onColor(accent), muted: onColor(accent), accent: onColor(accent), background: "solid" };
  return { preset: "studio", ...(custom ? { accent } : {}) };
}

export function resolveDesign(c: Record<string, unknown>): Design {
  const parsed = designSchema.safeParse(c.design);
  const stored: StoredDesign = parsed.success && parsed.data.preset ? parsed.data : legacy(c);
  const p = presetById(stored.preset);
  return {
    preset: p.id,
    bg: stored.bg ?? p.bg,
    surface: stored.surface ?? p.surface,
    text: stored.text ?? p.text,
    muted: stored.muted ?? p.muted,
    accent: stored.accent ?? p.accent,
    accent2: stored.accent2 ?? p.accent2,
    font: stored.font ?? p.font,
    radius: stored.radius ?? p.radius,
    button: stored.button ?? p.button,
    card: stored.card ?? p.card,
    background: stored.background ?? p.background,
    bgImage: stored.bgImage ?? "",
    hero: stored.hero ?? p.hero,
    motion: stored.motion ?? p.motion,
  };
}

/** Only keep what differs from the preset (smaller codes, presets can evolve). */
export function compactDesign(d: Design): StoredDesign {
  const p = presetById(d.preset);
  const out: Record<string, unknown> = { preset: d.preset };
  for (const k of ["bg", "surface", "text", "muted", "accent", "accent2", "font", "radius", "button", "card", "background", "hero", "motion"] as const) {
    if (d[k] !== p[k]) out[k] = d[k];
  }
  if (d.bgImage) out.bgImage = d.bgImage;
  return out as StoredDesign;
}

const mix = (a: string, b: string, pct: number) => `color-mix(in srgb, ${a} ${pct}%, ${b})`;

/** CSS custom properties consumed by every page component and by globals.css. */
export function designVars(d: Design): Record<string, string> {
  const f = FONTS[d.font];
  return {
    "--pg-bg": d.bg,
    "--pg-fg": d.text,
    "--pg-card": d.surface,
    "--pg-muted": d.muted,
    "--pg-line": mix(d.text, "transparent", 12),
    "--pg-soft": mix(d.text, d.bg, 6),
    "--accent": d.accent,
    "--on-accent": onColor(d.accent),
    "--accent-2": d.accent2,
    "--pg-radius": `${RADII[d.radius]}px`,
    "--pg-display": f.display,
    "--pg-display-weight": String(f.weight),
    "--pg-display-tracking": f.tracking,
    "--pg-display-scale": String("scale" in f ? f.scale : 1),
    "--pg-display-case": "upper" in f && f.upper ? "uppercase" : "none",
    // legacy menu variables
    "--mp-display": f.display,
    "--mp-radius": `${RADII[d.radius]}px`,
    "--mp-hscale": String("scale" in f ? f.scale : 1),
  };
}
