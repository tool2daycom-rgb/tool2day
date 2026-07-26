import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import type { PngLibraryItem } from "@/lib/processors/png-library";

export const runtime = "nodejs";
export const maxDuration = 30;

type CommunityRow = {
  id: string;
  caption: string;
  keywords: string[] | null;
  public_url: string;
  width: number;
  height: number;
  file_size: number;
};

function proxyUrl(absolute: string) {
  if (!absolute) return "";
  // روابط التخزين المحلي تُعرض مباشرة
  if (
    absolute.includes("supabase.co") ||
    absolute.includes("supabase.in") ||
    absolute.startsWith("/")
  ) {
    return absolute;
  }
  return `/api/png-library/image?u=${encodeURIComponent(absolute)}`;
}

export async function GET(req: NextRequest) {
  try {
    const q = String(req.nextUrl.searchParams.get("q") || "").trim();
    const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") || 1));
    const minW = Math.max(0, Number(req.nextUrl.searchParams.get("minW") || 0));
    const minH = Math.max(0, Number(req.nextUrl.searchParams.get("minH") || 0));
    const perPage = 40;
    const query = q || "png";

    const [community, pixabayTransparent, pixabayAll, openverse] =
      await Promise.all([
        searchCommunity(query, minW, minH, perPage),
        searchPixabay(query, page, minW, minH, perPage, true),
        searchPixabay(query, page, minW, minH, perPage, false),
        searchOpenverse(query, page, minW, minH, 12),
      ]);

    const seen = new Set<string>();
    const items: PngLibraryItem[] = [];
    for (const item of [
      ...community,
      ...pixabayTransparent,
      ...pixabayAll,
      ...openverse,
    ]) {
      const key = `${item.source}-${item.id}`;
      if (seen.has(key)) continue;
      if (!item.previewUrl && !item.downloadUrl) continue;
      seen.add(key);
      items.push({
        ...item,
        previewUrl: proxyUrl(item.previewUrl || item.downloadUrl),
        downloadUrl: proxyUrl(item.downloadUrl || item.previewUrl),
      });
    }

    return NextResponse.json({
      items,
      page,
      total: items.length,
      providers: {
        community: community.length,
        pixabay: pixabayTransparent.length + pixabayAll.length,
        openverse: openverse.length,
        pixabayConfigured: Boolean(process.env.PIXABAY_API_KEY),
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "فشل البحث";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function searchCommunity(
  q: string,
  minW: number,
  minH: number,
  limit: number,
): Promise<PngLibraryItem[]> {
  try {
    const supabase = createServiceClient();
    let query = supabase
      .from("png_library_assets")
      .select("id,caption,keywords,public_url,width,height,file_size")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(Math.min(80, limit * 2));

    if (minW > 0) query = query.gte("width", minW);
    if (minH > 0) query = query.gte("height", minH);

    const { data, error } = await query;
    if (error || !Array.isArray(data)) return [];

    return (data as CommunityRow[])
      .filter((row) => {
        if (!q || q === "png") return true;
        const hay =
          `${row.caption} ${(row.keywords || []).join(" ")}`.toLowerCase();
        return hay.includes(q.toLowerCase());
      })
      .slice(0, limit)
      .map((row) => ({
        id: `community-${row.id}`,
        source: "community" as const,
        title: row.caption,
        previewUrl: row.public_url,
        downloadUrl: row.public_url,
        width: row.width,
        height: row.height,
        fileSize: row.file_size,
        tags: row.keywords || [],
      }));
  } catch {
    return [];
  }
}

async function searchPixabay(
  q: string,
  page: number,
  minW: number,
  minH: number,
  perPage: number,
  transparentOnly: boolean,
): Promise<PngLibraryItem[]> {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) return [];
  const url = new URL("https://pixabay.com/api/");
  url.searchParams.set("key", key);
  url.searchParams.set("q", q);
  url.searchParams.set("image_type", transparentOnly ? "illustration" : "all");
  url.searchParams.set("safesearch", "true");
  url.searchParams.set("per_page", String(Math.min(200, Math.max(3, perPage))));
  url.searchParams.set("page", String(page));
  if (transparentOnly) url.searchParams.set("colors", "transparent");
  if (minW > 0) url.searchParams.set("min_width", String(minW));
  if (minH > 0) url.searchParams.set("min_height", String(minH));

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    next: { revalidate: 120 },
  });
  if (!res.ok) return [];
  const data = (await res.json().catch(() => ({}))) as {
    hits?: Array<{
      id?: number;
      tags?: string;
      previewURL?: string;
      webformatURL?: string;
      largeImageURL?: string;
      imageWidth?: number;
      imageHeight?: number;
      pageURL?: string;
    }>;
  };
  return (data.hits || [])
    .map((hit) => {
      const preview =
        hit.previewURL || hit.webformatURL || hit.largeImageURL || "";
      const download =
        hit.largeImageURL || hit.webformatURL || hit.previewURL || "";
      return {
        id: `pixabay-${transparentOnly ? "t" : "a"}-${hit.id}`,
        source: "pixabay" as const,
        title: (hit.tags || "PNG").split(",")[0]?.trim() || "PNG",
        previewUrl: preview,
        downloadUrl: download,
        width: Number(hit.imageWidth) || 0,
        height: Number(hit.imageHeight) || 0,
        pageUrl: hit.pageURL,
        tags: (hit.tags || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 8),
      };
    })
    .filter((i) => i.previewUrl);
}

async function searchOpenverse(
  q: string,
  page: number,
  minW: number,
  minH: number,
  perPage: number,
): Promise<PngLibraryItem[]> {
  const url = new URL("https://api.openverse.org/v1/images/");
  url.searchParams.set("q", `${q} png`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("page_size", String(Math.min(20, perPage)));
  url.searchParams.set("format", "json");
  url.searchParams.set("extension", "png");

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    next: { revalidate: 300 },
  });
  if (!res.ok) return [];
  const data = (await res.json().catch(() => ({}))) as {
    results?: Array<{
      id?: string;
      title?: string;
      url?: string;
      thumbnail?: string;
      foreign_landing_url?: string;
      width?: number;
      height?: number;
      filesize?: number;
      filetype?: string;
      tags?: Array<{ name?: string }>;
    }>;
  };

  return (data.results || [])
    .filter((r) => {
      const thumb = r.thumbnail || r.url || "";
      if (!/^https?:\/\//i.test(thumb)) return false;
      // تجاهل SVG كنص/صفحات فارغة
      if (/\.svg(\?|$)/i.test(thumb) || r.filetype === "svg") return false;
      const w = Number(r.width) || 0;
      const h = Number(r.height) || 0;
      if (minW > 0 && w > 0 && w < minW) return false;
      if (minH > 0 && h > 0 && h < minH) return false;
      return true;
    })
    .map((r) => ({
      id: `openverse-${r.id}`,
      source: "openverse" as const,
      title: r.title || "PNG",
      previewUrl: r.thumbnail || r.url || "",
      downloadUrl: r.url || r.thumbnail || "",
      width: Number(r.width) || 0,
      height: Number(r.height) || 0,
      fileSize: r.filesize ? Number(r.filesize) : undefined,
      pageUrl: r.foreign_landing_url,
      tags: (r.tags || [])
        .map((t) => t.name || "")
        .filter(Boolean)
        .slice(0, 8),
    }));
}
