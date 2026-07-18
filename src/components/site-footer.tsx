import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line px-5 py-10 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-lg font-bold text-brand"
        >
          Tool2Day
        </Link>
        <p className="text-sm text-ink-soft">
          أدوات إلكترونية لتحويل الملفات وتحرير الفيديو.
        </p>
      </div>
    </footer>
  );
}
