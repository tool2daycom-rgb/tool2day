import type { Metadata } from "next";
import { HomeDirectory } from "@/components/home-directory";
import { JsonLd } from "@/components/json-ld";
import { SiteRatingCard } from "@/components/star-rating";
import { getAllSiteKeywords, siteSeo } from "@/lib/seo-keywords";
import {
  buildHomeJsonLd,
  buildLanguageAlternateMap,
  siteSeoByLocale,
} from "@/lib/seo-multilang";

export const metadata: Metadata = {
  title: siteSeo.title,
  description: siteSeo.description,
  keywords: getAllSiteKeywords(),
  alternates: {
    canonical: "https://tool2day.com",
    languages: buildLanguageAlternateMap(""),
  },
  openGraph: {
    title: siteSeo.title,
    description: siteSeo.description,
    url: "https://tool2day.com",
    siteName: "Tool2Day",
    locale: "en_US",
    alternateLocale: [
      "ar_AR",
      "de_DE",
      "es_ES",
      "pt_BR",
      "fr_FR",
      "ja_JP",
      "zh_CN",
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteSeo.title,
    description: siteSeo.description,
  },
};

const jsonLd = buildHomeJsonLd();

/** Extra discovery copy for crawlers (visually hidden). */
const crawlBlurb = Object.values(siteSeoByLocale)
  .map((s) => `${s.title}. ${s.description}`)
  .join(" ");

export default function Home() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <p className="sr-only">{crawlBlurb}</p>
      <HomeDirectory />
      <div className="pb-4">
        <SiteRatingCard />
      </div>
    </>
  );
}
