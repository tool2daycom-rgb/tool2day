import type { MetadataRoute } from "next";
import { tools } from "@/lib/tools";

const BASE = "https://www.tool2day.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const toolEntries: MetadataRoute.Sitemap = tools.map((tool) => ({
    url: `${BASE}/tools/${tool.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: tool.slug === "video-editor" ? 0.95 : 0.8,
  }));

  return [
    {
      url: BASE,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    ...[
      "privacy",
      "terms",
      "refund",
      "pricing",
      "help",
      "contact",
      "testimonials",
      "data-deletion",
    ].map((slug) => ({
      url: `${BASE}/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: slug === "contact" || slug === "help" || slug === "pricing" ? 0.6 : 0.4,
    })),
    ...toolEntries,
  ];
}
