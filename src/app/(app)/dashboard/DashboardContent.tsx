import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCachedProfile } from "@/lib/profile-cache";
import DashboardRefresher from "@/components/DashboardRefresher";
import ConnectionRequestWatcher from "@/components/ConnectionRequestWatcher";
import LastSeenUpdater from "@/components/LastSeenUpdater";
import { MiniCard, HistoryChip } from "@/components/DashboardCards";
import PendingConnectionBanner from "@/components/PendingConnectionBanner";
import WeeklyInsightCard from "@/components/WeeklyInsightCard";
import DateIdeasCard from "@/components/DateIdeasCard";
import type { MoodLog, Reaction } from "@/types";

function computeStreak(
  myLogs: { created_at: string }[],
  partnerLogs: { created_at: string }[]
): number {
  const myDates = new Set(myLogs.map((l) => l.created_at.slice(0, 10)));
  const partnerDates = new Set(partnerLogs.map((l) => l.created_at.slice(0, 10)));
  const today = new Date().toISOString().slice(0, 10);
  const checkFrom = new Date();
  // If today isn't complete for both, start counting from yesterday
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
  return streak;
}

export default async function DashboardContent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch profile, active connection, and pending requests in parallel
  const [profile, { data: connection }, { data: pendingConns }] = await Promise.all([
    getCachedProfile(user.id),
    supabase.from("connections")
      .select("*")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .eq("status", "active")
      .maybeSingle(),
    supabase.from("connections")
      .select("id, requester_id")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .eq("status", "pending")
      .neq("requester_id", user.id),
  ]);

  const partnerId = connection
    ? connection.user_a_id === user.id ? connection.user_b_id : connection.user_a_id
    : null;

  const admin = createAdminClient();

  // Resolve requester names for pending connection requests
  const pendingRequests: { id: string; requesterName: string }[] = [];
  if (pendingConns?.length) {
    const requesterIds = pendingConns.map((c) => c.requester_id).filter(Boolean) as string[];
    const { data: requesterProfiles } = await admin
      .from("profiles")
      .select("id, display_name")
      .in("id", requesterIds);
    const nameMap = Object.fromEntries((requesterProfiles ?? []).map((p) => [p.id, p.display_name]));
    for (const conn of pendingConns) {
      if (conn.requester_id) {
        pendingRequests.push({ id: conn.id, requesterName: nameMap[conn.requester_id] ?? "Someone" });
      }
    }
  }

  // Fetch logs (extra for streak calc), partner last_seen, reads, messages in parallel
  const since90 = new Date();
  since90.setDate(since90.getDate() - 90);

  const [partnerLogsResult, myLogsResult, partnerProfileResult] = await Promise.all([
    partnerId && connection
      ? admin
          .from("mood_logs")
          .select("*, profile:profiles!mood_logs_user_id_fkey(*)")
          .eq("user_id", partnerId)
          .gte("created_at", connection.created_at)
          .order("created_at", { ascending: false })
          .limit(60)
      : Promise.resolve({ data: [] as MoodLog[], error: null }),
    supabase
      .from("mood_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", connection?.created_at ?? new Date(0).toISOString())
      .order("created_at", { ascending: false })
      .limit(60),
    partnerId
      ? admin.from("profiles").select("display_name, last_seen_at").eq("id", partnerId).single<{ display_name: string; last_seen_at: string | null }>()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const partnerLogs = (partnerLogsResult.data ?? []) as MoodLog[];
  const myLogs = (myLogsResult.data ?? []) as MoodLog[];

  const streak = partnerId ? computeStreak(myLogs, partnerLogs) : 0;

  // Only pass last 6 to display cards
  const partnerLogsDisplay = partnerLogs.slice(0, 6);
  const myLogsDisplay = myLogs.slice(0, 6);

  const allLogIds = [...partnerLogsDisplay, ...myLogsDisplay].map((l) => l.id);
  const safeLogIds = allLogIds.length > 0 ? allLogIds : ["none"];

  const [{ data: reads }, { data: allMessages }, { data: allReactions }] = await Promise.all([
    supabase
      .from("chat_reads")
      .select("mood_log_id, last_read_at")
      .eq("user_id", user.id)
      .in("mood_log_id", safeLogIds),
    supabase
      .from("messages")
      .select("mood_log_id, sender_id, created_at")
      .in("mood_log_id", safeLogIds),
    supabase
      .from("reactions")
      .select("*")
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

  // Group reactions by mood_log_id
  const reactionsByLog: Record<string, Reaction[]> = {};
  (allReactions ?? []).forEach((r: Reaction) => {
    if (!reactionsByLog[r.mood_log_id]) reactionsByLog[r.mood_log_id] = [];
    reactionsByLog[r.mood_log_id].push(r);
  });

  const partnerName = partnerProfileResult.data?.display_name ?? partnerLogs[0]?.profile?.display_name ?? "Partner";
  const partnerLastSeen = partnerProfileResult.data?.last_seen_at ?? null;
  const myName = profile?.display_name ?? "You";

  return (
    <>
      <LastSeenUpdater userId={user.id} />
      <ConnectionRequestWatcher userId={user.id} />
      {partnerId && <DashboardRefresher partnerId={partnerId} />}

      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">Welcome back,</p>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{myName} 💞</h1>
        </div>
        {streak > 0 && (
          <div className="flex flex-col items-center rounded-2xl bg-orange-50 dark:bg-orange-950/30 px-3 py-2 shrink-0">
            <span className="text-xl">🔥</span>
            <span className="text-xs font-bold text-orange-500">{streak}d</span>
          </div>
        )}
      </div>

      {/* Pending connection requests */}
      {pendingRequests.length > 0 && (
        <PendingConnectionBanner requests={pendingRequests} />
      )}

      {!connection ? (
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
              {partnerLogs[0] ? (
                <MiniCard
                  log={partnerLogsDisplay[0]}
                  label={partnerName}
                  unread={unreadCounts[partnerLogsDisplay[0].id] ?? 0}
                  reactions={reactionsByLog[partnerLogsDisplay[0].id] ?? []}
                  currentUserId={user.id}
                  lastSeen={partnerLastSeen}
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800 p-4 text-center">
                  <span className="text-2xl">💤</span>
                  <p className="text-xs text-gray-400">No check-in yet</p>
                  {partnerLastSeen && (
                    <p className="text-[10px] text-gray-300">{formatLastSeen(partnerLastSeen)}</p>
                  )}
                </div>
              )}

              {myLogsDisplay[0] ? (
                <MiniCard
                  log={myLogsDisplay[0]}
                  label="You"
                  unread={unreadCounts[myLogsDisplay[0].id] ?? 0}
                  reactions={reactionsByLog[myLogsDisplay[0].id] ?? []}
                  currentUserId={user.id}
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

          {/* ── Weekly AI Insight ── */}
          <WeeklyInsightCard />

          {/* ── Date Ideas ── */}
          <DateIdeasCard />

          {/* ── History strips ── */}
          {(partnerLogsDisplay.length > 1 || myLogsDisplay.length > 1) && (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Recent History
              </h2>
              <div className="flex flex-col gap-3">
                {partnerLogsDisplay.length > 1 && (
                  <div>
                    <p className="mb-2 text-xs text-gray-400">{partnerName}</p>
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {partnerLogsDisplay.slice(1).map((log) => (
                        <HistoryChip key={log.id} log={log} unread={unreadCounts[log.id] ?? 0} />
                      ))}
                    </div>
                  </div>
                )}
                {myLogsDisplay.length > 1 && (
                  <div>
                    <p className="mb-2 text-xs text-gray-400">You</p>
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {myLogsDisplay.slice(1).map((log) => (
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

function formatLastSeen(lastSeen: string): string {
  const diff = Date.now() - new Date(lastSeen).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "Active just now";
  if (mins < 60) return `Active ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Active ${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `Active ${days}d ago`;
}
