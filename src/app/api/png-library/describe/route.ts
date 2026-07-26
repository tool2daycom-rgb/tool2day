import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 4 * 1024 * 1024;

/**
 * يقرأ الصورة ويولّد عنواناً عربياً قصيراً + كلمات مفتاحية.
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "الصورة مطلوبة" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "الصورة كبيرة جداً للتحليل (حد 4MB)" },
        { status: 413 },
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const mime = file.type || "image/png";
    if (!mime.startsWith("image/")) {
      return NextResponse.json({ error: "ملف غير صالح" }, { status: 400 });
    }
    const dataUrl = `data:${mime};base64,${buf.toString("base64")}`;

    const described = await describeWithVision(dataUrl);
    if (!described) {
      return NextResponse.json(
        {
          error: "no_vision",
          message: "لا يتوفر محرك رؤية — أدخل العنوان يدوياً",
        },
        { status: 501 },
      );
    }

    return NextResponse.json({
      title: described.title,
      keywords: described.keywords,
      provider: described.provider,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "فشل تحليل الصورة";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function describeWithVision(dataUrl: string): Promise<{
  title: string;
  keywords: string[];
  provider: string;
} | null> {
  const prompt =
    "Look at this transparent PNG / clipart / logo / icon. " +
    "Reply with ONLY valid JSON, no markdown: " +
    '{"title_ar":"...","title_en":"...","keywords":["k1","k2","k3","k4"]} ' +
    "title_ar: short Arabic title (max 60 chars) describing the subject. " +
    "title_en: short English title. " +
    "keywords: 4 short English search tags (single words or short phrases). " +
    "Be specific (e.g. golden dollar sign, warning road sign). Do not invent brand claims.";

  const groq = process.env.GROQ_API_KEY;
  if (groq) {
    const out = await callVision({
      endpoint: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: groq,
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      prompt,
      dataUrl,
    });
    if (out) return { ...out, provider: "groq-vision" };
  }

  const openai = process.env.OPENAI_API_KEY;
  if (openai) {
    const out = await callVision({
      endpoint: "https://api.openai.com/v1/chat/completions",
      apiKey: openai,
      model: "gpt-4o-mini",
      prompt,
      dataUrl,
    });
    if (out) return { ...out, provider: "openai-vision" };
  }

  return null;
}

async function callVision(opts: {
  endpoint: string;
  apiKey: string;
  model: string;
  prompt: string;
  dataUrl: string;
}): Promise<{ title: string; keywords: string[] } | null> {
  try {
    const res = await fetch(opts.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: opts.model,
        temperature: 0.2,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: opts.prompt },
              { type: "image_url", image_url: { url: opts.dataUrl } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = data.choices?.[0]?.message?.content?.trim() || "";
    return parseDescribeJson(raw);
  } catch {
    return null;
  }
}

function parseDescribeJson(raw: string): {
  title: string;
  keywords: string[];
} | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as {
      title_ar?: string;
      title_en?: string;
      title?: string;
      keywords?: unknown;
    };
    const title = String(
      parsed.title_ar || parsed.title || parsed.title_en || "",
    )
      .trim()
      .slice(0, 80);
    const keywords = Array.isArray(parsed.keywords)
      ? parsed.keywords
          .map((k) => String(k || "").trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 8)
      : [];
    if (!title && !keywords.length) return null;
    return {
      title: title || keywords.slice(0, 3).join(" "),
      keywords: keywords.length ? keywords : title.split(/\s+/).slice(0, 4),
    };
  } catch {
    return null;
  }
}
