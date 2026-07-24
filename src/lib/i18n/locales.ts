export type LocaleCode =
  | "en"
  | "de"
  | "es"
  | "pt"
  | "it"
  | "fr"
  | "ru"
  | "pl"
  | "tr"
  | "id"
  | "ja"
  | "ko"
  | "zh-CN"
  | "fa"
  | "zh-TW"
  | "vi"
  | "ar"
  | "he"
  | "hi"
  | "th";

export type LocaleDef = {
  code: LocaleCode;
  /** Native / display name in the picker */
  name: string;
  /** Short code shown in header when closed */
  short: string;
  flag: string;
  dir: "ltr" | "rtl";
};

export const DEFAULT_LOCALE: LocaleCode = "en";
export const LOCALE_COOKIE = "tool2day_lang";
export const LOCALE_STORAGE = "tool2day_lang";

export const locales: LocaleDef[] = [
  { code: "en", name: "English", short: "EN", flag: "🇬🇧", dir: "ltr" },
  { code: "de", name: "Deutsch", short: "DE", flag: "🇩🇪", dir: "ltr" },
  { code: "es", name: "Español", short: "ES", flag: "🇪🇸", dir: "ltr" },
  { code: "pt", name: "Português", short: "PT", flag: "🇧🇷", dir: "ltr" },
  { code: "it", name: "Italiano", short: "IT", flag: "🇮🇹", dir: "ltr" },
  { code: "fr", name: "Français", short: "FR", flag: "🇫🇷", dir: "ltr" },
  { code: "ru", name: "Русский", short: "RU", flag: "🇷🇺", dir: "ltr" },
  { code: "pl", name: "Polski", short: "PL", flag: "🇵🇱", dir: "ltr" },
  { code: "tr", name: "Türkçe", short: "TR", flag: "🇹🇷", dir: "ltr" },
  { code: "id", name: "Bahasa Indonesia", short: "ID", flag: "🇮🇩", dir: "ltr" },
  { code: "ja", name: "日本語", short: "JA", flag: "🇯🇵", dir: "ltr" },
  { code: "ko", name: "한국어", short: "KO", flag: "🇰🇷", dir: "ltr" },
  { code: "zh-CN", name: "简体中文", short: "ZH", flag: "🇨🇳", dir: "ltr" },
  { code: "fa", name: "فارسی", short: "FA", flag: "🇮🇷", dir: "rtl" },
  { code: "zh-TW", name: "繁體中文", short: "ZH", flag: "🇹🇼", dir: "ltr" },
  { code: "vi", name: "Tiếng Việt", short: "VI", flag: "🇻🇳", dir: "ltr" },
  { code: "ar", name: "العربية", short: "AR", flag: "🇸🇦", dir: "rtl" },
  { code: "he", name: "עברית", short: "HE", flag: "🇮🇱", dir: "rtl" },
  { code: "hi", name: "हिन्दी", short: "HI", flag: "🇮🇳", dir: "ltr" },
  { code: "th", name: "ภาษาไทย", short: "TH", flag: "🇹🇭", dir: "ltr" },
];

export function getLocale(code: string | null | undefined): LocaleDef {
  return locales.find((l) => l.code === code) || locales[0]!;
}

export function isLocaleCode(v: string): v is LocaleCode {
  return locales.some((l) => l.code === v);
}
