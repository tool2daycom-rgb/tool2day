import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type Lang = "ar" | "en";

/**
 * ترجمة نص قصير عربي ↔ إنجليزي عبر واجهات عامة (بدون مفتاح).
 * تُستخدم لتوليد الترجمة الفرعية للفيديو.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      text?: string;
      from?: string;
      to?: string;
    };
    const text = String(body.text || "").trim();
    const from = (body.from === "en" ? "en" : "ar") as Lang;
    const to = (body.to === "en" ? "en" : "ar") as Lang;

    if (!text) {
      return NextResponse.json({ error: "النص مطلوب" }, { status: 400 });
    }
    if (text.length > 4500) {
      return NextResponse.json(
        { error: "النص طويل جداً لمقطع واحد" },
        { status: 400 },
      );
    }
    if (from === to) {
      return NextResponse.json({ text, provider: "identity" });
    }

    const translated =
      (await translateGoogle(text, from, to)) ||
      (await translateMyMemory(text, from, to));

    if (!translated) {
      return NextResponse.json(
        { error: "تعذّرت الترجمة — أعد المحاولة" },
        { status: 502 },
      );
    }

    return NextResponse.json({ text: translated, provider: "translate" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "فشل الترجمة";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function translateGoogle(
  text: string,
  from: Lang,
  to: Lang,
): Promise<string | null> {
  try {
    const url =
      "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" +
      `${encodeURIComponent(from)}&tl=${encodeURIComponent(to)}&dt=t&q=` +
      encodeURIComponent(text);
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 Tool2Day/1.0" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data) || !Array.isArray(data[0])) return null;
    const parts = (data[0] as unknown[])
      .map((row) => (Array.isArray(row) ? String(row[0] || "") : ""))
      .filter(Boolean);
    const out = parts.join("").trim();
    return out || null;
  } catch {
    return null;
  }
}

async function translateMyMemory(
  text: string,
  from: Lang,
  to: Lang,
): Promise<string | null> {
  try {
    const url =
      "https://api.mymemory.translated.net/get?q=" +
      `${encodeURIComponent(text)}&langpair=${from}|${to}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      responseData?: { translatedText?: string };
    };
    const out = (data.responseData?.translatedText || "").trim();
    if (!out || /MYMEMORY WARNING/i.test(out)) return null;
    return out;
  } catch {
    return null;
  }
}
