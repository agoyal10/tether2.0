import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function getPeriodKey(type: "weekly" | "monthly"): string {
  const now = new Date();
  if (type === "monthly") {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }
  // ISO week number
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function getPeriodStart(type: "weekly" | "monthly"): Date {
  const now = new Date();
  if (type === "monthly") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  const day = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + 1);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export async function GET(req: NextRequest) {
  const type = (req.nextUrl.searchParams.get("type") ?? "weekly") as "weekly" | "monthly";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Get active connection
  const { data: conn } = await admin
    .from("connections")
    .select("id, user_a_id, user_b_id")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .eq("status", "active")
    .single();

  if (!conn) return NextResponse.json({ error: "No active connection" }, { status: 404 });

  // Monthly recap is premium-only
  if (type === "monthly") {
    const { data: profile } = await admin
      .from("profiles")
      .select("is_premium")
      .eq("id", user.id)
      .single<{ is_premium: boolean }>();
    if (!profile?.is_premium) {
      return NextResponse.json({ error: "Premium required", premiumRequired: true }, { status: 403 });
    }
  }

  const periodKey = getPeriodKey(type);

  // Return cached insight if it exists
  const { data: cached } = await admin
    .from("ai_insights")
    .select("content, created_at")
    .eq("connection_id", conn.id)
    .eq("type", type)
    .eq("period_key", periodKey)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cached) return NextResponse.json({ insight: cached.content, cached: true });

  // Fetch mood logs for both partners in the period
  const periodStart = getPeriodStart(type);
  const partnerId = conn.user_a_id === user.id ? conn.user_b_id : conn.user_a_id;

  const model = "claude-haiku-4-5-20251001";

  const [{ data: myLogs }, { data: partnerLogs }, { data: myProfile }, { data: partnerProfile }] = await Promise.all([
    admin.from("mood_logs").select("mood, note, created_at").eq("user_id", user.id).gte("created_at", periodStart.toISOString()).order("created_at"),
    admin.from("mood_logs").select("mood, note, created_at").eq("user_id", partnerId).gte("created_at", periodStart.toISOString()).order("created_at"),
    admin.from("profiles").select("display_name").eq("id", user.id).single<{ display_name: string }>(),
    admin.from("profiles").select("display_name").eq("id", partnerId).single<{ display_name: string }>(),
  ]);

  const minLogs = type === "weekly" ? 3 : 5;
  const totalLogs = (myLogs?.length ?? 0) + (partnerLogs?.length ?? 0);
  if (totalLogs < minLogs) {
    return NextResponse.json({ error: "Not enough check-ins yet", insufficient: true });
  }

  const myName = myProfile?.display_name ?? "Partner A";
  const partnerName = partnerProfile?.display_name ?? "Partner B";

  const formatLogs = (logs: { mood: string; note: string | null; created_at: string }[] | null) =>
    (logs ?? []).map((l) => `- ${new Date(l.created_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}: ${l.mood}${l.note ? ` ("${l.note}")` : ""}`).join("\n");

  const prompt = type === "weekly"
    ? `You are a warm, insightful relationship assistant. Analyze this couple's mood check-ins from the past week and give a brief, caring insight (3-4 sentences). Focus on patterns, how their moods relate to each other, and one gentle suggestion. Be warm and personal, not clinical.

${myName}'s check-ins:
${formatLogs(myLogs)}

${partnerName}'s check-ins:
${formatLogs(partnerLogs)}

Write a short insight addressed to both of them. No markdown, no headers, no bullet points, no asterisks — just warm flowing sentences.`
    : `You are a warm, insightful relationship assistant. Create a heartfelt monthly recap for this couple based on their mood check-ins. Include: overall mood trends, their best moments, any patterns you notice, and an encouraging note for the next month. Keep it to 4-5 sentences, warm and personal.

${myName}'s check-ins this month:
${formatLogs(myLogs)}

${partnerName}'s check-ins this month:
${formatLogs(partnerLogs)}

Write a monthly recap addressed to both of them. No markdown, no headers, no bullet points, no asterisks — just warm flowing sentences.`;

  const message = await anthropic.messages.create({
    model,
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  const content = (message.content[0] as { type: string; text: string }).text.trim();

  // Cache the result — delete first then insert to avoid needing a unique constraint
  await admin.from("ai_insights")
    .delete()
    .eq("connection_id", conn.id)
    .eq("type", type)
    .eq("period_key", periodKey);
  await admin.from("ai_insights")
    .insert({ connection_id: conn.id, type, period_key: periodKey, content });

  return NextResponse.json({ insight: content, cached: false });
}
