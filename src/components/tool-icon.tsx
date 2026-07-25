"use client";

import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { getToolImageIcon } from "@/lib/tool-image-icons";

type Size = "sm" | "md" | "lg" | "xl";

const sizeClass: Record<Size, string> = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-14 w-14 sm:h-16 sm:w-16",
};

const pixelSize: Record<Size, number> = {
  sm: 20,
  md: 24,
  lg: 32,
  xl: 64,
};

/**
 * Renders a custom brand image icon when available, otherwise the Lucide icon.
 */
export function ToolIcon({
  slug,
  Icon,
  size = "md",
  className = "",
  strokeWidth = 1.5,
}: {
  slug: string;
  Icon: LucideIcon;
  size?: Size;
  className?: string;
  strokeWidth?: number;
}) {
  const src = getToolImageIcon(slug);
  const box = sizeClass[size];

  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={pixelSize[size]}
        height={pixelSize[size]}
        className={`${box} shrink-0 object-contain ${className}`}
        unoptimized
        aria-hidden
      />
    );
  }

  return (
    <Icon
      className={`${box} shrink-0 ${className}`}
      strokeWidth={strokeWidth}
      aria-hidden
    />
  );
}
