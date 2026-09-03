import type { Metadata } from "next";
import { AdsterraInContent } from "@/components/adsterra-ads";
import { HomeDirectory } from "@/components/home-directory";
import { JsonLd } from "@/components/json-ld";
import { SiteRatingCard } from "@/components/star-rating";
import { brandKeywords, siteSeo } from "@/lib/seo-keywords";
import {
  buildHomeJsonLd,
  buildLanguageAlternateMap,
  siteSeoByLocale,
} from "@/lib/seo-multilang";

export const metadata: Metadata = {
  title: siteSeo.title,
  description: siteSeo.description,
  keywords: [...brandKeywords],
  alternates: {
    canonical: "https://www.tool2day.com",
    languages: buildLanguageAlternateMap(""),
  },
  openGraph: {
    title: siteSeo.title,
    description: siteSeo.description,
    url: "https://www.tool2day.com",
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
      <AdsterraInContent />
      <div className="pb-4">
        <SiteRatingCard />
      </div>
      <AdsterraInContent />
    </>
  );
}
