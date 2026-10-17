"use client";

import { useEffect, useId, useState } from "react";
import { usePathname } from "next/navigation";
import { getCookieCopy, type ConsentState } from "@/content/cookies";
import type { Locale } from "@/content";
import { site } from "@/content";
import {
  OPEN_COOKIE_SETTINGS_EVENT,
  readConsent,
  writeConsent,
} from "@/lib/consent";

type Mode = "hidden" | "banner" | "settings";

function localeFromPath(pathname: string | null): Locale {
  if (pathname?.startsWith("/en")) return "en";
  return "de";
}

export function CookieConsent() {
  const pathname = usePathname();
  const locale = localeFromPath(pathname);
  const t = getCookieCopy(locale);
  const titleId = useId();
  const [mode, setMode] = useState<Mode>("hidden");
  const [stats, setStats] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const existing = readConsent();
    if (existing) {
      setStats(existing.statistics);
      setMode("hidden");
    } else {
      setMode("banner");
    }
    setReady(true);

    function onOpen() {
      const current = readConsent();
      setStats(current?.statistics ?? false);
      setMode("settings");
    }

    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpen);
  }, []);

  function apply(statistics: boolean) {
    writeConsent(statistics);
    setStats(statistics);
    setMode("hidden");
  }

  function saveSettings() {
    apply(stats);
  }

  if (!ready || mode === "hidden") return null;

  return (
    <div className="cookie-root" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="cookie-panel">
        <div className="cookie-panel-head">
          <p className="cookie-kicker">tool2day</p>
          <h2 id={titleId}>{t.title}</h2>
          <p>{t.body}</p>
          <p className="cookie-privacy">
            <a href={site.legal.privacy}>{t.privacyLink}</a>
          </p>
        </div>

        {mode === "settings" ? (
          <div className="cookie-categories">
            <div className="cookie-category">
              <div className="cookie-category-top">
                <strong>{t.necessaryTitle}</strong>
                <span className="cookie-pill">{t.alwaysOn}</span>
              </div>
              <p>{t.necessaryDesc}</p>
            </div>
            <div className="cookie-category">
              <div className="cookie-category-top">
                <strong>{t.statsTitle}</strong>
                <label className="cookie-switch">
                  <input
                    type="checkbox"
                    checked={stats}
                    onChange={(e) => setStats(e.target.checked)}
                  />
                  <span aria-hidden="true" />
                </label>
              </div>
              <p>{t.statsDesc}</p>
            </div>
          </div>
        ) : null}

        <div className="cookie-actions">
          {mode === "banner" ? (
            <>
              <button type="button" className="cookie-btn cookie-btn-primary" onClick={() => apply(true)}>
                {t.accept}
              </button>
              <button type="button" className="cookie-btn cookie-btn-ghost" onClick={() => apply(false)}>
                {t.reject}
              </button>
              <button type="button" className="cookie-btn cookie-btn-link" onClick={() => setMode("settings")}>
                {t.settings}
              </button>
            </>
          ) : (
            <>
              <button type="button" className="cookie-btn cookie-btn-primary" onClick={saveSettings}>
                {t.save}
              </button>
              <button
                type="button"
                className="cookie-btn cookie-btn-ghost"
                onClick={() => {
                  const current = readConsent();
                  if (current) setMode("hidden");
                  else setMode("banner");
                }}
              >
                {t.close}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export type { ConsentState };
