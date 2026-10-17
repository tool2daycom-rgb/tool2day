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

function notificationRecipients() {
  const raw = process.env.MAIL_TO?.trim() || SUPPORT_EMAIL;
  return [
    ...new Set(
      raw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

export async function sendInquiryNotification(input: {
  type: "contact" | "project";
  name: string;
  email: string;
  id: string;
  locale: string;
  fields: Array<{ label: string; value: string }>;
  messagePreview?: string;
}) {
  if (!mailConfigured()) {
    console.error("[mail] inquiry notification skipped: smtp_not_configured");
    return { sent: false as const, reason: "smtp_not_configured" as const };
  }

  const from = supportFromAddress();
  const to = notificationRecipients();
  const transporter = createTransporter();
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://tool2day.com";
  const adminUrl = `${site}/admin/${input.id}`;
  const typeLabel = input.type === "contact" ? "تواصل (Contact)" : "استفسار مشروع";
  const subject = `[tool2day] طلب جديد — ${typeLabel} — ${input.name}`;

  const text = [
    "وصل طلب جديد على tool2day",
    `النوع: ${typeLabel}`,
    `الاسم: ${input.name}`,
    `البريد: ${input.email}`,
    `اللغة: ${input.locale}`,
    "",
    ...input.fields.map((field) => `${field.label}: ${field.value}`),
    "",
    input.messagePreview ? `الرسالة:\n${input.messagePreview}` : "",
    "",
    `افتح الطلب: ${adminUrl}`,
  ]
    .filter((line) => line !== undefined)
    .join("\n");

  const html = renderInquiryNotificationHtml({
    typeLabel,
    name: input.name,
    email: input.email,
    locale: input.locale,
    fields: [
      { label: "الاسم", value: input.name },
      { label: "البريد", value: input.email },
      { label: "لغة النموذج", value: input.locale },
      ...input.fields,
    ],
    messagePreview: input.messagePreview,
    adminUrl,
  });

  try {
    const info = await transporter.sendMail({
      from,
      to,
      replyTo: input.email,
      subject,
      text,
      html,
    });
    console.info("[mail] inquiry notification sent", {
      id: input.id,
      toCount: to.length,
      messageId: info.messageId,
    });
    return { sent: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    console.error("[mail] inquiry notification failed", {
      id: input.id,
      message,
    });
    throw error;
  }
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
