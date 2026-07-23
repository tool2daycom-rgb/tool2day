import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_BYTES = 24 * 1024 * 1024;

/**
 * تفريغ صوت/فيديو إلى نص عبر Whisper.
 * يستخدم GROQ_API_KEY أو OPENAI_API_KEY إن وُجدت (دقة أعلى).
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const language = String(form.get("language") || "ar").trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "ملف الصوت مطلوب" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "الملف كبير جداً — قصّ المقطع أو استخدم المسار المحلي" },
        { status: 413 },
      );
    }

    const groqKey = process.env.GROQ_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (groqKey) {
      const text = await callWhisperCompatible({
        endpoint: "https://api.groq.com/openai/v1/audio/transcriptions",
        apiKey: groqKey,
        model: "whisper-large-v3",
        file,
        language,
      });
      return NextResponse.json({
        text,
        provider: "groq",
        model: "whisper-large-v3",
      });
    }

    if (openaiKey) {
      const text = await callWhisperCompatible({
        endpoint: "https://api.openai.com/v1/audio/transcriptions",
        apiKey: openaiKey,
        model: "whisper-1",
        file,
        language,
      });
      return NextResponse.json({
        text,
        provider: "openai",
        model: "whisper-1",
      });
    }

    return NextResponse.json(
      {
        error: "no_server_key",
        message: "لا يتوفر مفتاح خادم — سيعمل التحويل داخل المتصفح",
      },
      { status: 501 },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "فشل التفريغ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function callWhisperCompatible(opts: {
  endpoint: string;
  apiKey: string;
  model: string;
  file: File;
  language: string;
}) {
  const body = new FormData();
  body.append("file", opts.file, opts.file.name || "audio.wav");
  body.append("model", opts.model);
  body.append("response_format", "json");
  if (opts.language && opts.language !== "auto") {
    body.append("language", opts.language);
  }

  const res = await fetch(opts.endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${opts.apiKey}` },
    body,
  });
  const data = (await res.json().catch(() => ({}))) as {
    text?: string;
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(data.error?.message || `فشل Whisper (${res.status})`);
  }
  const text = (data.text || "").trim();
  if (!text) throw new Error("لم يُستخرج نص من الملف");
  return text;
}
