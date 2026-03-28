import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const IMAGE_MAX = 10 * 1024 * 1024; // 10 MB
const VIDEO_MAX = 50 * 1024 * 1024; // 50 MB

// Magic byte signatures for allowed file types
const MAGIC_BYTES: { bytes: number[]; mask?: number[]; mime: string }[] = [
  // JPEG: FF D8 FF
  { bytes: [0xff, 0xd8, 0xff], mime: "image/jpeg" },
  // PNG: 89 50 4E 47
  { bytes: [0x89, 0x50, 0x4e, 0x47], mime: "image/png" },
  // GIF: 47 49 46 38
  { bytes: [0x47, 0x49, 0x46, 0x38], mime: "image/gif" },
  // WebP: RIFF....WEBP (bytes 0-3 = RIFF, bytes 8-11 = WEBP)
  { bytes: [0x52, 0x49, 0x46, 0x46], mime: "image/webp" },
  // HEIC/HEIF: ftyp at offset 4
  { bytes: [0x00, 0x00, 0x00, 0x00, 0x66, 0x74, 0x79, 0x70], mime: "image/heic" },
  // MP4: ftyp box (bytes 4-7)
  { bytes: [0x00, 0x00, 0x00, 0x00, 0x66, 0x74, 0x79, 0x70], mime: "video/mp4" },
  // MOV: same ftyp signature as MP4
  { bytes: [0x00, 0x00, 0x00, 0x00, 0x66, 0x74, 0x79, 0x70], mime: "video/quicktime" },
  // WebM: 1A 45 DF A3
  { bytes: [0x1a, 0x45, 0xdf, 0xa3], mime: "video/webm" },
];

function detectFileType(header: Uint8Array): "image" | "video" | null {
  // JPEG
  if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) return "image";
  // PNG
  if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47) return "image";
  // GIF
  if (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x38) return "image";
  // WebP: RIFF at 0, WEBP at 8
  if (
    header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46 &&
    header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50
  ) return "image";
  // WebM
  if (header[0] === 0x1a && header[1] === 0x45 && header[2] === 0xdf && header[3] === 0xa3) return "video";
  // MP4/MOV/HEIC — ftyp box at offset 4
  if (header[4] === 0x66 && header[5] === 0x74 && header[6] === 0x79 && header[7] === 0x70) {
    // Check brand: HEIC/HEIF = image, everything else = video
    const brand = String.fromCharCode(header[8], header[9], header[10], header[11]);
    if (brand === "heic" || brand === "heix" || brand === "mif1" || brand === "msf1") return "image";
    return "video";
  }
  return null;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  // Read first 12 bytes and validate via magic bytes (not trusting browser MIME type)
  const headerBuffer = await file.slice(0, 12).arrayBuffer();
  const header = new Uint8Array(headerBuffer);
  const detectedType = detectFileType(header);

  if (!detectedType) {
    return NextResponse.json({ error: "Only images and videos are allowed" }, { status: 400 });
  }

  const maxSize = detectedType === "image" ? IMAGE_MAX : VIDEO_MAX;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: `File too large. Max ${detectedType === "image" ? "10" : "50"} MB.` },
      { status: 400 }
    );
  }

  // Use detected type for content-type, not browser-reported
  const isImage = detectedType === "image";
  const ALLOWED_IMAGE_EXTS = new Set(["jpg","jpeg","png","gif","webp","heic","heif"]);
  const ALLOWED_VIDEO_EXTS = new Set(["mp4","mov","webm"]);
  const rawExt = file.name.split(".").pop()?.toLowerCase() ?? "";
  const allowedExts = isImage ? ALLOWED_IMAGE_EXTS : ALLOWED_VIDEO_EXTS;
  const ext = allowedExts.has(rawExt) ? rawExt : (isImage ? "jpg" : "mp4");
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
