import type { Locale } from "@/content";
import { getStartFormCopy, type ProjectTypeId } from "@/content/start-form";
import type { InquiryType } from "@/db/schema";

function cleanName(name: string | null | undefined) {
  const value = name?.trim() || "";
  if (!value || value === "—") return "";
  return value;
}

function cleanProjectType(value: string | null | undefined) {
  const text = value?.trim() || "";
  if (!text || text === "—") return "";
  return text;
}

export function resolveProjectTypeLabel(input: {
  locale: string;
  type: InquiryType;
  payload: Record<string, unknown>;
}) {
  const locale: Locale = input.locale === "en" ? "en" : "de";
  const form = getStartFormCopy(locale);

  if (input.type === "contact") {
    return cleanProjectType(String(input.payload.service || ""));
  }

  const raw = input.payload.projectTypes;
  const ids = Array.isArray(raw)
    ? raw.map(String)
    : typeof raw === "string" && raw.trim()
      ? [raw.trim()]
      : [];

  if (!ids.length) {
    return cleanProjectType(String(input.payload.otherProjectNote || ""));
  }

  const labels = ids.map((id) => form.projectTypes[id as ProjectTypeId] || id);
  return cleanProjectType(labels.join(", "));
}

export function buildReplyTemplate(input: {
  locale: string;
  name?: string | null;
  projectType?: string | null;
}) {
  const locale = input.locale === "en" ? "en" : "de";
  const name = cleanName(input.name);
  const projectType = cleanProjectType(input.projectType);

  if (locale === "en") {
    const greeting = name ? `Hi ${name},` : "Hi,";
    const inquiryLine = projectType
      ? `Thank you for your message and for your interest in Tool2day. I’ve received your inquiry about ${projectType} and will review the details. I’ll get back to you to discuss the next steps.`
      : `Thank you for your message and for your interest in Tool2day. I’ve received your inquiry and will review the details. I’ll get back to you to discuss the next steps.`;

    return {
      subject: "Thank you for contacting Tool2day",
      body: [
        greeting,
        "",
        inquiryLine,
        "",
        "If you’d like to add anything, simply reply to this email.",
        "",
        "Best regards,",
        "Wisam Dandash",
        "Tool2day",
        "support@tool2day.com",
      ].join("\n"),
    };
  }

  const greeting = name ? `Hallo ${name},` : "Hallo,";
  const inquiryLine = projectType
    ? `vielen Dank für Ihre Nachricht und Ihr Interesse an Tool2day. Ich habe Ihre Anfrage zu ${projectType} erhalten und sehe mir die Details an. Ich melde mich bei Ihnen, um die nächsten Schritte zu besprechen.`
    : `vielen Dank für Ihre Nachricht und Ihr Interesse an Tool2day. Ich habe Ihre Anfrage erhalten und sehe mir die Details an. Ich melde mich bei Ihnen, um die nächsten Schritte zu besprechen.`;

  return {
    subject: "Vielen Dank für Ihre Anfrage bei Tool2day",
    body: [
      greeting,
      "",
      inquiryLine,
      "",
      "Falls Sie noch etwas ergänzen möchten, antworten Sie einfach auf diese E-Mail.",
      "",
      "Freundliche Grüße",
      "Wisam Dandash",
      "Tool2day",
      "support@tool2day.com",
    ].join("\n"),
  };
}
