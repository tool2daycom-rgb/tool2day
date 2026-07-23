import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RatesPayload = {
  date: string;
  base: string;
  rates: Record<string, number>;
  source: string;
  fetchedAt: string;
};

const memoryCache = new Map<string, { at: number; data: RatesPayload }>();
const TTL_MS = 60_000;

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function loadRates(base: string, date: string): Promise<RatesPayload> {
  const b = base.toLowerCase();
  const primary = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/${b}.min.json`;
  const fallback = `https://${date}.currency-api.pages.dev/v1/currencies/${b}.min.json`;

  let raw: Record<string, unknown> | null = null;
  let source = primary;
  try {
    raw = (await fetchJson(primary)) as Record<string, unknown>;
  } catch {
    source = fallback;
    raw = (await fetchJson(fallback)) as Record<string, unknown>;
  }

  const bucket = (raw[b] || raw[base.toUpperCase()] || {}) as Record<
    string,
    number
  >;
  const rates: Record<string, number> = { [base.toUpperCase()]: 1 };
  for (const [k, v] of Object.entries(bucket)) {
    if (typeof v === "number" && Number.isFinite(v) && v > 0) {
      rates[k.toUpperCase()] = v;
    }
  }

  const dateField =
    typeof raw.date === "string" ? raw.date : date === "latest" ? "" : date;

  return {
    date: dateField || new Date().toISOString().slice(0, 10),
    base: base.toUpperCase(),
    rates,
    source,
    fetchedAt: new Date().toISOString(),
  };
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const base = (searchParams.get("base") || "usd").toLowerCase();
    const date = (searchParams.get("date") || "latest").toLowerCase();
    const history = searchParams.get("history"); // e.g. 30 = last 30 days sampled

    if (history) {
      const days = Math.min(365, Math.max(5, Number(history) || 30));
      const step = days <= 7 ? 1 : days <= 31 ? 3 : days <= 90 ? 7 : 14;
      const dates: string[] = [];
      for (let i = days; i >= step; i -= step) dates.push(daysAgo(i));
      const quote = (searchParams.get("quote") || "sar").toUpperCase();

      const settled = await Promise.all(
        dates.map(async (d) => {
          try {
            const payload = await loadRates(base, d);
            const rate = payload.rates[quote];
            if (typeof rate === "number") return { date: d, rate };
          } catch {
            return null;
          }
          return null;
        }),
      );

      const points = settled.filter(
        (p): p is { date: string; rate: number } => p != null,
      );

      try {
        const latest = await loadRates(base, "latest");
        const rate = latest.rates[quote];
        if (typeof rate === "number") {
          const last = points[points.length - 1];
          if (!last || last.date !== latest.date) {
            points.push({ date: latest.date || daysAgo(0), rate });
          } else {
            last.rate = rate;
          }
        }
        return NextResponse.json({
          base: base.toUpperCase(),
          quote,
          points,
          latest,
        });
      } catch {
        return NextResponse.json({
          base: base.toUpperCase(),
          quote,
          points,
        });
      }
    }

    const cacheKey = `${base}:${date}`;
    const hit = memoryCache.get(cacheKey);
    if (hit && Date.now() - hit.at < TTL_MS) {
      return NextResponse.json(hit.data, {
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
      });
    }

    const data = await loadRates(base, date);
    memoryCache.set(cacheKey, { at: Date.now(), data });
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "فشل جلب أسعار الصرف",
      },
      { status: 502 },
    );
  }
}
