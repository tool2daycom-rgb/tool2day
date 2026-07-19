import Link from "next/link";
import { BrandMarkAnimated } from "@/components/brand-mark-animated";

/** شعار Tool2Day بأسلوب 123apps: أيقونة مثلث صغيرة + اسم عريض */
export function BrandLogo({
  className = "",
  showWord = true,
  size = "md",
}: {
  className?: string;
  showWord?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const markPx = size === "lg" ? 28 : size === "sm" ? 18 : 22;

  return (
    <span
      className={`inline-flex items-center gap-2 ${className}`}
      style={{ flexDirection: "row" }}
    >
      <BrandMarkAnimated size={markPx} />
      {showWord ? (
        <span
          className={`font-[family-name:var(--font-display)] font-extrabold uppercase tracking-[-0.02em] text-white ${
            size === "lg"
              ? "text-[1.35rem] leading-none sm:text-[1.5rem]"
              : size === "sm"
                ? "text-[0.95rem] leading-none"
                : "text-[1.15rem] leading-none"
          }`}
        >
          tool2day
        </span>
      ) : null}
    </span>
  );
}

export function BrandLogoLink({
  className = "",
  showWord = true,
  size = "md",
}: {
  className?: string;
  showWord?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <Link
      href="/"
      className={`inline-flex shrink-0 items-center transition hover:opacity-90 ${className}`}
      aria-label="Tool2Day — الصفحة الرئيسية"
    >
      <BrandLogo showWord={showWord} size={size} />
    </Link>
  );
}
