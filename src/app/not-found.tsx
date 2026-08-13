import type { Metadata } from "next";
import { ErrorPageView } from "@/components/error-page-view";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "الصفحة غير موجودة",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="flex-1">
        <ErrorPageView
          title="404 — الصفحة غير موجودة"
          description="الرابط غير صحيح أو الأداة غير متاحة. يمكنك العودة للرئيسية واختيار أداة أخرى."
        />
      </main>
      <SiteFooter />
    </div>
  );
}
