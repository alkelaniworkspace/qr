import type { StoredDesign } from "@/lib/page-design";

/**
 * Menu page templates. The first ten are "Showcase" templates: a complete
 * restaurant page (cover, actions, promos, popular dishes, reviews, hours,
 * map) rendered by menu-showcase.tsx. The others are compositions of the
 * classic engine. Each one is a complete composition (not just a
 * colour change): its own header, category navigation, dish layout, section
 * headings and texture. The `design` part seeds colours and fonts, which the
 * owner can still fine-tune in the design editor.
 */

export type HeaderKind = "below" | "editorial" | "frame" | "bento" | "hero" | "gradient" | "split" | "minimal" | "monogram" | "shop";
export type NavKind = "underline" | "pills" | "numbered" | "boxed" | "chips";
export type HeadingKind = "plain" | "numbered" | "lines" | "index" | "serif-italic" | "accent";
export type ItemKind = "row" | "leader" | "centered" | "grid" | "masonry" | "carousel" | "circle" | "pricecol" | "bento" | "mono" | "shop" | "shoplist";
export type Texture = "none" | "paper" | "grain";

export interface MenuTemplate {
  id: string;
  /** "showcase" = the full restaurant page (cover, actions, promos, reviews, hours, map). */
  engine?: "showcase";
  /** Showcase header: profile card over the cover, or the name set large on the full photo. */
  hero?: "card" | "full";
  name: string;
  mood: string;
  header: HeaderKind;
  nav: NavKind;
  heading: HeadingKind;
  items: ItemKind;
  texture: Texture;
  design: StoredDesign;
}

/*
 * Principles: one strong typeface per template, lots of white space, one
 * accent colour, food photos as the hero. No decoration for its own sake.
 */
const SC = { engine: "showcase" as const, header: "below" as const, nav: "chips" as const, heading: "plain" as const, items: "row" as const, texture: "none" as const };

export const MENU_TEMPLATES: MenuTemplate[] = [
  { ...SC, id: "feuer", hero: "card", name: "Feuer", mood: "Warm und hell, kräftiges Rot, wie eine Liefer-App",
    design: { preset: "studio", bg: "#f8f4ef", surface: "#ffffff", text: "#1c1412", muted: "#8b807a", accent: "#e3242b", accent2: "#fff1e3", font: "grotesk", radius: "xl" } },
  { ...SC, id: "glut", hero: "full", name: "Glut", mood: "Dunkel, Glut-Orange, großes Titelfoto",
    design: { preset: "midnight", bg: "#0f0d0c", surface: "#1b1817", text: "#f7f2ee", muted: "#9a908a", accent: "#ff7a1a", accent2: "#2a1d17", font: "grotesk", radius: "xl" } },
  { ...SC, id: "granat", hero: "card", name: "Granatapfel", mood: "Döner, Grill, Orient: Granatrot auf Creme",
    design: { preset: "terracotta", bg: "#f6efe4", surface: "#fffaf1", text: "#24170e", muted: "#7f6a55", accent: "#c8102e", accent2: "#f6e3d0", font: "bold", radius: "xl" } },
  { ...SC, id: "trattoria", hero: "card", name: "Trattoria", mood: "Italienisch, Terracotta, klassische Serifen",
    design: { preset: "terracotta", bg: "#f4efe6", surface: "#fffcf6", text: "#2a1d14", muted: "#85735f", accent: "#b0391e", accent2: "#efe2cf", font: "classic", radius: "lg" } },
  { ...SC, id: "gold", hero: "full", name: "Schwarz & Gold", mood: "Fine Dining, Steakhouse, Bar",
    design: { preset: "bordeaux", bg: "#0b0b0c", surface: "#161617", text: "#f5efe3", muted: "#a39e93", accent: "#d4af6a", accent2: "#221d15", font: "script", radius: "lg" } },
  { ...SC, id: "street", hero: "full", name: "Street", mood: "Burger, Smash, Nacht: Schwarz und Gelb",
    design: { preset: "neon", bg: "#111111", surface: "#1c1c1c", text: "#ffffff", muted: "#9b9b9b", accent: "#ffcc00", accent2: "#262626", font: "bold", radius: "xl" } },
  { ...SC, id: "meer", hero: "card", name: "Meer", mood: "Sushi, Fisch, Poke: klares Blau",
    design: { preset: "ocean", bg: "#f2f6f8", surface: "#ffffff", text: "#0e1d2a", muted: "#5f7180", accent: "#0f6fb8", accent2: "#e3eef6", font: "modern", radius: "xl" } },
  { ...SC, id: "kaffee", hero: "card", name: "Kaffeehaus", mood: "Café, Bäckerei, Frühstück: Braun und Creme",
    design: { preset: "latte", bg: "#f3ece3", surface: "#fffaf4", text: "#2f241d", muted: "#85715f", accent: "#7a4a2b", accent2: "#ead9c6", font: "editorial", radius: "xl" } },
  { ...SC, id: "rose", hero: "card", name: "Rosé", mood: "Desserts, Bubble Tea, Eis: zartes Rosa",
    design: { preset: "peach", bg: "#fdf3f4", surface: "#ffffff", text: "#2b1a1f", muted: "#8d6f77", accent: "#e0457b", accent2: "#fde1e8", font: "grotesk", radius: "xl" } },
  { ...SC, id: "lime", hero: "full", name: "Lime Night", mood: "Schwarz mit Limette, modern und laut",
    design: { preset: "midnight", bg: "#0c0c0c", surface: "#171717", text: "#ffffff", muted: "#9a9a9a", accent: "#c8ff2e", accent2: "#222222", font: "grotesk", radius: "xl" } },
  { id: "classic", name: "Klassik Rot", mood: "Weiß, kräftige Schrift, Fotokarten im Raster", header: "shop", nav: "chips", heading: "accent", items: "shop", texture: "none",
    design: { preset: "studio", bg: "#ffffff", surface: "#ffffff", text: "#111111", muted: "#6b6b6b", accent: "#e3120b", accent2: "#f6f4f1", font: "bold", radius: "lg" } },
  { id: "night", name: "Nacht", mood: "Schwarz mit Gelb, Fotokarten", header: "shop", nav: "chips", heading: "accent", items: "shop", texture: "none",
    design: { preset: "neon", bg: "#0c0c0c", surface: "#161616", text: "#ffffff", muted: "#9a9a9a", accent: "#ffc72c", accent2: "#1f1f1f", font: "bold", radius: "lg" } },
  { id: "express", name: "Express", mood: "Wie eine Liefer-App: Foto links, Preis, Plus", header: "shop", nav: "chips", heading: "plain", items: "shoplist", texture: "none",
    design: { preset: "studio", bg: "#f6f6f4", surface: "#ffffff", text: "#121212", muted: "#6f6f6b", accent: "#ff4f00", accent2: "#f1efeb", font: "grotesk", radius: "lg" } },
  { id: "pastel", name: "Pastell", mood: "Weiche Farbflächen hinter jedem Gericht", header: "shop", nav: "chips", heading: "accent", items: "shop", texture: "none",
    design: { preset: "peach", bg: "#fffaf6", surface: "#ffffff", text: "#2a1d18", muted: "#85716a", accent: "#f2542d", accent2: "#fde8dc", font: "grotesk", radius: "xl" } },
  { id: "kraft", name: "Kraftpapier", mood: "Warm, Display-Serif, Fotokarten", header: "shop", nav: "chips", heading: "accent", items: "shop", texture: "none",
    design: { preset: "latte", bg: "#f4eee6", surface: "#fffcf8", text: "#2b2019", muted: "#7f6e61", accent: "#9c4a1f", accent2: "#ece2d6", font: "script", radius: "md" } },
  { id: "editorial", name: "Editorial", mood: "Wie ein Magazin: große Serifen, nummerierte Kapitel", header: "editorial", nav: "numbered", heading: "numbered", items: "leader", texture: "none",
    design: { preset: "terracotta", bg: "#f6f2ec", surface: "#fffdf9", text: "#1d1a16", muted: "#776d61", accent: "#b4471f", accent2: "#e9e1d5", font: "classic", radius: "sm" } },
  { id: "noir", name: "Noir", mood: "Schwarz und Gold, zentriert, Fine Dining", header: "monogram", nav: "underline", heading: "lines", items: "centered", texture: "none",
    design: { preset: "bordeaux", bg: "#0b0a09", surface: "#141210", text: "#efe6d6", muted: "#a59a87", accent: "#c9a96a", accent2: "#2a241b", font: "elegant", radius: "none", button: "outline" } },
  { id: "gallery", name: "Galerie", mood: "Foto zuerst, dunkel, große Kacheln", header: "hero", nav: "pills", heading: "plain", items: "masonry", texture: "none",
    design: { preset: "midnight", bg: "#0d0d0f", surface: "#18181c", text: "#f5f5f6", muted: "#9b9ba4", accent: "#ffffff", accent2: "#26262d", font: "grotesk", radius: "lg" } },
  { id: "bento", name: "Bento", mood: "Infos auf einen Blick, Kacheln", header: "bento", nav: "pills", heading: "plain", items: "bento", texture: "none",
    design: { preset: "studio", bg: "#efeeeb", surface: "#ffffff", text: "#141414", muted: "#6d6c67", accent: "#ff5a1f", accent2: "#f6e7dc", font: "grotesk", radius: "xl" } },
  { id: "swiss", name: "Swiss", mood: "Strenges Raster, große Ziffern, Rot", header: "split", nav: "numbered", heading: "index", items: "pricecol", texture: "none",
    design: { preset: "studio", bg: "#f5f5f2", surface: "#ffffff", text: "#111111", muted: "#6b6b6b", accent: "#e1251b", accent2: "#ececea", font: "modern", radius: "none" } },
  { id: "story", name: "Story", mood: "Großes Titelbild, Gerichte zum Wischen", header: "hero", nav: "pills", heading: "plain", items: "carousel", texture: "none",
    design: { preset: "midnight", bg: "#0e0e10", surface: "#1a1a1e", text: "#f5f5f6", muted: "#9d9da6", accent: "#ffcf40", accent2: "#2a2a30", font: "bold", radius: "lg" } },
  { id: "mono", name: "Mono", mood: "Minimal, viel Weißraum", header: "minimal", nav: "underline", heading: "plain", items: "mono", texture: "none",
    design: { preset: "nordic", bg: "#fafaf8", surface: "#ffffff", text: "#161616", muted: "#7b7b78", accent: "#161616", accent2: "#ededea", font: "modern", radius: "none" } },
  { id: "sunset", name: "Sunset", mood: "Warmer Verlauf, runde Fotokarten", header: "gradient", nav: "pills", heading: "plain", items: "grid", texture: "none",
    design: { preset: "peach", bg: "#fff6f1", surface: "#ffffff", text: "#2d1813", muted: "#8a685f", accent: "#ff6a3d", accent2: "#ff3d7f", font: "grotesk", radius: "xl" } },
  { id: "bistro", name: "Bistro", mood: "Dunkel, Serif, Preise in eigener Spalte", header: "editorial", nav: "underline", heading: "serif-italic", items: "pricecol", texture: "none",
    design: { preset: "espresso", bg: "#191310", surface: "#231b16", text: "#f4eadf", muted: "#b6a493", accent: "#e0a868", accent2: "#33261e", font: "editorial", radius: "md" } },
  { id: "index", name: "Index", mood: "Große Kapitel-Nummern, klare Struktur", header: "split", nav: "numbered", heading: "index", items: "row", texture: "none",
    design: { preset: "ocean", bg: "#f1f4f7", surface: "#ffffff", text: "#0f1d2b", muted: "#5d6f82", accent: "#1d4ed8", accent2: "#dce5f5", font: "grotesk", radius: "md" } },
  { id: "marine", name: "Marine", mood: "Tiefes Blau und Gold, ruhig, edel", header: "monogram", nav: "underline", heading: "lines", items: "centered", texture: "none",
    design: { preset: "bordeaux", bg: "#0d1626", surface: "#132036", text: "#f1ead9", muted: "#a4adbf", accent: "#d4b46e", accent2: "#1b2a44", font: "script", radius: "sm", button: "outline" } },
  { id: "fresh", name: "Fresh", mood: "Hell, runde Fotos, freundlich", header: "below", nav: "chips", heading: "plain", items: "circle", texture: "none",
    design: { preset: "peach", bg: "#f7f8fb", surface: "#ffffff", text: "#1a1d24", muted: "#6a7180", accent: "#ff5a3c", accent2: "#ffe2d9", font: "grotesk", radius: "xl" } },
  { id: "paper", name: "Speisekarte", mood: "Klassische gedruckte Karte im Rahmen", header: "frame", nav: "underline", heading: "lines", items: "leader", texture: "none",
    design: { preset: "latte", bg: "#ece6da", surface: "#fbf8f1", text: "#2a231b", muted: "#7c6f5f", accent: "#8a3b26", accent2: "#e6dcc8", font: "classic", radius: "sm" } },
  { id: "salon", name: "Salon", mood: "Display-Serif, zentriert, viel Luft", header: "frame", nav: "underline", heading: "serif-italic", items: "centered", texture: "none",
    design: { preset: "nordic", bg: "#f7f5f0", surface: "#ffffff", text: "#1c1b19", muted: "#77736b", accent: "#1c1b19", accent2: "#ebe7df", font: "script", radius: "none" } },
  { id: "graphite", name: "Graphit", mood: "Dunkelgrau, Liefer-App-Liste, Orange", header: "shop", nav: "chips", heading: "plain", items: "shoplist", texture: "none",
    design: { preset: "slate", bg: "#141518", surface: "#1d1f23", text: "#f3f4f6", muted: "#9ca0a8", accent: "#ff7a1a", accent2: "#26292e", font: "bold", radius: "lg" } },
];

/** Templates retired in the clean-up; pages that used them get the closest one. */
const RETIRED: Record<string, string> = { chalk: "paper", neon: "night", terrazzo: "pastel", polaroid: "pastel", ticket: "classic", brutal: "classic", glass: "graphite", emerald: "marine" };

export function menuTemplate(id: unknown): MenuTemplate | null {
  const key = typeof id === "string" ? (RETIRED[id] ?? id) : id;
  return MENU_TEMPLATES.find((t) => t.id === key) ?? null;
}

/** Content used when the owner has not entered dishes yet (template previews). */
export const SAMPLE_MENU = {
  name: "Maison Lumière",
  subtitle: "Saisonale Küche · Wein · Kaffee",
  hours: "Di–Sa 12–23 Uhr\nSo 10–16 Uhr",
  cover: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=80",
  rating: "4,8",
  ratingCount: "214",
  delivery: "30–45 Min",
  pickup: "15 Min",
  promos: [
    { kicker: "Di – Fr · 12 – 15 Uhr", title: "Mittagstisch", text: "Hauptgericht und ein Getränk", tag: "14,50 €", image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=800&q=80" },
    { kicker: "Jeden Sonntag", title: "Brunch", text: "Alles vom Buffet, Kaffee inklusive", tag: "24 €", image: "" },
  ],
  reviews: [
    { name: "Lena M.", when: "vor 2 Tagen", stars: 5, text: "Das Risotto war ein Traum, der Service herzlich. Wir kommen wieder!" },
    { name: "Jonas K.", when: "vor 1 Woche", stars: 5, text: "Schönes Ambiente und die beste Pasta in der Gegend." },
  ],
  phone: "0201 123456",
  address: "Rüttenscheider Str. 12, Essen",
  sections: [
    { title: "Zum Start", note: "", items: [
      { name: "Burrata", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80", description: "Tomaten, Basilikum, Olivenöl", price: "12,00", tags: "G", variants: [], badges: ["beliebt"], soldOut: false },
      { name: "Focaccia", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80", description: "Rosmarin, Meersalz", price: "5,50", tags: "A", variants: [], badges: ["vegan"], soldOut: false },
    ] },
    { title: "Hauptgerichte", note: "", items: [
      { name: "Risotto", image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=800&q=80", description: "Steinpilze, Parmesan, Thymian", price: "19,00", tags: "G", variants: [], badges: ["hausgemacht"], soldOut: false },
      { name: "Wolfsbarsch", image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80", description: "Fenchel, Zitrone, Kapern", price: "26,00", tags: "D", variants: [], badges: ["neu"], soldOut: false },
      { name: "Pasta al Limone", image: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&q=80", description: "Zitrone, Pecorino, Pfeffer", price: "", tags: "A, C, G", variants: [{ label: "Klein", price: "11,00" }, { label: "Groß", price: "15,00" }], badges: [], soldOut: false },
    ] },
    { title: "Dessert", note: "", items: [
      { name: "Tiramisu", image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&q=80", description: "Mascarpone, Espresso", price: "8,50", tags: "A, C, G", variants: [], badges: ["beliebt"], soldOut: false },
    ] },
  ],
};
