import type { Metadata } from "next";
import { site } from "@/lib/site";
import { LegalPage, Sec } from "@/components/marketing/legal";

export const metadata: Metadata = { title: "Impressum" };

export default function Page() {
  const o = site.owner;
  const missing = !o.name || !o.street || !o.city;
  return (
    <LegalPage title="Impressum" updated="17. November 2026">
      <Sec n={1} title="Angaben gemäß § 5 DDG">
        {missing ? (
          <p className="rounded-xl border border-gold/30 bg-gold/10 p-4 text-gold">Name und Anschrift werden gerade ergänzt.</p>
        ) : (
          <p><b>{o.name}</b><br />{o.street}<br />{o.city}<br />Deutschland</p>
        )}
      </Sec>
      <Sec n={2} title="Kontakt">
        <p>E-Mail: <a href={`mailto:${site.email}`}>{site.email}</a>{o.phone && <><br />Telefon: {o.phone}</>}</p>
      </Sec>
      <Sec n={3} title="Verantwortlich für den Inhalt">
        <p>{o.name || site.name}{o.street && <>, {o.street}, {o.city}</>}</p>
      </Sec>
      <Sec n={4} title="Verbraucherstreitbeilegung">
        <p>Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
      </Sec>
      <Sec n={5} title="Inhalte unserer Nutzer">
        <p>Seiten, die über Kurzlinks wie {site.domain}/r/… oder {site.domain}/p/… erreichbar sind, werden von unseren Nutzern erstellt. Für diese Inhalte ist der jeweilige Nutzer verantwortlich. Hinweise auf rechtswidrige Inhalte nehmen wir unter <a href={`mailto:${site.email}`}>{site.email}</a> entgegen und prüfen sie umgehend.</p>
      </Sec>
    </LegalPage>
  );
}
