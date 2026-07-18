import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Chunk long text for Google Translate TTS (unofficial, best-effort). */
function chunkText(text: string, max = 180): string[] {
  const parts: string[] = [];
  let rest = text.trim();
  while (rest.length > max) {
    let cut = rest.lastIndexOf(" ", max);
    if (cut < 40) cut = max;
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      text?: string;
      lang?: string;
    };
    const text = (body.text || "").trim();
    if (!text) {
      return NextResponse.json({ error: "النص فارغ" }, { status: 400 });
    }
    if (text.length > 1200) {
      return NextResponse.json(
        { error: "النص طويل جداً (الحد 1200 حرف)" },
        { status: 400 },
      );
    }

    const lang = (body.lang || "ar").split("-")[0] || "ar";
    const chunks = chunkText(text);
    const buffers: ArrayBuffer[] = [];

    for (const chunk of chunks) {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(lang)}&q=${encodeURIComponent(chunk)}`;
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://translate.google.com/",
        },
      });
      if (!res.ok) {
        return NextResponse.json(
          { error: `تعذر توليد الصوت (${res.status})` },
          { status: 502 },
        );
      }
      buffers.push(await res.arrayBuffer());
    }

    // Concatenate MP3 chunks (works for MPEG frames in practice for short clips)
    const total = buffers.reduce((n, b) => n + b.byteLength, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const b of buffers) {
      out.set(new Uint8Array(b), offset);
      offset += b.byteLength;
    }

    return new NextResponse(out, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "فشل التحويل إلى كلام" }, { status: 500 });
  }
}
