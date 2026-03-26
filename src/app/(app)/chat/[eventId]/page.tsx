import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChatThread from "@/components/ChatThread";
import MoodCard from "@/components/MoodCard";
import type { Message, MoodLog } from "@/types";

interface Props {
  params: Promise<{ eventId: string }>;
}

export default async function ChatPage({ params }: Props) {
  const { eventId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: log } = await supabase
    .from("mood_logs")
    .select("*, profile:profiles!mood_logs_user_id_fkey(*)")
    .eq("id", eventId)
    .single<MoodLog>();

  if (!log) notFound();

  // If viewing someone else's log, verify an active connection exists that predates the log
  if (log.user_id !== user.id) {
    const { data: connection } = await supabase
      .from("connections")
      .select("created_at")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .or(`user_a_id.eq.${log.user_id},user_b_id.eq.${log.user_id}`)
      .eq("status", "active")
      .lte("created_at", log.created_at)
      .maybeSingle();
    if (!connection) notFound();
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("*, profile:profiles(*), reply_to:messages!reply_to_id(id, content, sender_id, media_path, profile:profiles(display_name))")
    .eq("mood_log_id", eventId)
    .order("created_at", { ascending: true });

  // Mark this chat as read (upsert last_read_at to now)
  await supabase.from("chat_reads").upsert(
    { user_id: user.id, mood_log_id: eventId, last_read_at: new Date().toISOString() },
    { onConflict: "user_id,mood_log_id" }
  );

  // Mark resolved if partner is viewing
  if (log.user_id !== user.id && !log.is_resolved) {
    await supabase.from("mood_logs").update({ is_resolved: true }).eq("id", eventId);
  }

  return (
    <div className="flex h-[calc(100dvh-5rem)] flex-col gap-4">
      <div>
        <h1 className="mb-3 text-xl font-bold text-gray-800">Chat</h1>
        <MoodCard log={log} isPartner={log.user_id !== user.id} hideLink />
      </div>
      <div className="-mx-4 flex-1 overflow-hidden rounded-t-4xl bg-white shadow-card">
        <ChatThread
          moodLogId={eventId}
          currentUserId={user.id}
          initialMessages={(messages ?? []) as Message[]}
        />
      </div>
    </div>
  );
}
