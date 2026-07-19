import Link from "next/link";
import { BrandMarkAnimated } from "@/components/brand-mark-animated";

/** شعار Tool2Day — مثلث النقاط مع حركة احترافية */
export function BrandLogo({
  className = "",
  showWord = true,
  size = "md",
}: {
  className?: string;
  showWord?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const markPx = size === "lg" ? 52 : size === "sm" ? 28 : 40;

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <BrandMarkAnimated size={markPx} />
      {showWord ? (
        <span
          className={`font-[family-name:var(--font-display)] font-bold tracking-tight ${
            size === "lg"
              ? "text-3xl sm:text-4xl"
              : size === "sm"
                ? "text-base"
                : "text-xl"
          }`}
        >
          Tool2Day
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
