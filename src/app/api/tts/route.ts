import { NextResponse } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export const runtime = "nodejs";
export const maxDuration = 60;

/** كل الأصوات العربية العصبية المتاحة */
export const ARABIC_NEURAL_VOICES = [
  // موصى بها — الأقرب للحقيقة (فصحى/واضحة)
  "ar-SA-ZariyahNeural",
  "ar-SA-HamedNeural",
  "ar-EG-SalmaNeural",
  "ar-EG-ShakirNeural",
  "ar-LB-LaylaNeural",
  "ar-LB-RamiNeural",
  "ar-AE-FatimaNeural",
  "ar-AE-HamdanNeural",
  "ar-JO-SanaNeural",
  "ar-JO-TaimNeural",
  "ar-SY-AmanyNeural",
  "ar-SY-LaithNeural",
  "ar-IQ-RanaNeural",
  "ar-IQ-BasselNeural",
  "ar-KW-NouraNeural",
  "ar-KW-FahedNeural",
  "ar-QA-AmalNeural",
  "ar-QA-MoazNeural",
  "ar-BH-LailaNeural",
  "ar-BH-AliNeural",
  "ar-OM-AyshaNeural",
  "ar-OM-AbdullahNeural",
  "ar-YE-MaryamNeural",
  "ar-YE-SalehNeural",
  "ar-MA-MounaNeural",
  "ar-MA-JamalNeural",
  "ar-DZ-AminaNeural",
  "ar-DZ-IsmaelNeural",
  "ar-TN-ReemNeural",
  "ar-TN-HediNeural",
  "ar-LY-ImanNeural",
  "ar-LY-OmarNeural",
] as const;

function escapeXml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** تحسين الإيقاع ليبدو أقرب للكلام الطبيعي */
function naturalizeText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n+/g, "، ")
    .replace(/([.!?؟۔…])/g, "$1 ")
    .replace(/،\s*/g, "، ")
    .replace(/؛\s*/g, "؛ ")
    .replace(/:\s*/g, ": ")
    .replace(/\s+/g, " ")
    .trim();
}

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

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function synthesizeEdge(
  text: string,
  voice: string,
  rate?: string,
  pitch?: string,
): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  // جودة أعلى = أوضح وأقرب للواقع
  await tts.setMetadata(
    voice,
    OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3,
  );

  const rateValue =
    rate === "slow" ? "0.92" : rate === "fast" ? "1.08" : "1.0";
  const pitchValue =
    pitch && pitch !== "default" ? pitch : "+0Hz";

  const { audioStream } = tts.toStream(escapeXml(naturalizeText(text)), {
    rate: rateValue,
    pitch: pitchValue,
  });
  return streamToBuffer(audioStream);
}

async function synthesizeGoogle(text: string, lang: string): Promise<Buffer> {
  const chunks = chunkText(naturalizeText(text));
  const buffers: Buffer[] = [];
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
      throw new Error(`google-tts-${res.status}`);
    }
    buffers.push(Buffer.from(await res.arrayBuffer()));
  }
  return Buffer.concat(buffers);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      text?: string;
      voice?: string;
      lang?: string;
      rate?: string;
      pitch?: string;
    };
    const text = (body.text || "").trim();
    if (!text) {
      return NextResponse.json({ error: "النص فارغ" }, { status: 400 });
    }
    if (text.length > 2500) {
      return NextResponse.json(
        { error: "النص طويل جداً (الحد 2500 حرف)" },
        { status: 400 },
      );
    }

    const requested = (body.voice || "ar-SA-ZariyahNeural").trim();
    const voice = (ARABIC_NEURAL_VOICES as readonly string[]).includes(requested)
      ? requested
      : "ar-SA-ZariyahNeural";

    let audio: Buffer;
    try {
      audio = await synthesizeEdge(text, voice, body.rate, body.pitch);
    } catch (edgeErr) {
      console.error("edge-tts failed, fallback google", edgeErr);
      const lang = (body.lang || "ar").split("-")[0] || "ar";
      audio = await synthesizeGoogle(text, lang);
    }

    if (!audio.length || audio.length < 100) {
      return NextResponse.json({ error: "ملف الصوت فارغ" }, { status: 502 });
    }

    return new NextResponse(new Uint8Array(audio), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": 'attachment; filename="tool2day-tts.mp3"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "فشل التحويل إلى كلام" },
      { status: 500 },
    );
  }
}
