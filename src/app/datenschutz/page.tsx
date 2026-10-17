import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content";

export const metadata: Metadata = {
  title: "Datenschutz | tool2day",
  description: "Datenschutzerklärung von tool2day.",
};

export default function DatenschutzPage() {
  return (
    <main className="shell section legal-page">
      <p className="eyebrow">Rechtliches</p>
      <h1>Datenschutzerklärung</h1>

      <section>
        <h2>1. Verantwortlicher</h2>
        <p>
          Verantwortlich für die Datenverarbeitung auf dieser Webseite im Sinne
          der Datenschutz-Grundverordnung (DSGVO) ist:
        </p>
        <p>
          tool2day
          <br />
          Holtheimer Weg 13D
          <br />
          12207 Berlin
          <br />
          Deutschland
        </p>
        <p>
          Vertreten durch: Lukas Unglaub
          <br />
          E-Mail:{" "}
          <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
          <br />
          Telefon:{" "}
          <a href="tel:+4915567753060">+49 15567 753060</a>
        </p>
        <p>
          Ein Datenschutzbeauftragter ist nicht benannt, da die Voraussetzungen
          des Art. 37 DSGVO in Verbindung mit § 38 BDSG in unserem Unternehmen
          nicht erfüllt sind.
        </p>
      </section>

      <section>
        <h2>2. Hosting und Server-Logfiles</h2>
        <p>
          Diese Webseite wird über die Infrastruktur der Vercel Inc., 440 N
          Barranca Ave #4133, Covina, CA 91723, USA, bereitgestellt. Beim Aufruf
          der Seite können Verbindungsdaten (unter anderem IP-Adresse,
          Zeitstempel, angeforderte Ressource, User-Agent) in Server-Logfiles
          verarbeitet werden. Die Verarbeitung erfolgt zur Bereitstellung und
          Absicherung der Webseite. Rechtsgrundlage ist unser berechtigtes
          Interesse nach Art. 6 Abs. 1 lit. f DSGVO.
        </p>
        <p>
          Soweit eine Übermittlung in die USA stattfindet, erfolgt sie nach den
          jeweils geltenden Anforderungen der DSGVO (insbesondere geeignete
          Garantien des Auftragsverarbeiters). Eine Zusammenführung der
          Logdaten mit anderen Datenquellen durch uns findet nicht statt.
        </p>
      </section>

      <section>
        <h2>3. Cookies und lokale Speicherung</h2>
        <p>
          Diese Webseite verwendet technisch notwendige Cookies sowie optional
          Statistik-Cookies. Notwendige Cookies sind für den Betrieb der Seite
          erforderlich. Rechtsgrundlage ist § 25 Abs. 2 TDDDG in Verbindung mit
          Art. 6 Abs. 1 lit. f DSGVO. Alle übrigen Cookies werden nur mit Ihrer
          ausdrücklichen Einwilligung nach § 25 Abs. 1 TDDDG und Art. 6 Abs. 1
          lit. a DSGVO gesetzt.
        </p>
        <p>
          Notwendige Cookies: Wir setzen genau ein notwendiges Cookie. Es
          speichert Ihre Cookie-Entscheidung (t2d_consent, Laufzeit ein Jahr,
          SameSite=Lax), damit Sie nicht bei jedem Seitenaufruf erneut gefragt
          werden. Ihre Sprachauswahl wird über die Adresse der Seite abgebildet
          und nicht in einem Cookie gespeichert.
        </p>
        <p>
          Statistik-Cookies: Derzeit laden wir kein Analyse-Tool. Wird die
          Kategorie Statistik nicht aktiviert, werden weder Analyse-Skripte
          geladen noch entsprechende Cookies gesetzt. Ihre Entscheidung wird
          dennoch gespeichert, falls später eine Statistik-Funktion hinzukommt.
        </p>
        <p>
          Ihre Einwilligung können Sie jederzeit mit Wirkung für die Zukunft
          widerrufen, indem Sie im Footer „Cookie-Einstellungen“ öffnen oder das
          Cookie t2d_consent in Ihrem Browser löschen.
        </p>
        <p>
          Im Formular „Projekt starten“ können Entwurfsangaben vorübergehend in
          Ihrem Browser (localStorage) gespeichert werden, damit Sie Ihre
          Eingaben nicht verlieren. Diese Daten verbleiben auf Ihrem Endgerät
          und werden nicht automatisch an unsere Server übertragen.
        </p>
      </section>

      <section>
        <h2>4. Webanalyse</h2>
        <p>
          Wir setzen derzeit kein Webanalyse-Tool (wie Matomo oder vergleichbare
          Dienste) auf dieser Webseite ein. Es findet keine Auswertung Ihres
          Nutzungsverhaltens über Drittanbieter-Skripte statt.
        </p>
      </section>

      <section>
        <h2>5. Kontaktformular und Projektanfragen</h2>
        <p>
          Bei Nutzung des Kontaktformulars oder des Formulars für
          Projektanfragen werden die von Ihnen eingegebenen Daten verarbeitet,
          um Ihre Anfrage zu bearbeiten.
        </p>
        <p>
          Über das Kontaktformular sind das Ihr Name, Ihre E-Mail-Adresse,
          optional die gewünschte Leistung sowie Ihre Nachricht. Über das
          Formular für Projektanfragen zusätzlich Angaben wie
          Unternehmensname, bevorzugter Kontaktweg sowie Art, Zeitrahmen und
          Budgetrahmen des Projekts. Pflichtangaben sind mindestens Ihr Name,
          Ihre E-Mail-Adresse und die für die Bearbeitung erforderlichen
          Angaben zum Vorhaben. Alle übrigen Angaben sind freiwillig.
        </p>
        <p>
          Die Formulare öffnen derzeit einen E-Mail-Entwurf über Ihr lokales
          E-Mail-Programm (mailto). Die Daten werden erst übermittelt, wenn Sie
          die Nachricht in Ihrem E-Mail-Programm absenden. Eine Speicherung in
          einer eigenen Anfrage-Datenbank auf unserem Server findet derzeit
          nicht statt.
        </p>
        <p>
          Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, soweit die
          Verarbeitung der Durchführung vorvertraglicher Maßnahmen dient, im
          Übrigen Art. 6 Abs. 1 lit. f DSGVO. Eine Weitergabe an Dritte zu
          Werbezwecken findet nicht statt.
        </p>
        <p>
          Wir löschen Ihre Anfrage 6 Monate nach abgeschlossener Bearbeitung,
          sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen. Kommt
          ein Vertragsverhältnis zustande, gelten die handels- und
          steuerrechtlichen Aufbewahrungsfristen von bis zu 10 Jahren nach
          § 147 AO und § 257 HGB.
        </p>
      </section>

      <section>
        <h2>6. Spam-Schutz und Missbrauchsabwehr</h2>
        <p>
          Derzeit speichern wir für Formulare keine IP-Adressen zu
          Rate-Limiting-Zwecken auf unseren eigenen Servern. Technische
          Maßnahmen des Hosting-Anbieters zum Schutz vor Missbrauch und
          Angriffen bleiben davon unberührt. Rechtsgrundlage für solche
          Sicherheitsmaßnahmen ist Art. 6 Abs. 1 lit. f DSGVO.
        </p>
      </section>

      <section>
        <h2>7. E-Mail-Kommunikation</h2>
        <p>
          Wenn Sie uns per E-Mail kontaktieren oder über ein Formular eine
          Anfrage absenden, werden die übermittelten Daten gespeichert, um Ihre
          Anfrage zu bearbeiten. Der Empfang und die Beantwortung erfolgen über
          unsere E-Mail-Postfächer unter der Domain {site.domain}.
        </p>
        <p>
          Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO bei vertragsbezogener
          Kommunikation, im Übrigen unser berechtigtes Interesse an einer
          effektiven Bearbeitung Ihrer Anfrage nach Art. 6 Abs. 1 lit. f DSGVO.
        </p>
      </section>

      <section>
        <h2>8. Kontaktaufnahme über WhatsApp</h2>
        <p>
          Auf unserer Webseite kann ein Button erscheinen, über den Sie uns per
          WhatsApp kontaktieren können. Dabei handelt es sich um einen einfachen
          Link. Beim reinen Aufruf unserer Seiten werden keinerlei Daten an
          WhatsApp übertragen, es werden keine Inhalte von WhatsApp nachgeladen.
        </p>
        <p>
          Erst wenn Sie den Button aktiv anklicken, werden Sie zu WhatsApp
          weitergeleitet. Ab diesem Zeitpunkt gelten die
          Datenschutzbestimmungen der WhatsApp Ireland Limited, Merrion Road,
          Dublin 4, Irland. Diese verarbeitet dabei unter anderem Ihre
          Telefonnummer und Ihre Nachrichteninhalte. Eine Übermittlung von Daten
          in Drittländer außerhalb der EU, insbesondere in die USA, kann dabei
          nicht ausgeschlossen werden. Auf diese Verarbeitung haben wir keinen
          Einfluss.
        </p>
        <p>
          Die Nutzung dieses Kontaktwegs ist freiwillig. Sie können uns
          stattdessen jederzeit per E-Mail, Telefon oder über unser
          Kontaktformular erreichen. Weitere Informationen finden Sie in der
          Datenschutzrichtlinie von WhatsApp.
        </p>
      </section>

      <section>
        <h2>9. Rechte der betroffenen Personen</h2>
        <p>Sie haben das Recht auf:</p>
        <ul className="legal-list">
          <li>Auskunft über gespeicherte personenbezogene Daten (Art. 15 DSGVO)</li>
          <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
          <li>Löschung (Art. 17 DSGVO)</li>
          <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
          <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
          <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
          <li>Widerruf einer erteilten Einwilligung (Art. 7 Abs. 3 DSGVO)</li>
          <li>Beschwerde bei einer Aufsichtsbehörde (Art. 77 DSGVO)</li>
        </ul>
        <p>
          Zur Ausübung Ihrer Rechte genügt eine formlose Nachricht an{" "}
          <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
        </p>
      </section>

      <section>
        <h2>10. Widerspruchsrecht nach Art. 21 DSGVO</h2>
        <p>
          Sofern wir personenbezogene Daten auf Grundlage berechtigter
          Interessen nach Art. 6 Abs. 1 lit. f DSGVO verarbeiten, haben Sie das
          Recht, aus Gründen, die sich aus Ihrer besonderen Situation ergeben,
          jederzeit Widerspruch gegen diese Verarbeitung einzulegen.
        </p>
        <p>
          Legen Sie Widerspruch ein, verarbeiten wir die betroffenen Daten nicht
          mehr, es sei denn, wir können zwingende schutzwürdige Gründe
          nachweisen, die Ihre Interessen, Rechte und Freiheiten überwiegen,
          oder die Verarbeitung dient der Geltendmachung, Ausübung oder
          Verteidigung von Rechtsansprüchen.
        </p>
      </section>

      <section>
        <h2>11. Beschwerderecht bei der Aufsichtsbehörde</h2>
        <p>
          Unbeschadet anderweitiger Rechtsbehelfe steht Ihnen ein
          Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde zu. Für uns
          zuständig ist:
        </p>
        <p>
          Berliner Beauftragte für Datenschutz und Informationsfreiheit
          <br />
          Alt-Moabit 59-61
          <br />
          10555 Berlin
          <br />
          <a
            href="https://www.datenschutz-berlin.de"
            target="_blank"
            rel="noopener noreferrer"
          >
            www.datenschutz-berlin.de
          </a>
        </p>
      </section>

      <section>
        <h2>12. SSL-Verschlüsselung</h2>
        <p>
          Diese Seite nutzt aus Sicherheitsgründen eine TLS-Verschlüsselung. Eine
          verschlüsselte Verbindung erkennen Sie an dem „https://“ in der
          Adresszeile Ihres Browsers. Solange die Verschlüsselung aktiv ist,
          können die Daten, die Sie an uns übermitteln, nicht von Dritten
          mitgelesen werden.
        </p>
      </section>

      <section>
        <h2>13. Stand und Änderungen</h2>
        <p>
          Wir passen diese Datenschutzerklärung an, wenn sich die Rechtslage,
          unsere Dienste oder die Art der Datenverarbeitung ändern. Es gilt
          jeweils die hier veröffentlichte Fassung.
        </p>
      </section>

      <p className="legal-stand">Stand: 17. Oktober 2026</p>

      <p className="legal-back">
        <Link href="/de">← tool2day</Link>
      </p>
    </main>
  );
}
