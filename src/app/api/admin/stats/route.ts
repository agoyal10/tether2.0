import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== ADMIN_USER_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString();

  const [
    { count: totalUsers },
    { count: newUsersThisWeek },
    { data: recentUsers },
    { count: activeCouples },
    { count: pendingCouples },
    { count: checkinsToday },
    { count: checkinsThisWeek },
    { count: totalCheckins },
    { count: aiInsightsToday },
    { data: emojiToday },
    { count: premiumUsers },
    { data: killSwitches },
    { count: pushSubs },
    { count: driftAlertsToday },
  ] = await Promise.all([
    // Users
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgoStr),
    admin.from("profiles").select("id, display_name, created_at, is_premium, is_banned").order("created_at", { ascending: false }).limit(10),

    // Couples
    admin.from("connections").select("*", { count: "exact", head: true }).eq("status", "active"),
    admin.from("connections").select("*", { count: "exact", head: true }).eq("status", "pending"),

    // Check-ins
    admin.from("mood_logs").select("*", { count: "exact", head: true }).gte("created_at", `${todayStr}T00:00:00`),
    admin.from("mood_logs").select("*", { count: "exact", head: true }).gte("created_at", weekAgoStr),
    admin.from("mood_logs").select("*", { count: "exact", head: true }),

    // AI usage
    admin.from("ai_insights").select("*", { count: "exact", head: true }).gte("created_at", `${todayStr}T00:00:00`).neq("type", "drift_alert"),
    admin.from("emoji_usage").select("count").eq("date", todayStr),

    // Revenue
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("is_premium", true),

    // Kill switches
    admin.from("app_config").select("key, value, updated_at"),

    // Push
    admin.from("push_subscriptions").select("*", { count: "exact", head: true }),
    admin.from("ai_insights").select("*", { count: "exact", head: true }).eq("type", "drift_alert").gte("created_at", `${todayStr}T00:00:00`),
  ]);

  const emojiCountToday = (emojiToday ?? []).reduce((sum: number, r: { count: number }) => sum + (r.count ?? 0), 0);

  return NextResponse.json({
    users: { total: totalUsers ?? 0, newThisWeek: newUsersThisWeek ?? 0, recent: recentUsers ?? [] },
    couples: { active: activeCouples ?? 0, pending: pendingCouples ?? 0 },
    checkins: { today: checkinsToday ?? 0, thisWeek: checkinsThisWeek ?? 0, total: totalCheckins ?? 0 },
    ai: { insightsToday: aiInsightsToday ?? 0, emojiToday: emojiCountToday },
    revenue: { premium: premiumUsers ?? 0 },
    killSwitches: killSwitches ?? [],
    push: { subscriptions: pushSubs ?? 0, driftAlertsToday: driftAlertsToday ?? 0 },
  });
}
