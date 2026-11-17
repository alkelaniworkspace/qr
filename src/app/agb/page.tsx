import type { Metadata } from "next";
import { site } from "@/lib/site";
import { LegalPage, Sec } from "@/components/marketing/legal";

export const metadata: Metadata = { title: "AGB", description: `Allgemeine Geschäftsbedingungen von ${site.name}.` };

const mail = <a href={`mailto:${site.email}`}>{site.email}</a>;

export default function Page() {
  const who = site.owner.name || site.name;
  return (
    <LegalPage title="Allgemeine Geschäftsbedingungen" updated="17. November 2026">
      <Sec n={1} title="Geltungsbereich">
        <p>Diese AGB gelten für alle Verträge über die Nutzung von {site.name} ({site.domain}) zwischen {who} („wir“) und den Nutzerinnen und Nutzern („du“). Abweichende Bedingungen gelten nur, wenn wir ihnen ausdrücklich zustimmen.</p>
      </Sec>
      <Sec n={2} title="Leistungen">
        <p>{site.name} ist ein Online-Dienst zum Erstellen, Gestalten und Verwalten von QR-Codes und mobilen Seiten (z. B. Speisekarten, Linkseiten, Visitenkarten, Formulare). Der genaue Umfang ergibt sich aus der Tarifübersicht unter <a href="/preise">{site.domain}/preise</a> zum Zeitpunkt der Buchung.</p>
        <p>Statische QR-Codes enthalten ihren Inhalt direkt und funktionieren unabhängig von uns. Dynamische Codes leiten über unsere Server weiter und funktionieren, solange dein Konto besteht, auch nach einem Wechsel in den Free-Tarif.</p>
        <p>Wir entwickeln den Dienst laufend weiter. Wir halten eine Verfügbarkeit von 99 % im Jahresmittel an, ausgenommen geplante Wartung und Störungen außerhalb unseres Einflusses.</p>
      </Sec>
      <Sec n={3} title="Konto">
        <p>Für dynamische Codes brauchst du ein Konto. Deine Angaben müssen wahr sein, deine Zugangsdaten hältst du geheim. Ein Konto ist nicht übertragbar.</p>
      </Sec>
      <Sec n={4} title="Vertragsschluss und Testphase">
        <p>Der Free-Tarif ist kostenlos. Ein kostenpflichtiger Vertrag kommt zustande, wenn du einen Tarif auswählst und die Bestellung über die Schaltfläche mit Zahlungspflicht abschließt. Wir bestätigen den Vertrag per E-Mail.</p>
        <p>Beim ersten Abo kann eine kostenlose Testphase von 14 Tagen gelten. Kündigst du innerhalb der Testphase, entstehen keine Kosten. Sonst beginnt danach die bezahlte Laufzeit.</p>
      </Sec>
      <Sec n={5} title="Preise und Zahlung">
        <p>Es gelten die bei der Bestellung angezeigten Preise. Die Zahlung erfolgt im Voraus für den gewählten Abrechnungszeitraum (monatlich oder jährlich) über unseren Zahlungsdienstleister Stripe. Rechnungen erhältst du per E-Mail und in deinem Konto.</p>
        <p>Beim Wechsel in einen höheren Tarif wird der Preis anteilig verrechnet. Beim Wechsel in einen kleineren Tarif wird das Guthaben mit künftigen Rechnungen verrechnet.</p>
        <p>Schlägt eine Zahlung fehl, informieren wir dich. Bleibt sie aus, dürfen wir das Konto nach Hinweis in den Free-Tarif zurückstufen.</p>
      </Sec>
      <Sec n={6} title="Laufzeit und Kündigung">
        <p>Abos laufen für den gewählten Zeitraum und verlängern sich automatisch um denselben Zeitraum, wenn du nicht kündigst. Nach Ablauf der ersten Laufzeit kannst du ein Jahresabo jederzeit mit einer Frist von einem Monat kündigen.</p>
        <p>Du kündigst jederzeit mit einem Klick unter „Tarif & Rechnungen“, über den Button <a href="/kuendigen">„Verträge hier kündigen“</a> oder per E-Mail an {mail}. Die Kündigung wirkt zum Ende des bezahlten Zeitraums. Danach läuft dein Konto im Free-Tarif weiter.</p>
        <p>Das Recht zur Kündigung aus wichtigem Grund bleibt unberührt.</p>
      </Sec>
      <Sec n={7} title="Deine Inhalte und Pflichten">
        <p>Du bist für die Inhalte verantwortlich, die du mit {site.name} veröffentlichst, und stellst sicher, dass du die Rechte daran hast. Verboten sind insbesondere rechtswidrige, täuschende oder schädliche Inhalte, Phishing, Schadsoftware, Spam sowie Inhalte, die Rechte Dritter verletzen.</p>
        <p>Du räumst uns die Rechte ein, die nötig sind, um deine Inhalte zu speichern und anzuzeigen. Alle anderen Rechte bleiben bei dir.</p>
      </Sec>
      <Sec n={8} title="Sperrung">
        <p>Bei Verstößen gegen diese AGB oder geltendes Recht dürfen wir einzelne Codes pausieren oder das Konto sperren. Wir informieren dich, soweit das rechtlich zulässig ist, und berücksichtigen deine berechtigten Interessen.</p>
      </Sec>
      <Sec n={9} title="Haftung">
        <p>Wir haften unbeschränkt bei Vorsatz, grober Fahrlässigkeit, bei Verletzung von Leben, Körper oder Gesundheit sowie nach dem Produkthaftungsgesetz. Bei leichter Fahrlässigkeit haften wir nur bei Verletzung wesentlicher Vertragspflichten und begrenzt auf den vorhersehbaren, typischen Schaden.</p>
      </Sec>
      <Sec n={10} title="Datenschutz">
        <p>Wie wir mit personenbezogenen Daten umgehen, steht in unserer <a href="/datenschutz">Datenschutzerklärung</a>.</p>
      </Sec>
      <Sec n={11} title="Änderungen der AGB">
        <p>Wir können diese AGB mit Wirkung für die Zukunft ändern, wenn dafür ein sachlicher Grund besteht. Wir informieren dich mindestens sechs Wochen vorher per E-Mail. Widersprichst du nicht innerhalb dieser Frist, gelten die Änderungen als angenommen. Auf diese Folge weisen wir dich in der Mitteilung hin. Bei Widerspruch können beide Seiten den Vertrag zum Änderungszeitpunkt kündigen.</p>
      </Sec>
      <Sec n={12} title="Schlussbestimmungen">
        <p>Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Für Verbraucher gilt diese Rechtswahl nur, soweit dadurch nicht zwingende Schutzvorschriften ihres Wohnsitzlandes entzogen werden. Sollte eine Bestimmung unwirksam sein, bleibt der Rest wirksam.</p>
      </Sec>
    </LegalPage>
  );
}
