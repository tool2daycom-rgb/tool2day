import { de, type Dictionary } from "./de";
import { en } from "./en";
import type { Locale } from "./site";

const dictionaries: Record<Locale, Dictionary> = { de, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary } from "./de";
export type { Locale } from "./site";
export { site, isLocale } from "./site";
