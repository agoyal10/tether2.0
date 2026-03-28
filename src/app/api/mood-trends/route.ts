import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MOOD_SCORE: Record<string, number> = {
  thriving: 5,
  good: 4,
  okay: 3,
  low: 2,
  struggling: 1,
  // love moods — positive
  smitten: 5,
  adoring: 4.5,
  connected: 4,
  longing: 3,
  tender: 3.5,
  // naughty moods — positive/playful
  soaked: 4.5,
  burning: 4.5,
  heated: 4,
  frisky: 4,
  naughty: 4,
  // katakni — stressed
  katakni: 1.5,
};

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: conn } = await admin
    .from("connections")
    .select("id, user_a_id, user_b_id")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .eq("status", "active")
    .single();

  if (!conn) return NextResponse.json({ error: "No active connection" }, { status: 404 });

  const partnerId = conn.user_a_id === user.id ? conn.user_b_id : conn.user_a_id;

  // Last 30 days
  const since = new Date();
  since.setDate(since.getDate() - 29);
  since.setHours(0, 0, 0, 0);

  const [{ data: myLogs }, { data: partnerLogs }, { data: myProfile }, { data: partnerProfile }] = await Promise.all([
    admin.from("mood_logs").select("mood, created_at").eq("user_id", user.id).gte("created_at", since.toISOString()).order("created_at"),
    admin.from("mood_logs").select("mood, created_at").eq("user_id", partnerId).gte("created_at", since.toISOString()).order("created_at"),
    admin.from("profiles").select("display_name").eq("id", user.id).single<{ display_name: string }>(),
    admin.from("profiles").select("display_name").eq("id", partnerId).single<{ display_name: string }>(),
  ]);

  const mapLogs = (logs: { mood: string; created_at: string }[] | null) =>
    (logs ?? []).map((l) => ({
      date: l.created_at.slice(0, 10),
      mood: l.mood,
      score: MOOD_SCORE[l.mood] ?? 3,
    }));

  return NextResponse.json({
    myLogs: mapLogs(myLogs),
    partnerLogs: mapLogs(partnerLogs),
    myName: myProfile?.display_name ?? "You",
    partnerName: partnerProfile?.display_name ?? "Partner",
    since: since.toISOString().slice(0, 10),
  });
}
