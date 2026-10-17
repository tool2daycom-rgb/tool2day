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

export function renderCustomerReplyHtml(input: {
  subject: string;
  body: string;
}) {
  const bodyHtml = textBlocksToHtml(input.body);
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(input.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#eef3ea;font-family:Figtree,Segoe UI,Helvetica,Arial,sans-serif;">
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
                    <span style="display:inline-block;padding:6px 10px;border-radius:999px;background:#c5f26d;color:#152018;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
                      Studio
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
            <td style="padding:28px 28px 8px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="background:#f7faf5;padding:16px 28px;border-top:1px solid rgba(21,32,24,0.08);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:12px;line-height:1.5;color:#5c6b61;">
                    © ${year} Tool2day · Websites, apps &amp; digital products
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

export function renderInquiryNotificationHtml(input: {
  title: string;
  summaryLines: string[];
  adminUrl: string;
}) {
  const rows = input.summaryLines
    .map((line) => {
      const [label, ...rest] = line.split(":");
      const value = rest.join(":").trim() || line;
      const showLabel = rest.length > 0;
      return `<tr>
        <td style="padding:8px 0;border-bottom:1px solid rgba(21,32,24,0.08);font-size:14px;color:#5c6b61;width:34%;vertical-align:top;">${
          showLabel ? escapeHtml(label.trim()) : ""
        }</td>
        <td style="padding:8px 0;border-bottom:1px solid rgba(21,32,24,0.08);font-size:14px;color:#152018;vertical-align:top;">${escapeHtml(
          showLabel ? value : line,
        )}</td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#eef3ea;font-family:Figtree,Segoe UI,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef3ea;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:18px;overflow:hidden;border:1px solid rgba(21,32,24,0.08);">
        <tr><td style="background:#152018;padding:20px 28px;color:#f4f7f2;font-size:20px;font-weight:700;">tool2day</td></tr>
        <tr><td style="height:4px;background:#c5f26d;">&nbsp;</td></tr>
        <tr><td style="padding:24px 28px;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#5c6b61;font-weight:700;">New inquiry</p>
          <h1 style="margin:0 0 18px;font-size:22px;line-height:1.25;color:#152018;">${escapeHtml(input.title)}</h1>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
          <p style="margin:22px 0 0;">
            <a href="${escapeHtml(input.adminUrl)}" style="display:inline-block;background:#152018;color:#c5f26d;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:999px;">Open in admin</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
