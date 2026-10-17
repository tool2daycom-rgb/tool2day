import type { MetadataRoute } from "next";
import { site } from "@/content";

export default function sitemap(): MetadataRoute.Sitemap {
  return site.locales.map((locale) => ({
    url: `${site.url}/${locale}`,
    lastModified: "2026-10-17",
    changeFrequency: "monthly",
    priority: locale === site.defaultLocale ? 1 : 0.8,
    alternates: {
      languages: Object.fromEntries(
        site.locales.map((code) => [code, `${site.url}/${code}`]),
      ),
    },
  }));
}
