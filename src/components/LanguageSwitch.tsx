import Link from "next/link";
import type { Locale } from "@/content";

type Props = {
  locale: Locale;
  ariaLabel: string;
};

export function LanguageSwitch({ locale, ariaLabel }: Props) {
  const other: Locale = locale === "de" ? "en" : "de";

  return (
    <nav className="lang-switch" aria-label={ariaLabel}>
      <Link
        href="/de"
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
        href="/en"
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
