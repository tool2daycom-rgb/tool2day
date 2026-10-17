import type { Locale } from "./site";

export type MobileExample = {
  id: string;
  title: string;
  audience: string;
  problem: string;
  href?: string;
};

export type MobilePreviewCopy = {
  tabPreview: string;
  tabExamples: string;
  kindMobile: string;
  emptyHint: string;
  demoBadge: string;
  examplesEmpty: string;
  examplesLead: string;
  viewExample: string;
  demoOnly: string;
  externalNote: string;
  appName: string;
  homeTitle: string;
  homeLead: string;
  tabHome: string;
  tabExplore: string;
  tabProfile: string;
  authTitle: string;
  authEmail: string;
  authPassword: string;
  authBtn: string;
  authNote: string;
  profileTitle: string;
  pushTitle: string;
  pushBody: string;
  pushTime: string;
  cameraTitle: string;
  cameraLead: string;
  cameraBtn: string;
  cameraNote: string;
  locationTitle: string;
  locationLead: string;
  locationStatus: string;
  offlineTitle: string;
  offlineLead: string;
  offlineBadge: string;
  payTitle: string;
  payLead: string;
  payPlan: string;
  payPrice: string;
  payBtn: string;
  payNote: string;
  apiTitle: string;
  apiLead: string;
  apiItem1: string;
  apiItem2: string;
  apiItem3: string;
  storesTitle: string;
  storesLead: string;
  storeApple: string;
  storeGoogle: string;
  storesNote: string;
  examples: MobileExample[];
};

const de: MobilePreviewCopy = {
  tabPreview: "Vorschau",
  tabExamples: "Beispiele",
  kindMobile: "Mobile App",
  emptyHint: "Wähle Mobile-Funktionen — sie erscheinen hier im Handy-Rahmen.",
  demoBadge: "Demo / Beispielvorschau",
  examplesEmpty: "Wähle Mobile-Funktionen, um passende Hinweise zu den Beispielen zu sehen.",
  examplesLead:
    "Beispieltypen für Mobile Apps. Keine Tool2day-Kundenprojekte. Ohne verlässlichen Link bleibt es eine Demo.",
  viewExample: "Beispiel ansehen",
  demoOnly: "Demo — kein öffentlicher Projektlink hinterlegt.",
  externalNote: "Externe Inspiration — kein Tool2day-Projekt.",
  appName: "PocketDesk",
  homeTitle: "Dein Tag auf einen Blick",
  homeLead: "Allgemeine App-Startseite — Bausteine erscheinen, sobald du sie auswählst.",
  tabHome: "Start",
  tabExplore: "Entdecken",
  tabProfile: "Profil",
  authTitle: "Anmelden",
  authEmail: "E-Mail",
  authPassword: "Passwort",
  authBtn: "Weiter",
  authNote: "Demo — keine echte Anmeldung.",
  profileTitle: "Mein Konto",
  pushTitle: "Neue Nachricht",
  pushBody: "Dein Termin morgen um 10:00 ist bestätigt.",
  pushTime: "jetzt",
  cameraTitle: "Foto aufnehmen",
  cameraLead: "Kamera-Demo für Belege oder Profilbilder.",
  cameraBtn: "Auswählen",
  cameraNote: "Kein Zugriff auf die echte Kamera.",
  locationTitle: "Standort",
  locationLead: "Karte mit Demo-Marker — kein echtes Tracking.",
  locationStatus: "Standort (Demo): aktiv",
  offlineTitle: "Offline bereit",
  offlineLead: "Zwischengespeicherte Inhalte bleiben verfügbar.",
  offlineBadge: "Offline-Modus",
  payTitle: "Abo wählen",
  payLead: "Kaufmaske nur zur Veranschaulichung.",
  payPlan: "PocketDesk Pro",
  payPrice: "9,90 € / Monat",
  payBtn: "Demo-Kauf",
  payNote: "Kein Geldeinzug.",
  apiTitle: "Live-Daten",
  apiLead: "Beispielinhalte, als kämen sie vom Server.",
  apiItem1: "Auftrag #204 — unterwegs",
  apiItem2: "Nachricht von Support",
  apiItem3: "Sync vor 2 Min.",
  storesTitle: "Store-Veröffentlichung",
  storesLead: "Hinweis auf mögliche Stores — nicht veröffentlicht.",
  storeApple: "App Store",
  storeGoogle: "Google Play",
  storesNote: "Nur Demo-Badges, keine Live-Listings.",
  examples: [
    {
      id: "booking",
      title: "Termin- & Service-App",
      audience: "Für Studios, Salons und lokale Dienstleister.",
      problem: "Kunden buchen mobil, Erinnerungen und Status bleiben klar.",
    },
    {
      id: "shop",
      title: "Shop-App mit Bestellstatus",
      audience: "Für Händler mit wiederkehrenden Käufen.",
      problem: "Einkauf, Warenkorb und Lieferung an einem Ort.",
    },
    {
      id: "client",
      title: "Kunden-App für Dateien & Anfragen",
      audience: "Für Agenturen, Handwerk und Beratung.",
      problem: "Kunden sehen Fortschritt und Dokumente ohne E-Mail-Pingpong.",
    },
    {
      id: "delivery",
      title: "Liefer- oder Tracking-App",
      audience: "Für Lieferdienste und Außendienst.",
      problem: "Standort und Status von Aufträgen werden nachvollziehbar.",
    },
    {
      id: "tasks",
      title: "Team- & Aufgaben-App",
      audience: "Für kleine Teams im Außendienst oder Büro.",
      problem: "Aufgaben, Zuständige und Erledigungen bleiben synchron.",
    },
    {
      id: "learn",
      title: "Lern-App mit Fortschritt",
      audience: "Für Kurse, Trainings und Onboarding.",
      problem: "Lektionen, Fortschritt und Erinnerungen mobil greifbar.",
    },
  ],
};

const en: MobilePreviewCopy = {
  tabPreview: "Preview",
  tabExamples: "Examples",
  kindMobile: "Mobile app",
  emptyHint: "Select mobile features — they appear here inside the phone frame.",
  demoBadge: "Demo / Preview",
  examplesEmpty: "Select mobile features to see related notes next to the examples.",
  examplesLead:
    "Example types for mobile apps. Not Tool2day client projects. Without a reliable link, cards stay demo-only.",
  viewExample: "View example",
  demoOnly: "Demo — no public project link attached yet.",
  externalNote: "External inspiration — not a Tool2day project.",
  appName: "PocketDesk",
  homeTitle: "Your day at a glance",
  homeLead: "A general app home — building blocks appear as you select them.",
  tabHome: "Home",
  tabExplore: "Explore",
  tabProfile: "Profile",
  authTitle: "Sign in",
  authEmail: "Email",
  authPassword: "Password",
  authBtn: "Continue",
  authNote: "Demo — no real sign-in.",
  profileTitle: "My account",
  pushTitle: "New message",
  pushBody: "Your appointment tomorrow at 10:00 is confirmed.",
  pushTime: "now",
  cameraTitle: "Take a photo",
  cameraLead: "Camera demo for receipts or profile photos.",
  cameraBtn: "Choose",
  cameraNote: "No access to the real camera.",
  locationTitle: "Location",
  locationLead: "Map with a demo marker — no real tracking.",
  locationStatus: "Location (demo): on",
  offlineTitle: "Ready offline",
  offlineLead: "Cached content stays available without a network.",
  offlineBadge: "Offline mode",
  payTitle: "Choose a plan",
  payLead: "Purchase screen for illustration only.",
  payPlan: "PocketDesk Pro",
  payPrice: "€9.90 / month",
  payBtn: "Demo purchase",
  payNote: "No money is collected.",
  apiTitle: "Live data",
  apiLead: "Sample items as if they came from a server.",
  apiItem1: "Order #204 — on the way",
  apiItem2: "Message from support",
  apiItem3: "Synced 2 min ago",
  storesTitle: "Store publishing",
  storesLead: "A cue for possible stores — not published.",
  storeApple: "App Store",
  storeGoogle: "Google Play",
  storesNote: "Demo badges only, no live listings.",
  examples: [
    {
      id: "booking",
      title: "Booking & services app",
      audience: "For studios, salons and local service businesses.",
      problem: "Customers book on mobile; reminders and status stay clear.",
    },
    {
      id: "shop",
      title: "Shop app with order tracking",
      audience: "For retailers with repeat purchases.",
      problem: "Shopping, cart and delivery updates in one place.",
    },
    {
      id: "client",
      title: "Client app for files & requests",
      audience: "For agencies, trades and consulting.",
      problem: "Clients see progress and documents without email ping-pong.",
    },
    {
      id: "delivery",
      title: "Delivery or tracking app",
      audience: "For delivery services and field teams.",
      problem: "Makes order location and status easy to follow.",
    },
    {
      id: "tasks",
      title: "Team & tasks app",
      audience: "For small field or office teams.",
      problem: "Keeps tasks, owners and completions in sync.",
    },
    {
      id: "learn",
      title: "Learning app with progress",
      audience: "For courses, training and onboarding.",
      problem: "Lessons, progress and reminders stay within reach.",
    },
  ],
};

export function getMobilePreviewCopy(locale: Locale): MobilePreviewCopy {
  return locale === "de" ? de : en;
}
