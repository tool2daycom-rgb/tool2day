import type { Metadata } from "next";
import Script from "next/script";
import { Cairo, Syne } from "next/font/google";
import { CookieConsent } from "@/components/cookie-consent";
import { LocaleProvider } from "@/components/locale-provider";
import { RatingGateModal } from "@/components/rating-gate-modal";
import { getAllSiteKeywords, siteSeo } from "@/lib/seo-keywords";
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

export const metadata: Metadata = {
  title: {
    default: siteSeo.title,
    template: "%s | Tool2Day",
  },
  description: siteSeo.description,
  keywords: getAllSiteKeywords(),
  metadataBase: new URL("https://tool2day.com"),
  alternates: {
    canonical: "https://tool2day.com",
    languages: {
      en: "https://tool2day.com",
      ar: "https://tool2day.com",
      de: "https://tool2day.com",
      es: "https://tool2day.com",
      pt: "https://tool2day.com",
      it: "https://tool2day.com",
      fr: "https://tool2day.com",
      ru: "https://tool2day.com",
      pl: "https://tool2day.com",
      tr: "https://tool2day.com",
      id: "https://tool2day.com",
      ja: "https://tool2day.com",
      ko: "https://tool2day.com",
      "zh-CN": "https://tool2day.com",
      fa: "https://tool2day.com",
      "zh-TW": "https://tool2day.com",
      vi: "https://tool2day.com",
      he: "https://tool2day.com",
      hi: "https://tool2day.com",
      th: "https://tool2day.com",
      "x-default": "https://tool2day.com",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: [
      "ar_AR",
      "de_DE",
      "es_ES",
      "pt_BR",
      "it_IT",
      "fr_FR",
      "ru_RU",
      "ja_JP",
      "ko_KR",
      "zh_CN",
      "zh_TW",
    ],
    url: "https://tool2day.com",
    siteName: "Tool2Day",
    title: siteSeo.title,
    description: siteSeo.description,
  },
  twitter: {
    card: "summary_large_image",
    title: siteSeo.title,
    description: siteSeo.description,
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
      lang="en"
      dir="ltr"
      className={`${cairo.variable} ${syne.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full font-sans">
        <Script id="consent-default" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('consent', 'default', {
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              analytics_storage: 'denied',
              wait_for_update: 500
            });
          `}
        </Script>
        <Script id="locale-boot" strategy="beforeInteractive">
          {`
            try {
              var k='tool2day_lang';
              var v=localStorage.getItem(k) || (document.cookie.match(/(?:^|; )tool2day_lang=([^;]*)/)||[])[1];
              if (v) v=decodeURIComponent(v);
              var rtl={ar:1,he:1,fa:1};
              if (v) {
                document.documentElement.lang=v;
                document.documentElement.dir=rtl[v]?'rtl':'ltr';
              }
            } catch(e) {}
          `}
        </Script>
        <LocaleProvider>
          {children}
          <CookieConsent />
          <RatingGateModal />
        </LocaleProvider>
      </body>
    </html>
  );
}
