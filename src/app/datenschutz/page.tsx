import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Datenschutz | tool2day",
  description: "Platzhalter für die Datenschutzerklärung — vor dem Launch vervollständigen.",
  robots: { index: false, follow: false },
};

export default function DatenschutzPage() {
  return (
    <main className="shell section">
      <p className="eyebrow">Rechtliches</p>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem" }}>Datenschutz</h1>
      <p className="lead" style={{ marginTop: "1rem" }}>
        Dies ist ein Platzhalter für die Datenschutzerklärung. Ergänze vor dem Launch in
        Deutschland die tatsächlichen Verarbeitungen, Rechtsgrundlagen und Kontaktdaten.
      </p>
      <p style={{ marginTop: "2rem" }}>
        <Link href="/de">← tool2day</Link>
      </p>
    </main>
  );
}
