"use client";

import { useLocale } from "@/components/locale-provider";
import { getToolTitle } from "@/lib/i18n/tool-titles";

/**
 * Derives the locale-aware display title/description for a tool from its
 * raw Arabic (site-default) title/description, re-computing them whenever
 * the client-side language switcher changes — no page reload needed.
 */
export function useToolDisplay(
  slug: string,
  arTitle: string,
  arDescription?: string,
) {
  const { locale, messages } = useLocale();
  const title = getToolTitle(slug, locale, arTitle);
  const description =
    locale === "ar"
      ? arDescription ?? ""
      : `${title} — ${messages.freeInBrowser}`;
  return { title, description, locale, messages };
}
