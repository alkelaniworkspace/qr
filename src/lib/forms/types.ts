import { z } from "zod";

export type FieldType = "short" | "long" | "email" | "phone" | "number" | "date" | "single" | "multi" | "dropdown" | "rating" | "nps" | "consent" | "section";

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  help?: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

export interface FormSettings {
  thankYou?: string;
  buttonText?: string;
  accent?: string;
  theme?: "light" | "dark";
  /** shows a "show results" poll view after submitting */
  showResults?: boolean;
}

export const FIELD_TYPES: { type: FieldType; label: string; icon: string }[] = [
  { type: "short", label: "Kurzer Text", icon: "Type" },
  { type: "long", label: "Langer Text", icon: "AlignLeft" },
  { type: "email", label: "E-Mail", icon: "Mail" },
  { type: "phone", label: "Telefon", icon: "Phone" },
  { type: "number", label: "Zahl", icon: "Hash" },
  { type: "date", label: "Datum", icon: "Calendar" },
  { type: "single", label: "Einfachauswahl", icon: "CircleDot" },
  { type: "multi", label: "Mehrfachauswahl", icon: "ListChecks" },
  { type: "dropdown", label: "Dropdown", icon: "ChevronDown" },
  { type: "rating", label: "Sterne 1–5", icon: "Star" },
  { type: "nps", label: "Skala 0–10", icon: "Gauge" },
  { type: "consent", label: "Zustimmung", icon: "ShieldCheck" },
  { type: "section", label: "Überschrift", icon: "Heading" },
];

export const hasOptions = (t: FieldType) => t === "single" || t === "multi" || t === "dropdown";
export const isInput = (t: FieldType) => t !== "section";

const fieldSchema = z.object({
  id: z.string().regex(/^[a-z0-9]{2,16}$/),
  type: z.enum(["short", "long", "email", "phone", "number", "date", "single", "multi", "dropdown", "rating", "nps", "consent", "section"]),
  label: z.string().trim().min(1, "Frage fehlt").max(300),
  help: z.string().trim().max(500).optional(),
  required: z.boolean().optional(),
  options: z.array(z.string().trim().min(1).max(120)).max(40).optional(),
  placeholder: z.string().trim().max(120).optional(),
});

export const formSchema = z.object({
  title: z.string().trim().min(1, "Titel fehlt").max(160),
  description: z.string().trim().max(2000).default(""),
  fields: z.array(fieldSchema).min(1, "Mindestens ein Feld").max(80),
  settings: z.object({
    thankYou: z.string().trim().max(500).optional(),
    buttonText: z.string().trim().max(40).optional(),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    theme: z.enum(["light", "dark"]).optional(),
    showResults: z.boolean().optional(),
  }).default({}),
});
export type FormDef = z.infer<typeof formSchema>;

export const newFieldId = () => Math.random().toString(36).slice(2, 10);

/** Validates one submission against the form definition. Returns cleaned answers or errors. */
export function validateAnswers(fields: FormField[], raw: Record<string, unknown>): { ok: true; answers: Record<string, unknown> } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const answers: Record<string, unknown> = {};
  for (const f of fields) {
    if (!isInput(f.type)) continue;
    const v = raw[f.id];
    const empty = v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0) || (f.type === "consent" && v !== true);
    if (empty) {
      if (f.required) errors[f.id] = f.type === "consent" ? "Bitte bestätigen" : "Pflichtfeld";
      continue;
    }
    switch (f.type) {
      case "email":
        if (typeof v !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || v.length > 200) errors[f.id] = "Ungültige E-Mail";
        else answers[f.id] = v.trim();
        break;
      case "number": {
        const n = Number(String(v).replace(",", "."));
        if (!isFinite(n)) errors[f.id] = "Bitte eine Zahl";
        else answers[f.id] = n;
        break;
      }
      case "rating":
      case "nps": {
        const n = Number(v);
        const max = f.type === "rating" ? 5 : 10;
        const min = f.type === "rating" ? 1 : 0;
        if (!Number.isInteger(n) || n < min || n > max) errors[f.id] = "Ungültig";
        else answers[f.id] = n;
        break;
      }
      case "single":
      case "dropdown":
        if (typeof v !== "string" || !(f.options ?? []).includes(v)) errors[f.id] = "Bitte auswählen";
        else answers[f.id] = v;
        break;
      case "multi": {
        const arr = Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && (f.options ?? []).includes(x)) : [];
        if (!arr.length && f.required) errors[f.id] = "Bitte auswählen";
        else answers[f.id] = arr;
        break;
      }
      case "consent":
        answers[f.id] = true;
        break;
      default:
        answers[f.id] = String(v).slice(0, f.type === "long" ? 4000 : 400);
    }
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, answers };
}

// ───────── templates ─────────
const F = (type: FieldType, label: string, extra: Partial<FormField> = {}): FormField => ({ id: newFieldId(), type, label, ...extra });

export const FORM_TEMPLATES: { id: string; name: string; hint: string; icon: string; build: () => FormDef }[] = [
  {
    id: "feedback", name: "Gäste-Feedback", hint: "Sterne, NPS, Kommentar", icon: "Star",
    build: () => ({ title: "Wie war dein Besuch?", description: "Dein Feedback hilft uns, besser zu werden. Dauert 30 Sekunden.", settings: { thankYou: "Danke für dein Feedback!", showResults: false },
      fields: [F("rating", "Wie zufrieden warst du insgesamt?", { required: true }), F("single", "Was hat dir am besten gefallen?", { options: ["Essen", "Service", "Ambiente", "Preis"] }), F("nps", "Wie wahrscheinlich empfiehlst du uns weiter?"), F("long", "Was können wir besser machen?"), F("email", "E-Mail (optional, für Rückfragen)")] }),
  },
  {
    id: "reservation", name: "Tischreservierung", hint: "Datum, Personen, Kontakt", icon: "Calendar",
    build: () => ({ title: "Tisch reservieren", description: "Wir bestätigen deine Anfrage schnellstmöglich.", settings: { thankYou: "Danke! Wir melden uns zur Bestätigung.", buttonText: "Anfrage senden" },
      fields: [F("short", "Name", { required: true }), F("phone", "Telefon", { required: true }), F("date", "Datum", { required: true }), F("dropdown", "Uhrzeit", { required: true, options: ["12:00", "13:00", "18:00", "19:00", "20:00", "21:00"] }), F("number", "Personen", { required: true }), F("long", "Anmerkungen")] }),
  },
  {
    id: "raffle", name: "Gewinnspiel", hint: "Teilnahme mit Einwilligung", icon: "Gift",
    build: () => ({ title: "Gewinne ein Essen für zwei", description: "Teilnahme bis Monatsende. Der Gewinner wird per E-Mail benachrichtigt.", settings: { thankYou: "Du bist dabei. Viel Glück!", buttonText: "Teilnehmen" },
      fields: [F("short", "Vorname", { required: true }), F("email", "E-Mail", { required: true }), F("single", "Dein Lieblingsgericht?", { options: ["Döner", "Pizza", "Schnitzel", "Salat"] }), F("consent", "Ich akzeptiere die Teilnahmebedingungen und die Datenschutzerklärung.", { required: true })] }),
  },
  {
    id: "poll", name: "Umfrage & Abstimmung", hint: "Live-Ergebnisse nach der Stimme", icon: "BarChart3",
    build: () => ({ title: "Welches Gericht kommt neu auf die Karte?", description: "Stimm ab und sieh das Ergebnis sofort.", settings: { thankYou: "Danke für deine Stimme!", showResults: true, buttonText: "Abstimmen" },
      fields: [F("single", "Deine Wahl", { required: true, options: ["Lahmacun", "Falafel-Bowl", "Pide", "Chicken Wings"] })] }),
  },
  {
    id: "event", name: "Event-Anmeldung", hint: "Name, Personen, Essen", icon: "Ticket",
    build: () => ({ title: "Anmeldung zum Sommerfest", description: "Sichere dir deinen Platz.", settings: { thankYou: "Angemeldet! Wir freuen uns auf dich." },
      fields: [F("short", "Name", { required: true }), F("email", "E-Mail", { required: true }), F("number", "Anzahl Personen", { required: true }), F("multi", "Essenswünsche", { options: ["Vegetarisch", "Vegan", "Glutenfrei", "Keine"] })] }),
  },
  {
    id: "job", name: "Kurzbewerbung", hint: "Ohne Lebenslauf bewerben", icon: "Briefcase",
    build: () => ({ title: "Werde Teil unseres Teams", description: "Bewirb dich in einer Minute.", settings: { thankYou: "Danke! Wir melden uns innerhalb von 3 Tagen." },
      fields: [F("short", "Name", { required: true }), F("phone", "Telefon", { required: true }), F("single", "Position", { required: true, options: ["Service", "Küche", "Lieferfahrer", "Aushilfe"] }), F("multi", "Verfügbar", { options: ["Vormittags", "Nachmittags", "Abends", "Wochenende"] }), F("long", "Erzähl kurz von dir")] }),
  },
];
