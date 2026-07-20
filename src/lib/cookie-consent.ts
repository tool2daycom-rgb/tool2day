export const COOKIE_CONSENT_KEY = "tool2day-cookie-consent";
export const COOKIE_SETTINGS_EVENT = "tool2day:cookie-settings";

export type CookieConsentChoice = {
  essential: true;
  analytics: boolean;
  advertising: boolean;
  decidedAt: string;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function ensureGtag() {
  window.dataLayer = window.dataLayer ?? [];
  window.gtag =
    window.gtag ??
    function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
}

export function applyConsentToGtag(choice: Pick<CookieConsentChoice, "analytics" | "advertising">) {
  ensureGtag();
  const granted = "granted" as const;
  const denied = "denied" as const;

  window.gtag!("consent", "update", {
    analytics_storage: choice.analytics ? granted : denied,
    ad_storage: choice.advertising ? granted : denied,
    ad_user_data: choice.advertising ? granted : denied,
    ad_personalization: choice.advertising ? granted : denied,
  });
}

export function getStoredConsent(): CookieConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsentChoice;
    if (parsed.essential !== true) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setStoredConsent(choice: Omit<CookieConsentChoice, "decidedAt">) {
  const payload: CookieConsentChoice = {
    ...choice,
    essential: true,
    decidedAt: new Date().toISOString(),
  };
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(payload));
  applyConsentToGtag(payload);
  if (payload.advertising) {
    loadAdSense();
  }
  return payload;
}

export function loadAdSense() {
  if (typeof document === "undefined") return;
  if (document.getElementById("adsense")) return;

  const script = document.createElement("script");
  script.id = "adsense";
  script.async = true;
  script.src =
    "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9998186124580672";
  script.crossOrigin = "anonymous";
  document.head.appendChild(script);
}

export function openCookieSettings() {
  window.dispatchEvent(new CustomEvent(COOKIE_SETTINGS_EVENT));
}
