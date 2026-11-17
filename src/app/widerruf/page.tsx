import type { Metadata } from "next";
import { site } from "@/lib/site";
import { LegalPage, Sec } from "@/components/marketing/legal";

export const metadata: Metadata = { title: "Widerrufsbelehrung" };

export default function Page() {
  const o = site.owner;
  const address = [o.name || site.name, o.street, o.city].filter(Boolean).join(", ");
  return (
    <LegalPage title="Widerrufsbelehrung" updated="17. November 2026">
      <p className="text-[15px] leading-relaxed text-dim">Verbraucherinnen und Verbrauchern steht ein Widerrufsrecht nach folgender Maßgabe zu.</p>
      <Sec n={1} title="Widerrufsrecht">
        <p>Du hast das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.</p>
        <p>Um dein Widerrufsrecht auszuüben, musst du uns ({address}, E-Mail: <a href={`mailto:${site.email}`}>{site.email}</a>) mittels einer eindeutigen Erklärung (z. B. eine E-Mail) über deinen Entschluss, diesen Vertrag zu widerrufen, informieren. Du kannst dafür das unten stehende Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.</p>
        <p>Zur Wahrung der Widerrufsfrist reicht es aus, dass du die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absendest.</p>
      </Sec>
      <Sec n={2} title="Folgen des Widerrufs">
        <p>Wenn du diesen Vertrag widerrufst, haben wir dir alle Zahlungen, die wir von dir erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über deinen Widerruf bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das du bei der ursprünglichen Transaktion eingesetzt hast, es sei denn, mit dir wurde ausdrücklich etwas anderes vereinbart. In keinem Fall werden dir wegen dieser Rückzahlung Entgelte berechnet.</p>
        <p>Hast du verlangt, dass die Dienstleistung während der Widerrufsfrist beginnen soll, so hast du uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem Zeitpunkt, zu dem du uns von der Ausübung des Widerrufsrechts unterrichtest, bereits erbrachten Dienstleistungen im Vergleich zum Gesamtumfang der im Vertrag vorgesehenen Dienstleistungen entspricht.</p>
      </Sec>
      <Sec n={3} title="Muster-Widerrufsformular">
        <div className="rounded-2xl border border-edge bg-hi/[0.03] p-5 text-fg/90">
          <p>(Wenn du den Vertrag widerrufen willst, fülle bitte dieses Formular aus und sende es zurück.)</p>
          <p className="mt-3">An {address}, E-Mail: {site.email}</p>
          <p className="mt-3">Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die Erbringung der folgenden Dienstleistung: ____________</p>
          <p className="mt-3">Bestellt am (*) / erhalten am (*): ____________</p>
          <p>Name des/der Verbraucher(s): ____________</p>
          <p>Anschrift des/der Verbraucher(s): ____________</p>
          <p>Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier): ____________</p>
          <p>Datum: ____________</p>
          <p className="mt-3 text-[13px] text-faint">(*) Unzutreffendes streichen.</p>
        </div>
      </Sec>
    </LegalPage>
  );
}
