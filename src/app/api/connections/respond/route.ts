import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { connectionId, action } = await req.json() as { connectionId: string; action: "approve" | "decline" };
  if (!connectionId || !["approve", "decline"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verify this connection is pending and the current user is NOT the requester
  const { data: conn } = await admin
    .from("connections")
    .select("id, user_a_id, user_b_id, requester_id, status")
    .eq("id", connectionId)
    .eq("status", "pending")
    .single();

  if (!conn) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isInvolved = conn.user_a_id === user.id || conn.user_b_id === user.id;
  const isRequester = conn.requester_id === user.id;
  if (!isInvolved || isRequester) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (action === "approve") {
    await admin.from("connections").update({ status: "active" }).eq("id", connectionId);

    // Notify the requester that they were approved
    if (conn.requester_id) {
      const { data: inviterProfile } = await admin
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();

      await sendPushToUser(conn.requester_id, {
        title: "Connection approved! 💞",
        body: `${inviterProfile?.display_name ?? "Your partner"} accepted your connection request`,
        url: "/dashboard",
      });
    }
  } else {
    await admin.from("connections").delete().eq("id", connectionId);
  }

  return NextResponse.json({ ok: true });
}
