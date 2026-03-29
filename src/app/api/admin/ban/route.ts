import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, banned } = await req.json() as { userId: string; banned: boolean };
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  if (userId === ADMIN_USER_ID) {
    return NextResponse.json({ error: "Cannot ban admin" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Ban/unban in Supabase Auth — immediately invalidates sessions
  const { error: authError } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: banned ? "876600h" : "none", // ~100 years = effectively permanent
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  // Sync to profiles for display
  await admin.from("profiles").update({ is_banned: banned }).eq("id", userId);

  return NextResponse.json({ ok: true });
}
