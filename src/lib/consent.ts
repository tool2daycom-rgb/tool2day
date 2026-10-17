import {
  CONSENT_COOKIE,
  CONSENT_MAX_AGE,
  parseConsent,
  type ConsentState,
} from "@/content/cookies";

export const OPEN_COOKIE_SETTINGS_EVENT = "t2d:open-cookies";

export function readConsent(): ConsentState | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CONSENT_COOKIE}=`));
  if (!match) return null;
  const value = decodeURIComponent(match.slice(CONSENT_COOKIE.length + 1));
  return parseConsent(value);
}

export function writeConsent(statistics: boolean): ConsentState {
  const state: ConsentState = {
    necessary: true,
    statistics,
    updatedAt: new Date().toISOString(),
  };
  const encoded = encodeURIComponent(JSON.stringify(state));
  document.cookie = `${CONSENT_COOKIE}=${encoded}; path=/; max-age=${CONSENT_MAX_AGE}; SameSite=Lax`;
  return state;
}

export function openCookieSettings() {
  window.dispatchEvent(new CustomEvent(OPEN_COOKIE_SETTINGS_EVENT));
}
