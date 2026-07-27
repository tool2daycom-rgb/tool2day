import { createServiceClient } from "@/lib/supabase/admin";

const BUCKET = "avatars";
const MAX_BYTES = 400_000;

function dataUrlToBytes(dataUrl: string): {
  bytes: Buffer;
  contentType: string;
  ext: string;
} | null {
  const m = dataUrl.match(/^data:(image\/(jpeg|jpg|png|webp));base64,(.+)$/i);
  if (!m) return null;
  const contentType = m[1]!.toLowerCase().replace("image/jpg", "image/jpeg");
  const ext =
    contentType === "image/png"
      ? "png"
      : contentType === "image/webp"
        ? "webp"
        : "jpg";
  const bytes = Buffer.from(m[3]!, "base64");
  if (!bytes.length || bytes.length > MAX_BYTES) return null;
  return { bytes, contentType, ext };
}

export async function ensureAvatarsBucket() {
  const supabase = createServiceClient();
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = (buckets || []).some((b) => b.name === BUCKET);
  if (exists) return supabase;
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  });
  if (error && !/already exists|duplicate/i.test(error.message)) {
    throw new Error(error.message);
  }
  return supabase;
}

/** Upload a data-URL or raw bytes; returns a short public HTTPS URL. */
export async function uploadUserAvatar(opts: {
  userId: string;
  dataUrl?: string;
  bytes?: Buffer;
  contentType?: string;
}): Promise<string> {
  const supabase = await ensureAvatarsBucket();
  let bytes = opts.bytes;
  let contentType = opts.contentType || "image/jpeg";
  let ext = "jpg";

  if (opts.dataUrl) {
    const parsed = dataUrlToBytes(opts.dataUrl);
    if (!parsed) throw new Error("invalid avatar");
    bytes = parsed.bytes;
    contentType = parsed.contentType;
    ext = parsed.ext;
  }
  if (!bytes?.length) throw new Error("empty avatar");

  const path = `${opts.userId}/avatar.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType,
    upsert: true,
    cacheControl: "3600",
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  // cache-bust so browsers pick up replacements
  return `${data.publicUrl}?v=${Date.now()}`;
}

function shortHttpsAvatar(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const s = raw.trim();
  if (!/^https:\/\//i.test(s) || s.length > 2000) return "";
  if (s.startsWith("data:")) return "";
  return s;
}

/**
 * If user_metadata holds a huge data-URL avatar, migrate to Storage and
 * shrink metadata so JWTs / cookies fit under Vercel header limits.
 */
export async function shrinkUserAvatarMetadata(userId: string): Promise<{
  fixed: boolean;
  publicUrl: string;
}> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error || !data.user) return { fixed: false, publicUrl: "" };

  const meta = { ...(data.user.user_metadata || {}) } as Record<
    string,
    unknown
  >;
  const metaSize = JSON.stringify(meta).length;
  const candidates = [meta.avatar_url, meta.picture, meta.avatar];
  let dataUrl = "";
  for (const c of candidates) {
    if (typeof c === "string" && c.startsWith("data:image/")) {
      dataUrl = c;
      break;
    }
  }

  let publicUrl = "";
  if (dataUrl) {
    try {
      publicUrl = await uploadUserAvatar({ userId, dataUrl });
    } catch {
      publicUrl = "";
    }
  }

  if (!publicUrl) {
    for (const id of data.user.identities || []) {
      const d = id.identity_data || {};
      publicUrl =
        shortHttpsAvatar(d.avatar_url) ||
        shortHttpsAvatar(d.picture) ||
        publicUrl;
      if (publicUrl) break;
    }
  }
  if (!publicUrl) {
    publicUrl =
      shortHttpsAvatar(meta.avatar_url) || shortHttpsAvatar(meta.picture);
  }

  const needsFix =
    Boolean(dataUrl) ||
    metaSize > 2500 ||
    Object.values(meta).some(
      (v) => typeof v === "string" && (v.startsWith("data:") || v.length > 2000),
    );

  if (!needsFix) {
    return { fixed: false, publicUrl };
  }

  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (typeof v === "string" && (v.startsWith("data:") || v.length > 2000)) {
      continue;
    }
    cleaned[k] = v;
  }
  cleaned.avatar_url = publicUrl || null;
  cleaned.picture = publicUrl || null;
  delete cleaned.avatar;

  const { error: upErr } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: cleaned,
  });
  if (upErr) return { fixed: false, publicUrl };

  return { fixed: true, publicUrl };
}

/** Scan users and shrink bloated metadata (best-effort). */
export async function shrinkAllDataUrlAvatars(maxPages = 8) {
  const supabase = createServiceClient();
  let fixed = 0;
  for (let page = 1; page <= maxPages; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 50,
    });
    if (error || !data.users.length) break;
    for (const u of data.users) {
      const meta = u.user_metadata || {};
      const metaSize = JSON.stringify(meta).length;
      const bloated =
        metaSize > 2500 ||
        Object.values(meta).some(
          (v) =>
            typeof v === "string" &&
            (v.startsWith("data:") || v.length > 2000),
        );
      if (!bloated) continue;
      const r = await shrinkUserAvatarMetadata(u.id);
      if (r.fixed) fixed += 1;
    }
    if (data.users.length < 50) break;
  }
  return fixed;
}
