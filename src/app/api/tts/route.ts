import { NextResponse } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export const runtime = "nodejs";
export const maxDuration = 60;

/** كل الأصوات العربية العصبية المتاحة */
export const ARABIC_NEURAL_VOICES = [
  "ar-SA-HamedNeural",
  "ar-EG-ShakirNeural",
  "ar-LB-RamiNeural",
  "ar-IQ-BasselNeural",
  "ar-AE-HamdanNeural",
  "ar-JO-TaimNeural",
  "ar-SY-LaithNeural",
  "ar-KW-FahedNeural",
  "ar-SA-ZariyahNeural",
  "ar-EG-SalmaNeural",
  "ar-LB-LaylaNeural",
  "ar-AE-FatimaNeural",
  "ar-JO-SanaNeural",
  "ar-SY-AmanyNeural",
  "ar-IQ-RanaNeural",
  "ar-KW-NouraNeural",
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

/** تنظيف النص وتقسيمه إلى وحدات قراءة مع فواصل هيبة */
function prepareSpeechUnits(text: string): string[] {
  const cleaned = text
    .replace(/\r\n/g, "\n")
    .replace(/\n+/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();

  const raw = cleaned
    .split(/(?<=[.!?؟۔…])\s+|\n+|(?<=[؛])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (raw.length <= 1) {
    const byComma = cleaned
      .split(/(?<=،)\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    return byComma.length > 1 ? byComma : [cleaned];
  }
  return raw;
}

/** نص داخل prosody مع فواصل زمنية بين الوحدات */
function buildProsodyInner(text: string, pauseMs: number): string {
  const units = prepareSpeechUnits(text);
  const breakTag = ` <break time="${pauseMs}ms"/> `;
  return units.map((u) => escapeXml(u)).join(breakTag);
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

function rateFor(mode?: string): string {
  if (!mode) return "0.92";
  const n = Number(mode);
  if (Number.isFinite(n) && n >= 0.5 && n <= 1.5) {
    return (Math.round(n * 100) / 100).toFixed(2);
  }
  switch (mode) {
    case "solemn":
      return "0.78";
    case "slow":
      return "0.86";
    case "fast":
      return "1.08";
    case "video":
      return "0.92";
    default:
      return "0.95";
  }
}

function pitchFor(mode?: string, rate?: string, style?: string): string {
  if (mode === "deep" || style === "solemn" || rate === "solemn") return "-3Hz";
  if (style === "video") return "-1Hz"; // أقرب لصوت معلّق بشري محفّز
  if (mode && mode !== "default") return mode;
  return "+0Hz";
}

function pauseMsFor(rate?: string, style?: string): number {
  const speed = Number(rateFor(rate));
  // أبطأ = فواصل أطول؛ أسلوب فيديو = فواصل طبيعية بين الجمل
  const base =
    style === "solemn" ? 580 : style === "video" ? 380 : style === "natural" ? 280 : 320;
  const scaled = Math.round(base * (1.05 / Math.max(0.55, speed)));
  return Math.min(800, Math.max(160, scaled));
}

async function synthesizeEdge(
  text: string,
  voice: string,
  rate?: string,
  pitch?: string,
  style?: string,
): Promise<Buffer> {
  const rateValue = rateFor(rate);
  const pitchValue = pitchFor(pitch, rate, style);
  const pauseMs = pauseMsFor(rate, style);
  const inner = buildProsodyInner(text, pauseMs);

  async function run(input: string): Promise<Buffer> {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(
      voice,
      OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3,
    );
    const { audioStream } = tts.toStream(input, {
      rate: rateValue,
      pitch: pitchValue,
    });
    return streamToBuffer(audioStream);
  }

  try {
    return await run(inner);
  } catch (breakErr) {
    console.warn("tts break failed, fallback punctuation pauses", breakErr);
    const units = prepareSpeechUnits(text);
    return run(escapeXml(units.join(" … — ")));
  }
}

async function synthesizeGoogle(text: string, lang: string): Promise<Buffer> {
  const units = prepareSpeechUnits(text);
  const buffers: Buffer[] = [];
  for (const unit of units) {
    for (const chunk of chunkText(unit)) {
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
      style?: string;
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

    const requested = (body.voice || "ar-SA-HamedNeural").trim();
    const voice = (ARABIC_NEURAL_VOICES as readonly string[]).includes(requested)
      ? requested
      : "ar-SA-HamedNeural";

    const style = body.style || "video";
    const rate = body.rate || "0.92";

    let audio: Buffer;
    try {
      audio = await synthesizeEdge(
        text,
        voice,
        rate,
        body.pitch || "default",
        style,
      );
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
