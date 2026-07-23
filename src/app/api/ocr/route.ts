import { NextRequest, NextResponse } from "next/server";
import { postCorrectOcrText } from "@/lib/processors/ocr";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 8 * 1024 * 1024;

/** تحويل رموز لغات الواجهة إلى رموز OCR.space (3 أحرف) */
function toOcrSpaceLang(code: string): string {
  const primary = code.split("+")[0]?.toLowerCase() || "auto";
  if (primary === "auto" || code === "auto") return "auto";
  const map: Record<string, string> = {
    eng: "eng",
    deu: "ger",
    ger: "ger",
    ara: "ara",
    por: "por",
    spa: "spa",
    fra: "fre",
    fre: "fre",
    ita: "ita",
    tur: "tur",
    nld: "dut",
    dut: "dut",
    pol: "pol",
    rus: "rus",
    ukr: "ukr",
    ces: "cze",
    cze: "cze",
    ron: "eng",
    hun: "hun",
    swe: "swe",
    nor: "eng",
    dan: "dan",
    fin: "fin",
    ell: "gre",
    gre: "gre",
    heb: "eng",
    fas: "eng",
    urd: "eng",
    hin: "eng",
    chi_sim: "chs",
    chi_tra: "cht",
    jpn: "jpn",
    kor: "kor",
    tha: "tha",
    vie: "vnm",
  };
  return map[primary] || "auto";
}

/**
 * OCR سحابي للمستندات (دقة أعلى من Tesseract المحلي على الصور الضعيفة).
 * الترتيب: Groq Vision → OpenAI Vision → OCR.space
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const langs = String(form.get("langs") || "auto").trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "ملف الصورة مطلوب" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "الملف كبير جداً — صغّر الصورة أو ارفع JPEG" },
        { status: 413 },
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const mime = file.type || "image/jpeg";
    const dataUrl = `data:${mime};base64,${buf.toString("base64")}`;

    const vision = await tryVisionOcr(dataUrl, langs);
    if (vision) {
      return NextResponse.json({
        text: postCorrectOcrText(vision.text, langs),
        provider: vision.provider,
        langLabel: vision.langLabel,
      });
    }

    const space = await tryOcrSpace(buf, file.name || "doc.jpg", langs);
    if (space) {
      return NextResponse.json({
        text: postCorrectOcrText(space.text, langs),
        provider: "ocr.space",
        langLabel: space.langLabel,
      });
    }

    return NextResponse.json(
      {
        error: "no_server_ocr",
        message: "تعذر OCR السحابي — سيتم التحويل داخل المتصفح",
      },
      { status: 501 },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "فشل الاستخراج";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function tryVisionOcr(
  dataUrl: string,
  langs: string,
): Promise<{ text: string; provider: string; langLabel: string } | null> {
  const prompt =
    "Extract ALL readable text from this document image exactly as printed. " +
    "Preserve original language, line breaks, names, dates, numbers, addresses, and umlauts (äöüß). " +
    "Do not translate. Do not invent missing text. Output plain text only.";

  const groq = process.env.GROQ_API_KEY;
  if (groq) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groq}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          temperature: 0,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: dataUrl } },
              ],
            },
          ],
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text && text.length > 20) {
          return {
            text,
            provider: "groq-vision",
            langLabel: langs === "auto" ? "Vision (تلقائي)" : langs,
          };
        }
      }
    } catch {
      /* fall through */
    }
  }

  const openai = process.env.OPENAI_API_KEY;
  if (openai) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openai}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: dataUrl } },
              ],
            },
          ],
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text && text.length > 20) {
          return {
            text,
            provider: "openai-vision",
            langLabel: langs === "auto" ? "Vision (تلقائي)" : langs,
          };
        }
      }
    } catch {
      /* fall through */
    }
  }

  return null;
}

async function tryOcrSpace(
  buf: Buffer,
  filename: string,
  langs: string,
): Promise<{ text: string; langLabel: string } | null> {
  const apiKey = process.env.OCR_SPACE_API_KEY || "helloworld";
  const language = toOcrSpaceLang(langs);

  // Engine 3 أفضل للمستندات؛ إن فشل نجرّب 2
  for (const engine of ["3", "2"] as const) {
    const body = new FormData();
    body.append("apikey", apiKey);
    body.append("language", language);
    body.append("OCREngine", engine);
    body.append("scale", "true");
    body.append("detectOrientation", "true");
    body.append("isTable", "true");
    body.append(
      "file",
      new Blob([new Uint8Array(buf)], { type: "image/jpeg" }),
      filename.endsWith(".png") ? filename.replace(/\.png$/i, ".jpg") : filename,
    );

    const res = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(55_000),
    });
    if (!res.ok) continue;

    const data = (await res.json()) as {
      IsErroredOnProcessing?: boolean;
      ErrorMessage?: string | string[];
      ParsedResults?: { ParsedText?: string }[];
    };
    if (data.IsErroredOnProcessing) continue;
    const text = (data.ParsedResults?.[0]?.ParsedText || "").trim();
    if (text.length > 30) {
      return {
        text,
        langLabel:
          language === "ger"
            ? "Deutsch (سحابي)"
            : language === "auto"
              ? "تلقائي (سحابي)"
              : `${language} (سحابي)`,
      };
    }
  }
  return null;
}
