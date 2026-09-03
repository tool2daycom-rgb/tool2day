import type { Metadata } from "next";
import Script from "next/script";
import { Cairo, Syne } from "next/font/google";
import { AdsterraGlobalScripts } from "@/components/adsterra-ads";
import { CookieConsent } from "@/components/cookie-consent";
import { LocaleProvider } from "@/components/locale-provider";
import { RatingGateModal } from "@/components/rating-gate-modal";
import { ADSTERRA_POPUNDER } from "@/lib/adsterra";
import { brandKeywords, siteSeo } from "@/lib/seo-keywords";
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
  // Keep site-wide keywords short. Dumping every tool/locale keyword here
  // bloated every HTML page (~300KB+) and hurt crawl/indexing for thin pages
  // like /contact (GSC: Discovered – currently not indexed).
  keywords: [...brandKeywords],
  metadataBase: new URL("https://www.tool2day.com"),
  // Do NOT set a site-wide canonical here — child pages inherit it and
  // Google treats them as "Alternate page with proper canonical tag".
  openGraph: {
    type: "website",
    locale: "ar_AR",
    alternateLocale: [
      "en_US",
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
    // Do not set a site-wide OG url — children inherit it like canonical.
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
      <head>
        <Script
          id="adsense"
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9998186124580672"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Script
          id="adsterra-popunder-head"
          src={ADSTERRA_POPUNDER}
          strategy="afterInteractive"
        />
      </head>
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
            try {
              var raw = localStorage.getItem('tool2day-cookie-consent');
              if (raw) {
                var c = JSON.parse(raw);
                gtag('consent', 'update', {
                  analytics_storage: c.analytics ? 'granted' : 'denied',
                  ad_storage: c.advertising ? 'granted' : 'denied',
                  ad_user_data: c.advertising ? 'granted' : 'denied',
                  ad_personalization: c.advertising ? 'granted' : 'denied'
                });
              }
            } catch (e) {}
          `}
        </Script>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-44562PZWG4"
          strategy="afterInteractive"
        />
        <Script id="ga-gtag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-44562PZWG4');
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
          <AdsterraGlobalScripts />
          <CookieConsent />
          <RatingGateModal />
        </LocaleProvider>
      </body>
    </html>
  );
}
