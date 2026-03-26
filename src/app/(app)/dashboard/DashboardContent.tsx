import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCachedProfile } from "@/lib/profile-cache";
import DashboardRefresher from "@/components/DashboardRefresher";
import { MiniCard, HistoryChip } from "@/components/DashboardCards";
import type { MoodLog } from "@/types";

export default async function DashboardContent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch profile (cached) and connection in parallel
  const [profile, { data: connection }] = await Promise.all([
    getCachedProfile(user.id),
    supabase.from("connections")
      .select("*")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .eq("status", "active")
      .maybeSingle(),
  ]);

  const partnerId = connection
    ? connection.user_a_id === user.id ? connection.user_b_id : connection.user_a_id
    : null;

  const admin = createAdminClient();

  // Fetch partner logs and own logs in parallel
  const [partnerLogsResult, myLogsResult] = await Promise.all([
    partnerId && connection
      ? admin
          .from("mood_logs")
          .select("*, profile:profiles!mood_logs_user_id_fkey(*)")
          .eq("user_id", partnerId)
          .gte("created_at", connection.created_at)
          .order("created_at", { ascending: false })
          .limit(6)
      : Promise.resolve({ data: [] as MoodLog[], error: null }),
    supabase
      .from("mood_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", connection?.created_at ?? new Date(0).toISOString())
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const partnerLogs = (partnerLogsResult.data ?? []) as MoodLog[];
  const myLogs = (myLogsResult.data ?? []) as MoodLog[];

  // Fetch reads and messages in parallel
  const allLogIds = [...partnerLogs, ...myLogs].map((l) => l.id);
  const safeLogIds = allLogIds.length > 0 ? allLogIds : ["none"];

  const [{ data: reads }, { data: allMessages }] = await Promise.all([
    supabase
      .from("chat_reads")
      .select("mood_log_id, last_read_at")
      .eq("user_id", user.id)
      .in("mood_log_id", safeLogIds),
    supabase
      .from("messages")
      .select("mood_log_id, sender_id, created_at")
      .in("mood_log_id", safeLogIds),
  ]);

  const lastReadMap: Record<string, string> = {};
  (reads ?? []).forEach(({ mood_log_id, last_read_at }: { mood_log_id: string; last_read_at: string }) => {
    lastReadMap[mood_log_id] = last_read_at;
  });

  const unreadCounts: Record<string, number> = {};
  (allMessages ?? []).forEach(({ mood_log_id, sender_id, created_at }: { mood_log_id: string; sender_id: string; created_at: string }) => {
    if (sender_id === user.id) return;
    const lastRead = lastReadMap[mood_log_id];
    if (lastRead && new Date(created_at) <= new Date(lastRead)) return;
    unreadCounts[mood_log_id] = (unreadCounts[mood_log_id] ?? 0) + 1;
  });

  const partnerName = partnerLogs[0]?.profile?.display_name ?? "Partner";
  const myName = profile?.display_name ?? "You";

  return (
    <>
      {partnerId && <DashboardRefresher partnerId={partnerId} />}

      {/* Greeting */}
      <div>
        <p className="text-sm text-gray-400">Welcome back,</p>
        <h1 className="text-2xl font-bold text-gray-800">{myName} 💞</h1>
      </div>

      {!connection ? (
        /* No partner yet */
        <div className="rounded-3xl border-2 border-dashed border-lavender-light bg-lavender-light/40 p-6 text-center">
          <span className="text-3xl">💌</span>
          <p className="mt-2 text-sm font-medium text-lavender-dark">No partner connected yet</p>
          <Link href="/partner" className="mt-3 inline-block rounded-2xl bg-lavender px-5 py-2 text-sm font-semibold text-white">
            Connect Partner
          </Link>
        </div>
      ) : (
        <>
          {/* ── Side-by-side latest check-ins ── */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Latest Check-ins
            </h2>
            <div className="grid grid-cols-2 gap-3 pt-3 px-1">
              {/* Partner */}
              {partnerLogs[0] ? (
                <MiniCard
                  log={partnerLogs[0]}
                  label={partnerName}
                  unread={unreadCounts[partnerLogs[0].id] ?? 0}
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-gray-100 p-4 text-center">
                  <span className="text-2xl">💤</span>
                  <p className="text-xs text-gray-400">No check-in yet</p>
                </div>
              )}

              {/* Mine */}
              {myLogs[0] ? (
                <MiniCard
                  log={myLogs[0]}
                  label="You"
                  unread={unreadCounts[myLogs[0].id] ?? 0}
                />
              ) : (
                <Link
                  href="/checkin"
                  className="flex flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-lavender-light bg-lavender-light/30 p-4 text-center"
                >
                  <span className="text-2xl">✨</span>
                  <p className="text-xs font-medium text-lavender-dark">Check in now</p>
                </Link>
              )}
            </div>
          </section>

          {/* ── History strips ── */}
          {(partnerLogs.length > 1 || myLogs.length > 1) && (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Recent History
              </h2>
              <div className="flex flex-col gap-3">
                {/* Partner history */}
                {partnerLogs.length > 1 && (
                  <div>
                    <p className="mb-2 text-xs text-gray-400">{partnerName}</p>
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {partnerLogs.slice(1).map((log) => (
                        <HistoryChip key={log.id} log={log} unread={unreadCounts[log.id] ?? 0} />
                      ))}
                    </div>
                  </div>
                )}
                {/* My history */}
                {myLogs.length > 1 && (
                  <div>
                    <p className="mb-2 text-xs text-gray-400">You</p>
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {myLogs.slice(1).map((log) => (
                        <HistoryChip key={log.id} log={log} unread={unreadCounts[log.id] ?? 0} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
