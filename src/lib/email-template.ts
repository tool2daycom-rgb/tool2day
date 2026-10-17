const SUPPORT_EMAIL = "support@tool2day.com";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://tool2day.com";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function textBlocksToHtml(text: string) {
  const blocks = text
    .trim()
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (!blocks.length) return "";

  return blocks
    .map((block) => {
      const html = escapeHtml(block).replace(/\n/g, "<br />");
      return `<p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#2a3a30;">${html}</p>`;
    })
    .join("");
}

function emailShell(input: {
  lang: string;
  dir?: "ltr" | "rtl";
  badge: string;
  title: string;
  innerHtml: string;
  footerNote?: string;
}) {
  const year = new Date().getFullYear();
  const dir = input.dir || "ltr";

  return `<!DOCTYPE html>
<html lang="${input.lang}" dir="${dir}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(input.title)}</title>
</head>
<body style="margin:0;padding:0;background:#eef3ea;font-family:Figtree,Segoe UI,Tahoma,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef3ea;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid rgba(21,32,24,0.08);box-shadow:0 18px 40px rgba(21,32,24,0.08);">
          <tr>
            <td style="background:#152018;padding:22px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family:Syne,Segoe UI,Helvetica,Arial,sans-serif;font-size:22px;font-weight:700;letter-spacing:-0.03em;color:#f4f7f2;">
                    tool2day
                  </td>
                  <td align="right">
                    <span style="display:inline-block;padding:6px 10px;border-radius:999px;background:#c5f26d;color:#152018;font-size:11px;font-weight:700;letter-spacing:0.06em;">
                      ${escapeHtml(input.badge)}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#c5f26d,#9fd63a);font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:28px 28px 12px;">
              ${input.innerHtml}
            </td>
          </tr>
          <tr>
            <td style="background:#f7faf5;padding:16px 28px;border-top:1px solid rgba(21,32,24,0.08);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:12px;line-height:1.5;color:#5c6b61;">
                    ${
                      input.footerNote
                        ? escapeHtml(input.footerNote)
                        : `© ${year} Tool2day · Websites, apps &amp; digital products`
                    }
                  </td>
                  <td align="right" style="font-size:12px;line-height:1.5;">
                    <a href="${SITE_URL}" style="color:#1a2b1f;text-decoration:none;font-weight:650;">tool2day.com</a>
                    &nbsp;·&nbsp;
                    <a href="mailto:${SUPPORT_EMAIL}" style="color:#1a2b1f;text-decoration:none;font-weight:650;">${SUPPORT_EMAIL}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderCustomerReplyHtml(input: {
  subject: string;
  body: string;
}) {
  return emailShell({
    lang: "en",
    badge: "Studio",
    title: input.subject,
    innerHtml: textBlocksToHtml(input.body),
  });
}

export function renderInquiryNotificationHtml(input: {
  typeLabel: string;
  name: string;
  email: string;
  locale: string;
  fields: Array<{ label: string; value: string }>;
  messagePreview?: string;
  adminUrl: string;
}) {
  const fieldRows = input.fields
    .filter((field) => field.value.trim() && field.value !== "—")
    .map(
      (field) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid rgba(21,32,24,0.08);font-size:13px;color:#5c6b61;width:34%;vertical-align:top;font-weight:650;">${escapeHtml(field.label)}</td>
        <td style="padding:10px 0;border-bottom:1px solid rgba(21,32,24,0.08);font-size:14px;color:#152018;vertical-align:top;word-break:break-word;">${escapeHtml(field.value)}</td>
      </tr>`,
    )
    .join("");

  const preview = input.messagePreview?.trim()
    ? `<div style="margin:18px 0 0;padding:14px 16px;border-radius:12px;background:#f7faf5;border:1px solid rgba(21,32,24,0.08);">
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#5c6b61;">معاينة الرسالة</p>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#2a3a30;white-space:pre-wrap;">${escapeHtml(input.messagePreview.trim())}</p>
      </div>`
    : "";

  const innerHtml = `
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.04em;color:#5c6b61;font-weight:700;">تنبيه لوحة الإدارة</p>
    <h1 style="margin:0 0 10px;font-family:Syne,Segoe UI,Helvetica,Arial,sans-serif;font-size:24px;line-height:1.25;letter-spacing:-0.03em;color:#152018;">وصل طلب جديد يحتاج متابعتك</h1>
    <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#2a3a30;">
      نوع الطلب: <strong>${escapeHtml(input.typeLabel)}</strong> من
      <strong>${escapeHtml(input.name)}</strong>.
      افتح لوحة الإدارة لمراجعته والرد.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${fieldRows}</table>
    ${preview}
    <p style="margin:24px 0 8px;">
      <a href="${escapeHtml(input.adminUrl)}" style="display:inline-block;background:#152018;color:#c5f26d;text-decoration:none;font-weight:700;padding:13px 20px;border-radius:999px;">فتح الطلب في لوحة الإدارة</a>
    </p>
    <p style="margin:0;font-size:12px;color:#5c6b61;line-height:1.5;">إذا لم يعمل الزر، انسخ الرابط:<br /><a href="${escapeHtml(input.adminUrl)}" style="color:#1a2b1f;">${escapeHtml(input.adminUrl)}</a></p>
  `;

  return emailShell({
    lang: "ar",
    dir: "rtl",
    badge: "طلب جديد",
    title: `طلب جديد — ${input.name}`,
    innerHtml,
    footerNote: "إشعار تلقائي من tool2day — لا ترد على هذا التنسيق إن لم يكن لازمًا",
  });
}
