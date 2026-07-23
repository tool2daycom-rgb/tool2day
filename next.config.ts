import type { NextConfig } from "next";

const IMGLY_DATA_VERSION = "1.7.0";

const nextConfig: NextConfig = {
  // ffmpeg.wasm loads core from CDN via blob URLs in the browser
  serverExternalPackages: [
    "@ffmpeg/ffmpeg",
    "@ffmpeg/util",
    "@huggingface/transformers",
  ],
  transpilePackages: ["@imgly/background-removal", "tesseract.js"],
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
