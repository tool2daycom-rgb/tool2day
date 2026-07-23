import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ffmpeg.wasm loads core from CDN via blob URLs in the browser
  serverExternalPackages: [
    "@ffmpeg/ffmpeg",
    "@ffmpeg/util",
    "@huggingface/transformers",
  ],
};

export default nextConfig;
