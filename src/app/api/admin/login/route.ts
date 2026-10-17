import { NextResponse } from "next/server";
import {
  adminAuthConfigured,
  createAdminSession,
  verifyAdminCredentials,
} from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    if (!adminAuthConfigured()) {
      return NextResponse.json(
        { ok: false, message: "إعدادات تسجيل الدخول غير مكتملة." },
        { status: 503 },
      );
    }

    const ip = clientIp(request);
    const limited = rateLimit(`admin-login:${ip}`, 12, 15 * 60 * 1000);
    if (!limited.ok) {
      return NextResponse.json(
        { ok: false, message: "محاولات كثيرة. حاول لاحقًا." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const username = String(body?.username || "").trim();
    const password = String(body?.password || "");
    if (!username || !password) {
      return NextResponse.json(
        { ok: false, message: "أدخل اسم المستخدم وكلمة المرور." },
        { status: 400 },
      );
    }

    const valid = await verifyAdminCredentials(username, password);
    if (!valid) {
      return NextResponse.json(
        { ok: false, message: "بيانات الدخول غير صحيحة." },
        { status: 401 },
      );
    }

    await createAdminSession(username);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, message: "تعذّر تسجيل الدخول." },
      { status: 500 },
    );
  }
}
