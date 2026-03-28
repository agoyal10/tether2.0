import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";

const pageClass = "flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 px-6";

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const upperCode = code.toUpperCase();
  const admin = createAdminClient();

  // Look up inviter by invite code
  const { data: inviter } = await admin
    .from("profiles")
    .select("id, display_name")
    .eq("invite_code", upperCode)
    .single<{ id: string; display_name: string }>();

  if (!inviter) {
    return (
      <main className={pageClass}>
        <div className="text-center">
          <span className="text-5xl">💔</span>
          <h1 className="mt-4 text-xl font-bold text-gray-100">Invalid invite link</h1>
          <p className="mt-2 text-sm text-gray-400">This link may have expired or is incorrect.</p>
        </div>
      </main>
    );
  }

  // Check if inviter already has an active or pending connection — link is unavailable
  const { data: inviterConn } = await admin
    .from("connections")
    .select("id, status")
    .or(`user_a_id.eq.${inviter.id},user_b_id.eq.${inviter.id}`)
    .in("status", ["active", "pending"])
    .maybeSingle();

  if (inviterConn) {
    return (
      <main className={pageClass}>
        <div className="text-center">
          <span className="text-5xl">💞</span>
          <h1 className="mt-4 text-xl font-bold text-gray-100">
            {inviterConn.status === "active" ? "Already connected" : "Link not available"}
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            {inviterConn.status === "active"
              ? `${inviter.display_name} is already in a couple.`
              : `${inviter.display_name} already has a pending connection request.`}
          </p>
        </div>
      </main>
    );
  }

  // Check if current user is logged in
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    if (user.id === inviter.id) {
      return (
        <main className={pageClass}>
          <div className="text-center">
            <span className="text-5xl">😅</span>
            <h1 className="mt-4 text-xl font-bold text-gray-100">That&apos;s your own link!</h1>
            <p className="mt-2 text-sm text-gray-400">Share it with your partner, not yourself.</p>
            <Link href="/partner" className="mt-6 inline-block rounded-2xl bg-lavender px-6 py-3 text-sm font-semibold text-white">
              Back to Partner
            </Link>
          </div>
        </main>
      );
    }

    // Check if visitor already has an active or pending connection
    const { data: existing } = await supabase
      .from("connections")
      .select("id, status")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .in("status", ["active", "pending"])
      .maybeSingle();

    if (existing?.status === "active") redirect("/dashboard");

    if (!existing) {
      const [a, b] = [user.id, inviter.id].sort();
      await admin.from("connections").upsert(
        { user_a_id: a, user_b_id: b, status: "pending", requester_id: user.id },
        { onConflict: "user_a_id,user_b_id" }
      );

      // Get requester's name to include in notification
      const { data: requesterProfile } = await admin
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();

      // Notify inviter
      await sendPushToUser(inviter.id, {
        title: "New connection request 💌",
        body: `${requesterProfile?.display_name ?? "Someone"} wants to connect with you`,
        url: "/dashboard",
      }).catch(() => {});
    }

    // Show waiting screen (don't redirect — connection is pending approval)
    return (
      <main className={pageClass}>
        <div className="w-full max-w-sm text-center">
          <span className="text-6xl">💌</span>
          <h1 className="mt-4 text-2xl font-bold text-gray-100">Request sent!</h1>
          <p className="mt-3 text-gray-400">
            Waiting for{" "}
            <span className="font-semibold text-lavender">{inviter.display_name}</span>{" "}
            to accept your connection request.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            They&apos;ll get a notification and need to approve before you&apos;re connected.
          </p>
          <Link
            href="/dashboard"
            className="mt-8 inline-block rounded-3xl bg-lavender px-6 py-3 text-sm font-semibold text-white"
          >
            Go to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  // Not logged in — show landing page
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 px-6">
      <div className="w-full max-w-sm text-center">
        <span className="text-6xl">💞</span>
        <h1 className="mt-4 text-3xl font-bold text-gray-100">Tether</h1>
        <p className="mt-3 text-gray-400">
          <span className="font-semibold text-lavender">{inviter.display_name}</span> has invited you to connect
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href={`/signup?next=/join/${upperCode}`}
            className="w-full rounded-3xl bg-lavender py-4 text-center font-semibold text-white shadow-card hover:bg-lavender-dark transition-all"
          >
            Create account
          </Link>
          <Link
            href={`/login?next=/join/${upperCode}`}
            className="w-full rounded-3xl border-2 border-lavender/50 py-4 text-center font-semibold text-lavender hover:bg-lavender/10 transition-all"
          >
            Log in
          </Link>
        </div>
      </div>
    </main>
  );
}
