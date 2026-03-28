import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_REACTIONS = new Set(["❤️", "😍", "🥺", "😘", "💕", "🔥", "😂", "🫶"]);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { mood_log_id, emoji } = await req.json() as { mood_log_id: string; emoji: string };
  if (!mood_log_id || !emoji || !ALLOWED_REACTIONS.has(emoji)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { error } = await supabase
    .from("reactions")
    .upsert({ mood_log_id, user_id: user.id, emoji }, { onConflict: "mood_log_id,user_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { mood_log_id } = await req.json() as { mood_log_id: string };
  if (!mood_log_id) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await supabase.from("reactions").delete().eq("mood_log_id", mood_log_id).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
