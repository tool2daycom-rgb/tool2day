import { cookies, headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  isLocaleCode,
  type LocaleCode,
  LOCALE_COOKIE,
} from "@/lib/i18n/locales";

/**
 * Arabic-first for crawlers / first visit (Tool2Day primary market).
 * Cookie wins; otherwise Accept-Language; otherwise Arabic for SEO HTML.
 */
export const SEO_DEFAULT_LOCALE: LocaleCode = "ar";

/** Map Accept-Language tags → our locale codes (order = preference). */
const ACCEPT_LANG_MAP: Array<{ prefix: string; code: LocaleCode }> = [
  { prefix: "ar", code: "ar" },
  { prefix: "en", code: "en" },
  { prefix: "de", code: "de" },
  { prefix: "es", code: "es" },
  { prefix: "pt", code: "pt" },
  { prefix: "it", code: "it" },
  { prefix: "fr", code: "fr" },
  { prefix: "ru", code: "ru" },
  { prefix: "pl", code: "pl" },
  { prefix: "tr", code: "tr" },
  { prefix: "id", code: "id" },
  { prefix: "ja", code: "ja" },
  { prefix: "ko", code: "ko" },
  { prefix: "zh-tw", code: "zh-TW" },
  { prefix: "zh-cn", code: "zh-CN" },
  { prefix: "zh", code: "zh-CN" },
  { prefix: "fa", code: "fa" },
  { prefix: "vi", code: "vi" },
  { prefix: "he", code: "he" },
  { prefix: "hi", code: "hi" },
  { prefix: "th", code: "th" },
];

export function localeFromAcceptLanguage(
  header: string | null | undefined,
): LocaleCode | null {
  if (!header) return null;
  const parts = header.split(",").map((p) => {
    const [tag, ...params] = p.trim().split(";");
    const q = params.find((x) => x.trim().startsWith("q="));
    const quality = q ? Number(q.split("=")[1]) || 0 : 1;
    return { tag: (tag || "").trim().toLowerCase(), quality };
  });
  parts.sort((a, b) => b.quality - a.quality);
  for (const { tag } of parts) {
    if (!tag || tag === "*") continue;
    for (const row of ACCEPT_LANG_MAP) {
      if (tag === row.prefix || tag.startsWith(`${row.prefix}-`)) {
        return row.code;
      }
    }
  }
  return null;
}

/** Resolve locale for tool SEO / SSR: cookie → Accept-Language → Arabic. */
export async function resolveRequestLocale(): Promise<LocaleCode> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCALE_COOKIE)?.value;
  if (raw && isLocaleCode(raw)) return raw;

  const headerStore = await headers();
  const fromHeader = localeFromAcceptLanguage(
    headerStore.get("accept-language"),
  );
  if (fromHeader) return fromHeader;

  return SEO_DEFAULT_LOCALE;
}

export function resolveRequestLocaleSync(opts: {
  cookie?: string | null;
  acceptLanguage?: string | null;
}): LocaleCode {
  if (opts.cookie && isLocaleCode(opts.cookie)) return opts.cookie;
  return (
    localeFromAcceptLanguage(opts.acceptLanguage) ||
    SEO_DEFAULT_LOCALE ||
    DEFAULT_LOCALE
  );
}
