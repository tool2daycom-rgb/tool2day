import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content";

export const metadata: Metadata = {
  title: "Impressum | tool2day",
  description: "Platzhalter für das Impressum — vor dem Launch in Deutschland vervollständigen.",
  robots: { index: false, follow: false },
};

export default function ImpressumPage() {
  return (
    <main className="shell section">
      <p className="eyebrow">Rechtliches</p>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem" }}>Impressum</h1>
      <p className="lead" style={{ marginTop: "1rem" }}>
        Dies ist ein Platzhalter. Trage hier die gesetzlich erforderlichen Angaben für
        Deutschland ein, bevor die Website öffentlich geht.
      </p>
      <ul style={{ marginTop: "1.5rem", color: "var(--ink-soft)", lineHeight: 1.8 }}>
        <li>Anbieter / Name — [Platzhalter]</li>
        <li>Anschrift — [Platzhalter]</li>
        <li>E-Mail — {site.contactEmail}</li>
        <li>Weitere Pflichtangaben — [Platzhalter]</li>
      </ul>
      <p style={{ marginTop: "2rem" }}>
        <Link href="/de">← tool2day</Link>
      </p>
    </main>
  );
}
