import type { MetadataRoute } from "next";
import { site } from "@/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/start"] as const;

  return pages.flatMap((path) =>
    site.locales.map((locale) => ({
      url: `${site.url}/${locale}${path}`,
      lastModified: "2026-10-17",
      changeFrequency: "monthly" as const,
      priority: path === "" ? (locale === site.defaultLocale ? 1 : 0.8) : 0.7,
      alternates: {
        languages: Object.fromEntries(
          site.locales.map((code) => [code, `${site.url}/${code}${path}`]),
        ),
      },
    })),
  );
}
