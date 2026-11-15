/** Menu import parsers against small fixtures. Run: npm run verify:import */
import { extractBlobs, finishImages, fromEmbedded, fromJsonLd, fromText, resolveImage } from "../src/lib/menu-import";

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

// ───────── images ─────────
check("image: relative path resolved", resolveImage("/img/pizza.jpg", "https://pizzeria.de/karte") === "https://pizzeria.de/img/pizza.jpg");
check("image: protocol-relative + http upgraded", resolveImage("//cdn.x.de/a.jpg") === "https://cdn.x.de/a.jpg" && resolveImage("http://x.de/a.jpg") === "https://x.de/a.jpg");
check("image: srcset takes largest", resolveImage("/a-400.jpg 400w, /a-1200.jpg 1200w", "https://x.de/") === "https://x.de/a-1200.jpg");
check("image: size template filled", resolveImage("https://cdn.x.de/{width}/p.jpg") === "https://cdn.x.de/800/p.jpg");
check("image: logo and svg skipped", resolveImage("/logo.png", "https://x.de/") === "" && resolveImage("/i/plate.svg", "https://x.de/") === "");

const woltLike = { menu: { categories: [{ name: "Burger", items: [
  { name: "Cheeseburger", price: 990, images: [{ url: "/media/cheese.jpg", blurhash: "x" }] },
  { name: "Veggie Burger", price: 1090, image: { sizes: { large: "https://cdn.x.de/veg.jpg" } } },
] }] } };
const wolt = fromEmbedded(extractBlobs(`<script type="application/json">${JSON.stringify(woltLike)}</script>`).embedded);
if (wolt) finishImages(wolt, "", "https://shop.x.de/menu");
check("image: array of objects + relative", wolt?.sections[0].items[0].image === "https://shop.x.de/media/cheese.jpg", wolt?.sections[0].items[0]);
check("image: nested size object", wolt?.sections[0].items[1].image === "https://cdn.x.de/veg.jpg", wolt?.sections[0].items[1]);

// Plain restaurant website: no structured data, photos sit in the dish cards (lazy-loaded)
const siteHtml = `<header><img src="/logo.png" alt="Logo"></header><img src="/banner.jpg">
<div class="card"><img data-src="/fotos/margherita.jpg" src="data:image/gif;base64,R0"><h3>Pizza Margherita</h3><p>Tomate, Mozzarella</p><span>8,90 €</span></div>
<div class="card"><img src="/fotos/salami.webp" width="400"><h3>Pizza Salami</h3><span>9,90 €</span></div>
<div class="card"><h3>Tiramisu</h3><span>5,50 €</span></div>`;
const plain = fromText("Pizza Margherita\nTomate, Mozzarella\n8,90 €\nPizza Salami\n9,90 €\nTiramisu\n5,50 €");
if (plain) finishImages(plain, siteHtml, "https://pizzeria.de/karte");
const dish = (n: string) => plain?.sections.flatMap((s) => s.items).find((i) => i.name === n);
check("html: lazy image matched to dish", dish("Pizza Margherita")?.image === "https://pizzeria.de/fotos/margherita.jpg", dish("Pizza Margherita"));
check("html: second dish gets its own photo", dish("Pizza Salami")?.image === "https://pizzeria.de/fotos/salami.webp", dish("Pizza Salami"));
check("html: dish without photo gets none (no banner, no neighbour)", dish("Tiramisu")?.image === "", dish("Tiramisu"));
