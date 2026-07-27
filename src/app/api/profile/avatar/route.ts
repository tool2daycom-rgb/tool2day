import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  shrinkUserAvatarMetadata,
  uploadUserAvatar,
} from "@/lib/avatar-storage";

export const runtime = "nodejs";

/** Upload profile photo to Storage and store only a short HTTPS URL in auth metadata. */
export async function POST(req: Request) {
  try {
    const auth = await createClient();
    const { data } = await auth.auth.getUser();
    if (!data.user) {
      return NextResponse.json({ error: "login_required" }, { status: 401 });
    }

    const body = (await req.json()) as { dataUrl?: string };
    const dataUrl = typeof body.dataUrl === "string" ? body.dataUrl : "";
    if (!dataUrl.startsWith("data:image/")) {
      return NextResponse.json({ error: "invalid avatar" }, { status: 400 });
    }

    const publicUrl = await uploadUserAvatar({
      userId: data.user.id,
      dataUrl,
    });

    const { error } = await auth.auth.updateUser({
      data: {
        avatar_url: publicUrl,
        picture: publicUrl,
      },
    });
    if (error) {
      // service-role fallback if client update fails
      await shrinkUserAvatarMetadata(data.user.id);
    }

    return NextResponse.json({ ok: true, avatarUrl: publicUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : "upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
