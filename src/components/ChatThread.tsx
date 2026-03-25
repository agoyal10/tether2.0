"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Message, Profile } from "@/types";

interface ChatThreadProps {
  moodLogId: string;
  currentUserId: string;
  initialMessages: Message[];
}

export default function ChatThread({
  moodLogId,
  currentUserId,
  initialMessages,
}: ChatThreadProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Subscribe to new messages in real-time
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${moodLogId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `mood_log_id=eq.${moodLogId}`,
        },
        async (payload) => {
          // Fetch sender profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", payload.new.sender_id)
            .single();

          setMessages((prev) => [
            ...prev,
            { ...(payload.new as Message), profile: profile as Profile },
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [moodLogId, supabase]);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!content.trim() || sending) return;
    setSending(true);

    await supabase.from("messages").insert({
      mood_log_id: moodLogId,
      sender_id: currentUserId,
      content: content.trim(),
    });

    setContent("");
    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 dark:bg-gray-900">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isMine = msg.sender_id === currentUserId;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex flex-col gap-0.5", isMine ? "items-end" : "items-start")}
              >
                <div
                  className={cn(
                    "max-w-[78%] rounded-3xl px-4 py-2.5 text-sm leading-relaxed shadow-soft",
                    isMine
                      ? "rounded-br-md bg-lavender text-white"
                      : "rounded-bl-md bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  )}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-gray-300 px-1">
                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-gray-100 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-end gap-2 rounded-3xl border border-gray-200 bg-gray-50 px-4 py-2 focus-within:border-lavender focus-within:bg-white transition-all dark:border-gray-700 dark:bg-gray-800 dark:focus-within:bg-gray-700">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a message…"
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none dark:text-gray-100 dark:placeholder:text-gray-600"
            style={{ maxHeight: "120px" }}
          />
          <button
            onClick={sendMessage}
            disabled={!content.trim() || sending}
            aria-label="Send"
            className={cn(
              "mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all",
              content.trim()
                ? "bg-lavender text-white hover:bg-lavender-dark"
                : "bg-gray-200 text-gray-400"
            )}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
