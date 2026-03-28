import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const admin = createAdminClient();

  // Get all active connections
  const { data: connections } = await admin
    .from("connections")
    .select("id, user_a_id, user_b_id")
    .eq("status", "active");

  if (!connections?.length) return NextResponse.json({ ok: true, sent: 0 });

  // Get current week key
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  const periodKey = `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;

  let sent = 0;
  for (const conn of connections) {
    // Check if cached insight exists for this week
    const { data: insight } = await admin
      .from("ai_insights")
      .select("content")
      .eq("connection_id", conn.id)
      .eq("type", "weekly")
      .eq("period_key", periodKey)
      .single();

    if (!insight) continue;

    const preview = insight.content.slice(0, 100) + (insight.content.length > 100 ? "…" : "");
    const payload = JSON.stringify({
      title: "✨ Your weekly relationship insight",
      body: preview,
      url: "/dashboard",
    });

    // Send to both partners
    for (const userId of [conn.user_a_id, conn.user_b_id]) {
      const { data: subs } = await admin
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", userId);

      if (!subs?.length) continue;

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
  }

  return NextResponse.json({ ok: true, sent });
}
