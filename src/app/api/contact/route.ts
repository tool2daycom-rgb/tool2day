import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

const TO = process.env.CONTACT_TO || "tool2day.com@gmail.com";
const MAX_FILES = 3;
const MAX_FILE_BYTES = 2.5 * 1024 * 1024; // ~2.5MB — حد Vercel للطلب
const MAX_MESSAGE = 8000;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const message = String(form.get("message") || "").trim();
    const email = String(form.get("email") || "").trim();
    const files = form
      .getAll("files")
      .filter((f): f is File => typeof f !== "string" && f.size > 0);

    if (!message) {
      return NextResponse.json({ error: "اكتب رسالتك أولاً" }, { status: 400 });
    }
    if (message.length > MAX_MESSAGE) {
      return NextResponse.json(
        { error: "الرسالة طويلة جداً" },
        { status: 400 },
      );
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "أدخل بريداً إلكترونياً صالحاً" },
        { status: 400 },
      );
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `حد أقصى ${MAX_FILES} ملفات` },
        { status: 400 },
      );
    }
    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: `الملف ${file.name} أكبر من 2.5 ميغابايت` },
          { status: 400 },
        );
      }
    }

    const attachments = await Promise.all(
      files.map(async (file) => ({
        filename: file.name,
        content: Buffer.from(await file.arrayBuffer()),
        contentType: file.type || undefined,
      })),
    );

    const subject = `رسالة تواصل من Tool2Day — ${email}`;
    const text = `من: ${email}\n\n${message}`;
    const html = `
      <div dir="rtl" style="font-family:sans-serif;line-height:1.7">
        <p><strong>من:</strong> ${escapeHtml(email)}</p>
        <p><strong>الرسالة:</strong></p>
        <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
      </div>
    `;

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: { user: smtpUser, pass: smtpPass },
      });

      await transporter.sendMail({
        from: `"Tool2Day Contact" <${smtpUser}>`,
        to: TO,
        replyTo: email,
        subject,
        text,
        html,
        attachments,
      });

      return NextResponse.json({ ok: true });
    }

    // بدون SMTP: FormSubmit (يحتاج تأكيد البريد مرة أولى)
    const forward = new FormData();
    forward.append("message", message);
    forward.append("email", email);
    forward.append("_replyto", email);
    forward.append("_subject", subject);
    forward.append("_template", "table");
    forward.append("_captcha", "false");
    for (const file of files) {
      forward.append("attachment", file, file.name);
    }

    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(TO)}`, {
      method: "POST",
      body: forward,
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("FormSubmit failed", res.status, errText);
      return NextResponse.json(
        {
          error:
            "تعذّر إرسال الرسالة حالياً. أضف SMTP_USER و SMTP_PASS في إعدادات المشروع، أو أكّد البريد عبر FormSubmit.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("contact error", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء الإرسال. حاول مرة أخرى." },
      { status: 500 },
    );
  }
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
