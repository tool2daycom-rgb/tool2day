import Link from "next/link";
import type { Locale } from "@/content";

type Props = {
  locale: Locale;
  ariaLabel: string;
  /** Path after locale, e.g. "/start" — keeps the same page when switching language */
  pathSuffix?: string;
};

export function LanguageSwitch({ locale, ariaLabel, pathSuffix = "" }: Props) {
  const other: Locale = locale === "de" ? "en" : "de";
  const suffix = pathSuffix.startsWith("/") || pathSuffix === "" ? pathSuffix : `/${pathSuffix}`;

  return (
    <nav className="lang-switch" aria-label={ariaLabel}>
      <Link
        href={`/de${suffix}`}
        className={locale === "de" ? "is-active" : undefined}
        hrefLang="de"
        lang="de"
      >
        DE
      </Link>
      <span aria-hidden="true" className="lang-sep">
        |
      </span>
      <Link
        href={`/en${suffix}`}
        className={locale === "en" ? "is-active" : undefined}
        hrefLang="en"
        lang="en"
      >
        EN
      </Link>
      <span className="sr-only">
        {locale === "de" ? `Switch to ${other.toUpperCase()}` : `Zu ${other.toUpperCase()} wechseln`}
      </span>
    </nav>
  );
}
