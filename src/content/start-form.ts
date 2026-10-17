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

export const MOBILE_FEATURE_GROUPS: {
  id: "accounts" | "browse" | "locationCam" | "commerce" | "advanced";
  features: FeatureDef[];
}[] = [
  {
    id: "accounts",
    features: [
      { id: "auth-login", size: "medium" },
      { id: "profile", size: "medium" },
      { id: "chat", size: "custom" },
      { id: "in-app-messages", size: "medium" },
      { id: "reviews", size: "medium" },
    ],
  },
  {
    id: "browse",
    features: [
      { id: "search-filters", size: "medium" },
      { id: "favorites", size: "medium" },
      { id: "file-transfer", size: "medium" },
      { id: "multilang", size: "medium" },
      { id: "in-app-notify", size: "medium" },
    ],
  },
  {
    id: "locationCam",
    features: [
      { id: "maps-directions", size: "medium" },
      { id: "live-tracking", size: "custom" },
      { id: "qr-scan", size: "medium" },
      { id: "camera-upload", size: "medium" },
    ],
  },
  {
    id: "commerce",
    features: [
      { id: "cart-orders", size: "medium" },
      { id: "payments", size: "custom" },
      { id: "subscriptions", size: "custom" },
      { id: "coupons", size: "medium" },
      { id: "order-status", size: "medium" },
    ],
  },
  {
    id: "advanced",
    features: [
      { id: "offline-sync", size: "custom" },
      { id: "biometrics", size: "medium" },
      { id: "external-api", size: "custom" },
      { id: "admin-dashboard", size: "custom" },
      { id: "analytics", size: "medium" },
      { id: "device-sync", size: "custom" },
      { id: "a11y", size: "medium" },
    ],
  },
];

/** Flat list for lookups / mail summary */
export const MOBILE_FEATURES: FeatureDef[] = MOBILE_FEATURE_GROUPS.flatMap(
  (group) => group.features,
);

/** Map legacy mobile feature ids saved in localStorage */
export const MOBILE_FEATURE_ALIASES: Record<string, string> = {
  auth: "auth-login",
  push: "in-app-notify",
  camera: "camera-upload",
  location: "live-tracking",
  offline: "offline-sync",
  iap: "subscriptions",
  api: "external-api",
};

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
  mobileGroupTitles: Record<
    "accounts" | "browse" | "locationCam" | "commerce" | "advanced",
    string
  >;
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
    "auth-login": {
      label: "Login mit E-Mail, Google oder Apple",
      desc: "Flexible Anmeldung über gängige Anbieter.",
    },
    profile: {
      label: "Profil und Kontoeinstellungen",
      desc: "Persönliche Daten und Präferenzen verwalten.",
    },
    chat: {
      label: "Chat zwischen Nutzern und Team",
      desc: "Direkte Unterhaltungen in der App.",
    },
    "in-app-messages": {
      label: "In-App-Nachrichten",
      desc: "Mitteilungen und Inbox innerhalb der App.",
    },
    reviews: {
      label: "Bewertungen und Reviews",
      desc: "Feedback zu Leistungen oder Produkten sammeln.",
    },
    "search-filters": {
      label: "Suche und Filter",
      desc: "Inhalte schnell finden und eingrenzen.",
    },
    favorites: {
      label: "Favoriten und gespeicherte Listen",
      desc: "Wichtige Einträge merken und wiederfinden.",
    },
    "file-transfer": {
      label: "Dateien hoch- und herunterladen",
      desc: "Dokumente und Medien in der App teilen.",
    },
    multilang: {
      label: "Mehrsprachigkeit",
      desc: "App-Inhalte in mehreren Sprachen anbieten.",
    },
    "in-app-notify": {
      label: "Benachrichtigungen und Erinnerungen",
      desc: "Hinweise und Reminder innerhalb der App.",
    },
    "maps-directions": {
      label: "Karten und Routen",
      desc: "Standorte anzeigen und Wege vorschlagen.",
    },
    "live-tracking": {
      label: "Live-Standort-Tracking",
      desc: "Bewegung in Echtzeit visualisieren (Demo).",
    },
    "qr-scan": {
      label: "QR- oder Barcode-Scan",
      desc: "Codes scannen und Inhalte öffnen.",
    },
    "camera-upload": {
      label: "Fotos aufnehmen oder hochladen",
      desc: "Kamera und Galerie für Bildinhalte nutzen.",
    },
    "cart-orders": {
      label: "Warenkorb und Bestellungen",
      desc: "Einkauf und Aufträge mobil steuern.",
    },
    payments: {
      label: "Online-Zahlung",
      desc: "Bezahlvorgänge in der App abbilden (Demo).",
    },
    subscriptions: {
      label: "Abos oder In-App-Käufe",
      desc: "Pläne und Käufe ohne echten Geldeinzug zeigen.",
    },
    coupons: {
      label: "Gutscheine und Angebote",
      desc: "Rabatte und Aktionen einlösen.",
    },
    "order-status": {
      label: "Bestellstatus verfolgen",
      desc: "Fortschritt von Aufträgen sichtbar machen.",
    },
    "offline-sync": {
      label: "Offline-Nutzung mit späterer Sync",
      desc: "Inhalte offline nutzen und später abgleichen.",
    },
    biometrics: {
      label: "Login mit Biometrie / Face ID",
      desc: "Schneller Zugang per Geräteschutz (Demo).",
    },
    "external-api": {
      label: "Anbindung an externe Dienste / API",
      desc: "Daten aus anderen Systemen einbinden.",
    },
    "admin-dashboard": {
      label: "Admin-Dashboard",
      desc: "Verwaltungsübersicht für Betreiber.",
    },
    analytics: {
      label: "Analysen und Reports",
      desc: "Nutzung und Kennzahlen auswerten.",
    },
    "device-sync": {
      label: "Sync zwischen Geräten",
      desc: "Daten über mehrere Geräte hinweg abstimmen.",
    },
    a11y: {
      label: "Barrierefreiheit",
      desc: "Größere Schrift und Screenreader-Unterstützung.",
    },
  },
  mobileGroupTitles: {
    accounts: "Konten & Kommunikation",
    browse: "Navigation & Inhalte",
    locationCam: "Standort & Kamera",
    commerce: "Bestellungen & Zahlungen",
    advanced: "Erweiterte Funktionen",
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
    "auth-login": {
      label: "Sign-in with email, Google or Apple",
      desc: "Flexible login through common providers.",
    },
    profile: {
      label: "Profile and account settings",
      desc: "Manage personal details and preferences.",
    },
    chat: {
      label: "Chat between users and your team",
      desc: "Direct conversations inside the app.",
    },
    "in-app-messages": {
      label: "In-app messages",
      desc: "Inbox-style notes within the app.",
    },
    reviews: {
      label: "Ratings and reviews",
      desc: "Collect feedback on services or products.",
    },
    "search-filters": {
      label: "Search and filters",
      desc: "Find and narrow content quickly.",
    },
    favorites: {
      label: "Favorites and saved lists",
      desc: "Keep important items easy to reopen.",
    },
    "file-transfer": {
      label: "Upload and download files",
      desc: "Share documents and media in the app.",
    },
    multilang: {
      label: "Multiple languages",
      desc: "Offer app content in more than one language.",
    },
    "in-app-notify": {
      label: "Notifications and reminders",
      desc: "Alerts and reminders inside the app.",
    },
    "maps-directions": {
      label: "Maps and directions",
      desc: "Show places and suggest routes.",
    },
    "live-tracking": {
      label: "Live location tracking",
      desc: "Visualise movement in real time (demo).",
    },
    "qr-scan": {
      label: "QR or barcode scan",
      desc: "Scan codes and open related content.",
    },
    "camera-upload": {
      label: "Take or upload photos",
      desc: "Use camera and gallery for images.",
    },
    "cart-orders": {
      label: "Cart and order management",
      desc: "Handle shopping and orders on mobile.",
    },
    payments: {
      label: "Online payments",
      desc: "Show checkout flows without taking money.",
    },
    subscriptions: {
      label: "Subscriptions or in-app purchases",
      desc: "Plans and purchases for illustration only.",
    },
    coupons: {
      label: "Coupons and offers",
      desc: "Apply discounts and promotions.",
    },
    "order-status": {
      label: "Order status tracking",
      desc: "Make order progress easy to follow.",
    },
    "offline-sync": {
      label: "Offline use with later sync",
      desc: "Keep working offline and sync afterwards.",
    },
    biometrics: {
      label: "Biometric / Face ID login",
      desc: "Faster access via device security (demo).",
    },
    "external-api": {
      label: "External services / API connection",
      desc: "Pull data from other systems.",
    },
    "admin-dashboard": {
      label: "Admin dashboard",
      desc: "Operator overview for managing the app.",
    },
    analytics: {
      label: "Analytics and reports",
      desc: "Review usage and key metrics.",
    },
    "device-sync": {
      label: "Sync across devices",
      desc: "Keep data aligned on multiple devices.",
    },
    a11y: {
      label: "Accessibility",
      desc: "Larger text and screen-reader support.",
    },
  },
  mobileGroupTitles: {
    accounts: "Accounts & communication",
    browse: "Browse & content",
    locationCam: "Location & camera",
    commerce: "Orders & payments",
    advanced: "Advanced features",
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
