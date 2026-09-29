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

/** Metal / crypto codes — kept from currency-api (er-api has weak/no coverage). */
const NON_FIAT = new Set([
  "XAU",
  "XAG",
  "XPT",
  "XPD",
  "BTC",
  "ETH",
  "USDT",
  "BNB",
  "XRP",
  "SOL",
  "DOGE",
  "ADA",
]);

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "tool2day-fx/1.0",
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

/** Official daily mid-market fiat (same class as MSN / Yahoo) — 1 USD = x CODE. */
async function loadOfficialUsdFiat(): Promise<{
  rates: Record<string, number>;
  date: string;
  source: string;
} | null> {
  try {
    const raw = (await fetchJson("https://open.er-api.com/v6/latest/USD")) as {
      result?: string;
      rates?: Record<string, number>;
      time_last_update_utc?: string;
      time_last_update_unix?: number;
    };
    if (raw.result !== "success" || !raw.rates) return null;
    const rates: Record<string, number> = {};
    for (const [k, v] of Object.entries(raw.rates)) {
      if (typeof v === "number" && Number.isFinite(v) && v > 0) {
        rates[k.toUpperCase()] = v;
      }
    }
    let date = new Date().toISOString().slice(0, 10);
    if (typeof raw.time_last_update_unix === "number") {
      date = new Date(raw.time_last_update_unix * 1000).toISOString().slice(0, 10);
    } else if (typeof raw.time_last_update_utc === "string") {
      const parsed = new Date(raw.time_last_update_utc);
      if (!Number.isNaN(parsed.getTime())) {
        date = parsed.toISOString().slice(0, 10);
      }
    }
    return { rates, date, source: "open.er-api.com" };
  } catch {
    return null;
  }
}

/**
 * Broad basket (metals, crypto, extras) from fawazahmed0 currency-api.
 * Rates are "1 BASE = x QUOTE".
 */
async function loadCurrencyApi(
  base: string,
  date: string,
): Promise<{ rates: Record<string, number>; date: string; source: string }> {
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
    rates,
    date: dateField || new Date().toISOString().slice(0, 10),
    source,
  };
}

/**
 * Latest USD basket: official fiat (er-api) overwrites market CDN fiat so SYP/etc.
 * match MSN-style daily rates; metals/crypto stay from currency-api.
 */
async function loadRates(base: string, date: string): Promise<RatesPayload> {
  const api = await loadCurrencyApi(base, date);
  const rates = { ...api.rates };
  const sources = [api.source];
  let dateOut = api.date;

  if (base.toLowerCase() === "usd" && date === "latest") {
    const official = await loadOfficialUsdFiat();
    if (official) {
      let overwritten = 0;
      for (const [code, value] of Object.entries(official.rates)) {
        if (NON_FIAT.has(code)) continue;
        // Always prefer official daily fiat over parallel-market CDN values.
        if (rates[code] == null || rates[code] !== value) {
          if (rates[code] != null && rates[code] !== value) overwritten += 1;
          rates[code] = value;
        }
      }
      sources.unshift(official.source);
      dateOut = official.date || dateOut;
      if (overwritten > 0) {
        sources.push(`official-fiat×${overwritten}`);
      }
    }
  }

  rates[base.toUpperCase()] = 1;

  return {
    date: dateOut,
    base: base.toUpperCase(),
    rates,
    source: sources.join(" + "),
    fetchedAt: new Date().toISOString(),
  };
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Drop historical points that clash with today's official rate (e.g. SYP parallel vs official). */
function sanitizeHistory(
  points: { date: string; rate: number }[],
  latestRate: number | undefined,
): { date: string; rate: number }[] {
  if (latestRate == null || latestRate <= 0 || points.length === 0) return points;
  const consistent = points.filter((p) => {
    const ratio = p.rate / latestRate;
    return ratio > 0.5 && ratio < 2;
  });
  // If CDN used a different scale (parallel market), keep only the official latest point.
  if (consistent.length < Math.max(2, Math.floor(points.length * 0.4))) {
    return [];
  }
  return consistent;
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

      let points = settled.filter(
        (p): p is { date: string; rate: number } => p != null,
      );

      try {
        const latest = await loadRates(base, "latest");
        const rate = latest.rates[quote];
        if (typeof rate === "number") {
          points = sanitizeHistory(points, rate);
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
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      });
    }

    const data = await loadRates(base, date);
    memoryCache.set(cacheKey, { at: Date.now(), data });
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
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
