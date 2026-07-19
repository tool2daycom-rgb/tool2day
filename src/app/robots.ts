import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://tool2day.com/sitemap.xml",
    host: "https://tool2day.com",
  };
}
