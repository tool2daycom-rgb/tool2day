import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ffmpeg.wasm loads core from CDN via blob URLs in the browser
  serverExternalPackages: [
    "@ffmpeg/ffmpeg",
    "@ffmpeg/util",
    "@huggingface/transformers",
  ],
  transpilePackages: ["@imgly/background-removal", "tesseract.js"],
};

export default nextConfig;
