import type { CodeTypeId, MenuItemData, MenuSectionData } from "@/lib/codes/types";
import { menuTemplate } from "@/lib/menu-templates";
import { PAGE_LOOKS } from "@/lib/page-design";
import { DEMO_PAGES, PHOTOS } from "@/lib/samples";

/**
 * Ready-made starting points: a complete page plus a matching QR design.
 * `preview` carries demo photos for the cards; `content` is what the owner
 * gets when picking it (same texts, no photos: they add their own).
 */
export type StarterCategory = "gastro" | "business" | "promo";
export const STARTER_CATEGORIES: { id: StarterCategory; label: string }[] = [
  { id: "gastro", label: "Gastronomie" },
  { id: "business", label: "Geschäft & Kontakt" },
  { id: "promo", label: "Aktionen & Events" },
];

export interface Starter {
  id: string;
  name: string;
  hint: string;
  icon: string;
  type: CodeTypeId;
  category: StarterCategory;
  /** QR style preset */
  preset: string;
  preview: Record<string, unknown>;
  content: Record<string, unknown>;
}

const it = (name: string, description: string, price: string, image = "", badges: MenuItemData["badges"] = [], extra: Partial<MenuItemData> = {}): MenuItemData => ({
  name, description, price, image, badges, tags: "", variants: [], soldOut: false, ...extra,
});
const sec = (title: string, items: MenuItemData[], note = "", layout: MenuSectionData["layout"] = "auto"): MenuSectionData => ({ title, note, layout, items });
const sizes = (a: string, b: string) => ({ variants: [{ label: "Ø 26 cm", price: a }, { label: "Ø 32 cm", price: b }] });

/** Removes every photo (cover, logo, dishes, promos, gallery) so the owner starts clean. */
function withoutPhotos(c: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...c, cover: "", logo: "", avatar: "", photo: "", gallery: [] };
  for (const k of ["phone", "whatsapp", "mobile", "email", "address", "street", "city", "website"]) if (k in out) out[k] = "";
  if (Array.isArray(c.sections)) out.sections = (c.sections as MenuSectionData[]).map((s) => ({ ...s, items: s.items.map((i) => ({ ...i, image: "" })) }));
  if (Array.isArray(c.promos)) out.promos = (c.promos as { image: string }[]).map((p) => ({ ...p, image: "" }));
  if (Array.isArray(c.options)) out.options = (c.options as { image: string }[]).map((p) => ({ ...p, image: "" }));
  return out;
}

const BASE_MENU = { phone: "02362 123 45", whatsapp: "+49 170 1234567", address: "Lippestraße 12, 46282 Dorsten", footer: "Allergene und Zusatzstoffe erfragen Sie bitte beim Personal.", rating: "4,8", ratingCount: "120", delivery: "30–45 Min", pickup: "15 Min" };

function menu(id: string, name: string, hint: string, icon: string, template: string, preset: string, c: Record<string, unknown>): Starter {
  const t = menuTemplate(template);
  const preview = { ...BASE_MENU, ...c, template, design: t?.design };
  return { id, name, hint, icon, type: "menu", category: "gastro", preset, preview, content: withoutPhotos(preview) };
}

function page(id: string, name: string, hint: string, icon: string, type: CodeTypeId, category: StarterCategory, look: string, preset: string, extra: Record<string, unknown> = {}): Starter {
  const design = PAGE_LOOKS.find((l) => l.id === look)?.design;
  const preview = { ...(DEMO_PAGES[type] ?? {}), ...extra, design };
  return { id, name, hint, icon, type, category, preset, preview, content: withoutPhotos(preview) };
}

export const STARTERS: Starter[] = [
  menu("restaurant", "Restaurant & Imbiss", "Hell, rot, wie eine Liefer-App", "UtensilsCrossed", "feuer", "granat", {
    name: "Dein Restaurant", subtitle: "Burger · Pizza · Pasta", cover: PHOTOS.restaurant, hours: "Mo–So 11–22 Uhr",
    promos: [{ kicker: "Mo – Fr · 11 – 15 Uhr", title: "Mittagstisch", text: "Hauptgericht und ein Getränk.", tag: "9,90 €", image: PHOTOS.pasta }],
    sections: [
      sec("Burger", [it("Smash Double", "Zwei Patties, Cheddar, Haussoße", "13,90", PHOTOS.burger, ["beliebt"]), it("Classic Cheese", "Rind, Cheddar, Tomate, Salat", "11,90", PHOTOS.burger2)]),
      sec("Pizza", [it("Margherita", "Tomate, Mozzarella, Basilikum", "", PHOTOS.pizza2, ["vegetarisch"], sizes("8,90", "11,90")), it("Pepperoni", "Scharfe Salami", "", PHOTOS.pizza, ["beliebt"], sizes("10,90", "13,90"))], "", "grid"),
      sec("Getränke", [it("Cola", "0,33 l", "2,90"), it("Limonade", "Hausgemacht", "4,50")]),
    ],
  }),
  menu("doener", "Döner & Grill", "Granatrot auf Creme, kräftig", "Flame", "granat", "granat", {
    name: "Dein Grill", subtitle: "Döner · Dürüm · Grillteller", cover: PHOTOS.spread, hours: "Mo–So 11–23 Uhr",
    promos: [{ kicker: "Jeden Mittwoch", title: "Döner-Tag", text: "Jeder Döner im Brot zum Sonderpreis.", tag: "nur 5 €", image: PHOTOS.steak }],
    sections: [
      sec("Döner", [it("Döner im Brot", "Kalbfleisch, Salat, Soße nach Wahl", "7,50", PHOTOS.steak, ["beliebt"]), it("Dürüm", "Im Yufka gerollt", "8,50", PHOTOS.spread), it("Döner-Teller", "Mit Pommes oder Reis", "", PHOTOS.salad, [], { variants: [{ label: "Normal", price: "12,50" }, { label: "Groß", price: "14,50" }] })]),
      sec("Beilagen", [it("Pommes", "Mit Ketchup oder Mayo", "3,50", PHOTOS.fries), it("Salat", "Gemischt", "4,50", PHOTOS.bowl, ["vegan"])]),
      sec("Getränke", [it("Ayran", "0,25 l", "2,00"), it("Cola", "0,33 l", "2,50")]),
    ],
  }),
  menu("pizzeria", "Pizzeria & Trattoria", "Terracotta, Serifen, italienisch", "Pizza", "trattoria", "classic", {
    name: "Trattoria da Te", subtitle: "Pizza aus dem Steinofen · Pasta fresca", cover: PHOTOS.pizza, hours: "Di–So 12–22:30 Uhr\nMo Ruhetag",
    sections: [
      sec("Pizza", [it("Margherita", "San-Marzano, Fior di Latte", "", PHOTOS.pizza2, ["vegetarisch"], sizes("8,50", "11,50")), it("Diavola", "Scharfe Salami, Chili", "", PHOTOS.pizza, ["scharf"], sizes("10,50", "13,50"))], "48 Stunden gereifter Teig", "grid"),
      sec("Pasta", [it("Spaghetti Pomodoro", "Tomate, Basilikum", "9,50", PHOTOS.pasta, ["vegan"]), it("Risotto ai Funghi", "Steinpilze, Parmesan", "13,90", PHOTOS.risotto)]),
      sec("Dolci", [it("Tiramisu", "Hausgemacht", "6,50", PHOTOS.tiramisu, ["hausgemacht"])], "", "cards"),
    ],
  }),
  menu("cafe", "Café & Bäckerei", "Braun und Creme, warm, Serifen", "Coffee", "kaffee", "bordeaux", {
    name: "Dein Café", subtitle: "Kaffee · Frühstück · Kuchen", cover: PHOTOS.latte, hours: "Mo–Fr 8–18 Uhr\nSa–So 9–18 Uhr",
    sections: [
      sec("Kaffee", [it("Cappuccino", "Doppelter Espresso, Milchschaum", "3,80", PHOTOS.coffee, ["beliebt"]), it("Flat White", "", "4,20", PHOTOS.latte)]),
      sec("Frühstück", [it("Pancakes", "Ahornsirup, Beeren", "8,90", PHOTOS.pancakes, ["vegetarisch"]), it("Avocado-Bowl", "Ei, Sprossen, Brot", "10,50", PHOTOS.bowl)]),
      sec("Kuchen", [it("Schokotorte", "Jeden Tag frisch", "4,50", PHOTOS.cake, ["hausgemacht"]), it("Tiramisu", "", "5,20", PHOTOS.tiramisu)], "", "cards"),
    ],
  }),
  menu("steak", "Steakhouse & Bar", "Schwarz und Gold, edel", "Wine", "gold", "gold", {
    name: "Dein Steakhouse", subtitle: "Dry Aged · Wein · Cocktails", cover: PHOTOS.restaurant2, hours: "Di–Sa 17–23 Uhr",
    sections: [
      sec("Steaks", [it("Rib-Eye 300 g", "Dry Aged, Kräuterbutter", "34,00", PHOTOS.steak, ["beliebt"]), it("Lachs", "Fenchel, Zitrone", "24,00", PHOTOS.fish)]),
      sec("Bar", [it("Old Fashioned", "Bourbon, Bitter", "11,00", PHOTOS.cocktail), it("Hauswein", "Rot oder weiß · 0,2 l", "6,50")]),
    ],
  }),
  menu("sushi", "Sushi & Poke", "Klares Blau, frisch", "Fish", "meer", "marine", {
    name: "Dein Sushi", subtitle: "Sushi · Poke · Bowls", cover: PHOTOS.sushi, hours: "Mo–So 12–22 Uhr",
    sections: [
      sec("Sushi", [it("Lachs Nigiri", "2 Stück", "4,90", PHOTOS.sushi, ["beliebt"]), it("California Roll", "8 Stück", "8,90", PHOTOS.fish)], "", "grid"),
      sec("Bowls", [it("Poke Lachs", "Avocado, Edamame, Reis", "12,90", PHOTOS.bowl), it("Veggie Bowl", "Tofu, Mango", "11,50", PHOTOS.salad, ["vegan"])]),
    ],
  }),
  menu("burger", "Burger & Smash", "Schwarz und Gelb, laut", "Sandwich", "street", "lime-night", {
    name: "Smash Club", subtitle: "Smash Burger · Fries · Shakes", cover: PHOTOS.burger, hours: "Mo–So 12–23 Uhr",
    sections: [
      sec("Burger", [it("Double Smash", "Zwei Patties, Cheese", "12,90", PHOTOS.burger, ["beliebt"]), it("Classic", "Rind, Salat, Tomate", "10,90", PHOTOS.burger2)]),
      sec("Sides", [it("Fries", "Mit Dip", "4,50", PHOTOS.fries)]),
    ],
  }),
  menu("dessert", "Desserts & Eis", "Rosa, verspielt, süß", "IceCreamCone", "rose", "bubble", {
    name: "Sweet Spot", subtitle: "Kuchen · Waffeln · Eis", cover: PHOTOS.cake, hours: "Mo–So 13–22 Uhr",
    sections: [
      sec("Kuchen", [it("Schokotorte", "Dunkle Schokolade", "5,50", PHOTOS.cake, ["beliebt"]), it("Tiramisu", "Hausgemacht", "6,00", PHOTOS.tiramisu)], "", "cards"),
      sec("Frühstück", [it("Pancakes", "Beeren, Sirup", "8,50", PHOTOS.pancakes)]),
    ],
  }),
  page("handwerk", "Handwerk & Service", "Mini-Website mit Leistungen und Galerie", "Hammer", "site", "business", "terracotta", "classic"),
  page("beauty", "Beauty & Friseur", "Mini-Website, sanft und hell", "Sparkles", "site", "business", "rose", "bubble", {
    name: "Studio Belle", tagline: "Hair · Nails · Lashes", cover: PHOTOS.salon, services: "Schnitt & Styling\nColoration\nManiküre\nWimpern", gallery: [PHOTOS.salon, PHOTOS.shop],
    about: "Dein Ort zum Wohlfühlen. Termine auch kurzfristig per WhatsApp.", reviews: [{ name: "Sarah K.", when: "vor 2 Wochen", stars: 5, text: "Bestes Studio der Stadt, ich gehe nirgendwo anders mehr hin!" }],
  }),
  page("visitenkarte", "Digitale Visitenkarte", "Kontakt speichern mit einem Scan", "Contact", "vcard", "business", "ocean", "marine"),
  page("linkinbio", "Link in Bio", "Alle Profile auf einer Seite", "Layers", "links", "business", "night", "lime-night"),
  page("bewertung", "Google-Bewertung", "Mehr Sterne mit einem Scan", "Star", "review", "promo", "feuer", "qlick"),
  page("gutschein", "Gutschein", "Rabatt mit Code zum Aufdecken", "TicketPercent", "coupon", "promo", "citrus", "ticket"),
  page("event", "Event & Party", "Countdown, Anmeldung, Kalender", "CalendarDays", "event", "promo", "gold", "gold"),
];
