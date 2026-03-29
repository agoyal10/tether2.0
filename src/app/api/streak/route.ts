import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ streak: 0 });

  const admin = createAdminClient();

  const { data: conn } = await admin
    .from("connections")
    .select("user_a_id, user_b_id")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .eq("status", "active")
    .maybeSingle();

  if (!conn) return NextResponse.json({ streak: 0 });

  const partnerId = conn.user_a_id === user.id ? conn.user_b_id : conn.user_a_id;
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const [{ data: myLogs }, { data: partnerLogs }] = await Promise.all([
    admin.from("mood_logs").select("created_at").eq("user_id", user.id).gte("created_at", since.toISOString()),
    admin.from("mood_logs").select("created_at").eq("user_id", partnerId).gte("created_at", since.toISOString()),
  ]);

  const myDates = new Set((myLogs ?? []).map((l) => l.created_at.slice(0, 10)));
  const partnerDates = new Set((partnerLogs ?? []).map((l) => l.created_at.slice(0, 10)));
  const today = new Date().toISOString().slice(0, 10);

  const checkFrom = new Date();
  if (!myDates.has(today) || !partnerDates.has(today)) {
    checkFrom.setDate(checkFrom.getDate() - 1);
  }

  let streak = 0;
  for (let i = 0; i < 90; i++) {
    const d = new Date(checkFrom);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    if (myDates.has(dateStr) && partnerDates.has(dateStr)) {
      streak++;
    } else {
      break;
    }
  }

  return NextResponse.json({ streak });
}
