/**
 * Design presets for the restaurant / café menu page.
 * "modern" keeps the user's accent + theme. Every other preset brings its own
 * palette, typography, hero and section style. A custom accent (anything other
 * than the default) still wins over the preset accent.
 */
export type MenuStyleId = "modern" | "bistro" | "cafe" | "street" | "fine" | "trattoria";

export interface MenuStyle {
  id: MenuStyleId;
  label: string;
  hint: string;
  /** item layout suggested when the preset is picked */
  layout: "cards" | "grid" | "list" | "elegant";
  hero: "classic" | "overlay" | "soft" | "bold" | "centered";
  heading: "plain" | "ornament" | "script" | "block" | "lines" | "underline";
  vars: Record<string, string> | null;
  accent?: string;
  display: string;
  /** font size multiplier for section headings (script/condensed fonts run small) */
  headingScale: number;
  radius: number;
  uppercase?: boolean;
  dark?: boolean;
}

export const MENU_STYLES: MenuStyle[] = [
  {
    id: "modern", label: "Modern", hint: "Klar, deine Farbe", layout: "cards", hero: "classic", heading: "plain",
    vars: null, display: "var(--font-display)", headingScale: 1, radius: 18,
  },
  {
    id: "bistro", label: "Bistro", hint: "Warm, Serif, Papier", layout: "list", hero: "overlay", heading: "ornament",
    vars: { "--pg-bg": "#f4ede1", "--pg-fg": "#2b1d14", "--pg-card": "#fbf7f0", "--pg-line": "#e3d6c3", "--pg-muted": "#7a6553", "--pg-soft": "#ece2d2" },
    accent: "#b4532a", display: "'Fraunces Variable', Georgia, serif", headingScale: 1.05, radius: 14,
  },
  {
    id: "cafe", label: "Café", hint: "Weich, Display-Serif", layout: "grid", hero: "soft", heading: "script",
    vars: { "--pg-bg": "#f6efe8", "--pg-fg": "#3a2a22", "--pg-card": "#ffffff", "--pg-line": "#eadfd4", "--pg-muted": "#8a7465", "--pg-soft": "#efe4d8" },
    accent: "#b8714a", display: "'DM Serif Display', Georgia, serif", headingScale: 1.1, radius: 24,
  },
  {
    id: "street", label: "Street Food", hint: "Laut, dunkel, Neon", layout: "grid", hero: "bold", heading: "block",
    vars: { "--pg-bg": "#0d0d0d", "--pg-fg": "#fafafa", "--pg-card": "#181818", "--pg-line": "rgba(255,255,255,0.1)", "--pg-muted": "#a3a3a3", "--pg-soft": "#222222" },
    accent: "#ffd60a", display: "Poppins, sans-serif", headingScale: 1.1, radius: 8, dark: true,
  },
  {
    id: "fine", label: "Fine Dining", hint: "Schwarz & Gold", layout: "elegant", hero: "centered", heading: "lines",
    vars: { "--pg-bg": "#0e0d0b", "--pg-fg": "#f3ead8", "--pg-card": "#15130f", "--pg-line": "rgba(214,180,110,0.22)", "--pg-muted": "#b3a68c", "--pg-soft": "#1c1915" },
    accent: "#d6b46e", display: "'Cormorant Garamond', Garamond, serif", headingScale: 1.25, radius: 2, dark: true,
  },
  {
    id: "trattoria", label: "Trattoria", hint: "Italienisch, rot-weiß", layout: "cards", hero: "overlay", heading: "underline",
    vars: { "--pg-bg": "#fbf8f1", "--pg-fg": "#1f2a1f", "--pg-card": "#ffffff", "--pg-line": "#e7dfcd", "--pg-muted": "#6f6a5a", "--pg-soft": "#f1ebdc" },
    accent: "#b3261e", display: "'Playfair Display Variable', Georgia, serif", headingScale: 1.05, radius: 12,
  },
];

export const DEFAULT_ACCENT = "#191919";

export function menuStyle(id: unknown): MenuStyle {
  return MENU_STYLES.find((s) => s.id === id) ?? MENU_STYLES[0];
}

/**
 * The menu page's hero / heading look, derived from the shared page design
 * (src/lib/page-design.ts), so one design editor drives every page type.
 */
export function menuStyleFromDesign(d: { font: string; hero: string; radius: string; bg: string; accent: string }, dark: boolean): MenuStyle {
  const byFont: Record<string, MenuStyleId> = { bold: "street", script: "cafe", elegant: "fine", editorial: "bistro", classic: "trattoria" };
  const id: MenuStyleId = byFont[d.font] ?? "modern";
  const base = menuStyle(id);
  const hero: MenuStyle["hero"] =
    d.hero === "minimal" ? "classic"
      : d.hero === "centered" ? (d.font === "elegant" ? "centered" : "soft")
        : d.font === "bold" ? "bold" : "overlay";
  return { ...base, hero, vars: null, accent: d.accent, dark, display: "var(--pg-display)", headingScale: base.headingScale };
}
