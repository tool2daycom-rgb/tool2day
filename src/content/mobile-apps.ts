import type { Locale } from "./site";

export type MobileAppsCopy = {
  metaTitle: string;
  metaDescription: string;
  breadcrumbHome: string;
  breadcrumbServices: string;
  breadcrumbCurrent: string;
  eyebrow: string;
  title: string;
  lead: string;
  primaryCta: string;
  secondaryCta: string;
  stats: Array<{ value: string; label: string }>;
  intro: string;
  buildTitle: string;
  buildItems: Array<{ title: string; text: string; featured?: boolean }>;
  whenTitle: string;
  whenLead: string;
  whenItems: string[];
  caseEyebrow: string;
  caseTitle: string;
  caseText: string;
  caseCta: string;
  includedTitle: string;
  included: Array<{ title: string; items: string[] }>;
  pricingTitle: string;
  pricingLabel: string;
  pricingValue: string;
  pricingText: string;
  pricingNote: string;
  pricingCta: string;
  faqTitle: string;
  faq: Array<{ q: string; a: string }>;
  processTitle: string;
  process: Array<{ n: string; title: string; text: string }>;
};

const de: MobileAppsCopy = {
  metaTitle: "Mobile Apps mit Flutter | tool2day",
  metaDescription:
    "iOS- und Android-Apps mit Flutter aus einer Codebasis. Einstieg ab 1.000 € — von der Idee bis zum Store.",
  breadcrumbHome: "Startseite",
  breadcrumbServices: "Leistungen",
  breadcrumbCurrent: "Mobile Apps",
  eyebrow: "Mobile",
  title: "Mobile Apps mit Flutter für iOS und Android.",
  lead: "iOS- und Android-Apps, gebaut mit Flutter. Aktuell entsteht unsere eigene App Moovy, Kundenprojekte auf Anfrage.",
  primaryCta: "Projekt starten",
  secondaryCta: "Projekte ansehen",
  stats: [
    { value: "ab 1.000 €", label: "Einstiegspreis" },
    { value: "6–10 Wochen", label: "bis zum Store" },
    { value: "iOS + Android", label: "eine Codebasis" },
  ],
  intro:
    "Wir entwickeln mit Flutter: eine Codebasis, zwei Plattformen, native Performance. Das spart Zeit und Budget gegenüber zwei getrennten Entwicklungen, ohne dass die App sich auf einer der beiden Plattformen fremd anfühlt.",
  buildTitle: "Was wir bauen",
  buildItems: [
    {
      title: "Business-Apps",
      text: "Interne Tools und Prozesse als native App, zum Beispiel Aufgabenverwaltung, Zeiterfassung, Checklisten.",
    },
    {
      title: "Consumer-Apps",
      text: "Apps für Endnutzer, mit Store-Veröffentlichung, Push-Benachrichtigungen und nutzerfreundlichem Design.",
      featured: true,
    },
    {
      title: "Companion-Apps",
      text: "Ergänzung zu einer bestehenden Webseite oder Webapp, als mobile Erweiterung für unterwegs.",
    },
    {
      title: "Prototypen",
      text: "Eine testbare Version für Pitch, Nutzertest oder interne Abstimmung, bevor das volle Budget fließt.",
    },
  ],
  whenTitle: "Wann eine App sinnvoll ist",
  whenLead:
    "Nicht jede Idee braucht eine App. Diese Punkte sprechen dafür, dass eine sinnvoll ist:",
  whenItems: [
    "Die Nutzung findet unterwegs statt, auf der Baustelle, im Außendienst, im Laden.",
    "Push-Benachrichtigungen, Kamera oder Offline-Nutzung sind Teil der Aufgabe.",
    "Eine mobile Webseite gibt es schon, sie reicht aber nicht mehr aus.",
    "Die App soll im App Store und bei Google Play auffindbar sein.",
  ],
  caseEyebrow: "Aus der Praxis",
  caseTitle: "Moovy",
  caseText:
    "Unsere eigene App, mit Flutter gebaut, für iOS und Android aus einer Codebasis.",
  caseCta: "Projekt starten",
  includedTitle: "Was enthalten ist",
  included: [
    {
      title: "Design & Konzept",
      items: [
        "UI/UX-Design für mobile Nutzung",
        "Abstimmung der App-Struktur vor dem ersten Code",
      ],
    },
    {
      title: "Entwicklung",
      items: [
        "Flutter-Entwicklung (iOS + Android)",
        "Backend-Anbindung oder -Entwicklung",
        "Testing auf echten Geräten",
      ],
    },
    {
      title: "Launch & Betrieb",
      items: [
        "Store-Einreichung (Apple App Store + Google Play)",
        "Wartung und Updates nach Launch",
        "Store-Updates bei neuen OS-Versionen",
      ],
    },
  ],
  pricingTitle: "Preisrahmen zur Orientierung",
  pricingLabel: "Einstieg",
  pricingValue: "ab 1.000 €",
  pricingText:
    "Von der schlanken App bis zur Lösung mit eigenem Backend und Store-Veröffentlichung.",
  pricingNote: "Wir erstellen ein individuelles Angebot nach dem Erstgespräch.",
  pricingCta: "Projekt starten",
  faqTitle: "Häufige Fragen",
  faq: [
    {
      q: "iOS, Android oder beides?",
      a: "Beides aus einer Flutter-Codebasis. So erscheinen Funktionen und Design auf iOS und Android konsistent — ohne doppelte Native-Entwicklung.",
    },
    {
      q: "Was kostet eine eigene App?",
      a: "Der Einstieg beginnt ab etwa 1.000 € für schlanke Apps. Umfang mit Backend, Stores und Extrafunktionen klären wir im Erstgespräch und halten im Angebot fest.",
    },
    {
      q: "Wie lange dauert es bis zum Store-Launch?",
      a: "Viele Projekte sind in etwa 6–10 Wochen startklar — abhängig von Umfang, Reviews und Freigaben. Kleine Prototypen können deutlich schneller sein.",
    },
    {
      q: "Warum Flutter und nicht native Entwicklung?",
      a: "Eine Codebasis für beide Plattformen spart Zeit und Budget. Die Performance bleibt nativ nah, und Updates lassen sich gemeinsam ausrollen.",
    },
    {
      q: "Habt ihr Referenzprojekte?",
      a: "Aktuell entsteht unsere eigene App Moovy. Kundenprojekte nehmen wir auf Anfrage an — im Gespräch zeigen wir passende Beispiele und den geplanten Ablauf.",
    },
    {
      q: "Was passiert nach dem Launch?",
      a: "Auf Wunsch übernehmen wir Wartung, Store-Updates und Anpassungen — ohne festen Wartungsvertrag, wenn du das nicht möchtest.",
    },
  ],
  processTitle: "So starten wir",
  process: [
    {
      n: "01",
      title: "Erstgespräch",
      text: "Ein Gespräch per Telefon oder Video. Wir hören zu, fragen nach und überlegen, ob es für beide Seiten passt.",
    },
    {
      n: "02",
      title: "Konzept & Angebot",
      text: "Schriftliches Angebot mit klarem Leistungsumfang und festem Preis. Keine Stundenwirtschaft, keine Überraschungen am Ende.",
    },
    {
      n: "03",
      title: "Umsetzung",
      text: "Kleine Projekte sind in zwei Wochen live, größere in vier bis sechs. Während der Entwicklung gibt es regelmäßige Zwischenstände und kurze Wege bei Rückfragen.",
    },
    {
      n: "04",
      title: "Launch & Betreuung",
      text: "Nach dem Launch bleibt der Kontakt bestehen. Hosting, Updates und Anpassungen übernehmen wir auf Wunsch, ohne festen Wartungsvertrag, wenn das nicht gewünscht ist.",
    },
  ],
};

const en: MobileAppsCopy = {
  metaTitle: "Mobile apps with Flutter | tool2day",
  metaDescription:
    "iOS and Android apps with Flutter from one codebase. Starting from €1,000 — from idea to the stores.",
  breadcrumbHome: "Home",
  breadcrumbServices: "Services",
  breadcrumbCurrent: "Mobile apps",
  eyebrow: "Mobile",
  title: "Mobile apps with Flutter for iOS and Android.",
  lead: "iOS and Android apps built with Flutter. Our own app Moovy is in progress; client projects on request.",
  primaryCta: "Start a project",
  secondaryCta: "View projects",
  stats: [
    { value: "from €1,000", label: "Starting price" },
    { value: "6–10 weeks", label: "to the store" },
    { value: "iOS + Android", label: "one codebase" },
  ],
  intro:
    "We build with Flutter: one codebase, two platforms, native-feel performance. That saves time and budget versus two separate builds — without the app feeling foreign on either platform.",
  buildTitle: "What we build",
  buildItems: [
    {
      title: "Business apps",
      text: "Internal tools and processes as a native app — task lists, time tracking, checklists, and more.",
    },
    {
      title: "Consumer apps",
      text: "Apps for end users with store release, push notifications, and clear, friendly design.",
      featured: true,
    },
    {
      title: "Companion apps",
      text: "A mobile companion to an existing website or web app — useful on the go.",
    },
    {
      title: "Prototypes",
      text: "A testable version for pitches, user tests, or internal alignment before the full budget.",
    },
  ],
  whenTitle: "When an app makes sense",
  whenLead:
    "Not every idea needs an app. These points suggest one is worthwhile:",
  whenItems: [
    "People use it on the go — on site, in the field, or in the shop.",
    "Push notifications, camera, or offline use are part of the job.",
    "A mobile website already exists, but it is no longer enough.",
    "The app should be findable in the App Store and Google Play.",
  ],
  caseEyebrow: "From practice",
  caseTitle: "Moovy",
  caseText:
    "Our own app, built with Flutter, for iOS and Android from one codebase.",
  caseCta: "Start a project",
  includedTitle: "What’s included",
  included: [
    {
      title: "Design & concept",
      items: [
        "UI/UX design for mobile use",
        "App structure agreed before the first line of code",
      ],
    },
    {
      title: "Development",
      items: [
        "Flutter development (iOS + Android)",
        "Backend connection or build",
        "Testing on real devices",
      ],
    },
    {
      title: "Launch & operations",
      items: [
        "Store submission (Apple App Store + Google Play)",
        "Maintenance and updates after launch",
        "Store updates for new OS versions",
      ],
    },
  ],
  pricingTitle: "Pricing for orientation",
  pricingLabel: "Entry",
  pricingValue: "from €1,000",
  pricingText:
    "From a lean app to a solution with its own backend and store release.",
  pricingNote: "We prepare a custom offer after the first conversation.",
  pricingCta: "Start a project",
  faqTitle: "Frequently asked questions",
  faq: [
    {
      q: "iOS, Android, or both?",
      a: "Both from one Flutter codebase. Features and design stay consistent on iOS and Android — without two native projects.",
    },
    {
      q: "What does a custom app cost?",
      a: "Entry starts around €1,000 for lean apps. Scope with backend, stores, and extras is clarified in the first call and fixed in the offer.",
    },
    {
      q: "How long until store launch?",
      a: "Many projects are ready in about 6–10 weeks — depending on scope, reviews, and approvals. Small prototypes can be faster.",
    },
    {
      q: "Why Flutter instead of native?",
      a: "One codebase for both platforms saves time and budget. Performance stays close to native, and updates ship together.",
    },
    {
      q: "Do you have reference projects?",
      a: "Our own app Moovy is in progress. Client projects are available on request — we’ll show fitting examples and the planned process in the call.",
    },
    {
      q: "What happens after launch?",
      a: "On request we handle maintenance, store updates, and changes — without a fixed retainer if you don’t want one.",
    },
  ],
  processTitle: "How we start",
  process: [
    {
      n: "01",
      title: "Intro call",
      text: "A call by phone or video. We listen, ask questions, and see whether it fits both sides.",
    },
    {
      n: "02",
      title: "Concept & offer",
      text: "A written offer with clear scope and a fixed price. No hourly drift, no surprises at the end.",
    },
    {
      n: "03",
      title: "Build",
      text: "Small projects can go live in two weeks, larger ones in four to six. You get regular checkpoints and short paths for questions.",
    },
    {
      n: "04",
      title: "Launch & care",
      text: "After launch, contact stays open. Hosting, updates, and tweaks are available on request — without a fixed retainer if you don’t want one.",
    },
  ],
};

const copy: Record<Locale, MobileAppsCopy> = { de, en };

export function getMobileAppsCopy(locale: Locale): MobileAppsCopy {
  return copy[locale];
}
