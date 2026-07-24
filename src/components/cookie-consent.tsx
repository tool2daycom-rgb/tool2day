"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Cookie, ShieldCheck, Sparkles } from "lucide-react";
import { BrandMarkAnimated } from "@/components/brand-mark-animated";
import { useLocale } from "@/components/locale-provider";
import {
  COOKIE_SETTINGS_EVENT,
  applyConsentToGtag,
  getStoredConsent,
  loadAdSense,
  setStoredConsent,
  type CookieConsentChoice,
} from "@/lib/cookie-consent";

type Prefs = {
  analytics: boolean;
  advertising: boolean;
};

function Toggle({
  checked,
  disabled,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition ${
        disabled
          ? "cursor-default border-[#ececec] bg-[#fafafa]"
          : "cursor-pointer border-[#e8e8e8] bg-white hover:border-[#ddd]"
      }`}
    >
      <span className="min-w-0 flex-1 text-start">
        <span className="block text-sm font-bold text-[#111]">{label}</span>
        <span className="mt-0.5 block text-xs leading-6 text-[#666]">{description}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${
          disabled ? "bg-[#111]" : checked ? "bg-[#111]" : "bg-[#ccc]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? "end-0.5" : "start-0.5"
          }`}
        />
      </button>
    </label>
  );
}

export function CookieConsent() {
  const { messages } = useLocale();
  const [visible, setVisible] = useState(false);
  const [manage, setManage] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>({ analytics: true, advertising: true });

  const save = useCallback((choice: Omit<CookieConsentChoice, "decidedAt" | "essential">) => {
    setStoredConsent({ essential: true, ...choice });
    setVisible(false);
    setManage(false);
  }, []);

  useEffect(() => {
    const stored = getStoredConsent();
    if (stored) {
      applyConsentToGtag(stored);
      if (stored.advertising) loadAdSense();
      return;
    }
    const t = window.setTimeout(() => setVisible(true), 600);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const onOpen = () => {
      const stored = getStoredConsent();
      if (stored) {
        setPrefs({
          analytics: stored.analytics,
          advertising: stored.advertising,
        });
      }
      setManage(true);
      setVisible(true);
    };
    window.addEventListener(COOKIE_SETTINGS_EVENT, onOpen);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, onOpen);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center p-4 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#0a0a0a]/45 backdrop-blur-[2px]"
        aria-label={messages.close}
        onClick={() => {
          if (getStoredConsent()) setVisible(false);
        }}
      />

      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#f8f4e8]/80 to-transparent"
          aria-hidden
        />

        <div className="relative px-6 pb-6 pt-8 sm:px-8 sm:pb-8 sm:pt-10">
          <div className="flex flex-col items-center text-center">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#fff9e6] via-white to-[#eef5ff] shadow-inner ring-1 ring-[#eee]">
              <BrandMarkAnimated size={48} motion="morph" />
            </div>
            <p className="mt-4 font-[family-name:var(--font-syne)] text-lg font-extrabold tracking-wide text-[#111]">
              TOOL2DAY
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                <Sparkles className="h-3 w-3" />
                {messages.completelyFree}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold text-sky-800">
                <ShieldCheck className="h-3 w-3" />
                {messages.noWatermark}
              </span>
            </div>
          </div>

          <h2
            id="cookie-consent-title"
            className="mt-6 text-center text-xl font-bold text-[#111] sm:text-[1.35rem]"
          >
            {messages.cookieTitle}
          </h2>
          <p className="mt-3 text-center text-sm leading-7 text-[#555]">
            {messages.cookieBody}{" "}
            <strong className="font-bold text-[#111]">{messages.completelyFree}</strong>
          </p>

          {manage ? (
            <div className="mt-6 space-y-3">
              <Toggle
                checked
                disabled
                onChange={() => {}}
                label={messages.cookieEssential}
                description={messages.cookieEssentialDesc}
              />
              <Toggle
                checked={prefs.analytics}
                onChange={(analytics) => setPrefs((p) => ({ ...p, analytics }))}
                label={messages.cookieAnalytics}
                description={messages.cookieAnalyticsDesc}
              />
              <Toggle
                checked={prefs.advertising}
                onChange={(advertising) => setPrefs((p) => ({ ...p, advertising }))}
                label={messages.cookieAds}
                description={messages.cookieAdsDesc}
              />
            </div>
          ) : (
            <ul className="mt-5 space-y-2 text-start text-xs leading-6 text-[#666]">
              <li className="flex gap-2">
                <Cookie className="mt-0.5 h-4 w-4 shrink-0 text-[#888]" />
                {messages.cookieChangeAnytime}
              </li>
              <li className="flex gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#888]" />
                {messages.cookiePrivacyNote}{" "}
                <Link href="/privacy" className="font-semibold text-[#2563eb] hover:underline">
                  {messages.privacy}
                </Link>
                .
              </li>
            </ul>
          )}

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() =>
                save(
                  manage
                    ? prefs
                    : { analytics: true, advertising: true },
                )
              }
              className="flex-1 rounded-xl bg-[#111] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#222] sm:min-w-[8rem]"
            >
              {manage ? messages.savePrefs : messages.acceptAll}
            </button>
            {!manage ? (
              <>
                <button
                  type="button"
                  onClick={() => save({ analytics: false, advertising: false })}
                  className="flex-1 rounded-xl border border-[#ddd] bg-white px-5 py-3 text-sm font-bold text-[#333] transition hover:border-[#bbb] hover:bg-[#fafafa] sm:min-w-[8rem]"
                >
                  {messages.essentialOnly}
                </button>
                <button
                  type="button"
                  onClick={() => setManage(true)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-[#666] transition hover:text-[#111] sm:w-auto"
                >
                  {messages.manageOptions}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setManage(false)}
                className="flex-1 rounded-xl border border-[#ddd] px-5 py-3 text-sm font-semibold text-[#555] transition hover:bg-[#fafafa]"
              >
                {messages.back}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
