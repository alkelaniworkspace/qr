/** Menu import parsers against small fixtures. Run: npm run verify:import */
import { extractBlobs, fromEmbedded, fromJsonLd, fromText } from "../src/lib/menu-import";

function check(name: string, ok: boolean | undefined, info?: unknown) {
  console.log(`${ok ? "OK  " : "FAIL"} ${name}`, ok ? "" : JSON.stringify(info).slice(0, 400));
  if (!ok) process.exitCode = 1;
}

const ldHtml = `<script type="application/ld+json">{"@context":"https://schema.org","@type":"Restaurant","name":"Dili Grill","telephone":"0236 1234","address":{"streetAddress":"Hauptstr. 1","postalCode":"46282","addressLocality":"Dorsten"},"hasMenu":{"@type":"Menu","hasMenuSection":[{"@type":"MenuSection","name":"Döner","hasMenuItem":[{"@type":"MenuItem","name":"Döner im Brot","description":"Kalb","offers":{"@type":"Offer","price":"7.50"},"suitableForDiet":"https://schema.org/HalalDiet"},{"@type":"MenuItem","name":"Falafel","offers":{"price":6},"suitableForDiet":"https://schema.org/VeganDiet"}]}]}}</script>`;
const ld = fromJsonLd(extractBlobs(ldHtml).ld);
check("json-ld: restaurant name", ld?.name === "Dili Grill", ld);
check("json-ld: section + items", ld?.sections[0].title === "Döner" && ld.sections[0].items.length === 2, ld);
check("json-ld: price formatted", ld?.sections[0].items[0].price === "7,50", ld?.sections[0].items[0]);
check("json-ld: vegan badge", ld?.sections[0].items[1].badges.includes("vegan"), ld?.sections[0].items[1]);
check("json-ld: address", ld?.address === "Hauptstr. 1, 46282 Dorsten", ld?.address);

// Delivery-platform style state: categories list product ids, products live in a dictionary (prices in cents)
const state = {
  props: { pageProps: { menu: {
    categories: [{ id: "c1", name: "Pizza", productIds: ["p1", "p2"] }, { id: "c2", name: "Getränke", productIds: ["p3"] }],
    products: {
      p1: { name: "Pizza Margherita", description: "Tomate, Mozzarella", imageUrl: "https://img.example/p1.jpg", allergens: [{ name: "Glutenhaltiges Getreide" }, { name: "Milch" }], variants: [{ name: "26 cm", prices: { delivery: 890 } }, { name: "32 cm", prices: { delivery: 1190 } }] },
      p2: { name: "Pizza Diavolo", description: "scharfe Salami", labels: ["spicy"], variants: [{ name: "26 cm", prices: { delivery: 990 } }] },
      p3: { name: "Cola 0,33 l", priceInCents: 250, additives: ["1", "9"] },
    },
  } } },
};
const nextHtml = `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify(state)}</script>`;
const emb = fromEmbedded(extractBlobs(nextHtml).embedded);
check("embedded: two categories", emb?.sections.length === 2, emb);
const pizza = emb?.sections.find((s) => s.title === "Pizza");
check("embedded: sizes in cents", pizza?.items[0].variants.map((v) => v.price).join("|") === "8,90|11,90", pizza?.items[0]);
check("embedded: allergens mapped to letters", pizza?.items[0].tags === "A, G", pizza?.items[0].tags);
check("embedded: image kept", pizza?.items[0].image === "https://img.example/p1.jpg");
check("embedded: single size becomes price", pizza?.items[1].price === "9,90" && pizza.items[1].badges.includes("scharf"), pizza?.items[1]);
const drinks = emb?.sections.find((s) => s.title === "Getränke");
check("embedded: additives numbers", drinks?.items[0].tags === "1, 9" && drinks.items[0].price === "2,50", drinks?.items[0]);

const text = fromText(`Vorspeisen
Tzatziki (G) ........ 4,50 €
Hausgemachter Joghurt mit Gurke und Knoblauch
Hauptgerichte:
1. Gyros Teller (A, G) 12,90
Souvlaki 11,50€`);
check("text: two sections", text?.sections.length === 2, text);
check("text: allergens from brackets", text?.sections[0].items[0].tags === "G" && text.sections[0].items[0].price === "4,50", text?.sections[0].items[0]);
check("text: description attached", text?.sections[0].items[0].description.startsWith("Hausgemachter"), text?.sections[0].items[0]);
check("text: numbered dish", text?.sections[1].items[0].name === "Gyros Teller" && text.sections[1].items[0].tags === "A, G", text?.sections[1].items[0]);

// Copied from a menu website: name / description / price lines, size header, noise
const site = fromText(`Speisekarte von Antalya Grill
Klassisch sortiert
Grillspezialitäten
klein / mittel / groß
Döner Tasche
Kalb o. Hähnchen Dönerfleisch Im Fladenbrot mit gemischtem Salat und Sauce
5,00
€
7,00
€
9,00
€
Schmeckt mir!
Merken!
Döner Schale
Kalb o. Hähnchen Dönerfleisch mit Pommes o. Reis und Sauce
7,00 €
Pizzen
Margherita (A, G)
Tomatensauce, Käse
8,50 €`);
const grill = site?.sections.find((s) => s.title === "Grillspezialitäten");
check("site text: category found", !!grill, site);
check("site text: sizes from header", grill?.items[0].variants.map((v) => `${v.label}=${v.price}`).join("|") === "klein=5,00|mittel=7,00|groß=9,00", grill?.items[0]);
check("site text: description", grill?.items[0].description.startsWith("Kalb") === true, grill?.items[0]);
check("site text: second dish single price", grill?.items[1].name === "Döner Schale" && grill.items[1].price === "7,00", grill?.items[1]);
const pz = site?.sections.find((s) => s.title === "Pizzen");
check("site text: next category + allergens", pz?.items[0].name === "Margherita" && pz.items[0].tags === "A, G" && pz.items[0].price === "8,50", pz);
