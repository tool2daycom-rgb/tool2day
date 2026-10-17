import type { Locale } from "./site";

export type WebappExample = {
  id: string;
  title: string;
  audience: string;
  problem: string;
  /** External inspiration URL — omit for demo-only cards */
  href?: string;
};

export type WebappPreviewCopy = {
  tabPreview: string;
  tabExamples: string;
  kindWebsite: string;
  kindApp: string;
  emptyHint: string;
  demoBadge: string;
  examplesEmpty: string;
  examplesLead: string;
  viewExample: string;
  demoOnly: string;
  externalNote: string;
  appName: string;
  searchPlaceholder: string;
  userName: string;
  navOverview: string;
  navOrders: string;
  navCustomers: string;
  navSettings: string;
  welcomeTitle: string;
  welcomeLead: string;
  kpiOrders: string;
  kpiRevenue: string;
  kpiOpen: string;
  kpiCustomers: string;
  tableTitle: string;
  colId: string;
  colCustomer: string;
  colStatus: string;
  colAmount: string;
  statusOpen: string;
  statusDone: string;
  statusWait: string;
  loginTitle: string;
  loginEmail: string;
  loginPassword: string;
  loginBtn: string;
  loginNote: string;
  dashboardTitle: string;
  dataTitle: string;
  dataAdd: string;
  dataName: string;
  dataCategory: string;
  rolesTitle: string;
  roleAdmin: string;
  roleEditor: string;
  roleViewer: string;
  rolesLead: string;
  paymentsTitle: string;
  paymentsLead: string;
  payStep1: string;
  payStep2: string;
  payStep3: string;
  payNote: string;
  reportsTitle: string;
  reportsLead: string;
  apiTitle: string;
  apiLead: string;
  apiEndpoint: string;
  apiStatus: string;
  examples: WebappExample[];
};

const de: WebappPreviewCopy = {
  tabPreview: "Vorschau",
  tabExamples: "Beispiele",
  kindWebsite: "Website",
  kindApp: "Web-App",
  emptyHint: "Wähle Web-App-Funktionen — sie erscheinen hier in der App-Vorschau.",
  demoBadge: "Demo / Beispielvorschau",
  examplesEmpty: "Wähle Web-App-Funktionen, um passende Beispieltypen zu sehen.",
  examplesLead:
    "Beispieltypen für Web-Apps. Keine Tool2day-Kundenprojekte. Ohne verlässlichen Link bleibt es eine Demo.",
  viewExample: "Beispiel ansehen",
  demoOnly: "Demo — kein öffentlicher Projektlink hinterlegt.",
  externalNote: "Externe Inspiration — kein Tool2day-Projekt.",
  appName: "Werkdesk",
  searchPlaceholder: "Suchen…",
  userName: "Demo Nutzer",
  navOverview: "Übersicht",
  navOrders: "Aufträge",
  navCustomers: "Kunden",
  navSettings: "Einstellungen",
  welcomeTitle: "Willkommen in deiner Web-App",
  welcomeLead: "Allgemeine Demo-Oberfläche — Bausteine erscheinen, sobald du sie auswählst.",
  kpiOrders: "Aufträge",
  kpiRevenue: "Umsatz (Demo)",
  kpiOpen: "Offen",
  kpiCustomers: "Kunden",
  tableTitle: "Aktuelle Aufträge",
  colId: "ID",
  colCustomer: "Kunde",
  colStatus: "Status",
  colAmount: "Betrag",
  statusOpen: "Offen",
  statusDone: "Erledigt",
  statusWait: "Wartet",
  loginTitle: "Anmelden",
  loginEmail: "E-Mail",
  loginPassword: "Passwort",
  loginBtn: "Einloggen",
  loginNote: "Demo-Login — keine echte Authentifizierung.",
  dashboardTitle: "Kennzahlen",
  dataTitle: "Daten verwalten",
  dataAdd: "Eintrag hinzufügen",
  dataName: "Bezeichnung",
  dataCategory: "Kategorie",
  rolesTitle: "Rollen & Rechte",
  roleAdmin: "Admin",
  roleEditor: "Bearbeiter",
  roleViewer: "Leser",
  rolesLead: "Unterschiedliche Zugriffe in der Demo.",
  paymentsTitle: "Zahlung (Demo)",
  paymentsLead: "Schritte nur zur Veranschaulichung — kein Geldeinzug.",
  payStep1: "1. Betrag prüfen",
  payStep2: "2. Methode wählen",
  payStep3: "3. Bestätigen",
  payNote: "Keine echte Zahlung.",
  reportsTitle: "Berichte",
  reportsLead: "Einfache Demo-Auswertung der letzten Wochen.",
  apiTitle: "API-Anbindung",
  apiLead: "Visueller Hinweis, wo externe Dienste andocken.",
  apiEndpoint: "Endpoint",
  apiStatus: "Verbunden (Demo)",
  examples: [
    {
      id: "sales-dashboard",
      title: "Verkaufs- & Auftrags-Dashboard",
      audience: "Für Shops, Handwerk und Dienstleister mit laufenden Aufträgen.",
      problem: "Hilft, offene Bestellungen, Umsatz und Status auf einen Blick zu sehen.",
    },
    {
      id: "booking-admin",
      title: "Termin- & Buchungsverwaltung",
      audience: "Für Studios, Praxen und lokale Services mit Terminbetrieb.",
      problem: "Bündelt Anfragen, Zeitfenster und Bestätigungen an einem Ort.",
    },
    {
      id: "client-portal",
      title: "Kundenportal",
      audience: "Für Agenturen, Handwerker und Berater mit laufenden Kundenprojekten.",
      problem: "Kunden sehen Status, Dateien oder Nachrichten ohne E-Mail-Chaos.",
    },
    {
      id: "crm",
      title: "CRM für Kundenkontakt",
      audience: "Für Vertriebsteams und Solo-Selbstständige mit vielen Kontakten.",
      problem: "Hält Kontakte, Notizen und nächste Schritte nachvollziehbar.",
    },
    {
      id: "inventory",
      title: "Bestands- & Produktverwaltung",
      audience: "Für Händler und Werkstätten mit Lager oder Produktkatalog.",
      problem: "Zeigt Bestände, Varianten und kritische Mengen übersichtlich.",
    },
    {
      id: "projects",
      title: "Projekt- & Aufgabenboard",
      audience: "Für kleine Teams mit parallelen Aufgaben und Deadlines.",
      problem: "Macht Zuständigkeiten, Fortschritt und Blocker sichtbar.",
    },
  ],
};

const en: WebappPreviewCopy = {
  tabPreview: "Preview",
  tabExamples: "Examples",
  kindWebsite: "Website",
  kindApp: "Web app",
  emptyHint: "Select web app features — they appear here in the app preview.",
  demoBadge: "Demo / Preview",
  examplesEmpty: "Select web app features to see matching example types.",
  examplesLead:
    "Example types for web apps. Not Tool2day client projects. Without a reliable link, cards stay demo-only.",
  viewExample: "View example",
  demoOnly: "Demo — no public project link attached yet.",
  externalNote: "External inspiration — not a Tool2day project.",
  appName: "Werkdesk",
  searchPlaceholder: "Search…",
  userName: "Demo User",
  navOverview: "Overview",
  navOrders: "Orders",
  navCustomers: "Customers",
  navSettings: "Settings",
  welcomeTitle: "Welcome to your web app",
  welcomeLead: "A general demo shell — building blocks appear as you select them.",
  kpiOrders: "Orders",
  kpiRevenue: "Revenue (demo)",
  kpiOpen: "Open",
  kpiCustomers: "Customers",
  tableTitle: "Recent orders",
  colId: "ID",
  colCustomer: "Customer",
  colStatus: "Status",
  colAmount: "Amount",
  statusOpen: "Open",
  statusDone: "Done",
  statusWait: "Waiting",
  loginTitle: "Sign in",
  loginEmail: "Email",
  loginPassword: "Password",
  loginBtn: "Log in",
  loginNote: "Demo login — no real authentication.",
  dashboardTitle: "Metrics",
  dataTitle: "Manage data",
  dataAdd: "Add record",
  dataName: "Name",
  dataCategory: "Category",
  rolesTitle: "Roles & permissions",
  roleAdmin: "Admin",
  roleEditor: "Editor",
  roleViewer: "Viewer",
  rolesLead: "Different access levels in the demo.",
  paymentsTitle: "Payment (demo)",
  paymentsLead: "Steps for illustration only — no money is collected.",
  payStep1: "1. Review amount",
  payStep2: "2. Choose method",
  payStep3: "3. Confirm",
  payNote: "No real payment.",
  reportsTitle: "Reports",
  reportsLead: "Simple demo chart for the last few weeks.",
  apiTitle: "API connection",
  apiLead: "A visual cue for where external services plug in.",
  apiEndpoint: "Endpoint",
  apiStatus: "Connected (demo)",
  examples: [
    {
      id: "sales-dashboard",
      title: "Sales & orders dashboard",
      audience: "For shops, trades and services with ongoing orders.",
      problem: "Helps you see open orders, revenue and status at a glance.",
    },
    {
      id: "booking-admin",
      title: "Booking & appointment admin",
      audience: "For studios, clinics and local services with schedules.",
      problem: "Keeps requests, time slots and confirmations in one place.",
    },
    {
      id: "client-portal",
      title: "Client portal",
      audience: "For agencies, crafts and advisors with active clients.",
      problem: "Clients can follow status, files or messages without email chaos.",
    },
    {
      id: "crm",
      title: "CRM for customer contact",
      audience: "For sales teams and independents with many contacts.",
      problem: "Keeps contacts, notes and next steps easy to follow.",
    },
    {
      id: "inventory",
      title: "Inventory & product management",
      audience: "For retailers and workshops with stock or catalogues.",
      problem: "Shows stock levels, variants and low-quantity alerts clearly.",
    },
    {
      id: "projects",
      title: "Projects & tasks board",
      audience: "For small teams with parallel tasks and deadlines.",
      problem: "Makes owners, progress and blockers visible.",
    },
  ],
};

export function getWebappPreviewCopy(locale: Locale): WebappPreviewCopy {
  return locale === "de" ? de : en;
}
