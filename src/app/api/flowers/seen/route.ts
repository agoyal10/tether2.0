import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabase
    .from("flowers")
    .update({ seen_at: new Date().toISOString() })
    .eq("to_user_id", user.id)
    .is("seen_at", null);

  return NextResponse.json({ ok: true });
}
