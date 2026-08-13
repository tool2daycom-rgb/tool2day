"use client";

import { ErrorPageView } from "@/components/error-page-view";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorPageView
      title="حدث خطأ في الصفحة"
      description="تعذّر عرض هذه الصفحة مؤقتاً. جرّب إعادة المحاولة أو ارجع للرئيسية."
      onRetry={reset}
    />
  );
}
