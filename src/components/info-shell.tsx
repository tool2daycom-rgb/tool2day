import Link from "next/link";

export function InfoShell({
  title,
  description,
  paragraphs,
}: {
  title: string;
  description: string;
  paragraphs: string[];
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-2xl font-bold text-[#111] sm:text-3xl">{title}</h1>
      <p className="mt-3 text-[#555]">{description}</p>
      <div className="mt-8 space-y-4 text-[15px] leading-8 text-[#333]">
        {paragraphs.map((p) => (
          <p key={p.slice(0, 32)}>{p}</p>
        ))}
      </div>
      <p className="mt-10">
        <Link
          href="/"
          className="text-sm font-semibold text-[#2563eb] hover:underline"
        >
          ← العودة للصفحة الرئيسية
        </Link>
      </p>
    </div>
  );
}
