import type { Locale } from "./site";

export type MobileExample = {
  id: string;
  title: string;
  audience: string;
  problem: string;
  href?: string;
};

export type AppKind = "shop" | "booking" | "client" | "delivery";

export type MobilePreviewCopy = {
  tabPreview: string;
  tabExamples: string;
  kindMobile: string;
  emptyHint: string;
  demoBadge: string;
  demoShort: string;
  examplesEmpty: string;
  examplesLead: string;
  viewExample: string;
  demoOnly: string;
  externalNote: string;
  back: string;
  seeAll: string;
  offlineBadge: string;
  pushTitle: string;
  pushBody: string;
  pushTime: string;
  authNote: string;
  payNote: string;
  mapNote: string;
  cameraNote: string;
  bioNote: string;
  apps: Record<
    AppKind,
    {
      name: string;
      greeting: string;
      homeSub: string;
      tabHome: string;
      tabBrowse: string;
      tabCart: string;
      tabOrders: string;
      tabInbox: string;
      tabFiles: string;
      tabTrack: string;
      tabScan: string;
      tabProfile: string;
      items: { title: string; meta: string; price?: string }[];
      heroCta: string;
    }
  >;
  searchPlaceholder: string;
  filtersLabel: string;
  favoritesLabel: string;
  reviewsLabel: string;
  reviewSample: string;
  cartTitle: string;
  cartQty: string;
  cartTotal: string;
  checkoutCta: string;
  payTitle: string;
  payMethod: string;
  payBtn: string;
  couponLabel: string;
  couponCode: string;
  couponApplied: string;
  subTitle: string;
  subPlan: string;
  subPrice: string;
  orderTitle: string;
  orderId: string;
  orderSteps: [string, string, string];
  mapTitle: string;
  mapEta: string;
  trackStatus: string;
  chatTitle: string;
  chatSample: string;
  chatReply: string;
  chatPlaceholder: string;
  messagesTitle: string;
  messages: [string, string];
  filesTitle: string;
  files: [string, string];
  filesBtn: string;
  cameraTitle: string;
  cameraBtn: string;
  qrTitle: string;
  qrHint: string;
  profileTitle: string;
  profileName: string;
  profileEmail: string;
  profileSettings: string;
  langRow: string;
  syncRow: string;
  a11yRow: string;
  authTitle: string;
  authEmail: string;
  authPassword: string;
  authSocial: string;
  authBtn: string;
  bioBtn: string;
  adminTitle: string;
  adminUsers: string;
  adminOrders: string;
  analyticsTitle: string;
  apiTitle: string;
  apiSynced: string;
  examples: MobileExample[];
};

const de: MobilePreviewCopy = {
  tabPreview: "Vorschau",
  tabExamples: "Beispiele",
  kindMobile: "Mobile App",
  emptyHint: "Wähle Funktionen — die App-Vorschau baut sich daraus auf.",
  demoBadge: "Demo",
  demoShort: "Demo",
  examplesEmpty: "Wähle Funktionen, um passende Hinweise zu sehen.",
  examplesLead:
    "Beispieltypen für Mobile Apps. Keine Tool2day-Kundenprojekte. Ohne verlässlichen Link bleibt es eine Demo.",
  viewExample: "Beispiel ansehen",
  demoOnly: "Demo — kein öffentlicher Projektlink hinterlegt.",
  externalNote: "Externe Inspiration — kein Tool2day-Projekt.",
  back: "Zurück",
  seeAll: "Alle",
  offlineBadge: "Offline",
  pushTitle: "Erinnerung",
  pushBody: "Dein Termin morgen um 10:00 ist bestätigt.",
  pushTime: "jetzt",
  authNote: "Nur Demo — keine echte Anmeldung.",
  payNote: "Nur Demo — kein Geldeinzug.",
  mapNote: "Nur Demo — kein echtes Tracking.",
  cameraNote: "Nur Demo — kein Kamerazugriff.",
  bioNote: "Nur Demo — keine Biometrie.",
  apps: {
    shop: {
      name: "NordMarkt",
      greeting: "Guten Tag",
      homeSub: "Frisch für dich ausgewählt",
      tabHome: "Start",
      tabBrowse: "Shop",
      tabCart: "Warenkorb",
      tabOrders: "Bestellungen",
      tabInbox: "Post",
      tabFiles: "Dateien",
      tabTrack: "Sendung",
      tabScan: "Scan",
      tabProfile: "Konto",
      items: [
        { title: "Wochenbox Bio", meta: "8 Produkte · Lieferung Di", price: "34,90 €" },
        { title: "Saison-Salat", meta: "Frisch · regional", price: "6,50 €" },
        { title: "Brot vom Ofner", meta: "Sauerteig", price: "4,20 €" },
      ],
      heroCta: "Zum Warenkorb",
    },
    booking: {
      name: "Studio Holm",
      greeting: "Willkommen",
      homeSub: "Nächster Termin & Services",
      tabHome: "Start",
      tabBrowse: "Termine",
      tabCart: "Warenkorb",
      tabOrders: "Status",
      tabInbox: "Chat",
      tabFiles: "Dateien",
      tabTrack: "Route",
      tabScan: "Check-in",
      tabProfile: "Profil",
      items: [
        { title: "Haarschnitt", meta: "45 Min · morgen 10:00", price: "48 €" },
        { title: "Farbe & Pflege", meta: "90 Min · Fr 14:30", price: "89 €" },
        { title: "Beratung", meta: "20 Min · online", price: "0 €" },
      ],
      heroCta: "Termin buchen",
    },
    client: {
      name: "ClientHub",
      greeting: "Projektübersicht",
      homeSub: "Offene Aufgaben & Dateien",
      tabHome: "Start",
      tabBrowse: "Anfragen",
      tabCart: "Warenkorb",
      tabOrders: "Aufträge",
      tabInbox: "Nachrichten",
      tabFiles: "Dateien",
      tabTrack: "Status",
      tabScan: "Scan",
      tabProfile: "Konto",
      items: [
        { title: "Website Relaunch", meta: "In Prüfung · Update heute", price: undefined },
        { title: "Angebot Q2", meta: "PDF bereit · 12 Seiten", price: undefined },
        { title: "Feedback Runde 2", meta: "Fällig Freitag", price: undefined },
      ],
      heroCta: "Nachricht senden",
    },
    delivery: {
      name: "FleetGo",
      greeting: "Heute unterwegs",
      homeSub: "Aktive Lieferung & Route",
      tabHome: "Start",
      tabBrowse: "Aufträge",
      tabCart: "Warenkorb",
      tabOrders: "Historie",
      tabInbox: "Chat",
      tabFiles: "Belege",
      tabTrack: "Live",
      tabScan: "QR",
      tabProfile: "Profil",
      items: [
        { title: "Paket #4821", meta: "Mitte · Empfänger zu Hause", price: undefined },
        { title: "Paket #4827", meta: "Nord · Klingeln", price: undefined },
        { title: "Rückgabe #119", meta: "Abholung 15:00", price: undefined },
      ],
      heroCta: "Route öffnen",
    },
  },
  searchPlaceholder: "Suchen…",
  filtersLabel: "Filter",
  favoritesLabel: "Gespeichert",
  reviewsLabel: "Bewertungen",
  reviewSample: "★★★★☆ „Schnelle Lieferung, super Qualität.“",
  cartTitle: "Warenkorb",
  cartQty: "1×",
  cartTotal: "Summe 41,40 €",
  checkoutCta: "Zur Kasse",
  payTitle: "Bezahlen",
  payMethod: "Karte ·••• 4242",
  payBtn: "Jetzt zahlen (Demo)",
  couponLabel: "Gutschein",
  couponCode: "WILLKOMMEN10",
  couponApplied: "−10 % angewendet",
  subTitle: "Abo",
  subPlan: "NordMarkt Plus",
  subPrice: "4,90 € / Monat",
  orderTitle: "Bestellstatus",
  orderId: "Bestellung #204",
  orderSteps: ["Bestätigt", "Unterwegs", "Zugestellt"],
  mapTitle: "Karte",
  mapEta: "Ankunft in ca. 12 Min.",
  trackStatus: "Fahrer ist unterwegs",
  chatTitle: "Chat",
  chatSample: "Hallo! Wann kommt die Lieferung?",
  chatReply: "Gegen 14:20 — klingeln Sie bitte.",
  chatPlaceholder: "Nachricht…",
  messagesTitle: "Posteingang",
  messages: ["Erinnerung: Unterlagen prüfen", "Support: Ticket #88 geschlossen"],
  filesTitle: "Dateien",
  files: ["Angebot.pdf · 240 KB", "Briefing.docx · 88 KB"],
  filesBtn: "Hochladen",
  cameraTitle: "Foto",
  cameraBtn: "Aufnehmen",
  qrTitle: "QR scannen",
  qrHint: "Code in den Rahmen halten",
  profileTitle: "Mein Konto",
  profileName: "Alex Müller",
  profileEmail: "alex@beispiel.de",
  profileSettings: "Einstellungen",
  langRow: "Sprache: Deutsch",
  syncRow: "Geräte-Sync · vor 2 Min.",
  a11yRow: "Textgröße: groß",
  authTitle: "Anmelden",
  authEmail: "E-Mail",
  authPassword: "Passwort",
  authSocial: "Mit Apple fortfahren",
  authBtn: "Weiter",
  bioBtn: "Mit Face ID",
  adminTitle: "Übersicht",
  adminUsers: "128 Nutzer",
  adminOrders: "19 offen",
  analyticsTitle: "Diese Woche",
  apiTitle: "Live-Daten",
  apiSynced: "API synchron · vor 1 Min.",
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
  emptyHint: "Select features — the app preview builds from your choices.",
  demoBadge: "Demo",
  demoShort: "Demo",
  examplesEmpty: "Select features to see related notes.",
  examplesLead:
    "Example types for mobile apps. Not Tool2day client projects. Without a reliable link, cards stay demo-only.",
  viewExample: "View example",
  demoOnly: "Demo — no public project link attached yet.",
  externalNote: "External inspiration — not a Tool2day project.",
  back: "Back",
  seeAll: "All",
  offlineBadge: "Offline",
  pushTitle: "Reminder",
  pushBody: "Your appointment tomorrow at 10:00 is confirmed.",
  pushTime: "now",
  authNote: "Demo only — no real sign-in.",
  payNote: "Demo only — no real charge.",
  mapNote: "Demo only — no live tracking.",
  cameraNote: "Demo only — no camera access.",
  bioNote: "Demo only — no biometrics.",
  apps: {
    shop: {
      name: "NordMarkt",
      greeting: "Good day",
      homeSub: "Picked fresh for you",
      tabHome: "Home",
      tabBrowse: "Shop",
      tabCart: "Cart",
      tabOrders: "Orders",
      tabInbox: "Inbox",
      tabFiles: "Files",
      tabTrack: "Track",
      tabScan: "Scan",
      tabProfile: "Account",
      items: [
        { title: "Weekly organic box", meta: "8 items · Tue delivery", price: "€34.90" },
        { title: "Season salad", meta: "Fresh · local", price: "€6.50" },
        { title: "Ofner sourdough", meta: "Bakery", price: "€4.20" },
      ],
      heroCta: "View cart",
    },
    booking: {
      name: "Studio Holm",
      greeting: "Welcome",
      homeSub: "Next visit & services",
      tabHome: "Home",
      tabBrowse: "Book",
      tabCart: "Cart",
      tabOrders: "Status",
      tabInbox: "Chat",
      tabFiles: "Files",
      tabTrack: "Route",
      tabScan: "Check-in",
      tabProfile: "Profile",
      items: [
        { title: "Haircut", meta: "45 min · tomorrow 10:00", price: "€48" },
        { title: "Colour & care", meta: "90 min · Fri 14:30", price: "€89" },
        { title: "Consultation", meta: "20 min · online", price: "€0" },
      ],
      heroCta: "Book a visit",
    },
    client: {
      name: "ClientHub",
      greeting: "Project overview",
      homeSub: "Open tasks & files",
      tabHome: "Home",
      tabBrowse: "Requests",
      tabCart: "Cart",
      tabOrders: "Jobs",
      tabInbox: "Messages",
      tabFiles: "Files",
      tabTrack: "Status",
      tabScan: "Scan",
      tabProfile: "Account",
      items: [
        { title: "Website relaunch", meta: "In review · updated today", price: undefined },
        { title: "Q2 proposal", meta: "PDF ready · 12 pages", price: undefined },
        { title: "Feedback round 2", meta: "Due Friday", price: undefined },
      ],
      heroCta: "Send message",
    },
    delivery: {
      name: "FleetGo",
      greeting: "On the road",
      homeSub: "Active delivery & route",
      tabHome: "Home",
      tabBrowse: "Jobs",
      tabCart: "Cart",
      tabOrders: "History",
      tabInbox: "Chat",
      tabFiles: "Receipts",
      tabTrack: "Live",
      tabScan: "QR",
      tabProfile: "Profile",
      items: [
        { title: "Parcel #4821", meta: "Centre · recipient home", price: undefined },
        { title: "Parcel #4827", meta: "North · ring bell", price: undefined },
        { title: "Return #119", meta: "Pickup 15:00", price: undefined },
      ],
      heroCta: "Open route",
    },
  },
  searchPlaceholder: "Search…",
  filtersLabel: "Filters",
  favoritesLabel: "Saved",
  reviewsLabel: "Reviews",
  reviewSample: "★★★★☆ “Fast delivery, great quality.”",
  cartTitle: "Cart",
  cartQty: "1×",
  cartTotal: "Total €41.40",
  checkoutCta: "Checkout",
  payTitle: "Pay",
  payMethod: "Card ·••• 4242",
  payBtn: "Pay now (demo)",
  couponLabel: "Coupon",
  couponCode: "WELCOME10",
  couponApplied: "−10% applied",
  subTitle: "Subscription",
  subPlan: "NordMarkt Plus",
  subPrice: "€4.90 / month",
  orderTitle: "Order status",
  orderId: "Order #204",
  orderSteps: ["Confirmed", "On the way", "Delivered"],
  mapTitle: "Map",
  mapEta: "Arrival in ~12 min",
  trackStatus: "Driver is on the way",
  chatTitle: "Chat",
  chatSample: "Hi! When will the delivery arrive?",
  chatReply: "Around 14:20 — please ring the bell.",
  chatPlaceholder: "Message…",
  messagesTitle: "Inbox",
  messages: ["Reminder: review documents", "Support: ticket #88 closed"],
  filesTitle: "Files",
  files: ["Proposal.pdf · 240 KB", "Briefing.docx · 88 KB"],
  filesBtn: "Upload",
  cameraTitle: "Photo",
  cameraBtn: "Capture",
  qrTitle: "Scan QR",
  qrHint: "Align the code in the frame",
  profileTitle: "My account",
  profileName: "Alex Miller",
  profileEmail: "alex@example.com",
  profileSettings: "Settings",
  langRow: "Language: English",
  syncRow: "Device sync · 2 min ago",
  a11yRow: "Text size: large",
  authTitle: "Sign in",
  authEmail: "Email",
  authPassword: "Password",
  authSocial: "Continue with Apple",
  authBtn: "Continue",
  bioBtn: "Use Face ID",
  adminTitle: "Overview",
  adminUsers: "128 users",
  adminOrders: "19 open",
  analyticsTitle: "This week",
  apiTitle: "Live data",
  apiSynced: "API synced · 1 min ago",
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

export function inferAppKind(selected: string[]): AppKind {
  const score = (ids: string[]) => ids.filter((id) => selected.includes(id)).length;
  const commerce = score([
    "cart-orders",
    "payments",
    "coupons",
    "order-status",
    "subscriptions",
  ]);
  const delivery = score(["maps-directions", "live-tracking", "qr-scan"]);
  const client = score([
    "file-transfer",
    "chat",
    "in-app-messages",
    "admin-dashboard",
    "analytics",
    "external-api",
  ]);
  const booking = score(["reviews", "camera-upload", "favorites", "search-filters"]);

  const ranked: { kind: AppKind; n: number }[] = (
    [
      { kind: "shop" as const, n: commerce },
      { kind: "delivery" as const, n: delivery },
      { kind: "client" as const, n: client },
      { kind: "booking" as const, n: booking },
    ] satisfies { kind: AppKind; n: number }[]
  ).sort((a, b) => b.n - a.n);

  if (ranked[0].n === 0) return "booking";
  return ranked[0].kind;
}
