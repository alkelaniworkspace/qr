import type { CodeTypeId, MenuItemData, MenuSectionData } from "@/lib/codes/types";

/**
 * Demo content with photos, used ONLY for previews (template and look pickers,
 * starter cards). Picking a template never copies these photos into a page.
 * Photos are hot-linked from Unsplash (free licence); if one fails to load,
 * SmartImg shows the designed placeholder instead.
 */
export const U = (id: string, w = 900) => `https://images.unsplash.com/photo-${id}?w=${w}&q=75&auto=format&fit=crop`;

export const PHOTOS = {
  burger: U("1568901346375-23c9450c58cd"),
  burger2: U("1550547660-d9450f859349"),
  fries: U("1573080496219-bb080dd4f877"),
  pizza: U("1513104890138-7c749659a591"),
  pizza2: U("1565299624946-b28f40a0ae38"),
  pasta: U("1563379926898-05f4575a45d8"),
  risotto: U("1476124369491-e7addf5db371"),
  bowl: U("1546069901-ba9599a7e63c"),
  salad: U("1512621776951-a57141f2eefd"),
  fish: U("1467003909585-2f8a72700288"),
  steak: U("1600891964092-4316c288032e"),
  sushi: U("1579871494447-9811cf80d66c"),
  pancakes: U("1567620905732-2d1ec7ab7445"),
  coffee: U("1495474472287-4d71bcdd2085"),
  latte: U("1509042239860-f550ce710b93"),
  cake: U("1578985545062-69928b1d9587"),
  tiramisu: U("1571877227200-a0d98ea607e9"),
  cocktail: U("1514362545857-3bc16c4c7d1b"),
  spread: U("1504674900247-0877df9cc836", 1400),
  restaurant: U("1517248135467-4c7edcad34c4", 1400),
  restaurant2: U("1555396273-367ea4eb4db5", 1400),
  manPortrait: U("1507003211169-0a1dd7228f2d", 500),
  womanPortrait: U("1494790108377-be9c29b29330", 500),
  team: U("1522071820081-009f0129c71c", 1400),
  tools: U("1504148455328-c376907d081c", 1400),
  kitchen: U("1484154218962-a197022b5858", 1400),
  concert: U("1501281668745-f7f57925c3b4", 1400),
  party: U("1492684223066-81342ee5ff30", 1400),
  salon: U("1560066984-138dadb4c035", 1400),
  shop: U("1441986300917-64674bd600d8", 1400),
};

const it = (name: string, description: string, price: string, image = "", badges: MenuItemData["badges"] = [], extra: Partial<MenuItemData> = {}): MenuItemData => ({
  name, description, price, image, badges, tags: "", variants: [], soldOut: false, ...extra,
});
const sec = (title: string, items: MenuItemData[], note = "", layout: MenuSectionData["layout"] = "auto"): MenuSectionData => ({ title, note, layout, items });
const v = (a: string, b: string, pa: string, pb: string) => ({ variants: [{ label: a, price: pa }, { label: b, price: pb }] });

/** The full demo restaurant used in menu template previews. */
export const DEMO_MENU: Record<string, unknown> = {
  name: "Rocco's",
  subtitle: "Burger · Pizza · Pasta · seit 2009",
  cover: PHOTOS.restaurant,
  logo: "",
  phone: "02362 123 45",
  whatsapp: "+49 170 1234567",
  address: "Lippestraße 12, 46282 Dorsten",
  hours: "Mo–Do 11–22 Uhr\nFr–Sa 11–23:30 Uhr\nSo 12–22 Uhr",
  delivery: "30–45 Min",
  pickup: "15 Min · –10 %",
  rating: "4,8",
  ratingCount: "312",
  promos: [
    { kicker: "Jeden Dienstag", title: "Burger-Tag", text: "Der zweite Burger kostet die Hälfte.", tag: "2. Burger –50 %", image: PHOTOS.burger },
    { kicker: "Mo – Fr · 11 – 15 Uhr", title: "Mittagstisch", text: "Pizza nach Wahl und ein Getränk.", tag: "nur 9,90 €", image: PHOTOS.pizza },
  ],
  reviews: [
    { name: "Lena M.", when: "vor 2 Tagen", stars: 5, text: "Der Smash Burger ist unfassbar gut. Und superfreundlich!" },
    { name: "Murat K.", when: "vor 1 Woche", stars: 5, text: "Beste Pizza der Stadt, der Teig ist richtig luftig." },
  ],
  sections: [
    sec("Burger", [
      it("Smash Double", "Zwei Patties, Cheddar, Röstzwiebeln, Haussoße", "13,90", PHOTOS.burger, ["beliebt"]),
      it("Classic Cheese", "Rind, Cheddar, Tomate, Salat, Gurke", "11,90", PHOTOS.burger2, ["neu"]),
      it("Trüffel-Pommes", "Parmesan, Trüffelmayo", "5,90", PHOTOS.fries, ["vegetarisch"]),
    ], "180 g Rind, Brioche-Bun, dazu Pommes"),
    sec("Pizza", [
      it("Margherita", "Tomate, Fior di Latte, Basilikum", "", PHOTOS.pizza2, ["vegetarisch"], v("Ø 26 cm", "Ø 32 cm", "8,90", "11,90")),
      it("Pepperoni", "Scharfe Salami, Mozzarella", "", PHOTOS.pizza, ["beliebt"], v("Ø 26 cm", "Ø 32 cm", "10,90", "13,90")),
    ], "Steinofen, 48 Stunden gereifter Teig", "grid"),
    sec("Pasta & Bowls", [
      it("Spaghetti Pomodoro", "Tomate, Knoblauch, Basilikum", "9,50", PHOTOS.pasta, ["vegan"]),
      it("Risotto Funghi", "Steinpilze, Parmesan", "13,90", PHOTOS.risotto),
      it("Poke Bowl", "Lachs, Avocado, Edamame", "12,90", PHOTOS.bowl),
    ]),
    sec("Desserts", [
      it("Tiramisu", "Mascarpone, Espresso", "6,50", PHOTOS.tiramisu, ["hausgemacht"]),
      it("Schokotorte", "Dunkle Schokolade", "5,90", PHOTOS.cake),
    ], "Hausgemacht", "cards"),
    sec("Getränke", [it("Limonade", "Hausgemacht · 0,4 l", "4,50"), it("Cola", "0,33 l", "2,90"), it("Espresso", "", "2,40")]),
  ],
};

/** Demo content for every other page type (look picker and starters). */
export const DEMO_PAGES: Partial<Record<CodeTypeId, Record<string, unknown>>> = {
  site: {
    name: "Malerbetrieb Kaya", tagline: "Farbe, Putz und Fassade seit 2004", logo: "", cover: PHOTOS.kitchen,
    about: "Wir sind ein Familienbetrieb und machen Räume schöner. Sauber, pünktlich und zum Festpreis.",
    services: "Innenanstrich\nFassaden\nTapezieren\nLackierarbeiten", hours: "Mo–Fr 7–17 Uhr\nSa 8–12 Uhr",
    phone: "02362 98765", whatsapp: "+49 170 1234567", email: "info@kaya-maler.de", address: "Halterner Str. 40, 46284 Dorsten",
    rating: "4,9", ratingCount: "86", gallery: [PHOTOS.kitchen, PHOTOS.tools, PHOTOS.shop],
    reviews: [{ name: "Thomas R.", when: "vor 1 Monat", stars: 5, text: "Super saubere Arbeit, pünktlich und freundlich." }],
    links: [{ label: "Instagram", url: "https://instagram.com/" }],
  },
  links: {
    title: "Lena Hoffmann", bio: "Fotografin · Hochzeiten, Portraits, Food", avatar: PHOTOS.womanPortrait, cover: PHOTOS.spread,
    links: [{ label: "Termin buchen", url: "https://calendly.com/" }, { label: "Instagram", url: "https://instagram.com/" }, { label: "TikTok", url: "https://tiktok.com/" }, { label: "Portfolio", url: "https://example.com/" }],
  },
  vcard: {
    firstName: "Ahmad", lastName: "Kaya", title: "Geschäftsführer", company: "Kaya Bau GmbH", photo: PHOTOS.manPortrait, cover: PHOTOS.team,
    phone: "02362 123", mobile: "+49 170 1234567", email: "ahmad@kaya-bau.de", website: "https://kaya-bau.de", street: "Lippestraße 1", city: "46282 Dorsten",
  },
  review: { business: "Café Lumière", logo: "", cover: PHOTOS.latte, googleUrl: "https://google.com/", message: "" },
  coupon: { business: "Rocco's", discount: "-20 %", headline: "Auf deine nächste Bestellung", code: "ROCCO20", validUntil: "", url: "https://example.com", terms: "Einmal pro Person.", logo: "", cover: PHOTOS.pizza },
  event: { title: "Sommerfest am Kanal", start: "2027-06-12T18:00", end: "2027-06-12T23:00", location: "Kanalstraße 3, 46282 Dorsten", description: "Live-Musik, Streetfood und Drinks direkt am Wasser.", cover: PHOTOS.concert, url: "https://example.com" },
  pdf: { title: "Preisliste 2027", description: "Alle Leistungen und Preise auf einen Blick.", cover: "", file: { url: "https://example.com/preise.pdf", name: "Preisliste-2027.pdf" } },
  poll: { question: "Welches Gericht soll auf die neue Karte?", description: "", options: [{ label: "Trüffel-Burger", image: PHOTOS.burger }, { label: "Pizza Diavola", image: PHOTOS.pizza }, { label: "Poke Bowl", image: PHOTOS.bowl }], results: "always", multiple: false },
};
