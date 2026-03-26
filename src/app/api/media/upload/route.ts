import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const IMAGE_MAX = 10 * 1024 * 1024; // 10 MB
const VIDEO_MAX = 50 * 1024 * 1024; // 50 MB

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  if (!isImage && !isVideo) {
    return NextResponse.json({ error: "Only images and videos allowed" }, { status: 400 });
  }

  const maxSize = isImage ? IMAGE_MAX : VIDEO_MAX;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: `File too large. Max ${isImage ? "10" : "50"} MB.` },
      { status: 400 }
    );
  }

  const ext = file.name.split(".").pop() ?? (isImage ? "jpg" : "mp4");
  const path = `${user.id}/${Date.now()}.${ext}`;

  const admin = createAdminClient();
  const { error } = await admin.storage
    .from("chat-media")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    console.error("[media/upload]", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  return NextResponse.json({ path });
}
