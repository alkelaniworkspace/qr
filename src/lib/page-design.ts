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
  grotesk: { label: "Jakarta", display: "'Plus Jakarta Sans Variable', 'Inter Variable', sans-serif", weight: 800, tracking: "-0.035em", sample: "Aa" },
  editorial: { label: "Editorial", display: "'Fraunces Variable', Georgia, serif", weight: 600, tracking: "-0.02em", sample: "Aa" },
  classic: { label: "Klassisch", display: "'Playfair Display Variable', Georgia, serif", weight: 600, tracking: "-0.01em", sample: "Aa" },
  elegant: { label: "Elegant", display: "'Cormorant Garamond', Garamond, serif", weight: 600, tracking: "0", sample: "Aa" },
  bold: { label: "Kräftig", display: "Poppins, 'Inter Variable', sans-serif", weight: 800, tracking: "-0.03em", sample: "Aa" },
  script: { label: "Display Serif", display: "'DM Serif Display', Georgia, serif", weight: 400, tracking: "-0.01em", sample: "Aa", scale: 1.05 },
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
  { id: "studio", name: "Studio", mood: "Hell, klar, zeitlos", dark: false, bg: "#f7f6f3", surface: "#ffffff", text: "#121212", muted: "#6e6d68", accent: "#121212", accent2: "#e9e7e1", font: "modern", radius: "lg", button: "solid", card: "flat", background: "solid", hero: "cover", motion: "subtle" },
  { id: "midnight", name: "Mitternacht", mood: "Dunkel, ruhig, edel", dark: true, bg: "#0c0c0f", surface: "#17171c", text: "#f4f4f5", muted: "#9d9da6", accent: "#e8ff7a", accent2: "#24242c", font: "grotesk", radius: "lg", button: "solid", card: "flat", background: "solid", hero: "cover", motion: "subtle" },
  { id: "espresso", name: "Espresso", mood: "Kaffee, warm, dunkel", dark: true, bg: "#17110e", surface: "#211814", text: "#f3e9df", muted: "#b5a392", accent: "#d8a26a", accent2: "#33251d", font: "editorial", radius: "md", button: "solid", card: "flat", background: "solid", hero: "cover", motion: "subtle" },
  { id: "latte", name: "Latte", mood: "Café, hell, weich", dark: false, bg: "#f5efe8", surface: "#fffdf9", text: "#2f241d", muted: "#85715f", accent: "#a8673d", accent2: "#eadbcb", font: "editorial", radius: "xl", button: "pill", card: "flat", background: "solid", hero: "cover", motion: "subtle" },
  { id: "matcha", name: "Matcha", mood: "Frisch, grün, natürlich", dark: false, bg: "#f1f4ec", surface: "#ffffff", text: "#1d261b", muted: "#67725f", accent: "#4a6b3a", accent2: "#dfe7d4", font: "grotesk", radius: "lg", button: "solid", card: "flat", background: "solid", hero: "cover", motion: "subtle" },
  { id: "terracotta", name: "Terracotta", mood: "Mediterran, warm", dark: false, bg: "#f6efe8", surface: "#fffaf5", text: "#2b1d16", muted: "#7d6658", accent: "#b85a36", accent2: "#ecd9c9", font: "classic", radius: "md", button: "solid", card: "flat", background: "solid", hero: "cover", motion: "subtle" },
  { id: "bordeaux", name: "Bordeaux & Gold", mood: "Fine Dining, festlich", dark: true, bg: "#1a0b10", surface: "#241118", text: "#f5e9dc", muted: "#bea795", accent: "#cfae72", accent2: "#36161f", font: "elegant", radius: "sm", button: "outline", card: "outline", background: "solid", hero: "centered", motion: "subtle" },
  { id: "ocean", name: "Ozean", mood: "Blau, klar, vertrauensvoll", dark: false, bg: "#eef3f7", surface: "#ffffff", text: "#102030", muted: "#5d7184", accent: "#1f5f99", accent2: "#dbe7f1", font: "modern", radius: "lg", button: "solid", card: "flat", background: "solid", hero: "cover", motion: "subtle" },
  { id: "neon", name: "Street", mood: "Street Food, Nacht", dark: true, bg: "#0b0b0b", surface: "#161616", text: "#ffffff", muted: "#9f9f9f", accent: "#ffd23f", accent2: "#262626", font: "bold", radius: "sm", button: "solid", card: "flat", background: "solid", hero: "cover", motion: "lively" },
  { id: "peach", name: "Pfirsich", mood: "Fröhlich, hell", dark: false, bg: "#fbf0ea", surface: "#ffffff", text: "#33201c", muted: "#8a6a62", accent: "#e2674b", accent2: "#f6dcd2", font: "grotesk", radius: "xl", button: "pill", card: "flat", background: "solid", hero: "centered", motion: "subtle" },
  { id: "nordic", name: "Nordisch", mood: "Minimal, skandinavisch", dark: false, bg: "#f2f2ef", surface: "#ffffff", text: "#222222", muted: "#7a7a75", accent: "#4f6573", accent2: "#dfe3e5", font: "elegant", radius: "sm", button: "outline", card: "outline", background: "solid", hero: "minimal", motion: "subtle" },
  { id: "citrus", name: "Zitrus", mood: "Sommer, Energie", dark: false, bg: "#fbf6e4", surface: "#ffffff", text: "#1f1c14", muted: "#6f6a55", accent: "#e07a10", accent2: "#f2e6bf", font: "grotesk", radius: "md", button: "solid", card: "flat", background: "solid", hero: "cover", motion: "subtle" },
  { id: "lavender", name: "Lavendel", mood: "Sanft, Beauty", dark: false, bg: "#f3f1fa", surface: "#ffffff", text: "#1f1a33", muted: "#6c6688", accent: "#6a52e0", accent2: "#e3def6", font: "editorial", radius: "xl", button: "pill", card: "flat", background: "solid", hero: "centered", motion: "subtle" },
  { id: "slate", name: "Schiefer", mood: "Tech, seriös, dunkel", dark: true, bg: "#12161b", surface: "#1b2027", text: "#eef1f4", muted: "#8e99a5", accent: "#7dd3c7", accent2: "#232a33", font: "modern", radius: "md", button: "solid", card: "outline", background: "solid", hero: "minimal", motion: "subtle" },
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
