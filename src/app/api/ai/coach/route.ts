import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function getConfig(admin: ReturnType<typeof createAdminClient>, key: string): Promise<string | null> {
  const { data } = await admin.from("app_config").select("value").eq("key", key).single();
  return data?.value ?? null;
}

// GET — load message history
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: conn } = await admin
    .from("connections")
    .select("id")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .eq("status", "active")
    .single();

  if (!conn) return NextResponse.json({ messages: [], remaining: 0 });

  const [{ data: messages }, { count }] = await Promise.all([
    admin
      .from("coach_messages")
      .select("id, role, content, sender_user_id, created_at")
      .eq("connection_id", conn.id)
      .order("created_at", { ascending: true })
      .limit(60),
    admin
      .from("coach_messages")
      .select("id", { count: "exact", head: true })
      .eq("connection_id", conn.id)
      .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
  ]);

  const limitStr = await getConfig(admin, "ai_coach_daily_limit");
  const limit = parseInt(limitStr ?? "20", 10);
  const remaining = Math.max(0, limit - (count ?? 0));

  return NextResponse.json({ messages: messages ?? [], remaining, userId: user.id });
}

// POST — send a message
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message } = await req.json() as { message: string };
  if (!message?.trim()) return NextResponse.json({ error: "Empty message" }, { status: 400 });

  const admin = createAdminClient();

  // Kill switch
  const enabled = await getConfig(admin, "ai_coach_enabled");
  if (enabled !== "true") {
    return NextResponse.json({ error: "Coach is currently unavailable", disabled: true }, { status: 503 });
  }

  const { data: conn } = await admin
    .from("connections")
    .select("id, user_a_id, user_b_id")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .eq("status", "active")
    .single();

  if (!conn) return NextResponse.json({ error: "No active connection" }, { status: 404 });

  // Daily limit check
  const limitStr = await getConfig(admin, "ai_coach_daily_limit");
  const limit = parseInt(limitStr ?? "20", 10);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count } = await admin
    .from("coach_messages")
    .select("id", { count: "exact", head: true })
    .eq("connection_id", conn.id)
    .gte("created_at", todayStart.toISOString());

  if ((count ?? 0) >= limit) {
    return NextResponse.json({ error: "Daily message limit reached", limitReached: true }, { status: 429 });
  }

  const partnerId = conn.user_a_id === user.id ? conn.user_b_id : conn.user_a_id;

  // Fetch context in parallel
  const [{ data: myProfile }, { data: partnerProfile }, { data: myLogs }, { data: partnerLogs }] = await Promise.all([
    admin.from("profiles").select("display_name").eq("id", user.id).single<{ display_name: string }>(),
    admin.from("profiles").select("display_name").eq("id", partnerId).single<{ display_name: string }>(),
    admin.from("mood_logs").select("mood, note, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
    admin.from("mood_logs").select("mood, note, created_at").eq("user_id", partnerId).order("created_at", { ascending: false }).limit(5),
  ]);

  const myName = myProfile?.display_name ?? "Partner A";
  const partnerName = partnerProfile?.display_name ?? "Partner B";

  const formatLogs = (logs: { mood: string; note: string | null; created_at: string }[] | null) =>
    !(logs?.length) ? "No recent check-ins"
      : logs.map((l) => `- ${new Date(l.created_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}: ${l.mood}${l.note ? ` ("${l.note}")` : ""}`).join("\n");

  const systemPrompt = `You are a warm, empathetic relationship coach for a couple using Tether, a private couples app. You have context about their recent emotional check-ins.

${myName}'s recent moods:
${formatLogs(myLogs)}

${partnerName}'s recent moods:
${formatLogs(partnerLogs)}

You are speaking with ${myName} right now. Be warm, personal, and concise (2-4 sentences unless more depth is genuinely needed). Never be clinical or judgmental. Focus on their relationship dynamic and emotional wellbeing.`;

  // Last 10 messages as conversation history
  const { data: history } = await admin
    .from("coach_messages")
    .select("role, content")
    .eq("connection_id", conn.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const conversationHistory = (history ?? []).reverse().map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // Store user message first
  await admin.from("coach_messages").insert({
    connection_id: conn.id,
    sender_user_id: user.id,
    role: "user",
    content: message.trim(),
  });

  // Call Claude Haiku
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    system: systemPrompt,
    messages: [
      ...conversationHistory,
      { role: "user", content: message.trim() },
    ],
  });

  const reply = (response.content[0] as { type: string; text: string }).text.trim();

  // Store assistant reply
  await admin.from("coach_messages").insert({
    connection_id: conn.id,
    sender_user_id: null,
    role: "assistant",
    content: reply,
  });

  const remaining = Math.max(0, limit - (count ?? 0) - 2);

  return NextResponse.json({ reply, remaining });
}
