import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const [{ data: profile }, { data: connection }] = await Promise.all([
    admin.from("profiles").select("display_name").eq("id", user.id).single(),
    admin
      .from("connections")
      .select("user_a_id, user_b_id")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .eq("status", "active")
      .single(),
  ]);

  if (!connection) return NextResponse.json({ error: "No partner" }, { status: 400 });

  const senderName = (profile as { display_name: string } | null)?.display_name ?? "Your partner";
  const partnerId = connection.user_a_id === user.id ? connection.user_b_id : connection.user_a_id;

  // Insert flower gift
  await admin.from("flowers").insert({ from_user_id: user.id, to_user_id: partnerId });

  // Send push notification
  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT!,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );
    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", partnerId);

    if (subs && subs.length > 0) {
      const payload = JSON.stringify({
        title: `${senderName} sent you flowers 🌸`,
        body: "Open the app to see them",
        url: "/dashboard",
      });
      await Promise.allSettled(
        subs.map((sub) =>
          webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          )
        )
      );
    }
  } catch {}

  return NextResponse.json({ ok: true });
}
