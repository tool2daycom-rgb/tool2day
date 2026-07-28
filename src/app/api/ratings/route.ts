import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import {
  resolveUserAvatarUrl,
  sanitizeAvatarUrl,
} from "@/lib/user-avatar";

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
  countryCode?: string;
  countryFlag?: string;
};

export type PublicReview = {
  id: string;
  displayName: string;
  stars: number;
  comment: string;
  target: string;
  createdAt: string;
  avatarUrl: string | null;
  countryCode: string | null;
  countryFlag: string | null;
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

function sanitizeCountryCode(raw: string | undefined | null): string {
  const s = (raw || "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(s) ? s : "";
}

function sanitizeCountryFlag(raw: string | undefined | null): string {
  const s = (raw || "").trim();
  if (!s || s.length > 8) return "";
  return s;
}

/** Reviews removed from public listing (and purged when service role is available). */
const HIDDEN_REVIEW_IDS = new Set([
  "9131eae4-1649-4f48-94ac-e8e264c8b3db", // Ahmad king
]);

let hiddenReviewsPurged = false;

async function purgeHiddenReviews(
  supabase: NonNullable<ReturnType<typeof adminClient>>,
) {
  if (hiddenReviewsPurged || HIDDEN_REVIEW_IDS.size === 0) return;
  hiddenReviewsPurged = true;
  try {
    await supabase
      .from("tool_ratings")
      .delete()
      .in("id", [...HIDDEN_REVIEW_IDS]);
  } catch {
    // ignore — listing filter still hides them
  }
}

function avatarFromAuthUser(user: User): string {
  return resolveUserAvatarUrl(user);
}

function countryFromAuthUser(user: User): { code: string; flag: string } {
  const meta = user.user_metadata || {};
  const code = sanitizeCountryCode(
    typeof meta.country_code === "string" ? meta.country_code : "",
  );
  const flag = sanitizeCountryFlag(
    typeof meta.country_flag === "string" ? meta.country_flag : "",
  );
  return { code, flag };
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
  await purgeHiddenReviews(supabase);
  const capped = Math.min(100, Math.max(1, limit));
  let data: Record<string, unknown>[] | null = null;

  const withCountry = await supabase
    .from("tool_ratings")
    .select(
      "id, display_name, stars, comment, target, created_at, avatar_url, country_code, country_flag",
    )
    .not("comment", "is", null)
    .order("created_at", { ascending: false })
    .limit(capped);

  if (withCountry.error) {
    const without = await supabase
      .from("tool_ratings")
      .select("id, display_name, stars, comment, target, created_at, avatar_url")
      .not("comment", "is", null)
      .order("created_at", { ascending: false })
      .limit(capped);
    if (without.error) throw without.error;
    data = (without.data ?? []) as Record<string, unknown>[];
  } else {
    data = (withCountry.data ?? []) as Record<string, unknown>[];
  }

  return data
    .map((row) => {
      const id = String(row.id);
      if (HIDDEN_REVIEW_IDS.has(id)) return null;
      const comment = sanitizeComment(
        typeof row.comment === "string" ? row.comment : "",
      );
      const displayName =
        sanitizeDisplayName(
          typeof row.display_name === "string" ? row.display_name : "",
        ) || "مستخدم";
      if (displayName.toLowerCase() === "ahmad king") return null;
      if (!comment || comment.length < 3) return null;
      const avatarUrl =
        sanitizeAvatarUrl(
          typeof row.avatar_url === "string" ? row.avatar_url : "",
        ) || null;
      const countryCode =
        sanitizeCountryCode(
          typeof row.country_code === "string" ? row.country_code : "",
        ) || null;
      const countryFlag =
        sanitizeCountryFlag(
          typeof row.country_flag === "string" ? row.country_flag : "",
        ) || null;
      return {
        id,
        displayName,
        stars: Math.min(5, Math.max(1, Number(row.stars) || 5)),
        comment,
        target: String(row.target || "site"),
        createdAt: String(row.created_at || ""),
        avatarUrl,
        countryCode,
        countryFlag,
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
  let avatarUrl = sanitizeAvatarUrl(body.avatarUrl) || "";
  let countryCode = sanitizeCountryCode(body.countryCode);
  let countryFlag = sanitizeCountryFlag(body.countryFlag);
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
      avatarUrl = fromAuth || avatarUrl;
      const countryAuth = countryFromAuthUser(data.user);
      if (countryAuth.code) countryCode = countryAuth.code;
      if (countryAuth.flag) countryFlag = countryAuth.flag;
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
  if (countryCode) row.country_code = countryCode;
  if (countryFlag) row.country_flag = countryFlag;

  try {
    if (once) {
      const { error } = await supabase
        .from("tool_ratings")
        .upsert(row, { onConflict: "target,visitor_key" });
      if (error) {
        // أعمدة الدولة قد تكون غير موجودة بعد — أعد المحاولة بدونها
        if (row.country_code || row.country_flag) {
          delete row.country_code;
          delete row.country_flag;
          const retry = await supabase
            .from("tool_ratings")
            .upsert(row, { onConflict: "target,visitor_key" });
          if (retry.error) throw retry.error;
        } else throw error;
      }
    } else {
      const { error } = await supabase.from("tool_ratings").insert(row);
      if (error) {
        if (row.country_code || row.country_flag) {
          delete row.country_code;
          delete row.country_flag;
          const retry = await supabase.from("tool_ratings").insert(row);
          if (retry.error) {
            const { error: upErr } = await supabase
              .from("tool_ratings")
              .upsert(row, { onConflict: "target,visitor_key" });
            if (upErr) throw upErr;
          }
        } else {
          const { error: upErr } = await supabase
            .from("tool_ratings")
            .upsert(row, { onConflict: "target,visitor_key" });
          if (upErr) throw upErr;
        }
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
