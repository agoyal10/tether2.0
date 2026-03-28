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

  // Fetch the messages — only allow deletion of messages the user sent
  const { data: messages } = await admin
    .from("messages")
    .select("id, media_path, sender_id")
    .in("id", messageIds)
    .eq("sender_id", user.id)
    .not("media_path", "is", null);

  if (!messages?.length) return NextResponse.json({ error: "Nothing to delete" }, { status: 404 });

  const paths = messages.map((m) => m.media_path as string);

  // Delete files from storage
  await admin.storage.from("chat-media").remove(paths);

  // Null out media_path on the messages so the message (and any text) is preserved
  await admin
    .from("messages")
    .update({ media_path: null })
    .in("id", messages.map((m) => m.id));

  return NextResponse.json({ deleted: messages.length });
}
