export type Dictionary = {
  meta: { title: string; description: string };
  nav: {
    services: string;
    work: string;
    why: string;
    process: string;
    contact: string;
    cta: string;
    langAria: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    lead: string;
    primaryCta: string;
    secondaryCta: string;
  };
  services: {
    eyebrow: string;
    title: string;
    lead: string;
    items: Array<{ id: string; label: string; title: string; text: string }>;
  };
  work: {
    eyebrow: string;
    title: string;
    lead: string;
    conceptBadge: string;
    items: Array<{
      title: string;
      summary: string;
      href: string;
      tags: string[];
    }>;
  };
  why: {
    eyebrow: string;
    title: string;
    lead: string;
    points: Array<{ title: string; text: string }>;
  };
  process: {
    eyebrow: string;
    title: string;
    lead: string;
    steps: Array<{ n: string; title: string; text: string }>;
  };
  contact: {
    eyebrow: string;
    title: string;
    lead: string;
    note: string;
    fields: {
      name: string;
      email: string;
      service: string;
      message: string;
      serviceOptions: string[];
    };
    submit: string;
    emailLabel: string;
  };
  footer: {
    blurb: string;
    servicesTitle: string;
    companyTitle: string;
    websites: string;
    webapps: string;
    mobile: string;
    hosting: string;
    about: string;
    projects: string;
    contact: string;
    imprint: string;
    privacy: string;
    cookies: string;
    rights: string;
    whatsappAria: string;
  };
};

export const de: Dictionary = {
  meta: {
    title: "tool2day | Websites & Apps für kleine Unternehmen",
    description:
      "tool2day plant und entwickelt Websites, Web-Apps und mobile Apps für kleine Unternehmen und lokale Angebote — direkt, klar und ohne Agenturumwege.",
  },
  nav: {
    services: "Leistungen",
    work: "Beispiele",
    why: "Warum tool2day",
    process: "Ablauf",
    contact: "Kontakt",
    cta: "Projekt starten",
    langAria: "Sprache wählen",
  },
  hero: {
    eyebrow: "Websites · Apps · Digital",
    title: "Digitale Auftritte, die kleine Unternehmen verständlich und greifbar machen.",
    lead:
      "tool2day hilft dir, online klar aufzutreten und Kunden leichter zu erreichen — mit Websites und Apps, die zu deinem Angebot passen.",
    primaryCta: "Projekt starten",
    secondaryCta: "Leistungen ansehen",
  },
  services: {
    eyebrow: "Leistungen",
    title: "Was tool2day für dich umsetzt",
    lead: "Konkrete Leistungen mit klaren Grenzen — damit du weißt, worum es geht.",
    items: [
      {
        id: "websites",
        label: "Websites",
        title: "Unternehmenswebsites",
        text: "Aussagekräftige Seiten für lokale Betriebe und Selbstständige: Startseite, Leistungen, Kontakt — klar strukturiert und mobil nutzbar.",
      },
      {
        id: "webapps",
        label: "Web-Apps",
        title: "Webanwendungen",
        text: "Schlanke Anwendungen für Abläufe, Kundenbereiche oder interne Tools — abgestimmt auf deinen Alltag, nicht auf generische Vorlagen.",
      },
      {
        id: "mobile",
        label: "Mobile",
        title: "Mobile Apps",
        text: "Apps für iOS und Android, wenn dein Angebot unterwegs gebraucht wird — von der Idee bis zur Veröffentlichung.",
      },
      {
        id: "design",
        label: "Beratung",
        title: "Design & Beratung",
        text: "Gemeinsam klären wir Ziel, Inhalt und nächste Schritte — bevor gebaut wird, was du eigentlich nicht brauchst.",
      },
    ],
  },
  work: {
    eyebrow: "Beispiele",
    title: "Gestaltungsbeispiele",
    lead:
      "Platzhalter für echte Projekte. Bis dahin siehst du hier Designkonzepte — keine ausgeführten Kundenaufträge.",
    conceptBadge: "Designkonzept",
    items: [
      {
        title: "Lokalatelier — Studio-Website",
        summary: "Ruhige One-Pager-Struktur für ein kreatives Studio mit klarer Kontaktführung.",
        href: "/de/start",
        tags: ["Website", "Konzept"],
      },
      {
        title: "Nachbarladen — Buchungsübersicht",
        summary: "Web-App-Konzept für Terminübersicht und einfache Kundenanfragen.",
        href: "/de/start",
        tags: ["Web-App", "Konzept"],
      },
      {
        title: "Routenhilfe — Service-App",
        summary: "Mobile-App-Konzept für den Außendienst mit Fokus auf Übersichtlichkeit.",
        href: "/de/start",
        tags: ["Mobile", "Konzept"],
      },
    ],
  },
  why: {
    eyebrow: "Warum tool2day",
    title: "Direkt, klar, nach Bedarf",
    lead: "tool2day ist als unabhängiges Studio aufgebaut — nah am Gespräch, ohne unnötige Umwege.",
    points: [
      {
        title: "Direkter Kontakt",
        text: "Du sprichst mit der Person, die plant und baut — kurze Wege, klare Antworten.",
      },
      {
        title: "Klarer Umfang",
        text: "Wir halten fest, was drin ist und was nicht. So bleibt die Zusammenarbeit übersichtlich.",
      },
      {
        title: "Passgenaue Lösungen",
        text: "Inhalt, Struktur und Funktionen folgen deinem Angebot — nicht einer Einheitsvorlage.",
      },
      {
        title: "Einfacher Ablauf",
        text: "Wenige Schritte von der ersten Idee bis zum Launch, optional mit späterer Betreuung.",
      },
    ],
  },
  process: {
    eyebrow: "Ablauf",
    title: "So starten wir zusammen",
    lead: "Vier nachvollziehbare Schritte — ohne feste Terminversprechen.",
    steps: [
      {
        n: "01",
        title: "Erstgespräch",
        text: "Wir klären Ziel, Zielgruppe und Rahmen. Kurz und konkret.",
      },
      {
        n: "02",
        title: "Umfang & Angebot",
        text: "Du erhältst einen schriftlichen Vorschlag mit Leistungen und Rahmenbedingungen.",
      },
      {
        n: "03",
        title: "Design & Entwicklung",
        text: "Gestaltung und Umsetzung in enger Abstimmung — mit Zwischenständen zum Mitdenken.",
      },
      {
        n: "04",
        title: "Launch & optional Support",
        text: "Veröffentlichung und, wenn gewünscht, spätere Anpassungen oder Begleitung.",
      },
    ],
  },
  contact: {
    eyebrow: "Kontakt",
    title: "Erzähl kurz von deinem Vorhaben",
    lead:
      "Schick eine Nachricht — die Angaben unten kannst du später durch deine echten Kontaktdaten ersetzen.",
    note: "Das Formular öffnet deine E-Mail-App mit einer vorbereiteten Nachricht. Es gibt derzeit keinen Serverversand.",
    fields: {
      name: "Name",
      email: "E-Mail",
      service: "Gewünschte Leistung",
      message: "Nachricht",
      serviceOptions: [
        "Website",
        "Web-App",
        "Mobile App",
        "Design & Beratung",
        "Noch unklar",
      ],
    },
    submit: "Nachricht vorbereiten",
    emailLabel: "E-Mail",
  },
  footer: {
    blurb:
      "Wir gestalten und entwickeln Websites, Apps und digitale Lösungen für kleine Unternehmen.",
    servicesTitle: "Leistungen",
    companyTitle: "Unternehmen",
    websites: "Websites",
    webapps: "Web-Apps",
    mobile: "Mobile Apps",
    hosting: "Hosting",
    about: "Über uns",
    projects: "Projekte",
    contact: "Kontakt",
    imprint: "Impressum",
    privacy: "Datenschutz",
    cookies: "Cookie-Einstellungen",
    rights: "Tool2day. Alle Rechte vorbehalten.",
    whatsappAria: "WhatsApp öffnen",
  },
};
