import Link from "next/link";

const links = [
  { href: "/#convert", label: "تحويل" },
  { href: "/#edit", label: "تحرير فيديو" },
  { href: "/#tools", label: "كل الأدوات" },
];

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-brand sm:text-2xl"
        >
          Tool2Day
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-ink-soft md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-brand"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/#tools"
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-deep"
        >
          ابدأ الآن
        </Link>
      </div>
    </header>
  );
}
