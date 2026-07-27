import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

export const runtime = "nodejs";

type Body = {
  target?: string;
  stars?: number;
  visitorKey?: string;
  /** تقييم الموقع مرة واحدة لكل زائر (upsert) */
  once?: boolean;
  displayName?: string;
  comment?: string;
  avatarUrl?: string;
};

export type PublicReview = {
  id: string;
  displayName: string;
  stars: number;
  comment: string;
  target: string;
  createdAt: string;
  avatarUrl: string | null;
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

/** يمنع عرض الإيميل — يستخرج اسم مستخدم فقط */
function sanitizeDisplayName(raw: string | undefined | null): string {
  const s = (raw || "").trim().replace(/\s+/g, " ");
  if (!s) return "";
  if (s.includes("@")) {
    const local = s.split("@")[0]?.trim() || "";
    return local.slice(0, 40);
  }
  return s.slice(0, 60);
}

function sanitizeComment(raw: string | undefined | null): string {
  return (raw || "").trim().replace(/\s+/g, " ").slice(0, 400);
}

function sanitizeAvatarUrl(raw: string | undefined | null): string {
  const s = (raw || "").trim();
  if (!s || s.length > 500) return "";
  if (!/^https:\/\//i.test(s)) return "";
  return s;
}

function avatarFromAuthUser(user: User): string {
  const meta = user.user_metadata || {};
  const identity = user.identities?.[0]?.identity_data || {};
  const candidates = [
    meta.avatar_url,
    meta.picture,
    meta.avatar,
    meta.profile_image_url,
    identity.avatar_url,
    identity.picture,
  ];
  for (const c of candidates) {
    const ok = sanitizeAvatarUrl(typeof c === "string" ? c : "");
    if (ok) return ok;
  }
  return "";
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

async function listReviews(
  supabase: NonNullable<ReturnType<typeof adminClient>>,
  limit = 60,
): Promise<PublicReview[]> {
  const { data, error } = await supabase
    .from("tool_ratings")
    .select("id, display_name, stars, comment, target, created_at, avatar_url")
    .not("comment", "is", null)
    .order("created_at", { ascending: false })
    .limit(Math.min(100, Math.max(1, limit)));

  if (error) throw error;

  return (data ?? [])
    .map((row) => {
      const comment = sanitizeComment(row.comment);
      const displayName = sanitizeDisplayName(row.display_name) || "مستخدم";
      if (!comment || comment.length < 3) return null;
      const avatarUrl = sanitizeAvatarUrl(row.avatar_url) || null;
      return {
        id: String(row.id),
        displayName,
        stars: Math.min(5, Math.max(1, Number(row.stars) || 5)),
        comment,
        target: String(row.target || "site"),
        createdAt: String(row.created_at || ""),
        avatarUrl,
      } as PublicReview;
    })
    .filter((r): r is PublicReview => r !== null);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const target = url.searchParams.get("target")?.trim() || "site";
  const reviews = url.searchParams.get("reviews") === "1";
  const limit = Number(url.searchParams.get("limit") || 60);

  const supabase = adminClient();
  if (!supabase) {
    return NextResponse.json(
      reviews ? { reviews: [], average: 0, count: 0 } : { average: 0, count: 0 },
    );
  }

  try {
    if (reviews) {
      const [list, stats] = await Promise.all([
        listReviews(supabase, limit),
        getStats(supabase, "site"),
      ]);
      return NextResponse.json({ reviews: list, ...stats });
    }
    const stats = await getStats(supabase, target);
    return NextResponse.json(stats);
  } catch (err) {
    console.error("ratings GET failed", err);
    return NextResponse.json(
      reviews ? { reviews: [], average: 0, count: 0 } : { average: 0, count: 0 },
    );
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
  let displayName = sanitizeDisplayName(body.displayName);
  const comment = sanitizeComment(body.comment);
  let avatarUrl =
    sanitizeAvatarUrl(body.avatarUrl) ||
    "";
  const wantsReview = Boolean(displayName || comment);

  if (
    !target ||
    !visitorKey ||
    !Number.isFinite(stars) ||
    stars < 1 ||
    stars > 5
  ) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  if (wantsReview) {
    try {
      const { createClient: createServerSupabase } = await import(
        "@/lib/supabase/server"
      );
      const authClient = await createServerSupabase();
      const { data } = await authClient.auth.getUser();
      if (!data.user) {
        return NextResponse.json(
          { error: "login_required", message: "Login required to comment" },
          { status: 401 },
        );
      }
      const fromAuth = avatarFromAuthUser(data.user);
      if (fromAuth) avatarUrl = fromAuth;
      if (!displayName) {
        const meta = data.user.user_metadata || {};
        displayName = sanitizeDisplayName(
          meta.full_name ||
            meta.name ||
            meta.preferred_username ||
            data.user.email?.split("@")[0] ||
            "",
        );
      }
    } catch {
      return NextResponse.json(
        { error: "login_required", message: "Login required to comment" },
        { status: 401 },
      );
    }
  }

  const supabase = adminClient();
  if (!supabase) {
    return NextResponse.json({
      average: stars,
      count: 1,
      localOnly: true,
    });
  }

  const row: Record<string, unknown> = {
    target,
    stars: Math.round(stars),
    visitor_key: visitorKey,
  };
  if (displayName) row.display_name = displayName;
  if (comment) row.comment = comment;
  if (avatarUrl) row.avatar_url = avatarUrl;

  try {
    if (once) {
      const { error } = await supabase
        .from("tool_ratings")
        .upsert(row, { onConflict: "target,visitor_key" });
      if (error) throw error;
    } else {
      const { error } = await supabase.from("tool_ratings").insert(row);
      if (error) {
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
