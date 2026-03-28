import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { paths } = await req.json() as { paths: string[] };
  if (!paths?.length) return NextResponse.json({ urls: {} });

  // Only allow signing paths that belong to the requesting user or their active partner
  const admin = createAdminClient();
  const { data: conn } = await admin
    .from("connections")
    .select("user_a_id, user_b_id")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .eq("status", "active")
    .maybeSingle();

  const allowedPrefixes = [user.id];
  if (conn) {
    const partnerId = conn.user_a_id === user.id ? conn.user_b_id : conn.user_a_id;
    allowedPrefixes.push(partnerId);
  }

  const validPaths = paths.filter((p) =>
    typeof p === "string" && allowedPrefixes.some((prefix) => p.startsWith(`${prefix}/`))
  );
  if (!validPaths.length) return NextResponse.json({ urls: {} });

  const { data, error } = await admin.storage
    .from("chat-media")
    .createSignedUrls(validPaths, 60 * 60); // 1 hour

  if (error || !data) {
    return NextResponse.json({ error: "Could not sign URLs" }, { status: 500 });
  }

  const urls: Record<string, string> = {};
  data.forEach(({ path, signedUrl }) => {
    if (path && signedUrl) urls[path] = signedUrl;
  });

  return NextResponse.json({ urls });
}
