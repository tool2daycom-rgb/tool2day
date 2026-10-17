import type { Locale } from "./site";

export type PreviewCopy = {
  tabPreview: string;
  tabExamples: string;
  mobileOptions: string;
  mobilePreview: string;
  emptyHint: string;
  demoBadge: string;
  examplesEmpty: string;
  examplesLead: string;
  viewExample: string;
  demoOnly: string;
  siteName: string;
  navHome: string;
  navServices: string;
  navContact: string;
  heroTitle: string;
  heroLead: string;
  heroCta: string;
  servicesTitle: string;
  servicesItem1: string;
  servicesItem2: string;
  servicesItem3: string;
  contactTitle: string;
  contactLead: string;
  galleryTitle: string;
  galleryAll: string;
  galleryInterior: string;
  galleryOutdoor: string;
  mapTitle: string;
  mapAddress: string;
  mapHours: string;
  downloadsTitle: string;
  downloadPdf: string;
  downloadPrice: string;
  downloadGuide: string;
  downloadBtn: string;
  langDe: string;
  langEn: string;
  blogTitle: string;
  blog1: string;
  blog1Meta: string;
  blog2: string;
  blog2Meta: string;
  blog3: string;
  blog3Meta: string;
  newsletterTitle: string;
  newsletterLead: string;
  newsletterPlaceholder: string;
  newsletterBtn: string;
  cmsBanner: string;
  toolTitle: string;
  toolLead: string;
  toolLabel: string;
  toolResult: string;
  bookingTitle: string;
  bookingLead: string;
  bookingPick: string;
  bookingConfirm: string;
  bookingNote: string;
  couponTitle: string;
  couponCode: string;
  couponLead: string;
  loginTitle: string;
  loginEmail: string;
  loginPassword: string;
  loginBtn: string;
  loginNote: string;
  exampleBlurb: Record<string, string>;
};

const de: PreviewCopy = {
  tabPreview: "Vorschau",
  tabExamples: "Referenzen",
  mobileOptions: "Optionen",
  mobilePreview: "Vorschau",
  emptyHint: "Wähle links Bausteine — sie erscheinen hier in der Vorschau.",
  demoBadge: "Demo / Vorschau",
  examplesEmpty: "Wähle Website-Funktionen, um passende Demo-Hinweise zu sehen.",
  examplesLead:
    "Echte Projektlinks folgen später. Bis dahin siehst du Demo-Hinweise zur jeweiligen Funktion.",
  viewExample: "Beispiel ansehen",
  demoOnly: "Demo — kein öffentlicher Projektlink hinterlegt.",
  siteName: "Nordwerk Studio",
  navHome: "Start",
  navServices: "Leistungen",
  navContact: "Kontakt",
  heroTitle: "Klarer Auftritt für dein lokales Angebot.",
  heroLead:
    "Eine Beispielwebsite für kleine Unternehmen — übersichtlich, mobil und bereit für deine Bausteine.",
  heroCta: "Termin anfragen",
  servicesTitle: "Leistungen",
  servicesItem1: "Beratung vor Ort",
  servicesItem2: "Umsetzung & Pflege",
  servicesItem3: "Persönlicher Kontakt",
  contactTitle: "Kontakt",
  contactLead: "Schreib uns kurz — wir melden uns zeitnah.",
  galleryTitle: "Arbeiten",
  galleryAll: "Alle",
  galleryInterior: "Innen",
  galleryOutdoor: "Außen",
  mapTitle: "So findest du uns",
  mapAddress: "Musterstraße 12, 20095 Hamburg",
  mapHours: "Di–Fr 10–18 Uhr",
  downloadsTitle: "Downloads",
  downloadPdf: "Leistungsübersicht.pdf",
  downloadPrice: "Preisliste.pdf",
  downloadGuide: "Kurzleitfaden.pdf",
  downloadBtn: "Download",
  langDe: "DE",
  langEn: "EN",
  blogTitle: "News",
  blog1: "Warum klare Startseiten besser konvertieren",
  blog1Meta: "3 Min. Lesezeit",
  blog2: "Checkliste vor dem Relaunch",
  blog2Meta: "5 Min. Lesezeit",
  blog3: "Lokale Sichtbarkeit ohne Tricks",
  blog3Meta: "4 Min. Lesezeit",
  newsletterTitle: "Nichts verpassen",
  newsletterLead: "Gelegentliche Updates — jederzeit abmeldbar.",
  newsletterPlaceholder: "E-Mail",
  newsletterBtn: "Anmelden",
  cmsBanner: "Inhalte hier selbst pflegen (CMS-Demo)",
  toolTitle: "Kurzer Rechner",
  toolLead: "Beispiel-Tool direkt auf der Seite.",
  toolLabel: "Anzahl Stunden",
  toolResult: "Richtwert",
  bookingTitle: "Termin wählen",
  bookingLead: "Demo — es wird kein echter Termin gebucht.",
  bookingPick: "Zeitfenster",
  bookingConfirm: "Vormerken",
  bookingNote: "Nur zur Veranschaulichung.",
  couponTitle: "Gutschein",
  couponCode: "WILLKOMMEN10",
  couponLead: "Demo-Code — nicht einlösbar.",
  loginTitle: "Kundenbereich",
  loginEmail: "E-Mail",
  loginPassword: "Passwort",
  loginBtn: "Anmelden",
  loginNote: "Demo-Login — keine echte Anmeldung.",
  exampleBlurb: {
    gallery: "Galerie mit Filtern — ideal für Studios und Handwerk.",
    map: "Standortkarte mit Adresse und Öffnungszeiten.",
    downloads: "Datei-Bereich für PDFs und Unterlagen.",
    multilingual: "Sprachwechsel im Kopfbereich der Seite.",
    blog: "News-Karten für Beiträge und Tipps.",
    newsletter: "Schlichtes Anmeldeformular für Updates.",
    cms: "Hinweis, dass Inhalte selbst gepflegt werden können.",
    tool: "Interaktiver Rechner als Beispiel-Werkzeug.",
    booking: "Terminauswahl ohne echte Buchung.",
    coupons: "Gutschein-Karte mit Demo-Code.",
    "client-login": "Login-Maske für einen geschützten Bereich.",
  },
};

const en: PreviewCopy = {
  tabPreview: "Preview",
  tabExamples: "Examples",
  mobileOptions: "Options",
  mobilePreview: "Preview",
  emptyHint: "Select features on the left — they appear here in the preview.",
  demoBadge: "Demo / Preview",
  examplesEmpty: "Select website features to see matching demo notes.",
  examplesLead:
    "Real project links can be added later. For now you’ll see demo notes for each selected feature.",
  viewExample: "View example",
  demoOnly: "Demo — no public project link attached yet.",
  siteName: "Northworks Studio",
  navHome: "Home",
  navServices: "Services",
  navContact: "Contact",
  heroTitle: "A clear presence for your local business.",
  heroLead:
    "A sample website for small businesses — tidy, mobile-friendly, ready for your building blocks.",
  heroCta: "Request a visit",
  servicesTitle: "Services",
  servicesItem1: "On-site advice",
  servicesItem2: "Delivery & care",
  servicesItem3: "Direct contact",
  contactTitle: "Contact",
  contactLead: "Send a short note — we’ll get back to you.",
  galleryTitle: "Selected work",
  galleryAll: "All",
  galleryInterior: "Indoor",
  galleryOutdoor: "Outdoor",
  mapTitle: "Find us",
  mapAddress: "Example Street 12, 20095 Hamburg",
  mapHours: "Tue–Fri 10am–6pm",
  downloadsTitle: "Downloads",
  downloadPdf: "Services overview.pdf",
  downloadPrice: "Price list.pdf",
  downloadGuide: "Quick guide.pdf",
  downloadBtn: "Download",
  langDe: "DE",
  langEn: "EN",
  blogTitle: "News",
  blog1: "Why clear homepages convert better",
  blog1Meta: "3 min read",
  blog2: "Checklist before a relaunch",
  blog2Meta: "5 min read",
  blog3: "Local visibility without gimmicks",
  blog3Meta: "4 min read",
  newsletterTitle: "Stay in the loop",
  newsletterLead: "Occasional updates — unsubscribe anytime.",
  newsletterPlaceholder: "Email",
  newsletterBtn: "Subscribe",
  cmsBanner: "Edit content yourself here (CMS demo)",
  toolTitle: "Quick calculator",
  toolLead: "Sample tool right on the page.",
  toolLabel: "Hours",
  toolResult: "Estimate",
  bookingTitle: "Pick a time",
  bookingLead: "Demo — no real booking is made.",
  bookingPick: "Time slot",
  bookingConfirm: "Hold slot",
  bookingNote: "For illustration only.",
  couponTitle: "Voucher",
  couponCode: "WELCOME10",
  couponLead: "Demo code — not redeemable.",
  loginTitle: "Client area",
  loginEmail: "Email",
  loginPassword: "Password",
  loginBtn: "Sign in",
  loginNote: "Demo login — no real authentication.",
  exampleBlurb: {
    gallery: "Filterable gallery — useful for studios and craft work.",
    map: "Location map with address and opening hours.",
    downloads: "File area for PDFs and documents.",
    multilingual: "Language switch in the site header.",
    blog: "News cards for posts and tips.",
    newsletter: "Simple signup form for updates.",
    cms: "A cue that content can be edited later.",
    tool: "Interactive calculator as a sample widget.",
    booking: "Appointment picker without a real booking.",
    coupons: "Voucher card with a demo code.",
    "client-login": "Login screen for a protected area.",
  },
};

export function getPreviewCopy(locale: Locale): PreviewCopy {
  return locale === "de" ? de : en;
}
