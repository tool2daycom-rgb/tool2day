/**
 * Editable business placeholders — update before launch.
 * Do not claim backend delivery until a real form endpoint exists.
 */
export const site = {
  name: "tool2day",
  domain: "tool2day.com",
  url: "https://tool2day.com",
  defaultLocale: "de" as const,
  locales: ["de", "en"] as const,

  /** Replace with your real contact email before launch */
  contactEmail: "support@tool2day.com",

  /** Optional social / chat links — leave empty string to hide */
  links: {
    whatsapp: "",
    linkedin: "",
    github: "",
  },

  /** Legal pages — add real URLs before launching in Germany */
  legal: {
    imprint: "/impressum",
    privacy: "/datenschutz",
  },
} as const;

export type Locale = (typeof site.locales)[number];

export function isLocale(value: string): value is Locale {
  return (site.locales as readonly string[]).includes(value);
}
