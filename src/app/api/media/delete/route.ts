import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messageIds } = await req.json() as { messageIds: string[] };
  if (!messageIds?.length) return NextResponse.json({ error: "No IDs provided" }, { status: 400 });

  const admin = createAdminClient();

  // Verify the user is in an active connection
  const { data: conn } = await admin
    .from("connections")
    .select("user_a_id, user_b_id")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .eq("status", "active")
    .single();

  if (!conn) return NextResponse.json({ error: "No active connection" }, { status: 403 });

  const partnerId = conn.user_a_id === user.id ? conn.user_b_id : conn.user_a_id;

  // Allow deletion of media sent by either partner in this connection
  const { data: messages } = await admin
    .from("messages")
    .select("id, media_path")
    .in("id", messageIds)
    .in("sender_id", [user.id, partnerId])
    .not("media_path", "is", null);

  if (!messages?.length) return NextResponse.json({ error: "Nothing to delete" }, { status: 404 });

  const paths = messages.map((m) => m.media_path as string);

  await admin.storage.from("chat-media").remove(paths);

  await admin
    .from("messages")
    .update({ media_path: null })
    .in("id", messages.map((m) => m.id));

  return NextResponse.json({ deleted: messages.length });
}
