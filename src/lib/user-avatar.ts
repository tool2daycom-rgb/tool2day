/** Resolve profile photo: custom upload first, then Google / Facebook / GitHub. */

const MAX_HTTPS = 2000;
const MAX_DATA = 120_000;

export function sanitizeAvatarUrl(raw: string | undefined | null): string {
  const s = (raw || "").trim();
  if (!s) return "";
  if (/^https:\/\//i.test(s) && s.length <= MAX_HTTPS) return s;
  if (
    /^data:image\/(jpeg|jpg|png|webp);base64,/i.test(s) &&
    s.length <= MAX_DATA
  ) {
    return s;
  }
  return "";
}

type AvatarUser = {
  user_metadata?: Record<string, unknown> | null;
  identities?: Array<{
    provider?: string;
    identity_data?: Record<string, unknown> | null;
  }> | null;
};

/**
 * Prefer the user’s own avatar_url / picture (incl. uploaded data URLs),
 * then fall back to OAuth identity photos (Google, Facebook, GitHub, …).
 */
export function resolveUserAvatarUrl(user: AvatarUser | null | undefined): string {
  if (!user) return "";
  const meta = user.user_metadata || {};
  const candidates: unknown[] = [
    meta.avatar_url,
    meta.picture,
    meta.avatar,
    meta.profile_image_url,
  ];

  const identities = user.identities || [];
  const preferred = ["google", "facebook", "github", "azure", "apple"];
  const ordered = [
    ...preferred.flatMap((p) =>
      identities.filter((i) => (i.provider || "").toLowerCase() === p),
    ),
    ...identities.filter(
      (i) => !preferred.includes((i.provider || "").toLowerCase()),
    ),
  ];

  for (const id of ordered) {
    const d = id.identity_data || {};
    candidates.push(d.avatar_url, d.picture, d.avatar);
  }

  for (const c of candidates) {
    const ok = sanitizeAvatarUrl(typeof c === "string" ? c : "");
    if (ok) return ok;
  }
  return "";
}
