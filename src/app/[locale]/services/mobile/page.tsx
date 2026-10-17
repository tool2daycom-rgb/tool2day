import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, site } from "@/content";
import { getMobileAppsCopy } from "@/content/mobile-apps";
import { MobileAppsPage } from "@/components/MobileAppsPage";

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return site.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const m = getMobileAppsCopy(locale);
  return {
    title: m.metaTitle,
    description: m.metaDescription,
    alternates: {
      canonical: `/${locale}/services/mobile`,
      languages: {
        de: `/de/services/mobile`,
        en: `/en/services/mobile`,
        "x-default": `/${site.defaultLocale}/services/mobile`,
      },
    },
  };
}

export default async function MobileAppsRoute({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <MobileAppsPage locale={locale} />;
}
