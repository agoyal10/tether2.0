import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { paths } = await req.json() as { paths: string[] };
  if (!paths?.length) return NextResponse.json({ urls: {} });

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("chat-media")
    .createSignedUrls(paths, 60 * 60); // 1 hour

  if (error || !data) {
    return NextResponse.json({ error: "Could not sign URLs" }, { status: 500 });
  }

  const urls: Record<string, string> = {};
  data.forEach(({ path, signedUrl }) => {
    if (path && signedUrl) urls[path] = signedUrl;
  });

  return NextResponse.json({ urls });
}
