import Image from "next/image";
import Link from "next/link";
import { BrandMarkAnimated } from "@/components/brand-mark-animated";

/** شعار Tool2Day — مثلث النقاط (متحرك في الواجهة) */
export function BrandLogo({
  className = "",
  showWord = true,
  size = "md",
  animated = true,
}: {
  className?: string;
  showWord?: boolean;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}) {
  const markPx = size === "lg" ? 48 : size === "sm" ? 28 : 36;

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {animated ? (
        <BrandMarkAnimated size={markPx} />
      ) : (
        <Image
          src="/brand/logo-mark-triangle.svg"
          alt=""
          width={markPx}
          height={Math.round(markPx * 0.9)}
          className="h-auto w-auto shrink-0"
          style={{ width: markPx, height: "auto" }}
          unoptimized
          priority
        />
      )}
      {showWord ? (
        <span
          className={`font-[family-name:var(--font-display)] font-bold tracking-tight ${
            size === "lg"
              ? "text-2xl sm:text-3xl"
              : size === "sm"
                ? "text-base"
                : "text-lg"
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
