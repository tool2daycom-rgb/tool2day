import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

async function fetchGoogleSuggest(q: string): Promise<string[]> {
  const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=ar&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; Tool2Day/1.0; +https://www.tool2day.com)",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = (await res.json()) as unknown;
  // شكل Firefox: ["query", ["s1","s2",...]]
  if (Array.isArray(data) && Array.isArray(data[1])) {
    return (data[1] as unknown[])
      .filter((x): x is string => typeof x === "string")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { q?: string; queries?: string[] };
    let queries = (body.queries || []).map((q) => String(q).trim()).filter(Boolean);
    if (body.q?.trim()) queries = [body.q.trim(), ...queries];

    queries = [...new Set(queries)].slice(0, 36).map((q) => q.slice(0, 80));
    if (queries.length === 0) {
      return NextResponse.json({ error: "أدخل كلمة للبحث" }, { status: 400 });
    }

    const results: Record<string, string[]> = {};
    // دفعات صغيرة حتى لا نُحظر
    const chunk = 6;
    for (let i = 0; i < queries.length; i += chunk) {
      const part = queries.slice(i, i + chunk);
      await Promise.all(
        part.map(async (q) => {
          try {
            results[q] = await fetchGoogleSuggest(q);
          } catch {
            results[q] = [];
          }
        }),
      );
    }

    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "فشل جلب الاقتراحات" },
      { status: 500 },
    );
  }
}
