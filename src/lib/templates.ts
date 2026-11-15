import type { CodeTypeId, MenuItemData, MenuSectionData } from "@/lib/codes/types";

/** Ready-made starting points: a full mini website plus a matching QR design. */
export interface Starter {
  id: string;
  name: string;
  hint: string;
  icon: string;
  type: CodeTypeId;
  preset: string;
  content: Record<string, unknown>;
}

const it = (name: string, price: string, description = "", extra: Partial<MenuItemData> = {}): MenuItemData => ({
  name, price, description, tags: "", image: "", variants: [], badges: [], soldOut: false, ...extra,
});
const sec = (title: string, items: MenuItemData[], note = ""): MenuSectionData => ({ title, note, items });

export const STARTERS: Starter[] = [
  {
    id: "imbiss",
    name: "Döner & Imbiss",
    hint: "Große Fotos, schnelle Preise",
    icon: "Flame",
    type: "menu",
    preset: "qlick",
    content: {
      name: "Dein Imbiss",
      subtitle: "Döner · Pizza · Schnitzel",
      logo: "", cover: "", phone: "", address: "", hours: "Mo–So 11–23 Uhr", footer: "Allergene und Zusatzstoffe erfragen Sie bitte beim Personal.",
      layout: "cards", theme: "light", accent: "#191919",
      sections: [
        sec("Döner", [
          it("Döner im Brot", "7,50", "Kalbfleisch, Salat, Tomaten, Zwiebeln, Soße nach Wahl", { tags: "A, G", badges: ["beliebt"] }),
          it("Dürüm", "8,50", "Im Yufka gerollt, mit Salat und Soße", { tags: "A, G" }),
          it("Döner Teller", "", "Mit Pommes oder Reis und Salat", { tags: "A, G", variants: [{ label: "Normal", price: "12,50" }, { label: "Groß", price: "14,50" }] }),
        ]),
        sec("Pizza", [
          it("Margherita", "", "Tomatensoße, Mozzarella", { tags: "A, G", badges: ["vegetarisch"], variants: [{ label: "Ø 26 cm", price: "8,90" }, { label: "Ø 32 cm", price: "11,90" }] }),
          it("Diavolo", "", "Scharfe Salami, Peperoni", { tags: "A, G", badges: ["scharf"], variants: [{ label: "Ø 26 cm", price: "9,90" }, { label: "Ø 32 cm", price: "12,90" }] }),
        ]),
        sec("Schnitzel", [it("Jägerschnitzel", "13,90", "Mit Pilzrahmsoße und Pommes", { tags: "A, C, G" }), it("Rigatoni al Forno", "11,50", "Überbacken mit Käse", { tags: "A, C, G" })]),
        sec("Getränke", [it("Cola 0,33 l", "2,50", "", { tags: "1, 9" }), it("Ayran", "2,00", "", { tags: "G" })]),
      ],
    },
  },
  {
    id: "restaurant",
    name: "Restaurant",
    hint: "Elegant, ruhig, hochwertig",
    icon: "UtensilsCrossed",
    type: "menu",
    preset: "classic",
    content: {
      name: "Dein Restaurant",
      subtitle: "Saisonale Küche",
      logo: "", cover: "", phone: "", address: "", hours: "Di–Sa 17–23 Uhr\nSo 12–21 Uhr", footer: "",
      layout: "elegant", theme: "dark", accent: "#dfded7",
      sections: [
        sec("Vorspeisen", [it("Burrata", "12,00", "Tomaten, Basilikum, Olivenöl", { tags: "G", badges: ["vegetarisch"] }), it("Carpaccio", "14,00", "Rind, Rucola, Parmesan", { tags: "G" })]),
        sec("Hauptgänge", [it("Rinderfilet", "34,00", "Kartoffel-Gratin, Jus", { tags: "G, L" }), it("Risotto", "21,00", "Steinpilze, Trüffel", { tags: "G", badges: ["hausgemacht"] })]),
        sec("Dessert", [it("Tiramisu", "9,00", "Nach Familienrezept", { tags: "A, C, G", badges: ["hausgemacht"] })]),
      ],
    },
  },
  {
    id: "cafe",
    name: "Café",
    hint: "Hell, freundlich, Galerie",
    icon: "Coffee",
    type: "menu",
    preset: "silver",
    content: {
      name: "Dein Café",
      subtitle: "Kaffee, Kuchen & Frühstück",
      logo: "", cover: "", phone: "", address: "", hours: "Mo–Fr 8–18 Uhr\nSa–So 9–18 Uhr", footer: "",
      layout: "grid", theme: "light", accent: "#6b4f3a",
      sections: [
        sec("Kaffee", [it("Cappuccino", "", "", { tags: "G", variants: [{ label: "Klein", price: "3,40" }, { label: "Groß", price: "4,20" }] }), it("Flat White", "3,90", "", { tags: "G" }), it("Hafer-Latte", "4,30", "", { badges: ["vegan"] })]),
        sec("Frühstück", [it("Avocado-Toast", "9,50", "Sauerteig, Ei, Chili", { tags: "A, C" }), it("Granola Bowl", "7,90", "Joghurt, Beeren, Honig", { tags: "G, H" })]),
        sec("Kuchen", [it("Käsekuchen", "4,20", "", { tags: "A, C, G", badges: ["hausgemacht"] }), it("Zimtschnecke", "3,50", "", { tags: "A, C, G", badges: ["beliebt"] })]),
      ],
    },
  },
  {
    id: "bar",
    name: "Bar & Lounge",
    hint: "Dunkel, edel, Drinks",
    icon: "Wine",
    type: "menu",
    preset: "lime-night",
    content: {
      name: "Deine Bar",
      subtitle: "Cocktails & Snacks",
      logo: "", cover: "", phone: "", address: "", hours: "Do–Sa ab 19 Uhr", footer: "Abgabe von Alkohol ab 18 Jahren.",
      layout: "list", theme: "dark", accent: "#bdfb04",
      sections: [
        sec("Signature", [it("Qlick Sour", "12,00", "Gin, Limette, Basilikum", { badges: ["neu"] }), it("Espresso Martini", "13,00", "Vodka, Espresso, Kaffeelikör")]),
        sec("Klassiker", [it("Negroni", "11,00", "Gin, Campari, Wermut", { tags: "O" }), it("Moscow Mule", "10,50", "Vodka, Ginger Beer, Limette")]),
        sec("Alkoholfrei", [it("Virgin Mojito", "7,50", "Minze, Limette, Soda", { badges: ["vegan"] })]),
        sec("Snacks", [it("Trüffel-Pommes", "6,50", "", { tags: "G", badges: ["vegetarisch"] })]),
      ],
    },
  },
  {
    id: "baeckerei",
    name: "Bäckerei",
    hint: "Warm, handgemacht",
    icon: "Croissant",
    type: "menu",
    preset: "bordeaux",
    content: {
      name: "Deine Bäckerei",
      subtitle: "Jeden Morgen frisch",
      logo: "", cover: "", phone: "", address: "", hours: "Mo–Sa 6–18 Uhr\nSo 7–12 Uhr", footer: "",
      layout: "cards", theme: "light", accent: "#a0622d",
      sections: [
        sec("Brot", [it("Sauerteigbrot", "4,80", "750 g, 24 Stunden Teigführung", { tags: "A", badges: ["hausgemacht"] }), it("Dinkelvollkorn", "4,50", "", { tags: "A, N" })]),
        sec("Brötchen", [it("Laugenbrezel", "0,90", "", { tags: "A" }), it("Körnerbrötchen", "0,80", "", { tags: "A, N" })]),
        sec("Süßes", [it("Croissant", "1,60", "Mit französischer Butter", { tags: "A, C, G", badges: ["beliebt"] })]),
      ],
    },
  },
];
