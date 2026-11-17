/**
 * Form designs. Every look has a light and a dark palette; the form follows
 * settings.mode (light/dark/auto). Fonts are the site's professional set.
 */
export type FieldStyle = "boxed" | "soft" | "underline" | "glass";
export type Backdrop = "solid" | "gradient" | "mesh" | "grid" | "dots" | "paper" | "glow";

export interface Palette { bg: string; card: string; fg: string; muted: string; line: string; field: string; accent: string }
export interface FormLook {
  id: string;
  name: string;
  font: string;          // key of FORM_FONTS
  radius: number;        // px for fields and buttons
  field: FieldStyle;
  backdrop: Backdrop;
  sheet: boolean;        // form sits on a raised card
  light: Palette;
  dark: Palette;
  /** default mode for new forms */
  prefers: "light" | "dark";
}

export const FORM_FONTS: Record<string, { label: string; display: string; body: string; weight: number; tracking: string }> = {
  inter: { label: "Inter", display: "'Inter Variable', Inter, system-ui, sans-serif", body: "'Inter Variable', Inter, system-ui, sans-serif", weight: 750, tracking: "-0.035em" },
  jakarta: { label: "Jakarta", display: "'Plus Jakarta Sans Variable', 'Inter Variable', sans-serif", body: "'Plus Jakarta Sans Variable', 'Inter Variable', sans-serif", weight: 800, tracking: "-0.035em" },
  poppins: { label: "Poppins", display: "Poppins, 'Inter Variable', sans-serif", body: "'Inter Variable', Inter, sans-serif", weight: 700, tracking: "-0.03em" },
  fraunces: { label: "Fraunces", display: "'Fraunces Variable', Georgia, serif", body: "'Inter Variable', Inter, sans-serif", weight: 600, tracking: "-0.02em" },
  playfair: { label: "Playfair", display: "'Playfair Display Variable', Georgia, serif", body: "'Inter Variable', Inter, sans-serif", weight: 600, tracking: "-0.01em" },
  cormorant: { label: "Cormorant", display: "'Cormorant Garamond', Garamond, serif", body: "'Inter Variable', Inter, sans-serif", weight: 600, tracking: "0" },
  dmserif: { label: "DM Serif", display: "'DM Serif Display', Georgia, serif", body: "'Inter Variable', Inter, sans-serif", weight: 400, tracking: "-0.01em" },
};

const P = (bg: string, card: string, fg: string, muted: string, line: string, field: string, accent: string): Palette => ({ bg, card, fg, muted, line, field, accent });

export const FORM_LOOKS: FormLook[] = [
  { id: "lime", name: "Lime Night", font: "inter", radius: 16, field: "soft", backdrop: "glow", sheet: true, prefers: "dark",
    dark: P("#0a0a0b", "#141416", "#ffffff", "#9b9b9f", "rgba(255,255,255,.1)", "rgba(255,255,255,.05)", "#c8ff2e"),
    light: P("#f2f2ec", "#ffffff", "#111111", "#6b6b66", "rgba(17,17,17,.1)", "#f6f6f1", "#111111") },
  { id: "paper", name: "Papier", font: "fraunces", radius: 10, field: "underline", backdrop: "paper", sheet: true, prefers: "light",
    light: P("#efe8da", "#fffdf7", "#1c1a16", "#77705f", "rgba(28,26,22,.16)", "transparent", "#1c1a16"),
    dark: P("#171511", "#211e18", "#f3ece0", "#a99f8b", "rgba(243,236,224,.16)", "transparent", "#f3ece0") },
  { id: "pomegranate", name: "Granatapfel", font: "jakarta", radius: 18, field: "boxed", backdrop: "gradient", sheet: true, prefers: "light",
    light: P("#fbeff1", "#ffffff", "#1d0b10", "#7a5960", "rgba(200,16,46,.14)", "#fff8f9", "#c8102e"),
    dark: P("#16070b", "#220d13", "#fff1f3", "#c99aa4", "rgba(255,255,255,.1)", "rgba(255,255,255,.04)", "#e2294f") },
  { id: "aurora", name: "Aurora", font: "jakarta", radius: 20, field: "glass", backdrop: "mesh", sheet: false, prefers: "dark",
    dark: P("#0c0a1c", "rgba(255,255,255,.06)", "#ffffff", "#b9b4d8", "rgba(255,255,255,.14)", "rgba(255,255,255,.08)", "#a78bfa"),
    light: P("#eeeafd", "rgba(255,255,255,.7)", "#1b1640", "#6a6491", "rgba(27,22,64,.12)", "rgba(255,255,255,.75)", "#6d28d9") },
  { id: "ocean", name: "Ozean", font: "inter", radius: 14, field: "boxed", backdrop: "gradient", sheet: true, prefers: "light",
    light: P("#e8f1fd", "#ffffff", "#0b1b33", "#5b6b84", "rgba(11,27,51,.12)", "#f7faff", "#2563eb"),
    dark: P("#06101f", "#0d1a2e", "#eaf2ff", "#8ea3c2", "rgba(234,242,255,.1)", "rgba(255,255,255,.04)", "#60a5fa") },
  { id: "espresso", name: "Kaffeehaus", font: "playfair", radius: 12, field: "boxed", backdrop: "paper", sheet: true, prefers: "light",
    light: P("#f1e7da", "#fffaf3", "#2b1d14", "#7d6a5b", "rgba(43,29,20,.14)", "#fbf4ea", "#6b4226"),
    dark: P("#1a120d", "#241912", "#f5e9dc", "#b39d89", "rgba(245,233,220,.12)", "rgba(255,255,255,.04)", "#d4a373") },
  { id: "rose", name: "Rosé", font: "poppins", radius: 24, field: "soft", backdrop: "dots", sheet: true, prefers: "light",
    light: P("#fdf0f5", "#ffffff", "#2a0f1d", "#8b6176", "rgba(225,29,116,.12)", "#fdf3f8", "#e11d74"),
    dark: P("#1a0912", "#25101b", "#ffe9f3", "#c99ab1", "rgba(255,255,255,.1)", "rgba(255,255,255,.05)", "#f472b6") },
  { id: "mono", name: "Mono", font: "inter", radius: 0, field: "underline", backdrop: "grid", sheet: false, prefers: "light",
    light: P("#ffffff", "#ffffff", "#000000", "#6b6b6b", "rgba(0,0,0,.85)", "transparent", "#000000"),
    dark: P("#000000", "#000000", "#ffffff", "#8f8f8f", "rgba(255,255,255,.85)", "transparent", "#ffffff") },
  { id: "gold", name: "Schwarz & Gold", font: "cormorant", radius: 6, field: "underline", backdrop: "glow", sheet: true, prefers: "dark",
    dark: P("#0d0b08", "#15120d", "#f6eedd", "#a99a7c", "rgba(212,162,76,.3)", "transparent", "#d4a24c"),
    light: P("#f5efe2", "#fffcf5", "#1a150c", "#7f7258", "rgba(26,21,12,.2)", "transparent", "#9a6b1e") },
  { id: "sunset", name: "Sonnenuntergang", font: "poppins", radius: 20, field: "soft", backdrop: "mesh", sheet: true, prefers: "light",
    light: P("#fff1e6", "#ffffff", "#2a1206", "#8a6450", "rgba(249,115,22,.16)", "#fff7f0", "#f97316"),
    dark: P("#1b0b05", "#26120a", "#ffede1", "#c9a08a", "rgba(255,255,255,.1)", "rgba(255,255,255,.05)", "#fb923c") },
  { id: "lavender", name: "Lavendel", font: "jakarta", radius: 18, field: "soft", backdrop: "dots", sheet: true, prefers: "light",
    light: P("#f2effc", "#ffffff", "#1e1638", "#6f6790", "rgba(124,58,237,.14)", "#f7f4ff", "#7c3aed"),
    dark: P("#110c22", "#1a1430", "#efeaff", "#a79fc9", "rgba(255,255,255,.1)", "rgba(255,255,255,.05)", "#a78bfa") },
  { id: "terracotta", name: "Terrakotta", font: "dmserif", radius: 14, field: "boxed", backdrop: "paper", sheet: true, prefers: "light",
    light: P("#f4e6dc", "#fffaf6", "#2d150a", "#87695a", "rgba(194,65,12,.18)", "#fdf5ef", "#c2410c"),
    dark: P("#1c0f09", "#28160d", "#fbe9dd", "#c39b86", "rgba(255,255,255,.1)", "rgba(255,255,255,.04)", "#ea7a45") },
  { id: "sky", name: "Himmel", font: "inter", radius: 22, field: "soft", backdrop: "gradient", sheet: true, prefers: "light",
    light: P("#e6f6fd", "#ffffff", "#062433", "#5a7685", "rgba(14,165,233,.16)", "#f3fbff", "#0ea5e9"),
    dark: P("#041620", "#0a2230", "#e3f6ff", "#86aabb", "rgba(255,255,255,.1)", "rgba(255,255,255,.05)", "#38bdf8") },
  { id: "midnight", name: "Mitternacht", font: "jakarta", radius: 16, field: "boxed", backdrop: "glow", sheet: true, prefers: "dark",
    dark: P("#070a14", "#0e1424", "#e8edff", "#8d97b8", "rgba(232,237,255,.1)", "rgba(255,255,255,.04)", "#7c9cff"),
    light: P("#eef1fb", "#ffffff", "#0d1430", "#5e6788", "rgba(13,20,48,.12)", "#f7f8fe", "#3b5bdb") },
];

export const lookOf = (id: string | undefined): FormLook => FORM_LOOKS.find((l) => l.id === id) ?? FORM_LOOKS[0];

export function isLightColor(hex: string): boolean {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return false;
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 160;
}

/** CSS background for the page behind the form. */
export function backdropCss(look: FormLook, p: Palette, dark: boolean): string {
  const a = p.accent;
  switch (look.backdrop) {
    case "gradient": return `radial-gradient(120% 70% at 50% -10%, ${a}${dark ? "33" : "26"}, transparent 60%), ${p.bg}`;
    case "mesh": return `radial-gradient(60% 50% at 10% 10%, ${a}${dark ? "55" : "40"}, transparent 70%), radial-gradient(50% 45% at 95% 20%, ${dark ? "#ec489955" : "#f9a8d455"}, transparent 70%), radial-gradient(60% 50% at 50% 100%, ${dark ? "#3b82f640" : "#93c5fd55"}, transparent 70%), ${p.bg}`;
    case "grid": return `linear-gradient(${p.line.replace(/[\d.]+\)$/, dark ? ".08)" : ".06)")} 1px, transparent 1px) 0 0 / 28px 28px, linear-gradient(90deg, ${p.line.replace(/[\d.]+\)$/, dark ? ".08)" : ".06)")} 1px, transparent 1px) 0 0 / 28px 28px, ${p.bg}`;
    case "dots": return `radial-gradient(${a}${dark ? "30" : "2a"} 1.2px, transparent 1.4px) 0 0 / 22px 22px, ${p.bg}`;
    case "paper": return `radial-gradient(90% 60% at 50% 0%, ${dark ? "rgba(255,255,255,.04)" : "rgba(255,255,255,.7)"}, transparent 70%), ${p.bg}`;
    case "glow": return `radial-gradient(60% 40% at 50% 0%, ${a}${dark ? "2e" : "1f"}, transparent 70%), ${p.bg}`;
    default: return p.bg;
  }
}
