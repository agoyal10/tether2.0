import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function getConnection(userId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("connections")
    .select("id")
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .eq("status", "active")
    .single();
  return data?.id ?? null;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const connectionId = await getConnection(user.id);
  if (!connectionId) return NextResponse.json({ items: [] });

  const { data } = await supabase
    .from("bucket_list")
    .select("id, text, is_done, done_at, added_by, created_at")
    .eq("connection_id", connectionId)
    .order("is_done", { ascending: true })
    .order("created_at", { ascending: true });

  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text } = await req.json() as { text: string };
  if (!text?.trim()) return NextResponse.json({ error: "Text required" }, { status: 400 });

  const connectionId = await getConnection(user.id);
  if (!connectionId) return NextResponse.json({ error: "No active connection" }, { status: 404 });

  const { data, error } = await supabase
    .from("bucket_list")
    .insert({ connection_id: connectionId, added_by: user.id, text: text.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}
