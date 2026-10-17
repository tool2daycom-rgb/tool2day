import nodemailer from "nodemailer";

export function mailConfigured() {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim(),
  );
}

export async function sendInquiryNotification(input: {
  type: "contact" | "project";
  name: string;
  email: string;
  id: string;
  locale: string;
  summaryLines: string[];
}) {
  if (!mailConfigured()) {
    return { sent: false as const, reason: "smtp_not_configured" as const };
  }

  const host = process.env.SMTP_HOST!.trim();
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER!.trim();
  const pass = process.env.SMTP_PASS!.trim();
  const from = process.env.MAIL_FROM?.trim() || user;
  const to = process.env.MAIL_TO?.trim() || "support@tool2day.com";

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const label = input.type === "contact" ? "Contact" : "Project inquiry";
  const subject = `[tool2day] ${label} — ${input.name}`;
  const text = [
    `New ${label}`,
    `ID: ${input.id}`,
    `Locale: ${input.locale}`,
    `From: ${input.name} <${input.email}>`,
    "",
    ...input.summaryLines,
    "",
    `Open admin: ${process.env.NEXT_PUBLIC_SITE_URL || "https://tool2day.com"}/admin/${input.id}`,
  ].join("\n");

  await transporter.sendMail({
    from,
    to,
    replyTo: input.email,
    subject,
    text,
  });

  return { sent: true as const };
}
