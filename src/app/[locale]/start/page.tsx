import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, site } from "@/content";
import { getStartFormCopy } from "@/content/start-form";
import { StartProjectForm } from "@/components/start/StartProjectForm";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getStartFormCopy(locale);
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: {
      canonical: `/${locale}/start`,
      languages: {
        de: "/de/start",
        en: "/en/start",
        "x-default": `/${site.defaultLocale}/start`,
      },
    },
  };
}

export default async function StartPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <StartProjectForm locale={locale} />;
}
