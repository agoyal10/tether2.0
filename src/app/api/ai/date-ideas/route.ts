import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Kill switch
  const { data: configRow } = await admin.from("app_config").select("value").eq("key", "ai_date_ideas_enabled").single();
  if (configRow?.value !== "true") {
    return NextResponse.json({ error: "Feature unavailable", disabled: true }, { status: 503 });
  }

  const { data: conn } = await admin
    .from("connections")
    .select("id, user_a_id, user_b_id")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .eq("status", "active")
    .single();

  if (!conn) return NextResponse.json({ error: "No active connection" }, { status: 404 });

  const periodKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Return cached if exists
  const { data: cached } = await admin
    .from("ai_insights")
    .select("content")
    .eq("connection_id", conn.id)
    .eq("type", "date_ideas")
    .eq("period_key", periodKey)
    .single();

  if (cached) return NextResponse.json({ ideas: JSON.parse(cached.content), cached: true });

  const partnerId = conn.user_a_id === user.id ? conn.user_b_id : conn.user_a_id;

  const model = "claude-haiku-4-5-20251001";

  const [{ data: myProfile }, { data: partnerProfile }, { data: myLogs }, { data: partnerLogs }] = await Promise.all([
    admin.from("profiles").select("display_name").eq("id", user.id).single<{ display_name: string }>(),
    admin.from("profiles").select("display_name").eq("id", partnerId).single<{ display_name: string }>(),
    admin.from("mood_logs").select("mood, note").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3),
    admin.from("mood_logs").select("mood, note").eq("user_id", partnerId).order("created_at", { ascending: false }).limit(3),
  ]);

  const myName = myProfile?.display_name ?? "Partner A";
  const partnerName = partnerProfile?.display_name ?? "Partner B";

  const myMood = myLogs?.[0]?.mood ?? "okay";
  const partnerMood = partnerLogs?.[0]?.mood ?? "okay";

  const prompt = `${myName} is feeling "${myMood}" and ${partnerName} is feeling "${partnerMood}" today.

Suggest exactly 3 date ideas for them. Make them specific, varied (one cozy/at-home, one out-and-about, one spontaneous/playful), and tailored to how they're both feeling. Keep each idea to one sentence.

Respond with a JSON array of exactly 3 strings, nothing else. Example format:
["idea one", "idea two", "idea three"]`;

  const message = await anthropic.messages.create({
    model,
    max_tokens: 200,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = (message.content[0] as { type: string; text: string }).text.trim()
    .replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  let ideas: string[];
  try {
    ideas = JSON.parse(raw);
    if (!Array.isArray(ideas) || ideas.length !== 3) throw new Error("bad format");
  } catch {
    // Fallback: extract lines if JSON parse fails
    ideas = raw.split("\n").filter((l) => l.trim().length > 0 && !l.trim().startsWith("[") && !l.trim().startsWith("]")).slice(0, 3);
  }

  // Cache for the day
  await admin.from("ai_insights").upsert(
    { connection_id: conn.id, type: "date_ideas", period_key: periodKey, content: JSON.stringify(ideas) },
    { onConflict: "connection_id,type,period_key" }
  );

  return NextResponse.json({ ideas, cached: false });
}

// DELETE — bust the daily cache so they can refresh
export async function DELETE(req: NextRequest) {
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

  if (!conn) return NextResponse.json({ ok: true });

  const periodKey = new Date().toISOString().slice(0, 10);
  await admin.from("ai_insights")
    .delete()
    .eq("connection_id", conn.id)
    .eq("type", "date_ideas")
    .eq("period_key", periodKey);

  return NextResponse.json({ ok: true });
}
