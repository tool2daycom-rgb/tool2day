import type { Metadata } from "next";
import Script from "next/script";
import { Cairo, Syne } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Tool2Day | أدوات تحويل وتحرير الملفات",
    template: "%s | Tool2Day",
  },
  description:
    "الأدوات الإلكترونية لتحويل الفيديو والصوت وPDF والملفات — مثل أدوات التحرير والتحويل أونلاين.",
  metadataBase: new URL("https://tool2day.com"),
  alternates: {
    canonical: "https://tool2day.com",
    languages: {
      ar: "https://tool2day.com",
      "x-default": "https://tool2day.com",
    },
  },
  openGraph: {
    type: "website",
    locale: "ar_AR",
    url: "https://tool2day.com",
    siteName: "Tool2Day",
    title: "Tool2Day | أدوات تحويل وتحرير الملفات",
    description:
      "أدوات أونلاين لتحرير الفيديو والصوت وPDF والملفات — سريعة ومجانية في المتصفح.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tool2Day | أدوات تحويل وتحرير الملفات",
    description:
      "أدوات أونلاين لتحرير الفيديو والصوت وPDF والملفات — سريعة ومجانية في المتصفح.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  verification: {
    google: "MmdrWtxfKv5ZbvAydBV_mSodZIVvAHHDIhz_Y7BPNPk",
  },
  other: {
    "google-adsense-account": "ca-pub-9998186124580672",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} ${syne.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <Script
          id="adsense"
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9998186124580672"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  );
}
