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
  async redirects() {
    return [
      // Adsterra units are approved for tool2day.com only — never serve ads on *.vercel.app
      {
        source: "/:path*",
        has: [{ type: "host", value: "tool2day.vercel.app" }],
        destination: "https://www.tool2day.com/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "tool2day-o8np.vercel.app" }],
        destination: "https://www.tool2day.com/:path*",
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
