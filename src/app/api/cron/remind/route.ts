import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const admin = createAdminClient();

  // Get all users with reminders enabled
  const { data: profiles } = await admin
    .from("profiles")
    .select("id")
    .eq("reminder_enabled", true);

  if (!profiles || profiles.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  let sent = 0;
  for (const profile of profiles) {
    // Skip if already checked in today
    const { data: todayLog } = await admin
      .from("mood_logs")
      .select("id")
      .eq("user_id", profile.id)
      .gte("created_at", todayStart.toISOString())
      .maybeSingle();

    if (todayLog) continue;

    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", profile.id);

    if (!subs || subs.length === 0) continue;

    const payload = JSON.stringify({
      title: "How are you feeling? 💞",
      body: "You haven't checked in with your partner today.",
      url: "/checkin",
    });

    await Promise.allSettled(
      subs.map((sub: { endpoint: string; p256dh: string; auth: string }) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      )
    );
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
