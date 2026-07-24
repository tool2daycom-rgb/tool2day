"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  getLocale,
  isLocaleCode,
  LOCALE_COOKIE,
  LOCALE_STORAGE,
  type LocaleCode,
  type LocaleDef,
} from "@/lib/i18n/locales";
import { getMessages, type UiMessages } from "@/lib/i18n/messages";

type LocaleContextValue = {
  locale: LocaleCode;
  localeDef: LocaleDef;
  messages: UiMessages;
  setLocale: (code: LocaleCode) => void;
  ready: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStoredLocale(): LocaleCode {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const fromStore = localStorage.getItem(LOCALE_STORAGE);
    if (fromStore && isLocaleCode(fromStore)) return fromStore;
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`),
    );
    const fromCookie = match?.[1] ? decodeURIComponent(match[1]) : null;
    if (fromCookie && isLocaleCode(fromCookie)) return fromCookie;
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE;
}

function persistLocale(code: LocaleCode) {
  try {
    localStorage.setItem(LOCALE_STORAGE, code);
    document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(code)};path=/;max-age=31536000;samesite=lax`;
  } catch {
    /* ignore */
  }
}

function applyDocumentLocale(def: LocaleDef) {
  const root = document.documentElement;
  root.lang = def.code;
  root.dir = def.dir;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initial = readStoredLocale();
    setLocaleState(initial);
    applyDocumentLocale(getLocale(initial));
    setReady(true);
  }, []);

  const setLocale = useCallback((code: LocaleCode) => {
    setLocaleState(code);
    persistLocale(code);
    applyDocumentLocale(getLocale(code));
  }, []);

  const value = useMemo<LocaleContextValue>(() => {
    const localeDef = getLocale(locale);
    return {
      locale,
      localeDef,
      messages: getMessages(locale),
      setLocale,
      ready,
    };
  }, [locale, setLocale, ready]);

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}
