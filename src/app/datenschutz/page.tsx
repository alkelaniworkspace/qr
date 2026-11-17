import type { Metadata } from "next";
import { site } from "@/lib/site";
import { LegalPage, Sec } from "@/components/marketing/legal";

export const metadata: Metadata = { title: "Datenschutzerklärung", description: `Wie ${site.name} mit deinen Daten umgeht.` };

const mail = <a href={`mailto:${site.email}`}>{site.email}</a>;

export default function Page() {
  const o = site.owner;
  return (
    <LegalPage title="Datenschutzerklärung" updated="17. November 2026">
      <p className="text-[15px] leading-relaxed text-dim">
        Wir nehmen den Schutz deiner Daten ernst. Hier erklären wir in klarer Sprache, welche Daten {site.name} ({site.domain}) verarbeitet, wofür, auf welcher Rechtsgrundlage und welche Rechte du hast. Wir verkaufen keine Daten und zeigen keine Werbung.
      </p>

      <Sec n={1} title="Verantwortlicher">
        <p>
          {o.name && <><b>{o.name}</b><br /></>}
          {o.street && <>{o.street}<br /></>}
          {o.city && <>{o.city}<br /></>}
          {!o.name && <><b>{site.name}</b><br /></>}
          E-Mail: {mail}
          {o.phone && <><br />Telefon: {o.phone}</>}
        </p>
        <p>Für alle Fragen zum Datenschutz und zur Ausübung deiner Rechte erreichst du uns unter {mail}.</p>
      </Sec>

      <Sec n={2} title="Hosting und Server-Logs">
        <p>Die Website wird bei <b>Vercel Inc.</b> (440 N Barranca Ave #4133, Covina, CA 91723, USA) gehostet. Beim Aufruf jeder Seite verarbeitet der Server technisch notwendige Daten: IP-Adresse, Datum und Uhrzeit, aufgerufene Adresse, Browser und Betriebssystem. Diese Daten dienen nur dem sicheren und stabilen Betrieb und werden nach kurzer Zeit gelöscht.</p>
        <p>Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem sicheren Betrieb). Mit Vercel besteht ein Auftragsverarbeitungsvertrag; für Übermittlungen in die USA gelten das EU-US Data Privacy Framework bzw. EU-Standardvertragsklauseln.</p>
      </Sec>

      <Sec n={3} title="Konto und Anmeldung">
        <p>Für dynamische QR-Codes, Statistiken und gehostete Seiten brauchst du ein Konto. Dabei speichern wir deine <b>E-Mail-Adresse</b>, deinen <b>Namen</b> (falls angegeben), ein verschlüsseltes Passwort (falls du dich per E-Mail registrierst), Zeitpunkt der Registrierung und der letzten Anmeldung sowie deinen Tarif.</p>
        <p>Konten und Inhalte werden bei <b>Supabase Inc.</b> gespeichert (Datenbank, Anmeldung und Dateispeicher). Mit Supabase besteht ein Auftragsverarbeitungsvertrag; Übermittlungen in die USA sind über EU-Standardvertragsklauseln abgesichert.</p>
        <p>Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Erfüllung des Nutzungsvertrags). Wir speichern die Daten, solange dein Konto besteht. Nach einer Löschung des Kontos werden die Daten innerhalb von 30 Tagen entfernt, soweit keine gesetzlichen Aufbewahrungspflichten bestehen.</p>
      </Sec>

      <Sec n={4} title="Anmeldung mit Google">
        <p>Du kannst dich optional mit deinem Google-Konto anmelden („Sign in with Google“, Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland). Dabei erhalten wir von Google ausschließlich die folgenden Daten, denen du im Google-Dialog zustimmst:</p>
        <ul>
          <li><b>E-Mail-Adresse</b> (um dein Konto eindeutig zuzuordnen und dich bei Bedarf zu kontaktieren, z. B. zu deinem Konto oder Tarif),</li>
          <li><b>Name</b> (zur Anzeige in deinem Konto),</li>
          <li><b>Profilbild</b> (optional zur Anzeige in deinem Konto),</li>
          <li>eine <b>Google-Kontokennung</b> (damit du dich wieder anmelden kannst).</li>
        </ul>
        <p>Wir nutzen diese Daten <b>ausschließlich</b>, um dein {site.name}-Konto anzulegen, dich anzumelden und den Dienst bereitzustellen. Wir greifen <b>nicht</b> auf deine Google-Kontakte, E-Mails, Dateien, deinen Kalender oder andere Google-Dienste zu. Wir verkaufen diese Daten nicht, geben sie nicht an Dritte für Werbung weiter und nutzen sie nicht zum Trainieren von KI-Modellen.</p>
        <p>Die Nutzung und Weitergabe von Informationen, die wir von Google-APIs erhalten, entspricht der <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener">Google API Services User Data Policy</a>, einschließlich der Anforderungen zur eingeschränkten Nutzung („Limited Use“).</p>
        <p>Du kannst die Verbindung jederzeit in deinem Google-Konto unter <a href="https://myaccount.google.com/connections" target="_blank" rel="noopener">myaccount.google.com/connections</a> trennen und die Löschung deines {site.name}-Kontos samt dieser Daten per E-Mail an {mail} verlangen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.</p>
      </Sec>

      <Sec n={5} title="QR-Codes und Inhalte">
        <p><b>Statische QR-Codes</b> erstellst du ohne Konto. Sie werden nur in deinem Browser (lokaler Speicher) abgelegt und nicht an uns übertragen.</p>
        <p><b>Dynamische QR-Codes</b> und gehostete Seiten (z. B. Speisekarte, Linkseite, Visitenkarte, Event) speichern wir mit den Inhalten und Bildern, die du einträgst, damit sie beim Scannen angezeigt werden können. Du entscheidest selbst, welche Inhalte öffentlich sind. Gelöschte Codes liegen 30 Tage im Papierkorb und werden danach automatisch endgültig gelöscht.</p>
      </Sec>

      <Sec n={6} title="Scan-Statistiken">
        <p>Wenn jemand einen dynamischen Code scannt, zählen wir den Scan für die Statistik des Code-Inhabers. Gespeichert werden Zeitpunkt, ungefähres Land und Stadt, Gerätetyp, Betriebssystem, Browser und Sprache.</p>
        <p><b>Wir speichern keine IP-Adressen.</b> Um eindeutige Besucher zu zählen, bilden wir aus IP-Adresse und Browserkennung einen täglich wechselnden, gesalzenen Hash-Wert, der keine Rückschlüsse auf eine Person zulässt. Es werden keine Cookies gesetzt und keine Profile über mehrere Codes oder Tage gebildet.</p>
        <p>Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse der Code-Inhaber an einer anonymen Reichweitenmessung).</p>
      </Sec>

      <Sec n={7} title="Formulare, Umfragen und Event-Anmeldungen">
        <p>Wenn du auf einer gehosteten Seite ein Formular ausfüllst, an einer Umfrage teilnimmst oder dich zu einem Event anmeldest, speichern wir deine Angaben und stellen sie dem jeweiligen Seiteninhaber zur Verfügung. Für diese Inhalte ist der Seiteninhaber verantwortlich; {site.name} verarbeitet sie in seinem Auftrag (Art. 28 DSGVO).</p>
        <p>Bestätigungs-E-Mails (z. B. zur Event-Anmeldung) versenden wir über <b>Resend</b> (Resend Inc., USA; Versand über Server in der EU). Mit Resend besteht ein Auftragsverarbeitungsvertrag.</p>
      </Sec>

      <Sec n={8} title="E-Mails">
        <p>Wir senden dir nur E-Mails, die für dein Konto nötig sind: Bestätigung der Registrierung, Anmelde-Links, Zurücksetzen des Passworts und wichtige Hinweise zu deinem Konto oder Tarif. Newsletter schicken wir nur mit deiner ausdrücklichen Einwilligung.</p>
        <p>Wenn du uns per E-Mail schreibst, verarbeiten wir deine Nachricht, um sie zu beantworten (Art. 6 Abs. 1 lit. b bzw. f DSGVO). Unser Postfach wird bei Hostinger International Ltd. betrieben.</p>
      </Sec>

      <Sec n={9} title="Cookies und lokaler Speicher">
        <p>Wir verwenden nur <b>technisch notwendige</b> Cookies und Browser-Speicher: für die Anmeldung (Sitzung), deine Spracheinstellung, das helle oder dunkle Design und deine statischen Codes. Es gibt keine Tracking-, Analyse- oder Werbe-Cookies. Deshalb brauchen wir kein Cookie-Banner (§ 25 Abs. 2 TDDDG).</p>
      </Sec>

      <Sec n={10} title="Bilder externer Seiten">
        <p>Wenn du Bilder per Link einfügst oder eine Speisekarte von einer anderen Website importierst, ruft unser Server diese Bilder ab und speichert eine optimierte Kopie zwischen. Dabei wird nur die Adresse unseres Servers an die fremde Seite übermittelt, nicht die deiner Besucher.</p>
      </Sec>

      <Sec n={11} title="Deine Rechte">
        <p>Du hast jederzeit das Recht auf</p>
        <ul>
          <li>Auskunft über deine gespeicherten Daten (Art. 15 DSGVO),</li>
          <li>Berichtigung (Art. 16) und Löschung (Art. 17),</li>
          <li>Einschränkung der Verarbeitung (Art. 18) und Datenübertragbarkeit (Art. 20),</li>
          <li>Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen (Art. 21),</li>
          <li>Widerruf einer erteilten Einwilligung mit Wirkung für die Zukunft (Art. 7 Abs. 3).</li>
        </ul>
        <p>Schreib uns dazu einfach an {mail}. Außerdem kannst du dich bei einer Datenschutz-Aufsichtsbehörde beschweren, zum Beispiel bei der Behörde deines Wohnorts.</p>
      </Sec>

      <Sec n={12} title="Sicherheit">
        <p>Alle Verbindungen sind per HTTPS verschlüsselt. Passwörter speichern wir nur als sicheren Hash. Der Zugriff auf Daten ist auf Datenbankebene so eingeschränkt, dass jede Person nur ihre eigenen Codes und Auswertungen sehen kann.</p>
      </Sec>

      <Sec n={13} title="Änderungen">
        <p>Wenn sich der Dienst ändert, passen wir diese Erklärung an. Es gilt jeweils die hier veröffentlichte Fassung.</p>
      </Sec>
    </LegalPage>
  );
}
