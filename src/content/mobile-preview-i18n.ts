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
  authSocial: string;
  authBtn: string;
  authNote: string;
  profileTitle: string;
  profileName: string;
  profileEdit: string;
  chatTitle: string;
  chatSample: string;
  chatReply: string;
  messagesTitle: string;
  messagesItem: string;
  reviewsTitle: string;
  reviewsSample: string;
  searchTitle: string;
  searchPlaceholder: string;
  searchResult: string;
  favoritesTitle: string;
  favoritesItem: string;
  filesTitle: string;
  filesItem: string;
  filesBtn: string;
  langTitle: string;
  langDe: string;
  langEn: string;
  pushTitle: string;
  pushBody: string;
  pushTime: string;
  mapsTitle: string;
  mapsLead: string;
  trackingTitle: string;
  trackingStatus: string;
  qrTitle: string;
  qrLead: string;
  cameraTitle: string;
  cameraLead: string;
  cameraBtn: string;
  cameraNote: string;
  cartTitle: string;
  cartItem: string;
  cartTotal: string;
  payTitle: string;
  payLead: string;
  payBtn: string;
  payNote: string;
  subTitle: string;
  subPlan: string;
  subPrice: string;
  couponTitle: string;
  couponCode: string;
  orderTitle: string;
  orderStep: string;
  offlineTitle: string;
  offlineLead: string;
  offlineBadge: string;
  bioTitle: string;
  bioLead: string;
  bioBtn: string;
  apiTitle: string;
  apiLead: string;
  apiItem1: string;
  apiItem2: string;
  apiItem3: string;
  adminTitle: string;
  adminUsers: string;
  adminOrders: string;
  analyticsTitle: string;
  analyticsLead: string;
  syncTitle: string;
  syncLead: string;
  a11yTitle: string;
  a11yLead: string;
  a11yLarge: string;
  examples: MobileExample[];
};

const de: MobilePreviewCopy = {
  tabPreview: "Vorschau",
  tabExamples: "Beispiele",
  kindMobile: "Mobile App",
  emptyHint: "Wähle Mobile-Funktionen — sie erscheinen hier im iPhone-Rahmen.",
  demoBadge: "Demo / Beispielvorschau",
  examplesEmpty: "Wähle Funktionen, um passende Hinweise zu sehen.",
  examplesLead:
    "Beispieltypen für Mobile Apps. Keine Tool2day-Kundenprojekte. Ohne verlässlichen Link bleibt es eine Demo.",
  viewExample: "Beispiel ansehen",
  demoOnly: "Demo — kein öffentlicher Projektlink hinterlegt.",
  externalNote: "Externe Inspiration — kein Tool2day-Projekt.",
  appName: "PocketDesk",
  homeTitle: "Dein Tag auf einen Blick",
  homeLead: "Allgemeine App-Startseite — Bausteine erscheinen mit deiner Auswahl.",
  tabHome: "Start",
  tabExplore: "Entdecken",
  tabProfile: "Profil",
  authTitle: "Anmelden",
  authEmail: "E-Mail",
  authPassword: "Passwort",
  authSocial: "Weiter mit Google / Apple (Demo)",
  authBtn: "Weiter",
  authNote: "Demo — keine echte Anmeldung.",
  profileTitle: "Mein Konto",
  profileName: "Demo Nutzer",
  profileEdit: "Einstellungen",
  chatTitle: "Chat",
  chatSample: "Hallo! Wann ist der nächste Termin?",
  chatReply: "Morgen um 10:00 — passt das?",
  messagesTitle: "Nachrichten",
  messagesItem: "Erinnerung: Unterlagen hochladen",
  reviewsTitle: "Bewertungen",
  reviewsSample: "★★★★☆ „Schnelle Rückmeldung, klarer Ablauf.“",
  searchTitle: "Suche",
  searchPlaceholder: "Suchen…",
  searchResult: "3 Treffer in der Nähe",
  favoritesTitle: "Favoriten",
  favoritesItem: "Studio Holm · gespeichert",
  filesTitle: "Dateien",
  filesItem: "Angebot.pdf",
  filesBtn: "Hochladen (Demo)",
  langTitle: "Sprache",
  langDe: "DE",
  langEn: "EN",
  pushTitle: "Neue Erinnerung",
  pushBody: "Dein Termin morgen um 10:00 ist bestätigt.",
  pushTime: "jetzt",
  mapsTitle: "Karte & Route",
  mapsLead: "Demo-Karte mit Zielpunkt.",
  trackingTitle: "Live-Tracking",
  trackingStatus: "Unterwegs · Ankunft ~12 Min. (Demo)",
  qrTitle: "QR scannen",
  qrLead: "Rahmen zum Scannen — kein echter Kamerazugriff.",
  cameraTitle: "Foto",
  cameraLead: "Aufnahme oder Upload nur zur Demo.",
  cameraBtn: "Auswählen",
  cameraNote: "Kein Zugriff auf die echte Kamera.",
  cartTitle: "Warenkorb",
  cartItem: "Service-Paket · 1×",
  cartTotal: "Summe 89 €",
  payTitle: "Zahlung",
  payLead: "Checkout-Schritte ohne Geldeinzug.",
  payBtn: "Demo bezahlen",
  payNote: "Keine echte Zahlung.",
  subTitle: "Abo",
  subPlan: "PocketDesk Pro",
  subPrice: "9,90 € / Monat",
  couponTitle: "Gutschein",
  couponCode: "WILLKOMMEN10",
  orderTitle: "Bestellstatus",
  orderStep: "In Bearbeitung → Versand vorbereitet",
  offlineTitle: "Offline bereit",
  offlineLead: "Inhalte bleiben lokal und synchronisieren später.",
  offlineBadge: "Offline-Modus",
  bioTitle: "Biometrie",
  bioLead: "Face ID / Fingerabdruck nur als Demo-Hinweis.",
  bioBtn: "Mit Biometrie freischalten",
  apiTitle: "Live-Daten",
  apiLead: "Beispielinhalte wie von einem Server.",
  apiItem1: "Auftrag #204 — unterwegs",
  apiItem2: "Nachricht von Support",
  apiItem3: "Sync vor 2 Min.",
  adminTitle: "Admin",
  adminUsers: "Nutzer: 128",
  adminOrders: "Offene Aufträge: 19",
  analyticsTitle: "Analysen",
  analyticsLead: "Demo-Auswertung der letzten Woche.",
  syncTitle: "Geräte-Sync",
  syncLead: "Zuletzt synchronisiert · iPhone & iPad (Demo)",
  a11yTitle: "Barrierefreiheit",
  a11yLead: "Größere Schrift und Screenreader-Hinweise.",
  a11yLarge: "Textgröße: groß",
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
  emptyHint: "Select mobile features — they appear here inside the iPhone frame.",
  demoBadge: "Demo / Preview",
  examplesEmpty: "Select features to see related notes.",
  examplesLead:
    "Example types for mobile apps. Not Tool2day client projects. Without a reliable link, cards stay demo-only.",
  viewExample: "View example",
  demoOnly: "Demo — no public project link attached yet.",
  externalNote: "External inspiration — not a Tool2day project.",
  appName: "PocketDesk",
  homeTitle: "Your day at a glance",
  homeLead: "A general app home — building blocks appear with your selection.",
  tabHome: "Home",
  tabExplore: "Explore",
  tabProfile: "Profile",
  authTitle: "Sign in",
  authEmail: "Email",
  authPassword: "Password",
  authSocial: "Continue with Google / Apple (demo)",
  authBtn: "Continue",
  authNote: "Demo — no real sign-in.",
  profileTitle: "My account",
  profileName: "Demo User",
  profileEdit: "Settings",
  chatTitle: "Chat",
  chatSample: "Hi! When is the next appointment?",
  chatReply: "Tomorrow at 10:00 — does that work?",
  messagesTitle: "Messages",
  messagesItem: "Reminder: upload documents",
  reviewsTitle: "Reviews",
  reviewsSample: "★★★★☆ “Fast reply, clear process.”",
  searchTitle: "Search",
  searchPlaceholder: "Search…",
  searchResult: "3 nearby results",
  favoritesTitle: "Favorites",
  favoritesItem: "Studio Holm · saved",
  filesTitle: "Files",
  filesItem: "Proposal.pdf",
  filesBtn: "Upload (demo)",
  langTitle: "Language",
  langDe: "DE",
  langEn: "EN",
  pushTitle: "New reminder",
  pushBody: "Your appointment tomorrow at 10:00 is confirmed.",
  pushTime: "now",
  mapsTitle: "Map & directions",
  mapsLead: "Demo map with a destination pin.",
  trackingTitle: "Live tracking",
  trackingStatus: "On the way · ETA ~12 min (demo)",
  qrTitle: "Scan QR",
  qrLead: "Scan frame — no real camera access.",
  cameraTitle: "Photo",
  cameraLead: "Capture or upload for demo only.",
  cameraBtn: "Choose",
  cameraNote: "No access to the real camera.",
  cartTitle: "Cart",
  cartItem: "Service pack · 1×",
  cartTotal: "Total €89",
  payTitle: "Payment",
  payLead: "Checkout steps without collecting money.",
  payBtn: "Demo pay",
  payNote: "No real payment.",
  subTitle: "Subscription",
  subPlan: "PocketDesk Pro",
  subPrice: "€9.90 / month",
  couponTitle: "Coupon",
  couponCode: "WELCOME10",
  orderTitle: "Order status",
  orderStep: "In progress → Ready to ship",
  offlineTitle: "Ready offline",
  offlineLead: "Content stays local and syncs later.",
  offlineBadge: "Offline mode",
  bioTitle: "Biometrics",
  bioLead: "Face ID / fingerprint as a demo cue only.",
  bioBtn: "Unlock with biometrics",
  apiTitle: "Live data",
  apiLead: "Sample items as if from a server.",
  apiItem1: "Order #204 — on the way",
  apiItem2: "Message from support",
  apiItem3: "Synced 2 min ago",
  adminTitle: "Admin",
  adminUsers: "Users: 128",
  adminOrders: "Open orders: 19",
  analyticsTitle: "Analytics",
  analyticsLead: "Demo chart for the last week.",
  syncTitle: "Device sync",
  syncLead: "Last synced · iPhone & iPad (demo)",
  a11yTitle: "Accessibility",
  a11yLead: "Larger text and screen-reader cues.",
  a11yLarge: "Text size: large",
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
