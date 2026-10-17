import type { Locale } from "./site";

export type CookieCopy = {
  title: string;
  body: string;
  accept: string;
  reject: string;
  settings: string;
  save: string;
  close: string;
  necessaryTitle: string;
  necessaryDesc: string;
  statsTitle: string;
  statsDesc: string;
  alwaysOn: string;
  privacyLink: string;
};

const de: CookieCopy = {
  title: "Cookie-Einstellungen",
  body: "Diese Webseite verwendet Cookies. Notwendige Cookies sind für die Funktion der Seite erforderlich. Statistik-Cookies helfen uns, die Nutzung der Seite zu verstehen — und werden nur mit Ihrer Zustimmung gesetzt.",
  accept: "Akzeptieren",
  reject: "Ablehnen",
  settings: "Einstellungen",
  save: "Auswahl speichern",
  close: "Schließen",
  necessaryTitle: "Notwendig",
  necessaryDesc:
    "Speichert Ihre Cookie-Entscheidung (t2d_consent, 1 Jahr), damit Sie nicht bei jedem Besuch erneut gefragt werden. Die Sprachauswahl steckt in der URL und nicht im Cookie.",
  statsTitle: "Statistik",
  statsDesc:
    "Optional. Derzeit laden wir kein Analyse-Tool. Ihre Entscheidung wird gespeichert, falls später eine Statistik-Funktion hinzukommt.",
  alwaysOn: "Immer aktiv",
  privacyLink: "Datenschutzerklärung",
};

const en: CookieCopy = {
  title: "Cookie settings",
  body: "This website uses cookies. Necessary cookies are required for the site to work. Statistics cookies help us understand how the site is used — and are only set with your consent.",
  accept: "Accept",
  reject: "Reject",
  settings: "Settings",
  save: "Save choice",
  close: "Close",
  necessaryTitle: "Necessary",
  necessaryDesc:
    "Stores your cookie choice (t2d_consent, 1 year) so we do not ask on every visit. Language is taken from the URL, not from a cookie.",
  statsTitle: "Statistics",
  statsDesc:
    "Optional. We do not load an analytics tool yet. Your choice is stored in case statistics are added later.",
  alwaysOn: "Always on",
  privacyLink: "Privacy policy",
};

export function getCookieCopy(locale: Locale): CookieCopy {
  return locale === "de" ? de : en;
}

export const CONSENT_COOKIE = "t2d_consent";
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 365;

export type ConsentState = {
  necessary: true;
  statistics: boolean;
  updatedAt: string;
};

export function parseConsent(raw: string | null | undefined): ConsentState | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<ConsentState>;
    if (typeof data.statistics !== "boolean") return null;
    return {
      necessary: true,
      statistics: data.statistics,
      updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
