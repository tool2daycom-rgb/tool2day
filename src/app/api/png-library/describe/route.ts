import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 4 * 1024 * 1024;

const VISION_MODELS = [
  "qwen/qwen3.6-27b",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "meta-llama/llama-4-maverick-17b-128e-instruct",
];

/**
 * يقرأ الصورة ويولّد عنواناً إنجليزياً + كلمات مفتاحية إنجليزية.
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image required" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image too large for analysis (max 4MB)" },
        { status: 413 },
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());
    let mime = file.type || "image/png";
    if (!mime.startsWith("image/")) {
      // بعض المتصفحات ترسل application/octet-stream
      if (file.name.toLowerCase().endsWith(".png")) mime = "image/png";
      else if (/\.jpe?g$/i.test(file.name)) mime = "image/jpeg";
      else if (file.name.toLowerCase().endsWith(".webp")) mime = "image/webp";
      else {
        return NextResponse.json({ error: "Invalid image file" }, { status: 400 });
      }
    }
    const dataUrl = `data:${mime};base64,${buf.toString("base64")}`;

    const groq = process.env.GROQ_API_KEY?.trim();
    const openai = process.env.OPENAI_API_KEY?.trim();
    if (!groq && !openai) {
      return NextResponse.json(
        {
          error: "no_vision",
          message: "No vision API key configured (GROQ_API_KEY)",
        },
        { status: 501 },
      );
    }

    const described = await describeWithVision(dataUrl, groq, openai);
    if (!described.ok) {
      return NextResponse.json(
        {
          error: "vision_failed",
          message:
            described.reason ||
            "Could not describe the image — try again or enter title manually",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      title: described.title,
      keywords: described.keywords,
      provider: described.provider,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Describe failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function describeWithVision(
  dataUrl: string,
  groq?: string,
  openai?: string,
): Promise<
  | { ok: true; title: string; keywords: string[]; provider: string }
  | { ok: false; reason: string }
> {
  const prompt =
    "You describe stock PNG clipart for an English marketplace. " +
    "Return ONE JSON object only, no markdown, no explanation, no thinking. " +
    'Exact shape: {"title":"...","keywords":["a","b","c","d"]} ' +
    "title: short English phrase, max 60 characters. " +
    "keywords: exactly 4 lowercase English words or short phrases. " +
    "Never use Arabic. Example: " +
    '{"title":"Golden dollar sign","keywords":["dollar","money","gold","3d"]}';

  const errors: string[] = [];

  if (groq) {
    for (const model of VISION_MODELS) {
      const out = await callVision({
        endpoint: "https://api.groq.com/openai/v1/chat/completions",
        apiKey: groq,
        model,
        prompt,
        dataUrl,
      });
      if (out.ok) return { ...out.value, provider: `groq:${model}`, ok: true };
      if (out.reason) errors.push(`${model}: ${out.reason}`);
    }
  }

  if (openai) {
    const out = await callVision({
      endpoint: "https://api.openai.com/v1/chat/completions",
      apiKey: openai,
      model: "gpt-4o-mini",
      prompt,
      dataUrl,
    });
    if (out.ok) return { ...out.value, provider: "openai-vision", ok: true };
    if (out.reason) errors.push(`openai: ${out.reason}`);
  }

  return {
    ok: false,
    reason: errors[0] || "Vision API failed",
  };
}

async function callVision(opts: {
  endpoint: string;
  apiKey: string;
  model: string;
  prompt: string;
  dataUrl: string;
}): Promise<
  | { ok: true; value: { title: string; keywords: string[] } }
  | { ok: false; reason: string }
> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 40000);
    const res = await fetch(opts.endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: opts.model,
        temperature: 0.1,
        max_completion_tokens: 400,
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
    clearTimeout(timer);
    const rawText = await res.text();
    if (!res.ok) {
      let reason = `HTTP ${res.status}`;
      try {
        const err = JSON.parse(rawText) as {
          error?: { message?: string; code?: string; failed_generation?: string };
        };
        reason = err.error?.message || err.error?.code || reason;
        // Surface a short snippet of failed JSON mode output for debugging
        if (err.error?.failed_generation) {
          const snippet = String(err.error.failed_generation).slice(0, 120);
          reason = `${reason} (${snippet})`;
        }
      } catch {
        /* keep */
      }
      return { ok: false, reason };
    }
    let data: { choices?: { message?: { content?: string } }[] };
    try {
      data = JSON.parse(rawText) as typeof data;
    } catch {
      return { ok: false, reason: "Invalid JSON from model" };
    }
    const raw = data.choices?.[0]?.message?.content?.trim() || "";
    const parsed = parseDescribeJson(raw);
    if (!parsed) return { ok: false, reason: "Could not parse model output" };
    return { ok: true, value: parsed };
  } catch (e) {
    return {
      ok: false,
      reason: e instanceof Error ? e.message : "Vision request failed",
    };
  }
}

function parseDescribeJson(raw: string): {
  title: string;
  keywords: string[];
} | null {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as {
      title_ar?: string;
      title_en?: string;
      title?: string;
      keywords?: unknown;
    };
    // English preferred
    const title = String(
      parsed.title_en || parsed.title || parsed.title_ar || "",
    )
      .trim()
      .slice(0, 80);
    const keywords = Array.isArray(parsed.keywords)
      ? parsed.keywords
          .map((k) => String(k || "").trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 4)
      : [];
    while (keywords.length < 4 && title) {
      const parts = title.toLowerCase().split(/\s+/).filter(Boolean);
      for (const p of parts) {
        if (keywords.length >= 4) break;
        if (!keywords.includes(p) && p.length > 2) keywords.push(p);
      }
      break;
    }
    if (!title && !keywords.length) return null;
    return {
      title: title || keywords.slice(0, 3).join(" "),
      keywords: keywords.slice(0, 4),
    };
  } catch {
    return null;
  }
}
