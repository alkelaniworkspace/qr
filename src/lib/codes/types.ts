import { z } from "zod";

/**
 * Registry of every code type. One entry defines: what the user fills in
 * (fields), how it is validated (schema), which modes it supports and the
 * starting content. Hosted pages live in src/components/pages, static
 * payloads in ./payload.ts, redirects in ./resolve.ts.
 */

export type CodeMode = "dynamic" | "static";
export type CodeTypeId =
  | "url" | "vcard" | "links" | "menu" | "review" | "coupon" | "pdf" | "event" | "site"
  | "location" | "app" | "wifi" | "email" | "sms" | "phone" | "text";

export type Field =
  | {
      kind: "text" | "url" | "email" | "tel" | "textarea" | "datetime" | "date" | "color" | "password";
      name: string;
      label: string;
      placeholder?: string;
      hint?: string;
      required?: boolean;
      half?: boolean;
    }
  | { kind: "select"; name: string; label: string; options: { value: string; label: string }[]; half?: boolean }
  | { kind: "checkbox"; name: string; label: string }
  | { kind: "links"; name: string; label: string }
  | { kind: "menu"; name: string; label: string }
  | { kind: "file"; name: string; label: string; accept: string; hint?: string }
  | { kind: "review"; name: string; label: string; hint?: string }
  | { kind: "theme"; name: string; label: string };

export interface CodeTypeDef {
  id: CodeTypeId;
  label: string;
  description: string;
  icon: string;
  group: "page" | "link" | "direct";
  modes: CodeMode[];
  fields: Field[];
  schema: z.ZodType;
  defaults: Record<string, unknown>;
  /** dynamic codes of this type render a hosted page instead of redirecting */
  hostedPage: boolean;
}

// ───────── validation helpers ─────────
const str = (max = 200) => z.string().trim().max(max).default("");
const reqStr = (label: string, max = 200) => z.string().trim().min(1, `${label} fehlt`).max(max);
const isHttpUrl = (v: string) => {
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
};
/** Adds https:// when the user typed a bare domain. */
export const normalizeUrl = (v: string) => (v && !/^[a-z]+:\/\//i.test(v) ? `https://${v}` : v);
const url = (label = "Link") =>
  z.string().trim().min(1, `${label} fehlt`).max(2000).transform(normalizeUrl).refine(isHttpUrl, "Ungültiger Link (http/https)");
const optUrl = () =>
  z.string().trim().max(2000).default("").transform(normalizeUrl).refine((v) => !v || isHttpUrl(v), "Ungültiger Link");
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#d42a4e");
const linkItem = z.object({ label: reqStr("Bezeichnung", 80), url: url() });
const menuItem = z.object({
  name: reqStr("Gericht", 120),
  description: str(300),
  price: str(20),
  tags: str(80),
});
const menuSection = z.object({ title: reqStr("Kategorie", 80), items: z.array(menuItem).max(80) });

const ACCENT: Field = { kind: "color", name: "accent", label: "Akzentfarbe", half: true };
const THEME: Field = { kind: "theme", name: "theme", label: "Seiten-Stil" };
const theme = z.enum(["light", "dark", "color"]).default("light");

export const CODE_TYPES: Record<CodeTypeId, CodeTypeDef> = {
  url: {
    id: "url",
    label: "Website",
    description: "Führt zu einer beliebigen Webseite",
    icon: "Link2",
    group: "link",
    modes: ["dynamic", "static"],
    hostedPage: false,
    fields: [{ kind: "url", name: "url", label: "Ziel-Link", placeholder: "https://deine-seite.de", required: true }],
    schema: z.object({ url: url("Ziel-Link") }),
    defaults: { url: "" },
  },
  vcard: {
    id: "vcard",
    label: "Visitenkarte",
    description: "Kontakt speichern mit einem Scan",
    icon: "Contact",
    group: "page",
    modes: ["dynamic", "static"],
    hostedPage: true,
    fields: [
      { kind: "text", name: "firstName", label: "Vorname", required: true, half: true },
      { kind: "text", name: "lastName", label: "Nachname", half: true },
      { kind: "text", name: "title", label: "Position", half: true },
      { kind: "text", name: "company", label: "Firma", half: true },
      { kind: "tel", name: "phone", label: "Telefon", half: true },
      { kind: "tel", name: "mobile", label: "Mobil", half: true },
      { kind: "email", name: "email", label: "E-Mail", half: true },
      { kind: "url", name: "website", label: "Website", half: true },
      { kind: "text", name: "street", label: "Straße", half: true },
      { kind: "text", name: "city", label: "PLZ und Ort", half: true },
      { kind: "textarea", name: "note", label: "Kurzbeschreibung" },
      ACCENT,
      THEME,
    ],
    schema: z.object({
      firstName: reqStr("Vorname", 80),
      lastName: str(80),
      title: str(120),
      company: str(120),
      phone: str(40),
      mobile: str(40),
      email: z.union([z.literal(""), z.email("Ungültige E-Mail")]).default(""),
      website: optUrl(),
      street: str(120),
      city: str(120),
      note: str(500),
      accent: color,
      theme,
    }),
    defaults: { firstName: "", lastName: "", title: "", company: "", phone: "", mobile: "", email: "", website: "", street: "", city: "", note: "", accent: "#d42a4e", theme: "light" },
  },
  links: {
    id: "links",
    label: "Link-Seite",
    description: "Alle Social-Media-Profile auf einer Seite",
    icon: "Layers",
    group: "page",
    modes: ["dynamic", "static"],
    hostedPage: true,
    fields: [
      { kind: "text", name: "title", label: "Name", required: true },
      { kind: "textarea", name: "bio", label: "Beschreibung" },
      { kind: "links", name: "links", label: "Links" },
      ACCENT,
      THEME,
    ],
    schema: z.object({
      title: reqStr("Name", 80),
      bio: str(300),
      links: z.array(linkItem).min(1, "Mindestens ein Link").max(30),
      accent: color,
      theme,
    }),
    defaults: { title: "", bio: "", links: [{ label: "Instagram", url: "" }], accent: "#d42a4e", theme: "light" },
  },
  menu: {
    id: "menu",
    label: "Speisekarte",
    description: "Digitale Karte mit Kategorien und Preisen",
    icon: "UtensilsCrossed",
    group: "page",
    modes: ["dynamic", "static"],
    hostedPage: true,
    fields: [
      { kind: "text", name: "name", label: "Name des Lokals", required: true, half: true },
      { kind: "text", name: "subtitle", label: "Untertitel", placeholder: "Griechische Küche seit 1998", half: true },
      { kind: "menu", name: "sections", label: "Karte" },
      { kind: "textarea", name: "footer", label: "Hinweis unten", placeholder: "Allergene und Zusatzstoffe erfragen Sie bitte beim Personal." },
      ACCENT,
      THEME,
    ],
    schema: z.object({
      name: reqStr("Name", 80),
      subtitle: str(120),
      sections: z.array(menuSection).min(1, "Mindestens eine Kategorie").max(40),
      footer: str(600),
      accent: color,
      theme,
    }),
    defaults: {
      name: "",
      subtitle: "",
      sections: [{ title: "Vorspeisen", items: [{ name: "", description: "", price: "", tags: "" }] }],
      footer: "",
      accent: "#d42a4e",
      theme: "light",
    },
  },
  review: {
    id: "review",
    label: "Google-Bewertung",
    description: "Scan öffnet direkt das Bewertungsfenster",
    icon: "Star",
    group: "page",
    modes: ["dynamic", "static"],
    hostedPage: true,
    fields: [
      { kind: "text", name: "business", label: "Name des Geschäfts", required: true },
      { kind: "textarea", name: "message", label: "Nachricht", placeholder: "Danke für deinen Besuch! Wir freuen uns über deine Bewertung." },
      { kind: "review", name: "googleUrl", label: "Google-Maps-Link deines Geschäfts", hint: "Link aus Google Maps einfügen. Wir erzeugen daraus den direkten Bewertungs-Link." },
      { kind: "url", name: "secondaryUrl", label: "Weitere Plattform (optional)", placeholder: "Tripadvisor, Yelp …" },
      ACCENT,
      THEME,
    ],
    schema: z.object({
      business: reqStr("Name", 80),
      message: str(300),
      googleUrl: url("Google-Link"),
      secondaryUrl: optUrl(),
      accent: color,
      theme,
    }),
    defaults: { business: "", message: "", googleUrl: "", secondaryUrl: "", accent: "#d42a4e", theme: "light" },
  },
  coupon: {
    id: "coupon",
    label: "Gutschein",
    description: "Rabatte und Aktionen mit Code",
    icon: "TicketPercent",
    group: "page",
    modes: ["dynamic", "static"],
    hostedPage: true,
    fields: [
      { kind: "text", name: "business", label: "Geschäft", required: true, half: true },
      { kind: "text", name: "discount", label: "Angebot", placeholder: "-20 %", required: true, half: true },
      { kind: "text", name: "headline", label: "Überschrift", placeholder: "Auf deine nächste Bestellung" },
      { kind: "text", name: "code", label: "Gutscheincode", placeholder: "SOMMER20", half: true },
      { kind: "date", name: "validUntil", label: "Gültig bis", half: true },
      { kind: "url", name: "url", label: "Einlösen unter (optional)" },
      { kind: "textarea", name: "terms", label: "Bedingungen" },
      ACCENT,
      THEME,
    ],
    schema: z.object({
      business: reqStr("Geschäft", 80),
      discount: reqStr("Angebot", 40),
      headline: str(120),
      code: str(40),
      validUntil: str(10),
      url: optUrl(),
      terms: str(600),
      accent: color,
      theme,
    }),
    defaults: { business: "", discount: "", headline: "", code: "", validUntil: "", url: "", terms: "", accent: "#d42a4e", theme: "light" },
  },
  pdf: {
    id: "pdf",
    label: "PDF",
    description: "Preisliste, Broschüre oder Katalog",
    icon: "FileText",
    group: "page",
    modes: ["dynamic", "static"],
    hostedPage: true,
    fields: [
      { kind: "text", name: "title", label: "Titel", required: true },
      { kind: "textarea", name: "description", label: "Beschreibung" },
      { kind: "file", name: "file", label: "PDF-Datei", accept: "application/pdf", hint: "Max. 20 MB" },
      ACCENT,
      THEME,
    ],
    schema: z.object({
      title: reqStr("Titel", 120),
      description: str(500),
      file: z.object({ url: url("PDF"), name: str(200) }, { error: "Bitte eine PDF hochladen" }),
      accent: color,
      theme,
    }),
    defaults: { title: "", description: "", file: null, accent: "#d42a4e", theme: "light" },
  },
  event: {
    id: "event",
    label: "Veranstaltung",
    description: "Event mit „In Kalender speichern“",
    icon: "CalendarDays",
    group: "page",
    modes: ["dynamic", "static"],
    hostedPage: true,
    fields: [
      { kind: "text", name: "title", label: "Titel", required: true },
      { kind: "datetime", name: "start", label: "Beginn", required: true, half: true },
      { kind: "datetime", name: "end", label: "Ende", half: true },
      { kind: "text", name: "location", label: "Ort" },
      { kind: "textarea", name: "description", label: "Beschreibung" },
      { kind: "url", name: "url", label: "Tickets / Mehr Infos" },
      ACCENT,
      THEME,
    ],
    schema: z.object({
      title: reqStr("Titel", 120),
      start: reqStr("Beginn", 20),
      end: str(20),
      location: str(200),
      description: str(1000),
      url: optUrl(),
      accent: color,
      theme,
    }),
    defaults: { title: "", start: "", end: "", location: "", description: "", url: "", accent: "#d42a4e", theme: "light" },
  },
  site: {
    id: "site",
    label: "Mini-Website",
    description: "Eine schöne Seite für dein Geschäft, ohne eigene Website",
    icon: "Globe",
    group: "page",
    modes: ["dynamic", "static"],
    hostedPage: true,
    fields: [
      { kind: "text", name: "name", label: "Name des Geschäfts", required: true, half: true },
      { kind: "text", name: "tagline", label: "Slogan", placeholder: "Handwerk mit Herz seit 1998", half: true },
      { kind: "textarea", name: "about", label: "Über uns" },
      { kind: "textarea", name: "services", label: "Leistungen (eine pro Zeile)", placeholder: "Dachsanierung\nReparaturen\nDachfenster" },
      { kind: "textarea", name: "hours", label: "Öffnungszeiten (eine Zeile pro Tag)", placeholder: "Mo–Fr 8–18 Uhr\nSa 9–13 Uhr" },
      { kind: "tel", name: "phone", label: "Telefon", half: true },
      { kind: "email", name: "email", label: "E-Mail", half: true },
      { kind: "text", name: "address", label: "Adresse" },
      { kind: "links", name: "links", label: "Links" },
      ACCENT,
      THEME,
    ],
    schema: z.object({
      name: reqStr("Name", 80),
      tagline: str(140),
      about: str(1200),
      services: str(1200),
      hours: str(400),
      phone: str(40),
      email: z.union([z.literal(""), z.email("Ungültige E-Mail")]).default(""),
      address: str(200),
      links: z.array(linkItem).max(20).default([]),
      accent: color,
      theme,
    }),
    defaults: { name: "", tagline: "", about: "", services: "", hours: "", phone: "", email: "", address: "", links: [], accent: "#d42a4e", theme: "light" },
  },
  location: {
    id: "location",
    label: "Standort",
    description: "Öffnet die Adresse in Google Maps",
    icon: "MapPin",
    group: "link",
    modes: ["dynamic", "static"],
    hostedPage: false,
    fields: [{ kind: "text", name: "address", label: "Adresse", placeholder: "Lippestraße 1, 46282 Dorsten", required: true }],
    schema: z.object({ address: reqStr("Adresse", 300) }),
    defaults: { address: "" },
  },
  app: {
    id: "app",
    label: "App-Download",
    description: "iPhone und Android landen im richtigen Store",
    icon: "Smartphone",
    group: "link",
    modes: ["dynamic", "static"],
    hostedPage: false,
    fields: [
      { kind: "url", name: "iosUrl", label: "App Store", placeholder: "https://apps.apple.com/…" },
      { kind: "url", name: "androidUrl", label: "Google Play", placeholder: "https://play.google.com/…" },
      { kind: "url", name: "fallbackUrl", label: "Alle anderen Geräte", required: true },
    ],
    schema: z.object({ iosUrl: optUrl(), androidUrl: optUrl(), fallbackUrl: url("Fallback-Link") }),
    defaults: { iosUrl: "", androidUrl: "", fallbackUrl: "" },
  },
  wifi: {
    id: "wifi",
    label: "WLAN",
    description: "Ins WLAN ohne Passwort-Tippen",
    icon: "Wifi",
    group: "direct",
    modes: ["static"],
    hostedPage: false,
    fields: [
      { kind: "text", name: "ssid", label: "Netzwerkname (SSID)", required: true },
      { kind: "password", name: "password", label: "Passwort" },
      { kind: "select", name: "encryption", label: "Verschlüsselung", half: true, options: [
        { value: "WPA", label: "WPA/WPA2/WPA3" }, { value: "WEP", label: "WEP" }, { value: "nopass", label: "Offen" },
      ] },
      { kind: "checkbox", name: "hidden", label: "Verstecktes Netzwerk" },
    ],
    schema: z.object({
      ssid: reqStr("SSID", 64),
      password: str(64),
      encryption: z.enum(["WPA", "WEP", "nopass"]).default("WPA"),
      hidden: z.boolean().default(false),
    }),
    defaults: { ssid: "", password: "", encryption: "WPA", hidden: false },
  },
  email: {
    id: "email",
    label: "E-Mail",
    description: "Fertige E-Mail mit einem Scan",
    icon: "Mail",
    group: "direct",
    modes: ["static"],
    hostedPage: false,
    fields: [
      { kind: "email", name: "to", label: "Empfänger", required: true },
      { kind: "text", name: "subject", label: "Betreff" },
      { kind: "textarea", name: "body", label: "Nachricht" },
    ],
    schema: z.object({ to: z.email("Ungültige E-Mail"), subject: str(200), body: str(1000) }),
    defaults: { to: "", subject: "", body: "" },
  },
  sms: {
    id: "sms",
    label: "SMS",
    description: "Vorbereitete Nachricht",
    icon: "MessageSquare",
    group: "direct",
    modes: ["static"],
    hostedPage: false,
    fields: [
      { kind: "tel", name: "phone", label: "Nummer", required: true },
      { kind: "textarea", name: "message", label: "Nachricht" },
    ],
    schema: z.object({ phone: reqStr("Nummer", 40), message: str(500) }),
    defaults: { phone: "", message: "" },
  },
  phone: {
    id: "phone",
    label: "Anruf",
    description: "Direkt anrufen",
    icon: "Phone",
    group: "direct",
    modes: ["static"],
    hostedPage: false,
    fields: [{ kind: "tel", name: "phone", label: "Telefonnummer", required: true }],
    schema: z.object({ phone: reqStr("Nummer", 40) }),
    defaults: { phone: "" },
  },
  text: {
    id: "text",
    label: "Text",
    description: "Kurze Nachricht ohne Internet",
    icon: "Type",
    group: "direct",
    modes: ["static"],
    hostedPage: false,
    fields: [{ kind: "textarea", name: "text", label: "Text", required: true }],
    schema: z.object({ text: reqStr("Text", 1200) }),
    defaults: { text: "" },
  },
};

export const TYPE_ORDER: CodeTypeId[] = [
  "url", "menu", "review", "vcard", "site", "links", "coupon", "pdf", "event", "location", "app", "wifi", "email", "sms", "phone", "text",
];

export function getType(id: string): CodeTypeDef | null {
  return (CODE_TYPES as Record<string, CodeTypeDef>)[id] ?? null;
}

export type ValidationResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; errors: Record<string, string> };

export function validateContent(type: CodeTypeId, content: unknown): ValidationResult {
  const parsed = CODE_TYPES[type].schema.safeParse(content);
  if (parsed.success) return { ok: true, data: parsed.data as Record<string, unknown> };
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path.join(".") || "_";
    if (!errors[key]) errors[key] = issue.message;
  }
  return { ok: false, errors };
}
