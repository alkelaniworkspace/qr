import { z } from "zod";

/** Prefix for free-text "Other" answers in choice fields. */
export const OTHER = "Sonstiges: ";

export type FieldType = "short" | "long" | "email" | "phone" | "number" | "date" | "time" | "url" | "single" | "multi" | "dropdown" | "yesno" | "rating" | "nps" | "slider" | "consent" | "section" | "statement";

export type LogicOp = "eq" | "neq" | "includes" | "gt" | "lt" | "filled";
/** Show this field only when another answer matches. */
export interface FieldLogic { field: string; op: LogicOp; value?: string }

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  help?: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  /** "half" = two fields side by side (classic layout, wide screens) */
  width?: "full" | "half";
  /** number/slider: range; short/long: min/max characters */
  min?: number;
  max?: number;
  step?: number;
  /** choices: adds an "Other" option with a text field */
  other?: boolean;
  /** choices: shuffle the order for each visitor */
  shuffle?: boolean;
  /** multi: at most this many */
  maxSelect?: number;
  /** slider: labels for both ends */
  minLabel?: string;
  maxLabel?: string;
  logic?: FieldLogic;
}

export type FormLayout = "classic" | "steps";
export type FormMode = "light" | "dark" | "auto";

export interface FormSettings {
  thankYou?: string;
  thankYouTitle?: string;
  buttonText?: string;
  accent?: string;
  /** legacy: light/dark; newer forms use `mode` */
  theme?: "light" | "dark";
  /** shows a "show results" poll view after submitting */
  showResults?: boolean;
  // design
  look?: string;
  mode?: FormMode;
  font?: string;
  layout?: FormLayout;
  cover?: string;
  logo?: string;
  showProgress?: boolean;
  // advanced
  redirectUrl?: string;
  closeAt?: string;
  maxResponses?: number;
  oncePerDevice?: boolean;
  notifyOwner?: boolean;
  /** id of an e-mail field: the person gets a copy of their answers */
  confirmField?: string;
  closedMessage?: string;
}

export const FIELD_TYPES: { type: FieldType; label: string; icon: string }[] = [
  { type: "short", label: "Kurzer Text", icon: "Type" },
  { type: "long", label: "Langer Text", icon: "AlignLeft" },
  { type: "email", label: "E-Mail", icon: "Mail" },
  { type: "phone", label: "Telefon", icon: "Phone" },
  { type: "number", label: "Zahl", icon: "Hash" },
  { type: "date", label: "Datum", icon: "Calendar" },
  { type: "time", label: "Uhrzeit", icon: "Clock" },
  { type: "url", label: "Link", icon: "Link" },
  { type: "single", label: "Einfachauswahl", icon: "CircleDot" },
  { type: "multi", label: "Mehrfachauswahl", icon: "ListChecks" },
  { type: "dropdown", label: "Dropdown", icon: "ChevronDown" },
  { type: "yesno", label: "Ja / Nein", icon: "ToggleLeft" },
  { type: "rating", label: "Sterne 1–5", icon: "Star" },
  { type: "nps", label: "Skala 0–10", icon: "Gauge" },
  { type: "slider", label: "Schieberegler", icon: "SlidersHorizontal" },
  { type: "consent", label: "Zustimmung", icon: "ShieldCheck" },
  { type: "section", label: "Abschnitt", icon: "Heading" },
  { type: "statement", label: "Hinweistext", icon: "Info" },
];

/** Groups for the "add field" palette. */
export const FIELD_GROUPS: { label: string; types: FieldType[] }[] = [
  { label: "Text & Kontakt", types: ["short", "long", "email", "phone", "url"] },
  { label: "Auswahl", types: ["single", "multi", "dropdown", "yesno"] },
  { label: "Bewertung", types: ["rating", "nps", "slider"] },
  { label: "Zahl & Zeit", types: ["number", "date", "time"] },
  { label: "Gestaltung", types: ["section", "statement", "consent"] },
];

export const hasOptions = (t: FieldType) => t === "single" || t === "multi" || t === "dropdown";
export const isInput = (t: FieldType) => t !== "section" && t !== "statement";

const FIELD_TYPE_IDS = ["short", "long", "email", "phone", "number", "date", "time", "url", "single", "multi", "dropdown", "yesno", "rating", "nps", "slider", "consent", "section", "statement"] as const;
const fieldSchema = z.object({
  id: z.string().regex(/^[a-z0-9]{2,16}$/),
  type: z.enum(FIELD_TYPE_IDS),
  label: z.string().trim().min(1, "Frage fehlt").max(300),
  help: z.string().trim().max(500).optional(),
  required: z.boolean().optional(),
  options: z.array(z.string().trim().min(1).max(120)).max(40).optional(),
  placeholder: z.string().trim().max(120).optional(),
  width: z.enum(["full", "half"]).optional(),
  min: z.number().finite().optional(),
  max: z.number().finite().optional(),
  step: z.number().positive().finite().optional(),
  other: z.boolean().optional(),
  shuffle: z.boolean().optional(),
  maxSelect: z.number().int().min(1).max(40).optional(),
  minLabel: z.string().trim().max(40).optional(),
  maxLabel: z.string().trim().max(40).optional(),
  logic: z.object({ field: z.string().max(16), op: z.enum(["eq", "neq", "includes", "gt", "lt", "filled"]), value: z.string().max(120).optional() }).optional(),
});

export const formSchema = z.object({
  title: z.string().trim().min(1, "Titel fehlt").max(160),
  description: z.string().trim().max(2000).default(""),
  fields: z.array(fieldSchema).min(1, "Mindestens ein Feld").max(80),
  settings: z.object({
    thankYou: z.string().trim().max(500).optional(),
    thankYouTitle: z.string().trim().max(120).optional(),
    buttonText: z.string().trim().max(40).optional(),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    theme: z.enum(["light", "dark"]).optional(),
    showResults: z.boolean().optional(),
    look: z.string().max(32).optional(),
    mode: z.enum(["light", "dark", "auto"]).optional(),
    font: z.string().max(32).optional(),
    layout: z.enum(["classic", "steps"]).optional(),
    cover: z.string().url().max(600).optional().or(z.literal("")),
    logo: z.string().url().max(600).optional().or(z.literal("")),
    showProgress: z.boolean().optional(),
    redirectUrl: z.string().url().max(600).optional().or(z.literal("")),
    closeAt: z.string().max(40).optional().or(z.literal("")),
    maxResponses: z.number().int().min(1).max(1_000_000).optional(),
    oncePerDevice: z.boolean().optional(),
    notifyOwner: z.boolean().optional(),
    confirmField: z.string().max(16).optional().or(z.literal("")),
    closedMessage: z.string().trim().max(300).optional(),
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
    if (!isVisible(f, raw)) continue;
    const v = raw[f.id];
    const empty = v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0) || (f.type === "consent" && v !== true);
    if (empty) {
      if (f.required) errors[f.id] = f.type === "consent" ? "Bitte bestätigen" : "Pflichtfeld";
      continue;
    }
    switch (f.type) {
      case "url":
        if (typeof v !== "string" || !/^https?:\/\/\S+\.\S+/i.test(v.trim()) || v.length > 600) errors[f.id] = "Bitte einen Link mit https://";
        else answers[f.id] = v.trim();
        break;
      case "time":
        if (typeof v !== "string" || !/^\d{2}:\d{2}$/.test(v)) errors[f.id] = "Ungültige Uhrzeit";
        else answers[f.id] = v;
        break;
      case "yesno":
        if (v !== "Ja" && v !== "Nein") errors[f.id] = "Bitte auswählen";
        else answers[f.id] = v;
        break;
      case "slider": {
        const n = Number(v);
        const lo = f.min ?? 0, hi = f.max ?? 100;
        if (!isFinite(n) || n < lo || n > hi) errors[f.id] = "Ungültig";
        else answers[f.id] = n;
        break;
      }
      case "email":
        if (typeof v !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || v.length > 200) errors[f.id] = "Ungültige E-Mail";
        else answers[f.id] = v.trim();
        break;
      case "number": {
        const n = Number(String(v).replace(",", "."));
        if (!isFinite(n)) errors[f.id] = "Bitte eine Zahl";
        else if (f.min !== undefined && n < f.min) errors[f.id] = `Mindestens ${f.min}`;
        else if (f.max !== undefined && n > f.max) errors[f.id] = `Höchstens ${f.max}`;
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
        if (typeof v !== "string") errors[f.id] = "Bitte auswählen";
        else if ((f.options ?? []).includes(v)) answers[f.id] = v;
        else if (f.other && v.startsWith(OTHER) && v.length > OTHER.length) answers[f.id] = v.slice(0, 200);
        else errors[f.id] = "Bitte auswählen";
        break;
      case "multi": {
        const arr = Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && ((f.options ?? []).includes(x) || (!!f.other && x.startsWith(OTHER) && x.length > OTHER.length))).map((x) => x.slice(0, 200)) : [];
        if (!arr.length && f.required) errors[f.id] = "Bitte auswählen";
        else if (f.maxSelect && arr.length > f.maxSelect) errors[f.id] = `Höchstens ${f.maxSelect} auswählen`;
        else answers[f.id] = arr;
        break;
      }
      case "consent":
        answers[f.id] = true;
        break;
      default: {
        const t = String(v).slice(0, f.type === "long" ? 4000 : 400);
        if (f.min !== undefined && t.trim().length < f.min) errors[f.id] = `Mindestens ${f.min} Zeichen`;
        else answers[f.id] = t;
      }
    }
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, answers };
}


/** Conditional logic: is this field shown for these answers? */
export function isVisible(f: Pick<FormField, "logic">, answers: Record<string, unknown>): boolean {
  const l = f.logic;
  if (!l || !l.field) return true;
  const v = answers[l.field];
  const s = Array.isArray(v) ? v.map(String) : v === undefined || v === null ? [] : [String(v)];
  switch (l.op) {
    case "filled": return s.length > 0 && s[0] !== "";
    case "eq": return s.length === 1 && s[0] === (l.value ?? "");
    case "neq": return !(s.length === 1 && s[0] === (l.value ?? ""));
    case "includes": return s.some((x) => x === (l.value ?? "") || x.toLowerCase().includes((l.value ?? "").toLowerCase()));
    case "gt": return s.length > 0 && Number(s[0]) > Number(l.value);
    case "lt": return s.length > 0 && Number(s[0]) < Number(l.value);
    default: return true;
  }
}

export { FORM_TEMPLATES, TEMPLATE_CATEGORIES } from "./templates";
