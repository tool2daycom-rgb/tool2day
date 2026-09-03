import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://www.tool2day.com/sitemap.xml",
    host: "https://www.tool2day.com",
  };
}
