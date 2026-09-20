import type { NextConfig } from "next";

const IMGLY_DATA_VERSION = "1.7.0";

const nextConfig: NextConfig = {
  // ffmpeg.wasm loads core from CDN via blob URLs in the browser
  serverExternalPackages: [
    "@ffmpeg/ffmpeg",
    "@ffmpeg/util",
    "@huggingface/transformers",
    "youtubei.js",
  ],
  transpilePackages: ["@imgly/background-removal", "tesseract.js"],
  // *.vercel.app → www.tool2day.com is handled in src/middleware.ts
  async redirects() {
    const gone = [
      "video-downloader",
      "media-downloader",
      "thumbnail-downloader",
      "remove-logo",
      "remove-logo-image",
      "pdf-unlock",
      "png-library",
      "ebook-converter",
    ];
    return [
      ...gone.map((slug) => ({
        source: `/tools/${slug}`,
        destination: "/",
        permanent: true,
      })),
      {
        source: "/tools/social-caption-generator",
        destination: "/tools/social-media-caption",
        permanent: true,
      },
    ];
  },
  // نفس الأصل لتجنّب CORS على نماذج إزالة الخلفية
  async rewrites() {
    return [
      {
        source: "/imgly-bg/:path*",
        destination: `https://staticimgly.com/@imgly/background-removal-data/${IMGLY_DATA_VERSION}/dist/:path*`,
      },
    ];
  },
};

export default nextConfig;
