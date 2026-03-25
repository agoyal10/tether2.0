import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  // Verify cron secret
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
  const nowUtc = new Date();

  // Fetch all users with reminders enabled
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, display_name, reminder_hour, reminder_timezone")
    .eq("reminder_enabled", true);

  if (!profiles || profiles.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  // Filter to users whose local hour matches now
  const eligible = profiles.filter((p: { reminder_hour: number; reminder_timezone: string }) => {
    try {
      const localHour = new Date(nowUtc.toLocaleString("en-US", { timeZone: p.reminder_timezone })).getHours();
      return localHour === p.reminder_hour;
    } catch {
      return false;
    }
  });

  if (eligible.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  // For each eligible user, check if they've already checked in today (in their timezone)
  let sent = 0;
  for (const profile of eligible) {
    const localMidnight = new Date(
      new Date().toLocaleDateString("en-CA", { timeZone: profile.reminder_timezone }) + "T00:00:00"
    );

    const { data: todayLog } = await admin
      .from("mood_logs")
      .select("id")
      .eq("user_id", profile.id)
      .gte("created_at", localMidnight.toISOString())
      .maybeSingle();

    if (todayLog) continue; // Already checked in today

    // Get their push subscriptions
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
