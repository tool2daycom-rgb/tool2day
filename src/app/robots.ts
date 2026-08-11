import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/tools/media-downloader",
        "/tools/remove-logo",
        "/tools/remove-logo-image",
        "/tools/thumbnail-downloader",
      ],
    },
    sitemap: "https://www.tool2day.com/sitemap.xml",
    host: "https://www.tool2day.com",
  };
}
