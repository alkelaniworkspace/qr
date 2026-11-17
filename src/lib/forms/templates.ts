import { newFieldId, type FieldLogic, type FieldType, type FormDef, type FormField, type FormSettings } from "./types";

const F = (type: FieldType, label: string, extra: Partial<FormField> = {}): FormField => ({ id: newFieldId(), type, label, ...extra });
/** Builds fields where later ones can point at earlier ones by key for logic. */
function withLogic(list: [string, FormField][], rules: Record<string, FieldLogic & { ref: string }>): FormField[] {
  const ids = Object.fromEntries(list.map(([k, f]) => [k, f.id]));
  return list.map(([k, f]) => (rules[k] ? { ...f, logic: { field: ids[rules[k].ref], op: rules[k].op, value: rules[k].value } } : f));
}

export const TEMPLATE_CATEGORIES = ["Gastronomie", "Kunden & Service", "Events", "Umfragen", "Team & HR", "Geschäft"] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export interface FormTemplate { id: string; name: string; hint: string; icon: string; category: TemplateCategory; build: () => FormDef }

const S = (s: FormSettings): FormSettings => ({ showProgress: true, ...s });

export const FORM_TEMPLATES: FormTemplate[] = [
  // ── Gastronomie ──
  { id: "feedback", name: "Gäste-Feedback", hint: "Sterne, Empfehlung, Wünsche", icon: "Star", category: "Gastronomie",
    build: () => ({ title: "Wie war dein Besuch?", description: "Dein Feedback hilft uns, jeden Tag besser zu werden. Dauert 30 Sekunden.",
      settings: S({ look: "lime", mode: "dark", layout: "steps", thankYouTitle: "Danke dir!", thankYou: "Wir lesen jede Antwort persönlich.", buttonText: "Feedback senden" }),
      fields: withLogic([
        ["r", F("rating", "Wie zufrieden warst du insgesamt?", { required: true })],
        ["bad", F("long", "Schade! Was lief nicht gut?", { help: "Wir kümmern uns darum.", placeholder: "Erzähl uns kurz, was passiert ist" })],
        ["best", F("multi", "Was hat dir gefallen?", { options: ["Essen", "Service", "Ambiente", "Preis", "Wartezeit"] })],
        ["nps", F("nps", "Wie wahrscheinlich empfiehlst du uns weiter?")],
        ["mail", F("email", "E-Mail für Rückfragen", { help: "Optional" })],
      ], { bad: { ref: "r", op: "lt", value: "4", field: "" }, best: { ref: "r", op: "gt", value: "3", field: "" } }) }) },
  { id: "reservation", name: "Tischreservierung", hint: "Datum, Uhrzeit, Personen", icon: "CalendarCheck", category: "Gastronomie",
    build: () => ({ title: "Tisch reservieren", description: "Wir bestätigen deine Anfrage so schnell wie möglich.",
      settings: S({ look: "espresso", mode: "light", thankYouTitle: "Anfrage erhalten", thankYou: "Wir melden uns zur Bestätigung.", buttonText: "Anfrage senden", notifyOwner: true }),
      fields: withLogic([
        ["n", F("short", "Name", { required: true, width: "half" })],
        ["t", F("phone", "Telefon", { required: true, width: "half" })],
        ["d", F("date", "Datum", { required: true, width: "half" })],
        ["h", F("time", "Uhrzeit", { required: true, width: "half" })],
        ["p", F("number", "Personen", { required: true, min: 1, max: 40, width: "half" })],
        ["o", F("dropdown", "Anlass", { options: ["Kein besonderer", "Geburtstag", "Jahrestag", "Geschäftsessen", "Sonstiges"], width: "half" })],
        ["c", F("short", "Was dürfen wir vorbereiten?", { placeholder: "z. B. Kerze auf dem Dessert" })],
        ["x", F("long", "Anmerkungen", { placeholder: "Allergien, Kinderstuhl, Rollstuhl …" })],
      ], { c: { ref: "o", op: "eq", value: "Geburtstag", field: "" } }) }) },
  { id: "catering", name: "Catering-Anfrage", hint: "Anlass, Gäste, Budget", icon: "UtensilsCrossed", category: "Gastronomie",
    build: () => ({ title: "Catering anfragen", description: "Erzähl uns von deinem Event. Wir schicken dir ein Angebot.",
      settings: S({ look: "terracotta", mode: "light", layout: "steps", thankYouTitle: "Danke für deine Anfrage", thankYou: "Unser Angebot kommt innerhalb von 48 Stunden.", notifyOwner: true }),
      fields: [F("single", "Was feierst du?", { required: true, options: ["Firmenfeier", "Hochzeit", "Geburtstag", "Privates Fest"], other: true }), F("date", "Wann?", { required: true }), F("slider", "Wie viele Gäste?", { min: 10, max: 300, step: 10, minLabel: "10", maxLabel: "300+" }), F("multi", "Was soll es geben?", { options: ["Fingerfood", "Warmes Buffet", "Grill", "Desserts", "Getränke"] }), F("dropdown", "Budget pro Person", { options: ["bis 15 €", "15–25 €", "25–40 €", "über 40 €"] }), F("short", "Name", { required: true }), F("email", "E-Mail", { required: true })] }) },
  { id: "preorder", name: "Vorbestellung", hint: "Abholung mit Wunschzeit", icon: "ShoppingBag", category: "Gastronomie",
    build: () => ({ title: "Jetzt vorbestellen", description: "Bestell vor und hol frisch ab, ohne Wartezeit.",
      settings: S({ look: "pomegranate", mode: "light", thankYouTitle: "Bestellung eingegangen", thankYou: "Wir bestätigen per Anruf oder E-Mail.", buttonText: "Verbindlich vorbestellen", notifyOwner: true }),
      fields: [F("multi", "Was möchtest du?", { required: true, options: ["Pizza Margherita", "Döner Teller", "Falafel Box", "Salat", "Getränk"] }), F("long", "Extras und Wünsche", { placeholder: "z. B. ohne Zwiebeln" }), F("date", "Abholtag", { required: true, width: "half" }), F("time", "Abholzeit", { required: true, width: "half" }), F("short", "Name", { required: true, width: "half" }), F("phone", "Telefon", { required: true, width: "half" })] }) },
  { id: "allergy", name: "Allergien & Wünsche", hint: "Vor dem Besuch abfragen", icon: "ShieldAlert", category: "Gastronomie",
    build: () => ({ title: "Allergien und Unverträglichkeiten", description: "Damit unsere Küche alles perfekt für dich vorbereitet.",
      settings: S({ look: "sky", mode: "light", thankYouTitle: "Notiert!", thankYou: "Die Küche weiß Bescheid." }),
      fields: withLogic([
        ["n", F("short", "Name der Reservierung", { required: true })],
        ["has", F("yesno", "Gibt es Allergien oder Unverträglichkeiten?", { required: true })],
        ["which", F("multi", "Welche?", { options: ["Gluten", "Laktose", "Nüsse", "Erdnüsse", "Ei", "Fisch", "Schalentiere", "Soja", "Sellerie", "Senf", "Sesam"], other: true })],
        ["diet", F("single", "Ernährung", { options: ["Alles", "Vegetarisch", "Vegan", "Halal"] })],
      ], { which: { ref: "has", op: "eq", value: "Ja", field: "" } }) }) },

  // ── Kunden & Service ──
  { id: "contact", name: "Kontakt", hint: "Klassisches Kontaktformular", icon: "Mail", category: "Kunden & Service",
    build: () => ({ title: "Schreib uns", description: "Wir antworten in der Regel innerhalb eines Werktags.",
      settings: S({ look: "mono", mode: "light", thankYouTitle: "Nachricht gesendet", thankYou: "Danke! Wir melden uns bald.", buttonText: "Nachricht senden", notifyOwner: true, showProgress: false }),
      fields: [F("short", "Name", { required: true, width: "half" }), F("email", "E-Mail", { required: true, width: "half" }), F("dropdown", "Worum geht es?", { options: ["Allgemeine Frage", "Angebot", "Support", "Presse", "Sonstiges"] }), F("long", "Nachricht", { required: true, min: 10 }), F("consent", "Ich bin einverstanden, dass meine Angaben zur Beantwortung gespeichert werden.", { required: true })] }) },
  { id: "callback", name: "Rückrufbitte", hint: "Telefon und Wunschzeit", icon: "PhoneCall", category: "Kunden & Service",
    build: () => ({ title: "Wir rufen dich zurück", description: "Hinterlass deine Nummer, wir melden uns zur Wunschzeit.",
      settings: S({ look: "midnight", mode: "dark", thankYouTitle: "Alles klar!", thankYou: "Wir rufen dich zur gewünschten Zeit an.", buttonText: "Rückruf anfordern", notifyOwner: true }),
      fields: [F("short", "Name", { required: true }), F("phone", "Telefonnummer", { required: true }), F("single", "Wann passt es dir?", { required: true, options: ["Vormittags", "Mittags", "Nachmittags", "Abends"] }), F("short", "Kurz: Worum geht es?")] }) },
  { id: "complaint", name: "Reklamation", hint: "Fall aufnehmen und lösen", icon: "MessageSquareWarning", category: "Kunden & Service",
    build: () => ({ title: "Etwas ist schiefgelaufen?", description: "Das tut uns leid. Schildere uns den Fall, wir lösen das.",
      settings: S({ look: "ocean", mode: "light", layout: "steps", thankYouTitle: "Danke für deine Geduld", thankYou: "Wir melden uns innerhalb von 24 Stunden.", notifyOwner: true }),
      fields: [F("single", "Worum geht es?", { required: true, options: ["Bestellung", "Lieferung", "Qualität", "Rechnung", "Service"], other: true }), F("date", "Wann ist es passiert?"), F("long", "Was ist passiert?", { required: true, min: 15 }), F("single", "Was wünschst du dir?", { options: ["Ersatz", "Gutschrift", "Rückruf", "Nur Bescheid geben"] }), F("short", "Name", { required: true, width: "half" }), F("email", "E-Mail", { required: true, width: "half" })] }) },
  { id: "nps", name: "Kundenzufriedenheit", hint: "NPS mit Nachfrage", icon: "Gauge", category: "Kunden & Service",
    build: () => ({ title: "Eine Frage an dich", description: "Ehrlich und anonym.",
      settings: S({ look: "aurora", mode: "dark", layout: "steps", thankYouTitle: "Danke!", thankYou: "Deine Meinung bewegt etwas." }),
      fields: withLogic([
        ["s", F("nps", "Wie wahrscheinlich ist es, dass du uns weiterempfiehlst?", { required: true })],
        ["lo", F("long", "Was müssten wir besser machen?")],
        ["hi", F("long", "Was gefällt dir am meisten?")],
      ], { lo: { ref: "s", op: "lt", value: "7", field: "" }, hi: { ref: "s", op: "gt", value: "8", field: "" } }) }) },

  // ── Events ──
  { id: "event", name: "Event-Anmeldung", hint: "Platz sichern mit Begleitung", icon: "Ticket", category: "Events",
    build: () => ({ title: "Sommerfest 2027", description: "Sichere dir deinen Platz. Begrenzte Teilnehmerzahl.",
      settings: S({ look: "sunset", mode: "light", thankYouTitle: "Du bist dabei!", thankYou: "Wir freuen uns auf dich.", buttonText: "Platz sichern", maxResponses: 120 }),
      fields: withLogic([
        ["n", F("short", "Name", { required: true, width: "half" })],
        ["m", F("email", "E-Mail", { required: true, width: "half" })],
        ["g", F("yesno", "Bringst du jemanden mit?", { required: true })],
        ["gn", F("number", "Wie viele Begleitpersonen?", { min: 1, max: 5 })],
        ["f", F("multi", "Essenswünsche", { options: ["Vegetarisch", "Vegan", "Glutenfrei", "Halal"] })],
      ], { gn: { ref: "g", op: "eq", value: "Ja", field: "" } }) }) },
  { id: "wedding", name: "Hochzeit RSVP", hint: "Zusage, Menü, Lieblingssong", icon: "Heart", category: "Events",
    build: () => ({ title: "Lena & Jonas", description: "Wir heiraten am 12. Juni. Bitte gib uns bis 1. Mai Bescheid.",
      settings: S({ look: "gold", mode: "dark", layout: "steps", thankYouTitle: "Danke von Herzen", thankYou: "Wir freuen uns sehr auf dich.", buttonText: "Antwort senden" }),
      fields: withLogic([
        ["n", F("short", "Dein Name", { required: true })],
        ["c", F("single", "Kommst du?", { required: true, options: ["Ja, mit Freude!", "Leider nicht"] })],
        ["p", F("number", "Mit wie vielen Personen?", { min: 1, max: 6 })],
        ["menu", F("single", "Dein Menü", { options: ["Fleisch", "Fisch", "Vegetarisch"] })],
        ["song", F("short", "Welcher Song bringt dich auf die Tanzfläche?")],
        ["note", F("long", "Liebe Worte an uns")],
      ], { p: { ref: "c", op: "eq", value: "Ja, mit Freude!", field: "" }, menu: { ref: "c", op: "eq", value: "Ja, mit Freude!", field: "" }, song: { ref: "c", op: "eq", value: "Ja, mit Freude!", field: "" } }) }) },
  { id: "workshop", name: "Workshop-Anmeldung", hint: "Termin, Level, Erwartungen", icon: "Presentation", category: "Events",
    build: () => ({ title: "Barista-Workshop", description: "Lerne Latte Art in zwei Stunden. Max. 8 Personen pro Termin.",
      settings: S({ look: "espresso", mode: "dark", thankYouTitle: "Angemeldet", thankYou: "Alle Infos bekommst du per E-Mail.", maxResponses: 32 }),
      fields: [F("single", "Termin", { required: true, options: ["Sa, 14. März, 10 Uhr", "Sa, 21. März, 10 Uhr", "So, 22. März, 14 Uhr", "Sa, 28. März, 10 Uhr"] }), F("single", "Deine Erfahrung", { options: ["Anfänger", "Fortgeschritten", "Profi"] }), F("short", "Name", { required: true, width: "half" }), F("email", "E-Mail", { required: true, width: "half" }), F("long", "Was möchtest du lernen?")] }) },
  { id: "raffle", name: "Gewinnspiel", hint: "Teilnahme mit Einwilligung", icon: "Gift", category: "Events",
    build: () => ({ title: "Gewinne ein Essen für zwei", description: "Teilnahme bis Monatsende. Die Gewinner benachrichtigen wir per E-Mail.",
      settings: S({ look: "rose", mode: "light", thankYouTitle: "Du bist im Lostopf!", thankYou: "Viel Glück!", buttonText: "Teilnehmen", oncePerDevice: true }),
      fields: [F("short", "Vorname", { required: true, width: "half" }), F("email", "E-Mail", { required: true, width: "half" }), F("single", "Dein Lieblingsgericht?", { options: ["Pizza", "Pasta", "Burger", "Salat"] }), F("consent", "Ich akzeptiere die Teilnahmebedingungen und die Datenschutzerklärung.", { required: true }), F("consent", "Ich möchte Angebote per E-Mail bekommen. (optional)")] }) },

  // ── Umfragen ──
  { id: "poll", name: "Abstimmung", hint: "Live-Ergebnis nach der Stimme", icon: "BarChart3", category: "Umfragen",
    build: () => ({ title: "Welches Gericht kommt neu auf die Karte?", description: "Stimm ab und sieh sofort das Ergebnis.",
      settings: S({ look: "lime", mode: "dark", thankYouTitle: "Danke für deine Stimme!", showResults: true, buttonText: "Abstimmen", oncePerDevice: true, showProgress: false }),
      fields: [F("single", "Deine Wahl", { required: true, options: ["Lahmacun", "Falafel-Bowl", "Pide", "Chicken Wings"] })] }) },
  { id: "survey", name: "Kundenumfrage", hint: "Mehrere Fragen, Schritt für Schritt", icon: "ClipboardList", category: "Umfragen",
    build: () => ({ title: "Hilf uns, besser zu werden", description: "5 kurze Fragen, etwa 1 Minute.",
      settings: S({ look: "lavender", mode: "light", layout: "steps", thankYouTitle: "Vielen Dank!", thankYou: "Als Dankeschön: 10 % beim nächsten Besuch mit dem Code DANKE10." }),
      fields: [F("single", "Wie oft besuchst du uns?", { required: true, options: ["Zum ersten Mal", "Ab und zu", "Jede Woche", "Fast täglich"] }), F("rating", "Wie bewertest du unsere Preise?"), F("slider", "Wie lange hast du gewartet? (Minuten)", { min: 0, max: 60, step: 5, minLabel: "0", maxLabel: "60+" }), F("multi", "Was sollen wir anbieten?", { options: ["Frühstück", "Lieferung", "Mittagstisch", "Happy Hour", "Kinderkarte"], maxSelect: 2, help: "Höchstens zwei" }), F("long", "Noch etwas?")] }) },
  { id: "quickpoll", name: "Ja-oder-Nein", hint: "Eine schnelle Frage", icon: "ToggleLeft", category: "Umfragen",
    build: () => ({ title: "Sollen wir sonntags öffnen?", description: "Deine Stimme zählt.",
      settings: S({ look: "pomegranate", mode: "dark", thankYouTitle: "Danke!", showResults: true, buttonText: "Abstimmen", showProgress: false }),
      fields: [F("yesno", "Sonntags geöffnet?", { required: true })] }) },

  // ── Team & HR ──
  { id: "job", name: "Kurzbewerbung", hint: "Bewerben in einer Minute", icon: "Briefcase", category: "Team & HR",
    build: () => ({ title: "Werde Teil unseres Teams", description: "Kein Anschreiben nötig. Wir melden uns innerhalb von 3 Tagen.",
      settings: S({ look: "lime", mode: "light", layout: "steps", thankYouTitle: "Bewerbung erhalten", thankYou: "Wir melden uns bei dir!", buttonText: "Jetzt bewerben", notifyOwner: true }),
      fields: withLogic([
        ["pos", F("single", "Für welche Stelle?", { required: true, options: ["Service", "Küche", "Lieferfahrer", "Aushilfe"] })],
        ["lic", F("yesno", "Hast du einen Führerschein?", { required: true })],
        ["av", F("multi", "Wann kannst du arbeiten?", { options: ["Vormittags", "Nachmittags", "Abends", "Wochenende"] })],
        ["exp", F("slider", "Jahre Erfahrung", { min: 0, max: 15, minLabel: "keine", maxLabel: "15+" })],
        ["n", F("short", "Name", { required: true, width: "half" })],
        ["t", F("phone", "Telefon", { required: true, width: "half" })],
        ["link", F("url", "Lebenslauf oder Profil (optional)", { placeholder: "https://" })],
      ], { lic: { ref: "pos", op: "eq", value: "Lieferfahrer", field: "" } }) }) },
  { id: "staff", name: "Team-Feedback", hint: "Anonyme Stimmung im Team", icon: "Users", category: "Team & HR",
    build: () => ({ title: "Wie geht's dir im Team?", description: "Anonym. Nur zusammengefasst sichtbar.",
      settings: S({ look: "sky", mode: "light", layout: "steps", thankYouTitle: "Danke fürs Teilen", thankYou: "Wir besprechen die Ergebnisse im nächsten Teammeeting." }),
      fields: [F("rating", "Wie wohl fühlst du dich bei der Arbeit?", { required: true }), F("slider", "Wie stressig war der letzte Monat?", { min: 1, max: 10, minLabel: "entspannt", maxLabel: "sehr stressig" }), F("long", "Was sollten wir ändern?"), F("long", "Was läuft richtig gut?")] }) },
  { id: "vacation", name: "Urlaubsantrag", hint: "Zeitraum und Vertretung", icon: "Palmtree", category: "Team & HR",
    build: () => ({ title: "Urlaubsantrag", description: "Bitte mindestens vier Wochen vorher einreichen.",
      settings: S({ look: "ocean", mode: "light", thankYouTitle: "Antrag eingereicht", thankYou: "Du bekommst Bescheid, sobald er genehmigt ist.", notifyOwner: true, showProgress: false }),
      fields: [F("short", "Name", { required: true }), F("date", "Von", { required: true, width: "half" }), F("date", "Bis", { required: true, width: "half" }), F("single", "Art", { options: ["Erholungsurlaub", "Sonderurlaub", "Unbezahlt"] }), F("short", "Vertretung"), F("long", "Bemerkung")] }) },

  // ── Geschäft ──
  { id: "quote", name: "Angebotsanfrage", hint: "Leistung, Umfang, Budget", icon: "FileText", category: "Geschäft",
    build: () => ({ title: "Angebot anfragen", description: "Beschreib dein Projekt. Du bekommst ein unverbindliches Angebot.",
      settings: S({ look: "mono", mode: "dark", layout: "steps", thankYouTitle: "Danke!", thankYou: "Wir melden uns mit einem Angebot.", notifyOwner: true }),
      fields: [F("multi", "Was brauchst du?", { required: true, options: ["Beratung", "Design", "Umsetzung", "Wartung"], other: true }), F("long", "Beschreib dein Vorhaben", { required: true, min: 20 }), F("dropdown", "Budget", { options: ["bis 1.000 €", "1.000–5.000 €", "5.000–15.000 €", "über 15.000 €"] }), F("date", "Gewünschter Start"), F("short", "Firma", { width: "half" }), F("short", "Name", { required: true, width: "half" }), F("email", "E-Mail", { required: true, width: "half" }), F("phone", "Telefon", { width: "half" })] }) },
  { id: "appointment", name: "Terminanfrage", hint: "Leistung, Tag, Uhrzeit", icon: "CalendarClock", category: "Geschäft",
    build: () => ({ title: "Termin anfragen", description: "Wähle deine Wunschzeit. Wir bestätigen per E-Mail.",
      settings: S({ look: "rose", mode: "light", thankYouTitle: "Anfrage erhalten", thankYou: "Wir bestätigen deinen Termin in Kürze.", notifyOwner: true }),
      fields: [F("single", "Leistung", { required: true, options: ["Beratung", "Haarschnitt", "Färben", "Styling"] }), F("date", "Wunschtag", { required: true, width: "half" }), F("time", "Uhrzeit", { required: true, width: "half" }), F("short", "Name", { required: true, width: "half" }), F("phone", "Telefon", { required: true, width: "half" }), F("email", "E-Mail für die Bestätigung", { required: true })] }) },
  { id: "newsletter", name: "Newsletter", hint: "E-Mail mit Einwilligung", icon: "Newspaper", category: "Geschäft",
    build: () => ({ title: "Nichts mehr verpassen", description: "Neue Gerichte, Events und exklusive Angebote. Einmal im Monat.",
      settings: S({ look: "aurora", mode: "dark", thankYouTitle: "Willkommen!", thankYou: "Schau gleich in dein Postfach.", buttonText: "Anmelden", showProgress: false }),
      fields: [F("short", "Vorname", { width: "half" }), F("email", "E-Mail", { required: true, width: "half" }), F("multi", "Was interessiert dich?", { options: ["Neue Gerichte", "Events", "Angebote"] }), F("consent", "Ja, ich möchte den Newsletter erhalten. Abmelden geht jederzeit.", { required: true })] }) },
  { id: "membership", name: "Mitgliedsantrag", hint: "Verein, Club, Studio", icon: "BadgeCheck", category: "Geschäft",
    build: () => ({ title: "Mitglied werden", description: "Fülle den Antrag aus, wir melden uns zur Bestätigung.",
      settings: S({ look: "terracotta", mode: "light", thankYouTitle: "Antrag erhalten", thankYou: "Willkommen in der Gemeinschaft!", notifyOwner: true }),
      fields: [F("section", "Deine Daten"), F("short", "Vorname", { required: true, width: "half" }), F("short", "Nachname", { required: true, width: "half" }), F("date", "Geburtsdatum", { width: "half" }), F("phone", "Telefon", { width: "half" }), F("email", "E-Mail", { required: true }), F("section", "Mitgliedschaft"), F("single", "Tarif", { required: true, options: ["Basis 19 €/Monat", "Plus 29 €/Monat", "Familie 49 €/Monat"] }), F("statement", "Die Mitgliedschaft läuft 12 Monate und verlängert sich danach monatlich."), F("consent", "Ich akzeptiere die Satzung und die Datenschutzerklärung.", { required: true })] }) },
];
