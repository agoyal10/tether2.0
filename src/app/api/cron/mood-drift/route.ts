import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

const LOW_MOODS = new Set(["low", "struggling"]);
const DRIFT_THRESHOLD = 3; // out of last 5 check-ins
const LOOKBACK = 5;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Kill switch
  const { data: configRow } = await admin.from("app_config").select("value").eq("key", "ai_drift_alert_enabled").single();
  if (configRow?.value !== "true") return NextResponse.json({ ok: true, skipped: "disabled" });

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  // All active connections
  const { data: connections } = await admin
    .from("connections")
    .select("id, user_a_id, user_b_id")
    .eq("status", "active");

  if (!connections?.length) return NextResponse.json({ ok: true, sent: 0 });

  const today = new Date().toISOString().slice(0, 10);
  let sent = 0;

  for (const conn of connections) {
    const users = [
      { drifting: conn.user_a_id, notify: conn.user_b_id },
      { drifting: conn.user_b_id, notify: conn.user_a_id },
    ];

    for (const { drifting, notify } of users) {
      // Already sent an alert today about this person?
      const { data: existingAlert } = await admin
        .from("ai_insights")
        .select("id")
        .eq("connection_id", conn.id)
        .eq("type", "drift_alert")
        .eq("period_key", `${today}-${drifting}`)
        .maybeSingle();

      if (existingAlert) continue;

      // Check last LOOKBACK mood logs
      const { data: logs } = await admin
        .from("mood_logs")
        .select("mood")
        .eq("user_id", drifting)
        .order("created_at", { ascending: false })
        .limit(LOOKBACK);

      if (!logs || logs.length < LOOKBACK) continue;

      const lowCount = logs.filter((l) => LOW_MOODS.has(l.mood)).length;
      if (lowCount < DRIFT_THRESHOLD) continue;

      // Fetch the drifting user's name
      const { data: profile } = await admin
        .from("profiles")
        .select("display_name")
        .eq("id", drifting)
        .single<{ display_name: string }>();

      const name = profile?.display_name ?? "Your partner";

      // Send push to the other partner
      const { data: subs } = await admin
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", notify);

      if (subs?.length) {
        const payload = JSON.stringify({
          title: "Check in on them 💙",
          body: `${name} has been feeling low lately. A kind message could mean a lot.`,
          url: "/chat",
        });

        await Promise.allSettled(
          subs.map((sub: { endpoint: string; p256dh: string; auth: string }) =>
            webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload
            )
          )
        );
      }

      // Record so we don't send again today
      await admin.from("ai_insights").insert({
        connection_id: conn.id,
        type: "drift_alert",
        period_key: `${today}-${drifting}`,
        content: `Drift alert sent for ${drifting}`,
      });

      sent++;
    }
  }

  return NextResponse.json({ ok: true, sent });
}
