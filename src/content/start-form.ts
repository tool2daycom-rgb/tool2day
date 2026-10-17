import type { Locale } from "./site";

export type SizeHint = "basic" | "medium" | "custom";

export type ProjectTypeId =
  | "new-website"
  | "redesign"
  | "webapp"
  | "mobile"
  | "hosting"
  | "other";

export type GoalId =
  | "inform"
  | "sell"
  | "bookings"
  | "contact"
  | "visibility"
  | "other";

export type FeatureDef = {
  id: string;
  size: SizeHint;
};

export const PROJECT_TYPES: ProjectTypeId[] = [
  "new-website",
  "redesign",
  "webapp",
  "mobile",
  "hosting",
  "other",
];

export const GOALS: GoalId[] = [
  "inform",
  "sell",
  "bookings",
  "contact",
  "visibility",
  "other",
];

export const WEBSITE_FEATURES: FeatureDef[] = [
  { id: "gallery", size: "basic" },
  { id: "map", size: "basic" },
  { id: "downloads", size: "basic" },
  { id: "multilingual", size: "medium" },
  { id: "blog", size: "medium" },
  { id: "newsletter", size: "medium" },
  { id: "cms", size: "medium" },
  { id: "tool", size: "custom" },
  { id: "booking", size: "medium" },
  { id: "coupons", size: "medium" },
  { id: "client-login", size: "custom" },
];

export const WEBAPP_FEATURES: FeatureDef[] = [
  { id: "auth", size: "medium" },
  { id: "dashboard", size: "medium" },
  { id: "data", size: "medium" },
  { id: "api", size: "custom" },
  { id: "payments", size: "custom" },
  { id: "roles", size: "medium" },
  { id: "reports", size: "medium" },
];

export const MOBILE_FEATURES: FeatureDef[] = [
  { id: "push", size: "medium" },
  { id: "auth", size: "medium" },
  { id: "camera", size: "medium" },
  { id: "location", size: "medium" },
  { id: "offline", size: "custom" },
  { id: "iap", size: "custom" },
  { id: "api", size: "medium" },
  { id: "stores", size: "medium" },
];

export const HOSTING_FEATURES: FeatureDef[] = [
  { id: "migrate-site", size: "basic" },
  { id: "dns", size: "basic" },
  { id: "email", size: "basic" },
  { id: "backup", size: "basic" },
  { id: "maintenance", size: "medium" },
];

export const TIMELINES = [
  "asap",
  "1-3-months",
  "this-year",
  "exploring",
] as const;

export type TimelineId = (typeof TIMELINES)[number];

export const CONTACT_METHODS = ["email", "phone", "whatsapp"] as const;
export type ContactMethodId = (typeof CONTACT_METHODS)[number];

type FormCopy = {
  metaTitle: string;
  metaDescription: string;
  pageTitle: string;
  pageLead: string;
  backHome: string;
  stepOf: string;
  progress: string;
  back: string;
  continue: string;
  submit: string;
  summaryTitle: string;
  sizeBasic: string;
  sizeMedium: string;
  sizeCustom: string;
  sizeNote: string;
  unsureNote: string;
  multiSelectHint: string;
  otherOptional: string;
  errors: {
    projectTypes: string;
    timeline: string;
    name: string;
    email: string;
    emailInvalid: string;
    contactMethod: string;
    privacy: string;
  };
  successTitle: string;
  successBody: string;
  successAgain: string;
  steps: {
    1: { title: string; question: string };
    2: {
      title: string;
      goalsTitle: string;
      websiteTitle: string;
      webappTitle: string;
      mobileTitle: string;
      hostingTitle: string;
    };
    3: { title: string; question: string };
    4: { title: string; question: string; hint: string; placeholder: string };
    5: {
      title: string;
      name: string;
      email: string;
      phone: string;
      company: string;
      contactMethod: string;
      privacyBefore: string;
      privacyLink: string;
      privacyAfter: string;
    };
  };
  projectTypes: Record<ProjectTypeId, string>;
  goals: Record<GoalId, { label: string; hint?: string }>;
  websiteFeatures: Record<string, { label: string; desc: string }>;
  webappFeatures: Record<string, { label: string; desc: string }>;
  mobileFeatures: Record<string, { label: string; desc: string }>;
  hostingFeatures: Record<string, { label: string; desc: string }>;
  timelines: Record<TimelineId, string>;
  contactMethods: Record<ContactMethodId, string>;
  summary: {
    types: string;
    goals: string;
    features: string;
    timeline: string;
    details: string;
    contact: string;
    none: string;
  };
};

const de: FormCopy = {
  metaTitle: "Projekt starten | tool2day",
  metaDescription:
    "Erzähl uns in wenigen Schritten von deinem Projekt — Websites, Web-Apps, Mobile Apps oder Hosting.",
  pageTitle: "Projekt starten",
  pageLead: "Erzähl uns von deinem Vorhaben — in fünf klaren Schritten.",
  backHome: "Zur Startseite",
  stepOf: "Schritt {current} von {total}",
  progress: "{percent}%",
  back: "Zurück",
  continue: "Weiter",
  submit: "Anfrage senden",
  summaryTitle: "Kurz zusammengefasst",
  sizeBasic: "Basis",
  sizeMedium: "Mittel",
  sizeCustom: "Individuell",
  sizeNote:
    "Die Größenhinweise sind grobe Orientierungen — kein endgültiges Angebot.",
  unsureNote:
    "Nicht sicher, was du brauchst? Kein Problem — geh einfach weiter, wir klären das im Gespräch.",
  multiSelectHint: "Mehrfachauswahl möglich.",
  otherOptional: "Kurz beschreiben (optional)",
  errors: {
    projectTypes: "Bitte wähle mindestens eine Projektart.",
    timeline: "Bitte wähle einen Zeitrahmen.",
    name: "Bitte gib deinen Namen an.",
    email: "Bitte gib deine E-Mail-Adresse an.",
    emailInvalid: "Bitte gib eine gültige E-Mail-Adresse an.",
    contactMethod: "Bitte wähle eine bevorzugte Kontaktart.",
    privacy: "Bitte bestätige die Datenschutzerklärung.",
  },
  successTitle: "Danke — deine Anfrage ist vorbereitet.",
  successBody:
    "Dein E-Mail-Programm sollte sich mit den Details an support@tool2day.com geöffnet haben. Wenn nicht, schreib uns gerne direkt.",
  successAgain: "Weitere Anfrage starten",
  steps: {
    1: {
      title: "Projektart",
      question: "Welche Art von Projekt brauchst du?",
    },
    2: {
      title: "Ziele & Funktionen",
      goalsTitle: "Was soll das Projekt vor allem leisten?",
      websiteTitle: "Funktionen für Websites",
      webappTitle: "Funktionen für Web-Apps",
      mobileTitle: "Funktionen für Mobile Apps",
      hostingTitle: "Hosting & Umzug",
    },
    3: {
      title: "Zeitrahmen",
      question: "Wann soll dein Projekt bereit sein?",
    },
    4: {
      title: "Details",
      question: "Möchtest du noch etwas Wichtiges ergänzen?",
      hint: "Optional — du kannst das Feld leer lassen und Details später besprechen.",
      placeholder:
        "Was machst du beruflich? Was soll das Projekt erreichen? Gibt es Seiten oder Beispiele, die dir gefallen? Sonstiges?",
    },
    5: {
      title: "Kontakt",
      name: "Name",
      email: "E-Mail",
      phone: "Telefon (optional)",
      company: "Firma (optional)",
      contactMethod: "Bevorzugte Kontaktart",
      privacyBefore: "Ich habe die ",
      privacyLink: "Datenschutzerklärung",
      privacyAfter:
        " gelesen und stimme der Verarbeitung meiner Daten zur Beantwortung dieser Anfrage zu.",
    },
  },
  projectTypes: {
    "new-website": "Neue Website",
    redesign: "Bestehende Website weiterentwickeln oder neu gestalten",
    webapp: "Individuelle Web-App",
    mobile: "Mobile App",
    hosting: "Hosting oder Umzug einer Website",
    other: "Etwas anderes",
  },
  goals: {
    inform: { label: "Informationen über mein Angebot zeigen" },
    sell: { label: "Produkte oder Dienstleistungen verkaufen" },
    bookings: { label: "Termine und Buchungen annehmen" },
    contact: { label: "Kundenkontakt erleichtern" },
    visibility: { label: "Online besser gefunden werden" },
    other: { label: "Anderes Ziel" },
  },
  websiteFeatures: {
    gallery: {
      label: "Bildgalerie oder Portfolio",
      desc: "Arbeiten und Fotos klar präsentieren.",
    },
    map: {
      label: "Standortkarte",
      desc: "Deinen Standort interaktiv zeigen.",
    },
    downloads: {
      label: "Downloads",
      desc: "PDFs, Vorlagen oder Dokumente bereitstellen.",
    },
    multilingual: {
      label: "Mehrsprachigkeit",
      desc: "Inhalte in mehreren Sprachen strukturieren.",
    },
    blog: {
      label: "Blog oder News",
      desc: "Aktuelle Beiträge veröffentlichen.",
    },
    newsletter: {
      label: "Newsletter-Anbindung",
      desc: "Interessenten sammeln und informieren.",
    },
    cms: {
      label: "Inhalte selbst pflegen",
      desc: "Texte und Bilder ohne Entwickler ändern.",
    },
    tool: {
      label: "Tool oder Rechner auf der Seite",
      desc: "Interaktives Hilfsmittel direkt im Browser.",
    },
    booking: {
      label: "Terminbuchung",
      desc: "Kunden buchen online selbst Termine.",
    },
    coupons: {
      label: "Gutscheine oder Coupons",
      desc: "Gutscheine verkaufen oder einlösen.",
    },
    "client-login": {
      label: "Kundenbereich mit Login",
      desc: "Geschützter Bereich für Kundinnen und Kunden.",
    },
  },
  webappFeatures: {
    auth: {
      label: "Login und Benutzerkonten",
      desc: "Persönliche Zugänge für Nutzerinnen und Nutzer.",
    },
    dashboard: {
      label: "Dashboard",
      desc: "Zentrale Übersicht für Aufgaben und Status.",
    },
    data: {
      label: "Daten- oder Inhaltsverwaltung",
      desc: "Strukturierte Verwaltung eurer Inhalte.",
    },
    api: {
      label: "API- oder Dienst-Anbindung",
      desc: "Verbindung zu anderen Systemen.",
    },
    payments: {
      label: "Online-Zahlungen",
      desc: "Zahlungen sicher entgegennehmen.",
    },
    roles: {
      label: "Rollen und Rechte",
      desc: "Unterschiedliche Zugriffsstufen vergeben.",
    },
    reports: {
      label: "Berichte oder Auswertungen",
      desc: "Kennzahlen und Übersichten bereitstellen.",
    },
  },
  mobileFeatures: {
    push: {
      label: "Push-Benachrichtigungen",
      desc: "Nutzerinnen und Nutzer gezielt erreichen.",
    },
    auth: {
      label: "Login und Benutzerkonten",
      desc: "Persönliche Bereiche in der App.",
    },
    camera: {
      label: "Kamera oder Foto-Upload",
      desc: "Gerätefunktionen für Bilder nutzen.",
    },
    location: {
      label: "Standortfunktionen",
      desc: "Features basierend auf dem Standort.",
    },
    offline: {
      label: "Offline-Nutzung",
      desc: "Teile der App ohne Netzverbindung nutzen.",
    },
    iap: {
      label: "In-App-Käufe oder Abos",
      desc: "Käufe oder Abonnements in der App.",
    },
    api: {
      label: "Server- oder API-Anbindung",
      desc: "App mit Backend und Daten verbinden.",
    },
    stores: {
      label: "Veröffentlichung in App Stores",
      desc: "Bereitstellung für iOS und Android.",
    },
  },
  hostingFeatures: {
    "migrate-site": {
      label: "Bestehende Website umziehen",
      desc: "Inhalte und Setup auf eine neue Umgebung bringen.",
    },
    dns: {
      label: "Domain oder DNS einrichten",
      desc: "Domain und Namensauflösung korrekt setzen.",
    },
    email: {
      label: "E-Mail zum Domainnamen",
      desc: "Postfächer unter deiner Domain.",
    },
    backup: {
      label: "Backups",
      desc: "Regelmäßige Sicherungskopien.",
    },
    maintenance: {
      label: "Wartung und Updates",
      desc: "Laufende Pflege nach Abstimmung.",
    },
  },
  timelines: {
    asap: "So bald wie möglich",
    "1-3-months": "In 1–3 Monaten",
    "this-year": "Noch in diesem Jahr",
    exploring: "Noch offen — erstmal unverbindlich anfragen",
  },
  contactMethods: {
    email: "E-Mail",
    phone: "Telefon",
    whatsapp: "WhatsApp",
  },
  summary: {
    types: "Projektarten",
    goals: "Ziele",
    features: "Funktionen",
    timeline: "Zeitrahmen",
    details: "Details",
    contact: "Kontakt",
    none: "Keine Angabe",
  },
};

const en: FormCopy = {
  metaTitle: "Start a Project | tool2day",
  metaDescription:
    "Tell us about your project in a few clear steps — websites, web apps, mobile apps or hosting.",
  pageTitle: "Start a Project",
  pageLead: "Tell us about your idea — five short steps.",
  backHome: "Back to home",
  stepOf: "Step {current} of {total}",
  progress: "{percent}%",
  back: "Back",
  continue: "Continue",
  submit: "Send enquiry",
  summaryTitle: "Quick summary",
  sizeBasic: "Basic",
  sizeMedium: "Medium",
  sizeCustom: "Custom",
  sizeNote: "Size labels are rough guides — not a final quote.",
  unsureNote:
    "Not sure which features you need? No problem — continue anyway and we’ll clarify together.",
  multiSelectHint: "You can select more than one option.",
  otherOptional: "Briefly describe (optional)",
  errors: {
    projectTypes: "Please choose at least one project type.",
    timeline: "Please choose a timeline.",
    name: "Please enter your name.",
    email: "Please enter your email address.",
    emailInvalid: "Please enter a valid email address.",
    contactMethod: "Please choose a preferred contact method.",
    privacy: "Please confirm the privacy policy.",
  },
  successTitle: "Thanks — your enquiry is ready.",
  successBody:
    "Your email app should open with the details for support@tool2day.com. If it doesn’t, feel free to write us directly.",
  successAgain: "Start another enquiry",
  steps: {
    1: {
      title: "Project type",
      question: "What kind of project do you need?",
    },
    2: {
      title: "Goals & features",
      goalsTitle: "What should the project mainly achieve?",
      websiteTitle: "Website features",
      webappTitle: "Web app features",
      mobileTitle: "Mobile app features",
      hostingTitle: "Hosting & migration",
    },
    3: {
      title: "Timeline",
      question: "When would you like the project to be ready?",
    },
    4: {
      title: "Details",
      question: "Anything else that helps us understand your request?",
      hint: "Optional — you can leave this blank and discuss details later.",
      placeholder:
        "What do you do? What should the project achieve? Any sites or examples you like? Anything else?",
    },
    5: {
      title: "Contact",
      name: "Name",
      email: "Email",
      phone: "Phone (optional)",
      company: "Company (optional)",
      contactMethod: "Preferred contact method",
      privacyBefore: "I have read the ",
      privacyLink: "privacy policy",
      privacyAfter:
        " and agree to the processing of my data to respond to this enquiry.",
    },
  },
  projectTypes: {
    "new-website": "New website",
    redesign: "Redesign or improve an existing website",
    webapp: "Custom web application",
    mobile: "Mobile app",
    hosting: "Hosting or website migration",
    other: "Something else",
  },
  goals: {
    inform: { label: "Inform customers about my business" },
    sell: { label: "Sell products or services" },
    bookings: { label: "Accept appointments and bookings" },
    contact: { label: "Help customers contact me" },
    visibility: { label: "Improve my online visibility" },
    other: { label: "Other goal" },
  },
  websiteFeatures: {
    gallery: {
      label: "Image gallery or portfolio",
      desc: "Present photos and work clearly.",
    },
    map: {
      label: "Location map",
      desc: "Show where you are on an interactive map.",
    },
    downloads: {
      label: "File downloads",
      desc: "Offer PDFs, templates or documents.",
    },
    multilingual: {
      label: "Multiple languages",
      desc: "Structure content across languages.",
    },
    blog: {
      label: "Blog or news",
      desc: "Publish updates and articles.",
    },
    newsletter: {
      label: "Newsletter connection",
      desc: "Collect and reach interested people.",
    },
    cms: {
      label: "Edit content myself",
      desc: "Update text and images without a developer.",
    },
    tool: {
      label: "On-site tool or calculator",
      desc: "Interactive helper right in the browser.",
    },
    booking: {
      label: "Appointment booking",
      desc: "Let customers book online.",
    },
    coupons: {
      label: "Coupons or vouchers",
      desc: "Sell or redeem vouchers.",
    },
    "client-login": {
      label: "Client accounts / login",
      desc: "A protected area for customers.",
    },
  },
  webappFeatures: {
    auth: {
      label: "Login and user accounts",
      desc: "Personal access for users.",
    },
    dashboard: {
      label: "Dashboard",
      desc: "A central overview for tasks and status.",
    },
    data: {
      label: "Data or content management",
      desc: "Structured management of your information.",
    },
    api: {
      label: "API or service integration",
      desc: "Connect to other systems.",
    },
    payments: {
      label: "Online payments",
      desc: "Take payments securely.",
    },
    roles: {
      label: "Roles and permissions",
      desc: "Different access levels for users.",
    },
    reports: {
      label: "Reports or analytics",
      desc: "Provide metrics and overviews.",
    },
  },
  mobileFeatures: {
    push: {
      label: "Push notifications",
      desc: "Reach users with timely messages.",
    },
    auth: {
      label: "Login and user accounts",
      desc: "Personal spaces inside the app.",
    },
    camera: {
      label: "Camera or photo upload",
      desc: "Use device camera features.",
    },
    location: {
      label: "Location-based features",
      desc: "Functions that use location.",
    },
    offline: {
      label: "Offline use",
      desc: "Work with parts of the app without network.",
    },
    iap: {
      label: "In-app purchases or subscriptions",
      desc: "Sell or subscribe inside the app.",
    },
    api: {
      label: "Server or API connection",
      desc: "Connect the app to a backend.",
    },
    stores: {
      label: "App store publishing",
      desc: "Release for iOS and Android.",
    },
  },
  hostingFeatures: {
    "migrate-site": {
      label: "Migrate the current website",
      desc: "Move the existing site to a new setup.",
    },
    dns: {
      label: "Domain or DNS setup",
      desc: "Point and configure your domain.",
    },
    email: {
      label: "Domain email",
      desc: "Mailboxes under your domain name.",
    },
    backup: {
      label: "Backups",
      desc: "Regular backup copies.",
    },
    maintenance: {
      label: "Maintenance and updates",
      desc: "Ongoing care as agreed.",
    },
  },
  timelines: {
    asap: "As soon as possible",
    "1-3-months": "Within 1–3 months",
    "this-year": "This year",
    exploring: "Not sure yet — just exploring",
  },
  contactMethods: {
    email: "Email",
    phone: "Phone",
    whatsapp: "WhatsApp",
  },
  summary: {
    types: "Project types",
    goals: "Goals",
    features: "Features",
    timeline: "Timeline",
    details: "Details",
    contact: "Contact",
    none: "Not specified",
  },
};

export function getStartFormCopy(locale: Locale): FormCopy {
  return locale === "de" ? de : en;
}

export function showsWebsiteFeatures(types: ProjectTypeId[]) {
  return types.includes("new-website") || types.includes("redesign");
}

export function showsWebappFeatures(types: ProjectTypeId[]) {
  return types.includes("webapp");
}

export function showsMobileFeatures(types: ProjectTypeId[]) {
  return types.includes("mobile");
}

export function showsHostingFeatures(types: ProjectTypeId[]) {
  return types.includes("hosting");
}
