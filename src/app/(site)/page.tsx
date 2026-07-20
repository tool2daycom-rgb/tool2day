import type { Metadata } from "next";
import { HomeDirectory } from "@/components/home-directory";
import { SiteRatingCard } from "@/components/star-rating";
import { getAllSiteKeywords, siteSeo } from "@/lib/seo-keywords";
import { tools } from "@/lib/tools";

export const metadata: Metadata = {
  title: siteSeo.title,
  description: siteSeo.description,
  keywords: getAllSiteKeywords(),
  alternates: {
    canonical: "https://tool2day.com",
  },
  openGraph: {
    title: siteSeo.title,
    description: siteSeo.description,
    url: "https://tool2day.com",
    siteName: "Tool2Day",
    locale: "ar_AR",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Tool2Day",
  alternateName: ["Tool2day Com", "tool2day"],
  url: "https://tool2day.com",
  description: siteSeo.description,
  inLanguage: "ar",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://tool2day.com/#converters",
    "query-input": "required name=search_term_string",
  },
  hasPart: tools.map((tool) => ({
    "@type": "WebApplication",
    name: `${tool.title} مجاناً`,
    url: `https://tool2day.com/tools/${tool.slug}`,
    applicationCategory: "MultimediaApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  })),
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeDirectory />
      <SiteRatingCard />
    </>
  );
}
