import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MOOD_CONFIGS, NAUGHTY_MOOD_CONFIGS } from "@/types";

const ALL_CONFIGS = [...MOOD_CONFIGS, ...NAUGHTY_MOOD_CONFIGS];

export async function POST(req: NextRequest) {
  // Configure VAPID inside the handler so env vars are only required at runtime
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { moodLogId } = await req.json();
  const admin = createAdminClient();

  // Get the mood log (admin bypasses RLS, FK hint avoids ambiguous join)
  const { data: log } = await admin
    .from("mood_logs")
    .select("*, profile:profiles!mood_logs_user_id_fkey(display_name)")
    .eq("id", moodLogId)
    .single();

  if (!log) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const moodConfig = ALL_CONFIGS.find((m) => m.level === log.mood);
  const senderName = (log.profile as { display_name: string })?.display_name ?? "Your partner";

  // Get partner ID
  const { data: connection } = await admin
    .from("connections")
    .select("user_a_id, user_b_id")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .eq("status", "active")
    .single();

  if (!connection) return NextResponse.json({ ok: true });

  const partnerId =
    connection.user_a_id === user.id ? connection.user_b_id : connection.user_a_id;

  // Fetch partner's push subscriptions (admin bypasses RLS)
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", partnerId);

  console.log(`[push] subs for partner ${partnerId}:`, subs?.length ?? 0);
  if (!subs || subs.length === 0) return NextResponse.json({ ok: true, reason: "no subs" });

  const payload = JSON.stringify({
    title: `${senderName} checked in ${moodConfig?.emoji ?? ""}`,
    body: log.note ? `"${log.note}"` : `Feeling ${moodConfig?.label ?? log.mood}`,
    url: `/chat/${moodLogId}`,
  });

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  );

  results.forEach((r, i) => {
    if (r.status === "rejected") console.error(`[push] sub[${i}] failed:`, r.reason);
    else console.log(`[push] sub[${i}] sent, status:`, r.value.statusCode);
  });

  return NextResponse.json({ ok: true, sent: results.length });
}
