import nodemailer from "nodemailer";
import {
  renderCustomerReplyHtml,
  renderInquiryNotificationHtml,
} from "@/lib/email-template";

const SUPPORT_EMAIL = "support@tool2day.com";

export function mailConfigured() {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim(),
  );
}

export function supportFromAddress() {
  const configured = process.env.MAIL_FROM?.trim();
  if (configured) return configured;
  return `tool2day <${SUPPORT_EMAIL}>`;
}

function createTransporter() {
  const host = process.env.SMTP_HOST!.trim();
  const port = Number(process.env.SMTP_PORT || "465");
  const user = process.env.SMTP_USER!.trim();
  const pass = process.env.SMTP_PASS!.trim();

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
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

  const from = supportFromAddress();
  const to = process.env.MAIL_TO?.trim() || SUPPORT_EMAIL;
  const transporter = createTransporter();
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://tool2day.com";
  const adminUrl = `${site}/admin/${input.id}`;

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
    `Open admin: ${adminUrl}`,
  ].join("\n");

  const html = renderInquiryNotificationHtml({
    title: `${label} — ${input.name}`,
    summaryLines: [
      `ID: ${input.id}`,
      `Locale: ${input.locale}`,
      `From: ${input.name} <${input.email}>`,
      ...input.summaryLines,
    ],
    adminUrl,
  });

  await transporter.sendMail({
    from,
    to,
    replyTo: input.email,
    subject,
    text,
    html,
  });

  return { sent: true as const };
}

export async function sendCustomerReply(input: {
  to: string;
  subject: string;
  body: string;
}) {
  if (!mailConfigured()) {
    return {
      ok: false as const,
      error: "smtp_not_configured" as const,
      message:
        "إرسال البريد غير مهيأ. أضف SMTP_HOST وSMTP_USER وSMTP_PASS (Zoho) ثم أعد النشر.",
    };
  }

  const to = input.to.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return {
      ok: false as const,
      error: "invalid_recipient" as const,
      message: "عنوان بريد المستلم غير صالح.",
    };
  }

  const subject = input.subject.trim();
  const body = input.body.trim();
  if (!subject || subject.length > 200) {
    return {
      ok: false as const,
      error: "invalid_subject" as const,
      message: "الموضوع مطلوب وبحد أقصى 200 حرف.",
    };
  }
  if (!body || body.length > 20000) {
    return {
      ok: false as const,
      error: "invalid_body" as const,
      message: "نص الرد مطلوب وبحد أقصى 20000 حرف.",
    };
  }

  try {
    const transporter = createTransporter();
    const from = supportFromAddress();
    const html = renderCustomerReplyHtml({ subject, body });
    await transporter.sendMail({
      from,
      to,
      replyTo: SUPPORT_EMAIL,
      subject,
      text: body,
      html,
    });
    return {
      ok: true as const,
      fromEmail: SUPPORT_EMAIL,
    };
  } catch {
    return {
      ok: false as const,
      error: "send_failed" as const,
      message:
        "تعذر إرسال البريد عبر Zoho. تحقق من إعدادات SMTP أو App Password ثم أعد المحاولة.",
    };
  }
}
