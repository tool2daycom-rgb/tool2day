import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, isLocale, site } from "@/content";
import { HomePage } from "@/components/HomePage";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const t = getDictionary(locale);
  const languages = Object.fromEntries(
    site.locales.map((code) => [code, `/${code}`]),
  ) as Record<string, string>;

  return {
    title: t.meta.title,
    description: t.meta.description,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ...languages,
        "x-default": `/${site.defaultLocale}`,
      },
    },
    openGraph: {
      title: t.meta.title,
      description: t.meta.description,
      url: `/${locale}`,
      siteName: site.name,
      locale: locale === "de" ? "de_DE" : "en_GB",
      type: "website",
      images: [{ url: "/logo.png", alt: "tool2day" }],
    },
  };
}

export default async function LocalePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = getDictionary(locale);
  return <HomePage locale={locale} t={t} />;
}
