"use client";

import { Cairo, Syne } from "next/font/google";
import { ErrorPageView } from "@/components/error-page-view";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "800", "900"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
});

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${syne.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <ErrorPageView
          title="حدث خطأ غير متوقع"
          description="حدث خلل عام في الموقع. أعد المحاولة أو ارجع لاحقاً."
          onRetry={reset}
        />
      </body>
    </html>
  );
}
