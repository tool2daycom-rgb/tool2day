import { createClient } from "@/lib/supabase/server";

export async function getSupabaseHealth() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("tool_jobs").select("id").limit(1);
    if (error && error.code !== "PGRST116") {
      return { ok: false as const, message: error.message };
    }
    return { ok: true as const, message: "connected" };
  } catch (err) {
    return {
      ok: false as const,
      message: err instanceof Error ? err.message : "unknown error",
    };
  }
}
