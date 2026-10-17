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
  why: {
    eyebrow: string;
    title: string;
    body: [string, string];
    cta: string;
    imageAlt: string;
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
    submitting: string;
    successMessage: string;
    errorMessage: string;
    privacyBefore: string;
    privacyLink: string;
    privacyAfter: string;
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
    why: "Über uns",
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
  why: {
    eyebrow: "Über uns",
    title: "Digitale Lösungen, die zu Ihrem Unternehmen passen.",
    body: [
      "Tool2day ist ein unabhängiges Digitalstudio für Unternehmen, die eine Website oder App möchten, die zu ihren Anforderungen passt. Ich arbeite direkt mit Ihnen zusammen, halte den Ablauf verständlich und entwickle aus Ihrer Idee eine praktische digitale Lösung – ohne unnötige Komplexität.",
      "Vom ersten Gespräch bis zum Start wissen Sie, was wir entwickeln und warum. Sie haben eine Idee? Lassen Sie uns darüber sprechen.",
    ],
    cta: "Projekt besprechen",
    imageAlt: "Portrait of the Tool2day founder",
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
    lead: "Schick eine kurze Nachricht — wir melden uns mit den nächsten Schritten.",
    note: "Deine Anfrage wird sicher gespeichert. Wir melden uns zeitnah per E-Mail.",
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
    submit: "Nachricht senden",
    submitting: "Wird gesendet…",
    successMessage: "Danke — deine Nachricht wurde gespeichert. Wir melden uns bald.",
    errorMessage:
      "Die Nachricht konnte nicht gesendet werden. Bitte versuche es erneut oder schreib an support@tool2day.com.",
    privacyBefore: "Ich habe die ",
    privacyLink: "Datenschutzerklärung",
    privacyAfter: " gelesen und stimme der Verarbeitung meiner Angaben zu.",
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
