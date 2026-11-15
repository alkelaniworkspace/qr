import type { StoredDesign } from "@/lib/page-design";

/**
 * 20 menu page templates. Each one is a complete composition (not just a
 * colour change): its own header, category navigation, dish layout, section
 * headings and texture. The `design` part seeds colours and fonts, which the
 * owner can still fine-tune in the design editor.
 */

export type HeaderKind = "below" | "editorial" | "frame" | "bento" | "hero" | "gradient" | "split" | "brutal" | "minimal" | "neon" | "monogram";
export type NavKind = "underline" | "pills" | "numbered" | "boxed" | "brutal" | "glass";
export type HeadingKind = "plain" | "numbered" | "lines" | "script" | "index" | "tag" | "glow" | "serif-italic";
export type ItemKind = "row" | "leader" | "centered" | "grid" | "masonry" | "carousel" | "polaroid" | "ticket" | "circle" | "pricecol" | "bento" | "brutal" | "glass" | "mono";
export type Texture = "none" | "paper" | "chalk" | "grain" | "mesh" | "neon" | "terrazzo" | "dots";

export interface MenuTemplate {
  id: string;
  name: string;
  mood: string;
  header: HeaderKind;
  nav: NavKind;
  heading: HeadingKind;
  items: ItemKind;
  texture: Texture;
  design: StoredDesign;
}

export const MENU_TEMPLATES: MenuTemplate[] = [
  { id: "editorial", name: "Editorial", mood: "Wie ein Magazin: große Serifen, nummerierte Kapitel", header: "editorial", nav: "numbered", heading: "numbered", items: "leader", texture: "paper",
    design: { preset: "terracotta", bg: "#f3eee6", surface: "#fbf8f2", text: "#1d1a16", muted: "#776d61", accent: "#b4471f", accent2: "#e6dccd", font: "classic", radius: "sm" } },
  { id: "noir", name: "Noir", mood: "Schwarz, Gold, zentriert, Fine Dining", header: "monogram", nav: "underline", heading: "lines", items: "centered", texture: "grain",
    design: { preset: "bordeaux", bg: "#0b0a09", surface: "#141210", text: "#efe6d6", muted: "#a59a87", accent: "#c9a96a", accent2: "#2a241b", font: "elegant", radius: "none", button: "outline" } },
  { id: "gallery", name: "Galerie", mood: "Foto zuerst, dunkel, große Kacheln", header: "hero", nav: "pills", heading: "plain", items: "masonry", texture: "none",
    design: { preset: "midnight", bg: "#0d0d0f", surface: "#18181c", text: "#f5f5f6", muted: "#9b9ba4", accent: "#ffffff", accent2: "#26262d", font: "grotesk", radius: "lg" } },
  { id: "bento", name: "Bento", mood: "Kachel-Raster mit Infos auf einen Blick", header: "bento", nav: "pills", heading: "plain", items: "bento", texture: "none",
    design: { preset: "studio", bg: "#eeedea", surface: "#ffffff", text: "#141414", muted: "#6d6c67", accent: "#ff5a1f", accent2: "#f6e7dc", font: "grotesk", radius: "xl" } },
  { id: "chalk", name: "Kreide", mood: "Tafel-Look mit Handschrift", header: "frame", nav: "underline", heading: "script", items: "leader", texture: "chalk",
    design: { preset: "slate", bg: "#1d2522", surface: "#243029", text: "#f2f1ea", muted: "#b9c0b6", accent: "#f2d16b", accent2: "#2c3a33", font: "script", radius: "sm" } },
  { id: "swiss", name: "Swiss", mood: "Strenges Raster, große Ziffern, Rot", header: "split", nav: "numbered", heading: "index", items: "pricecol", texture: "none",
    design: { preset: "studio", bg: "#f5f5f2", surface: "#ffffff", text: "#111111", muted: "#6b6b6b", accent: "#e1251b", accent2: "#ececea", font: "modern", radius: "none" } },
  { id: "neon", name: "Neon", mood: "Nacht, Leuchtfarben, Bar-Stimmung", header: "neon", nav: "glass", heading: "glow", items: "row", texture: "neon",
    design: { preset: "neon", bg: "#07060c", surface: "#120f1d", text: "#f6f3ff", muted: "#a29dbb", accent: "#ff3fa4", accent2: "#3df5ff", font: "grotesk", radius: "lg" } },
  { id: "paper", name: "Speisekarte", mood: "Klassische gedruckte Karte im Rahmen", header: "frame", nav: "underline", heading: "lines", items: "leader", texture: "paper",
    design: { preset: "latte", bg: "#e9e2d4", surface: "#fbf7ee", text: "#2a231b", muted: "#7c6f5f", accent: "#8a3b26", accent2: "#e6dcc8", font: "classic", radius: "sm" } },
  { id: "story", name: "Story", mood: "Großes Titelbild, Kategorien zum Wischen", header: "hero", nav: "pills", heading: "plain", items: "carousel", texture: "none",
    design: { preset: "midnight", bg: "#0e0e10", surface: "#1a1a1e", text: "#f5f5f6", muted: "#9d9da6", accent: "#ffcf40", accent2: "#2a2a30", font: "modern", radius: "lg" } },
  { id: "mono", name: "Mono", mood: "Minimal, viel Weißraum, Monospace-Preise", header: "minimal", nav: "underline", heading: "plain", items: "mono", texture: "none",
    design: { preset: "nordic", bg: "#fafaf8", surface: "#ffffff", text: "#161616", muted: "#7b7b78", accent: "#161616", accent2: "#ededea", font: "modern", radius: "none" } },
  { id: "sunset", name: "Sunset", mood: "Warmer Verlauf, runde Karten mit Fotos", header: "gradient", nav: "pills", heading: "plain", items: "grid", texture: "none",
    design: { preset: "peach", bg: "#fff6f1", surface: "#ffffff", text: "#2d1813", muted: "#8a685f", accent: "#ff6a3d", accent2: "#ff3d7f", font: "grotesk", radius: "xl" } },
  { id: "terrazzo", name: "Terrazzo", mood: "Pastell, verspielt, weiche Formen", header: "below", nav: "pills", heading: "serif-italic", items: "row", texture: "terrazzo",
    design: { preset: "lavender", bg: "#f6f1ea", surface: "#fffdf9", text: "#2b2338", muted: "#7a7088", accent: "#6d4fd8", accent2: "#f3c9b8", font: "editorial", radius: "xl" } },
  { id: "bistro", name: "Bistro", mood: "Große Preise in eigener Spalte", header: "editorial", nav: "underline", heading: "serif-italic", items: "pricecol", texture: "grain",
    design: { preset: "espresso", bg: "#191310", surface: "#231b16", text: "#f4eadf", muted: "#b6a493", accent: "#e0a868", accent2: "#33261e", font: "editorial", radius: "md" } },
  { id: "polaroid", name: "Polaroid", mood: "Fotos als schräge Sofortbilder", header: "below", nav: "pills", heading: "script", items: "polaroid", texture: "dots",
    design: { preset: "studio", bg: "#f2efe9", surface: "#ffffff", text: "#1b1b1b", muted: "#6f6c66", accent: "#1b1b1b", accent2: "#e7e2d8", font: "script", radius: "sm" } },
  { id: "ticket", name: "Ticket", mood: "Gerichte als Coupons mit Perforation", header: "brutal", nav: "boxed", heading: "tag", items: "ticket", texture: "none",
    design: { preset: "citrus", bg: "#fff4d8", surface: "#ffffff", text: "#1c1a14", muted: "#6f6a55", accent: "#ff5b14", accent2: "#ffe39a", font: "bold", radius: "md" } },
  { id: "emerald", name: "Smaragd", mood: "Tiefes Grün und Gold, ruhig und edel", header: "monogram", nav: "underline", heading: "lines", items: "centered", texture: "grain",
    design: { preset: "bordeaux", bg: "#0f241d", surface: "#143027", text: "#f1ead9", muted: "#a9b5a6", accent: "#d4b46e", accent2: "#1c3b31", font: "elegant", radius: "sm", button: "outline" } },
  { id: "fresh", name: "Fresh", mood: "Hell, frisch, runde Fotos", header: "below", nav: "pills", heading: "plain", items: "circle", texture: "none",
    design: { preset: "peach", bg: "#f7f8fb", surface: "#ffffff", text: "#1a1d24", muted: "#6a7180", accent: "#ff5a3c", accent2: "#ffe2d9", font: "grotesk", radius: "xl" } },
  { id: "brutal", name: "Brutal", mood: "Dicke Linien, harte Schatten, laut", header: "brutal", nav: "brutal", heading: "tag", items: "brutal", texture: "none",
    design: { preset: "citrus", bg: "#f4f0e6", surface: "#ffffff", text: "#0d0d0d", muted: "#3d3d3d", accent: "#ffd400", accent2: "#ff4d8d", font: "grotesk", radius: "sm" } },
  { id: "glass", name: "Glas", mood: "Farbverlauf mit gläsernen Karten", header: "gradient", nav: "glass", heading: "plain", items: "glass", texture: "mesh",
    design: { preset: "lavender", bg: "#16112b", surface: "#241d40", text: "#ffffff", muted: "#c7c0e2", accent: "#9b7bff", accent2: "#ff7ac6", font: "modern", radius: "xl" } },
  { id: "index", name: "Index", mood: "Große Kapitel-Nummern, klare Struktur", header: "split", nav: "numbered", heading: "index", items: "row", texture: "none",
    design: { preset: "ocean", bg: "#f1f4f7", surface: "#ffffff", text: "#0f1d2b", muted: "#5d6f82", accent: "#1d4ed8", accent2: "#dce5f5", font: "grotesk", radius: "md" } },
];

export function menuTemplate(id: unknown): MenuTemplate | null {
  return MENU_TEMPLATES.find((t) => t.id === id) ?? null;
}

/** Content used when the owner has not entered dishes yet (template previews). */
export const SAMPLE_MENU = {
  name: "Maison Lumière",
  subtitle: "Saisonale Küche · Wein · Kaffee",
  hours: "Di–Sa 12–23 Uhr\nSo 10–16 Uhr",
  phone: "0201 123456",
  address: "Rüttenscheider Str. 12, Essen",
  sections: [
    { title: "Zum Start", note: "", items: [
      { name: "Burrata", description: "Tomaten, Basilikum, Olivenöl", price: "12,00", tags: "G", image: "", variants: [], badges: ["beliebt"], soldOut: false },
      { name: "Focaccia", description: "Rosmarin, Meersalz", price: "5,50", tags: "A", image: "", variants: [], badges: ["vegan"], soldOut: false },
    ] },
    { title: "Hauptgerichte", note: "", items: [
      { name: "Risotto", description: "Steinpilze, Parmesan, Thymian", price: "19,00", tags: "G", image: "", variants: [], badges: ["hausgemacht"], soldOut: false },
      { name: "Wolfsbarsch", description: "Fenchel, Zitrone, Kapern", price: "26,00", tags: "D", image: "", variants: [], badges: ["neu"], soldOut: false },
      { name: "Pasta al Limone", description: "Zitrone, Pecorino, Pfeffer", price: "", tags: "A, C, G", image: "", variants: [{ label: "Klein", price: "11,00" }, { label: "Groß", price: "15,00" }], badges: [], soldOut: false },
    ] },
    { title: "Dessert", note: "", items: [
      { name: "Tiramisu", description: "Mascarpone, Espresso", price: "8,50", tags: "A, C, G", image: "", variants: [], badges: ["beliebt"], soldOut: false },
    ] },
  ],
};
