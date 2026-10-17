import type { MetadataRoute } from "next";
import { site } from "@/content";
import { getWorkCopy } from "@/content/work";

export default function sitemap(): MetadataRoute.Sitemap {
  const workIds = getWorkCopy("de").projects.map((project) => project.id);
  const pages = [
    "",
    "/start",
    "/services/mobile",
    ...workIds.map((id) => `/work/${id}`),
  ];

  return pages.flatMap((path) =>
    site.locales.map((locale) => ({
      url: `${site.url}/${locale}${path}`,
      lastModified: "2026-10-17",
      changeFrequency: "monthly" as const,
      priority:
        path === ""
          ? locale === site.defaultLocale
            ? 1
            : 0.8
          : path.startsWith("/work/")
            ? 0.65
            : 0.7,
      alternates: {
        languages: Object.fromEntries(
          site.locales.map((code) => [code, `${site.url}/${code}${path}`]),
        ),
      },
    })),
  );
}
