import type { Metadata } from "next";
import { Cairo, Syne } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
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
      <body className="flex min-h-full flex-col font-sans">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
