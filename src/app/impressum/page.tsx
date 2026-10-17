import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content";

export const metadata: Metadata = {
  title: "Impressum | tool2day",
  description: "Impressum und Anbieterkennzeichnung von tool2day.",
};

export default function ImpressumPage() {
  return (
    <main className="shell section legal-page">
      <p className="eyebrow">Rechtliches</p>
      <h1>Impressum</h1>

      <section>
        <h2>Angaben gemäß § 5 DDG</h2>
        <p>
          tool2day
          <br />
          Holtheimer Weg 13D
          <br />
          12207 Berlin
          <br />
          Deutschland
        </p>
      </section>

      <section>
        <h2>Vertreten durch</h2>
        <p>Geschäftsführer: Lukas Unglaub</p>
      </section>

      <section>
        <h2>Kontakt</h2>
        <p>
          E-Mail:{" "}
          <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
          <br />
          Telefon:{" "}
          <a href="tel:+4915567753060">+49 15567 753060</a>
        </p>
      </section>

      <section>
        <h2>Registereintrag</h2>
        <p>
          Registergericht: Amtsgericht Charlottenburg (Berlin)
          <br />
          Registernummer: HRB 261100 B
        </p>
      </section>

      <section>
        <h2>Umsatzsteuer</h2>
        <p>
          Als Kleinunternehmer im Sinne von § 19 Abs. 1 UStG wird keine
          Umsatzsteuer berechnet und daher auch nicht in Rechnungen ausgewiesen.
          Eine Umsatzsteuer-Identifikationsnummer nach § 27 a UStG liegt nicht
          vor.
        </p>
      </section>

      <section>
        <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
        <p>
          Lukas Unglaub
          <br />
          Holtheimer Weg 13D
          <br />
          12207 Berlin
        </p>
      </section>

      <section>
        <h2>Streitschlichtung</h2>
        <p>
          Wir sind nicht bereit und nicht verpflichtet, an
          Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
          teilzunehmen.
        </p>
      </section>

      <section>
        <h2>Haftung für Inhalte</h2>
        <p>
          Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach
          den allgemeinen Gesetzen verantwortlich. Wir sind jedoch nicht
          verpflichtet, übermittelte oder gespeicherte fremde Informationen zu
          überwachen oder nach Umständen zu forschen, die auf eine
          rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder
          Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen
          bleiben hiervon unberührt. Sobald uns konkrete Rechtsverletzungen
          bekannt werden, entfernen wir die betreffenden Inhalte umgehend.
        </p>
      </section>

      <section>
        <h2>Haftung für Links</h2>
        <p>
          Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren
          Inhalte wir keinen Einfluss haben. Für diese fremden Inhalte ist stets
          der jeweilige Anbieter verantwortlich. Zum Zeitpunkt der Verlinkung
          waren keine Rechtsverstöße erkennbar. Eine dauerhafte inhaltliche
          Kontrolle verlinkter Seiten ist ohne konkrete Anhaltspunkte einer
          Rechtsverletzung nicht zumutbar. Bei bekannt werdenden
          Rechtsverletzungen entfernen wir solche Links umgehend.
        </p>
      </section>

      <section>
        <h2>Urheberrecht</h2>
        <p>
          Die durch uns erstellten Inhalte und Werke auf diesen Seiten unterliegen
          dem deutschen Urheberrecht. Vervielfältigung, Bearbeitung, Verbreitung
          und jede Art der Verwertung außerhalb der Grenzen des Urheberrechts
          bedürfen unserer schriftlichen Zustimmung. Downloads und Kopien dieser
          Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.
          Soweit die Inhalte auf dieser Seite nicht von uns erstellt wurden,
          werden die Urheberrechte Dritter beachtet und entsprechend gekennzeichnet.
        </p>
      </section>

      <p className="legal-stand">Stand: 17. Oktober 2026</p>

      <p className="legal-back">
        <Link href="/de">← tool2day</Link>
      </p>
    </main>
  );
}
