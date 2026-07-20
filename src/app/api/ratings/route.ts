import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type Body = {
  target?: string;
  stars?: number;
  visitorKey?: string;
};

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function ensureTable(
  supabase: NonNullable<ReturnType<typeof adminClient>>,
) {
  // Table must exist via schema; we only query.
  void supabase;
}

async function getStats(
  supabase: NonNullable<ReturnType<typeof adminClient>>,
  target: string,
) {
  const { data, error } = await supabase
    .from("tool_ratings")
    .select("stars")
    .eq("target", target);

  if (error) throw error;
  const rows = data ?? [];
  const count = rows.length;
  if (!count) return { average: 0, count: 0 };
  const sum = rows.reduce((a, r) => a + Number(r.stars), 0);
  return { average: sum / count, count };
}

export async function GET(req: Request) {
  const target = new URL(req.url).searchParams.get("target")?.trim();
  if (!target) {
    return NextResponse.json({ error: "target required" }, { status: 400 });
  }

  const supabase = adminClient();
  if (!supabase) {
    return NextResponse.json({ average: 0, count: 0 });
  }

  try {
    await ensureTable(supabase);
    const stats = await getStats(supabase, target);
    return NextResponse.json(stats);
  } catch {
    return NextResponse.json({ average: 0, count: 0 });
  }
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const target = body.target?.trim();
  const stars = Number(body.stars);
  const visitorKey = body.visitorKey?.trim();

  if (!target || !visitorKey || !Number.isFinite(stars) || stars < 1 || stars > 5) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const supabase = adminClient();
  if (!supabase) {
    return NextResponse.json({
      average: stars,
      count: 1,
      localOnly: true,
    });
  }

  try {
    const { error } = await supabase.from("tool_ratings").upsert(
      {
        target,
        stars: Math.round(stars),
        visitor_key: visitorKey,
      },
      { onConflict: "target,visitor_key" },
    );

    if (error) throw error;
    const stats = await getStats(supabase, target);
    return NextResponse.json(stats);
  } catch {
    return NextResponse.json({
      average: stars,
      count: 1,
      localOnly: true,
    });
  }
}
