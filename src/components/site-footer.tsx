import Link from "next/link";

const links = [
  { href: "/#video", label: "الفيديو" },
  { href: "/#audio", label: "الصوت" },
  { href: "/#pdf", label: "PDF" },
  { href: "/#converters", label: "المحولات" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[#e5e5e5] bg-[#f3f3f3]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6 text-sm text-[#555] sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© Tool2Day</p>
        <nav className="flex flex-wrap gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-[#111]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-[#777]">العربية</p>
      </div>
    </footer>
  );
}
