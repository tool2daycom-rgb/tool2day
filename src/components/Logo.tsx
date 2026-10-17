import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  locale: string;
  variant?: "full" | "mark";
  className?: string;
};

export function Logo({ locale, variant = "full", className = "" }: LogoProps) {
  if (variant === "mark") {
    return (
      <Link href={`/${locale}`} className={`logo-mark ${className}`} aria-label="tool2day">
        <span className="logo-icon" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="48" rx="12" fill="currentColor" className="logo-icon-bg" />
            <rect x="11" y="12" width="26" height="22" rx="3" stroke="#152018" strokeWidth="2.2" />
            <circle cx="15.5" cy="16.5" r="1.2" fill="#152018" />
            <circle cx="19.5" cy="16.5" r="1.2" fill="#152018" />
            <path
              d="M29.5 28.5 L33 35 L30.2 34.2 L28.8 37.2 L27.2 33.8 Z"
              fill="#152018"
            />
          </svg>
        </span>
        <span className="logo-word">
          tool<span className="logo-two">2</span>day
        </span>
      </Link>
    );
  }

  return (
    <Link href={`/${locale}`} className={`logo-full ${className}`} aria-label="tool2day">
      <Image
        src="/logo.png"
        alt="tool2day — Websites · Apps · Digital"
        width={280}
        height={96}
        className="logo-image"
        priority
      />
    </Link>
  );
}
