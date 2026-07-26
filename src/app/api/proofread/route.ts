import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type Lang = "ar" | "en";

/**
 * تصحيح إملائي لمقاطع الترجمة عبر Groq/OpenAI إن وُجد مفتاح.
 * بدون مفتاح يُرجع 501 ليعتمد العميل على التصحيح المحلي.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      lang?: string;
      cues?: Array<{ id?: string; text?: string }>;
    };
    const lang: Lang = body.lang === "en" ? "en" : "ar";
    const cues = Array.isArray(body.cues) ? body.cues : [];
    if (!cues.length) {
      return NextResponse.json({ error: "لا توجد مقاطع" }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!groqKey && !openaiKey) {
      return NextResponse.json(
        { error: "no_server_key", message: "لا يتوفر مفتاح تصحيح" },
        { status: 501 },
      );
    }

    const lines = cues
      .map((c, i) => `${i + 1}|${String(c.id || i)}|${String(c.text || "").trim()}`)
      .filter((l) => l.split("|").pop());

    const system =
      lang === "ar"
        ? "أنت مدقق لغوي عربي. صحّح الإملاء وأسماء الدول والمدن فقط دون تغيير المعنى أو اللهجة قدر الإمكان. أمثلة تصحيح: أكراكيا/أكرانيا→أوكرانيا، النمسة→النمسا، اوروبا→أوروبا، الماني→الألماني، عب→عم، نتنطل→ننتقل. أعد كل سطر بنفس الرقم والمعرّف: N|id|النص. لا تضف شرحاً."
        : "You are a careful proofreader. Fix spelling and proper nouns only; keep meaning. Reply each line as N|id|text. No commentary.";

    const user = lines.join("\n");
    const corrected = groqKey
      ? await chatComplete({
          endpoint: "https://api.groq.com/openai/v1/chat/completions",
          apiKey: groqKey,
          model: "llama-3.3-70b-versatile",
          system,
          user,
        })
      : await chatComplete({
          endpoint: "https://api.openai.com/v1/chat/completions",
          apiKey: openaiKey!,
          model: "gpt-4o-mini",
          system,
          user,
        });

    const out = parseProofread(corrected, cues);
    return NextResponse.json({
      cues: out,
      provider: groqKey ? "groq" : "openai",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "فشل التصحيح";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function chatComplete(opts: {
  endpoint: string;
  apiKey: string;
  model: string;
  system: string;
  user: string;
}) {
  const res = await fetch(opts.endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model,
      temperature: 0.1,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(data.error?.message || `فشل التصحيح (${res.status})`);
  }
  return (data.choices?.[0]?.message?.content || "").trim();
}

function parseProofread(
  content: string,
  original: Array<{ id?: string; text?: string }>,
) {
  const map = new Map<string, string>();
  for (const line of content.split(/\n+/)) {
    const m = line.trim().match(/^\d+\|([^|]+)\|(.+)$/);
    if (!m) continue;
    map.set(m[1]!.trim(), m[2]!.trim());
  }
  return original.map((c, i) => {
    const id = String(c.id || i);
    return { id, text: map.get(id) || String(c.text || "") };
  });
}
