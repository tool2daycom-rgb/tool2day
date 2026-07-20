import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type Body = {
  target?: string;
  stars?: number;
  visitorKey?: string;
  /** تقييم الموقع مرة واحدة لكل زائر (upsert) */
  once?: boolean;
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

async function getStats(
  supabase: NonNullable<ReturnType<typeof adminClient>>,
  target: string,
) {
  let query = supabase.from("tool_ratings").select("stars");

  if (target !== "site") {
    query = query.eq("target", target);
  }

  const { data, error } = await query;
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
  const once = Boolean(body.once);

  if (
    !target ||
    !visitorKey ||
    !Number.isFinite(stars) ||
    stars < 1 ||
    stars > 5
  ) {
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

  const row = {
    target,
    stars: Math.round(stars),
    visitor_key: visitorKey,
  };

  try {
    if (once || target === "site") {
      const { error } = await supabase
        .from("tool_ratings")
        .upsert(row, { onConflict: "target,visitor_key" });
      if (error) throw error;
    } else {
      // كل استخدام = صف جديد (مفتاح زائر:useId فريد)
      const { error } = await supabase.from("tool_ratings").insert(row);
      if (error) {
        // إن تكرر نفس المفتاح نحدّث فقط
        const { error: upErr } = await supabase
          .from("tool_ratings")
          .upsert(row, { onConflict: "target,visitor_key" });
        if (upErr) throw upErr;
      }
    }

    const stats = await getStats(supabase, target);
    return NextResponse.json(stats);
  } catch (err) {
    console.error("ratings POST failed", err);
    return NextResponse.json({
      average: stars,
      count: 1,
      localOnly: true,
    });
  }
}
