import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_BYTES = 24 * 1024 * 1024;

type SegmentCue = { start: number; end: number; text: string };
type WordCue = { start: number; end: number; word: string };

/**
 * تفريغ صوت/فيديو إلى نص عبر Whisper.
 * يستخدم GROQ_API_KEY أو OPENAI_API_KEY إن وُجدت (دقة أعلى).
 * timestamps=1 يعيد مقاطع مع أزمنة لملفات SRT/VTT.
 * word_timestamps=1 يطلب أزمنة على مستوى الكلمة (للترجمة الحركية).
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const language = String(form.get("language") || "ar").trim();
    const withTimestamps = String(form.get("timestamps") || "") === "1";
    const withWords = String(form.get("word_timestamps") || "") === "1";

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
      const result = await callWhisperCompatible({
        endpoint: "https://api.groq.com/openai/v1/audio/transcriptions",
        apiKey: groqKey,
        model: "whisper-large-v3",
        file,
        language,
        withTimestamps: withTimestamps || withWords,
        withWords,
      });
      return NextResponse.json({
        text: result.text,
        cues: result.cues,
        words: result.words,
        provider: "groq",
        model: "whisper-large-v3",
      });
    }

    if (openaiKey) {
      const result = await callWhisperCompatible({
        endpoint: "https://api.openai.com/v1/audio/transcriptions",
        apiKey: openaiKey,
        model: "whisper-1",
        file,
        language,
        withTimestamps: withTimestamps || withWords,
        withWords,
      });
      return NextResponse.json({
        text: result.text,
        cues: result.cues,
        words: result.words,
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
  withTimestamps: boolean;
  withWords: boolean;
}): Promise<{ text: string; cues?: SegmentCue[]; words?: WordCue[] }> {
  const body = new FormData();
  body.append("file", opts.file, opts.file.name || "audio.wav");
  body.append("model", opts.model);
  body.append(
    "response_format",
    opts.withTimestamps ? "verbose_json" : "json",
  );
  if (opts.withTimestamps) {
    body.append("timestamp_granularities[]", "segment");
    if (opts.withWords) {
      body.append("timestamp_granularities[]", "word");
    }
  }
  if (opts.language && opts.language !== "auto") {
    body.append("language", opts.language);
  }
  // بدون prompt طويل — Whisper يكرّر الـ prompt بدل كلام الفيديو
  body.append("temperature", "0");

  const res = await fetch(opts.endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${opts.apiKey}` },
    body,
  });
  const data = (await res.json().catch(() => ({}))) as {
    text?: string;
    segments?: Array<{ start?: number; end?: number; text?: string }>;
    words?: Array<{ start?: number; end?: number; word?: string }>;
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(data.error?.message || `فشل Whisper (${res.status})`);
  }
  const text = stripPromptLeakage((data.text || "").trim());
  if (!text) throw new Error("لم يُستخرج نص من الملف");

  const cues: SegmentCue[] | undefined = Array.isArray(data.segments)
    ? data.segments
        .map((s) => ({
          start: Number(s.start) || 0,
          end: Math.max(Number(s.start) || 0, Number(s.end) || 0) + 0.01,
          text: stripPromptLeakage((s.text || "").trim()),
        }))
        .filter((c) => c.text)
    : undefined;

  let words: WordCue[] | undefined = Array.isArray(data.words)
    ? data.words
        .map((w) => ({
          start: Number(w.start) || 0,
          end: Math.max(Number(w.start) || 0, Number(w.end) || 0) + 0.02,
          word: String(w.word || "").trim(),
        }))
        .filter((w) => w.word)
    : undefined;

  // إن طلبنا كلمات ولم تأتِ — وزّع كلمات المقاطع على الزمن
  if (opts.withWords && (!words || !words.length) && cues?.length) {
    words = wordsFromSegmentCues(cues);
  }

  return { text, cues, words };
}

function wordsFromSegmentCues(cues: SegmentCue[]): WordCue[] {
  const out: WordCue[] = [];
  for (const cue of cues) {
    const parts = cue.text.split(/\s+/).filter(Boolean);
    if (!parts.length) continue;
    const dur = Math.max(0.2, cue.end - cue.start);
    const step = dur / parts.length;
    parts.forEach((word, i) => {
      const start = cue.start + i * step;
      out.push({
        word,
        start,
        end: Math.min(cue.end, start + step),
      });
    });
  }
  return out;
}

/** يزيل نص الـ prompt الذي يكرّره Whisper أحياناً بدل الكلام الحقيقي */
function stripPromptLeakage(text: string): string {
  if (!text) return "";
  let t = text.replace(/\s+/gu, " ").trim();
  if (
    /لهجة شامية/u.test(t) ||
    /ترجمة عربية صحيحة/u.test(t) ||
    (/أسماء:?\s*(?:أوكرانيا|أوروبا|اوروبا)/u.test(t) &&
      /النمسا|تركيا|بولندا/u.test(t)) ||
    /عم نعيش[،,]?\s*عم ننتقل/u.test(t)
  ) {
    return "";
  }
  return t;
}
