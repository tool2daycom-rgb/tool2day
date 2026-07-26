import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

const BUCKET = "png-library";
const MAX_BYTES = 10 * 1024 * 1024;
const MIN_SIDE = 128;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const caption = String(form.get("caption") || "").trim().slice(0, 120);
    const keywordsRaw = String(form.get("keywords") || "");
    const visitorKey = String(form.get("visitorKey") || "").slice(0, 80);
    const width = Number(form.get("width") || 0);
    const height = Number(form.get("height") || 0);

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "ملف PNG مطلوب" }, { status: 400 });
    }
    if (!caption) {
      return NextResponse.json({ error: "أدخل عنواناً للصورة" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "الحد الأقصى لحجم الملف 10MB" },
        { status: 413 },
      );
    }
    const mime = file.type || "";
    const name = file.name.toLowerCase();
    if (!mime.includes("png") && !name.endsWith(".png")) {
      return NextResponse.json(
        { error: "يُقبل فقط ملف PNG بخلفية شفافة" },
        { status: 400 },
      );
    }
    if (width < MIN_SIDE || height < MIN_SIDE) {
      return NextResponse.json(
        { error: `الحد الأدنى للأبعاد ${MIN_SIDE}×${MIN_SIDE}px` },
        { status: 400 },
      );
    }

    const keywords = keywordsRaw
      .split(/[,،\n]+/)
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 12);

    const supabase = createServiceClient();
    await ensureBucket(supabase);

    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `png-${Date.now()}`;
    const storagePath = `community/${id}.png`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, bytes, {
        contentType: "image/png",
        upsert: false,
      });
    if (upErr) {
      throw new Error(upErr.message || "فشل رفع الملف");
    }

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    const publicUrl = pub.publicUrl;

    const { data: row, error: dbErr } = await supabase
      .from("png_library_assets")
      .insert({
        caption,
        keywords,
        storage_path: storagePath,
        public_url: publicUrl,
        width,
        height,
        file_size: file.size,
        status: "approved",
        visitor_key: visitorKey || null,
      })
      .select("id,public_url,width,height,file_size,caption")
      .single();

    if (dbErr) {
      // حاول تنظيف الملف إن فشل الإدراج
      await supabase.storage.from(BUCKET).remove([storagePath]).catch(() => null);
      throw new Error(dbErr.message || "فشل حفظ البيانات");
    }

    return NextResponse.json({
      ok: true,
      item: {
        id: `community-${row.id}`,
        source: "community",
        title: row.caption,
        previewUrl: row.public_url,
        downloadUrl: row.public_url,
        width: row.width,
        height: row.height,
        fileSize: row.file_size,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "فشل الرفع";
    const missingTable =
      /png_library_assets|relation|does not exist|Could not find/i.test(message);
    return NextResponse.json(
      {
        error: missingTable
          ? "جدول المكتبة غير جاهز — نفّذ SQL في Supabase (supabase/schema.sql) أولاً"
          : message,
      },
      { status: missingTable ? 503 : 500 },
    );
  }
}

async function ensureBucket(
  supabase: ReturnType<typeof createServiceClient>,
) {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = (buckets || []).some((b) => b.name === BUCKET);
  if (exists) return;
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: ["image/png"],
  });
  if (error && !/already exists|duplicate/i.test(error.message)) {
    throw new Error(
      `تعذّر إنشاء مجلد التخزين: ${error.message}. أنشئ bucket باسم png-library (عام) من لوحة Supabase.`,
    );
  }
}
