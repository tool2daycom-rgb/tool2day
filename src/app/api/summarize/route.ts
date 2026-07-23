import { NextResponse } from "next/server";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { extractiveSummarize, htmlToPlainText } from "@/lib/processors/ai-micro-tools";

export const runtime = "nodejs";
export const maxDuration = 60;

function isPrivateIp(ip: string): boolean {
  if (ip === "::1" || ip === "0.0.0.0") return true;
  if (ip.startsWith("127.") || ip.startsWith("10.")) return true;
  if (ip.startsWith("192.168.") || ip.startsWith("169.254.")) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true;
  if (ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80")) {
    return true;
  }
  return false;
}

async function assertSafeUrl(raw: string): Promise<URL> {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    throw new Error("رابط غير صالح");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("يُسمح فقط بروابط http/https");
  }
  const host = u.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local")
  ) {
    throw new Error("مضيف غير مسموح");
  }
  if (isIP(host) && isPrivateIp(host)) throw new Error("عنوان خاص محظور");
  if (!isIP(host)) {
    try {
      const records = await lookup(host, { all: true, family: 4 });
      if (records.some((r) => isPrivateIp(r.address))) {
        throw new Error("عنوان خاص محظور");
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes("محظور")) throw e;
    }
  }
  return u;
}

async function fetchPageText(url: string): Promise<string> {
  const target = await assertSafeUrl(url);
  const res = await fetch(target.toString(), {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; Tool2DayBot/1.0; +https://www.tool2day.com)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) throw new Error(`فشل جلب الصفحة (${res.status})`);
  const ctype = res.headers.get("content-type") || "";
  if (!ctype.includes("html") && !ctype.includes("text") && !ctype.includes("xml")) {
    throw new Error("الرابط ليس صفحة نصية");
  }
  const html = await res.text();
  return htmlToPlainText(html);
}

async function llmSummarize(text: string): Promise<{ summary: string; provider: string } | null> {
  const snippet = text.slice(0, 12_000);
  const prompt = `لخّص النص التالي بالعربية في 5–8 جمل واضحة ومفيدة، بدون مقدمات:\n\n${snippet}`;

  const groq = process.env.GROQ_API_KEY;
  if (groq) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groq}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: "You are a concise Arabic summarizer. Reply with the summary only.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const summary = data.choices?.[0]?.message?.content?.trim();
      if (summary) return { summary, provider: "groq" };
    }
  }

  const openai = process.env.OPENAI_API_KEY;
  if (openai) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openai}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: "You are a concise Arabic summarizer. Reply with the summary only.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const summary = data.choices?.[0]?.message?.content?.trim();
      if (summary) return { summary, provider: "openai" };
    }
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { url?: string; text?: string };
    let sourceText = (body.text || "").trim();
    let source: "text" | "url" = "text";

    if (body.url?.trim()) {
      source = "url";
      sourceText = await fetchPageText(body.url.trim());
      if (sourceText.length < 80) {
        return NextResponse.json(
          { error: "لم يُستخرج نص كافٍ من الرابط" },
          { status: 422 },
        );
      }
    }

    if (sourceText.length < 40) {
      return NextResponse.json(
        { error: "أدخل نصاً أطول أو رابط مقال" },
        { status: 400 },
      );
    }

    const llm = await llmSummarize(sourceText);
    if (llm) {
      return NextResponse.json({
        summary: llm.summary,
        provider: llm.provider,
        source,
        chars: sourceText.length,
      });
    }

    // احتياطي محلي على الخادم إن لم تتوفر مفاتيح
    return NextResponse.json({
      summary: extractiveSummarize(sourceText, 6),
      provider: "extractive",
      source,
      chars: sourceText.length,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "فشل التلخيص" },
      { status: 500 },
    );
  }
}
