"use client";

import { openCookieSettings } from "@/lib/consent";

type Props = {
  label: string;
};

export function CookieSettingsButton({ label }: Props) {
  return (
    <button type="button" className="footer-cookie-btn" onClick={openCookieSettings}>
      {label}
    </button>
  );
}
