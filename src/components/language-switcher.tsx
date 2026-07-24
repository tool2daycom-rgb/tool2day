"use client";

import { useEffect, useMemo, useState } from "react";
import { Globe, Search, X } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { locales, type LocaleCode } from "@/lib/i18n/locales";

export function LanguageSwitcher() {
  const { locale, localeDef, messages, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return locales;
    return locales.filter(
      (l) =>
        l.name.toLowerCase().includes(s) ||
        l.code.toLowerCase().includes(s) ||
        l.short.toLowerCase().includes(s),
    );
  }, [q]);

  function pick(code: LocaleCode) {
    setLocale(code);
    setOpen(false);
    setQ("");
  }

  return (
    <>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 transition hover:opacity-80"
        aria-label={messages.selectLanguage}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span className="text-base leading-none" aria-hidden>
          {localeDef.flag}
        </span>
        <Globe className="h-4 w-4" strokeWidth={2.25} />
        <span className="hidden sm:inline">{localeDef.short}</span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center bg-black/50 p-3 pt-[8vh] sm:p-6 sm:pt-[10vh]"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={messages.selectLanguage}
            className="flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white text-[#111] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-[#eee] px-4 py-3">
              <h2 className="shrink-0 text-base font-extrabold">
                {messages.selectLanguage}
              </h2>
              <label className="relative ms-auto flex min-w-0 flex-1 max-w-xs items-center">
                <Search className="pointer-events-none absolute start-2 h-4 w-4 text-[#999]" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={messages.search}
                  className="w-full rounded-lg border border-[#e5e5e5] bg-[#fafafa] py-2 pe-3 ps-8 text-sm outline-none focus:border-[#2563eb]"
                />
              </label>
              <button
                type="button"
                className="rounded-md p-2 text-[#666] hover:bg-[#f3f3f3]"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-4">
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((l) => {
                  const active = l.code === locale;
                  return (
                    <li key={l.code}>
                      <button
                        type="button"
                        onClick={() => pick(l.code)}
                        className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-start transition ${
                          active
                            ? "border-[#2563eb] bg-[#eff6ff]"
                            : "border-[#eee] bg-white hover:border-[#ccc] hover:bg-[#fafafa]"
                        }`}
                      >
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f3f3f3] text-xl leading-none"
                          aria-hidden
                        >
                          {l.flag}
                        </span>
                        <span className="text-sm font-bold text-[#222]">
                          {l.name}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-sm font-semibold text-[#777]">
                  —
                </p>
              ) : null}
            </div>

            <div className="border-t border-[#eee] px-4 py-3 text-center text-xs font-semibold text-[#666]">
              <a
                href="/contact"
                className="text-[#2563eb] hover:underline"
                onClick={() => setOpen(false)}
              >
                {messages.translationFeedback}
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
