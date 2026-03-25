import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles").select("display_name").eq("id", user.id).single<{ display_name: string }>();

  const { data: connection } = await admin
    .from("connections")
    .select("user_a_id, user_b_id")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .eq("status", "active")
    .single();

  if (!connection) return NextResponse.json({ ok: true });

  const partnerId = connection.user_a_id === user.id ? connection.user_b_id : connection.user_a_id;

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", partnerId);

  if (!subs || subs.length === 0) return NextResponse.json({ ok: true });

  const senderName = profile?.display_name ?? "Your partner";
  const payload = JSON.stringify({
    title: "Connection ended 💔",
    body: `${senderName} has disconnected.`,
    url: "/partner",
  });

  await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  );

  return NextResponse.json({ ok: true });
}
