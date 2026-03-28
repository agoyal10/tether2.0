"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface CoachMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sender_user_id: string | null;
  created_at: string;
}

export default function CoachPage() {
  const router = useRouter();
  const supabase = createClient();

  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [coachThinking, setCoachThinking] = useState(false); // either partner is waiting for coach
  const [input, setInput] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [disabled, setDisabled] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [myName, setMyName] = useState("You");
  const [partnerName, setPartnerName] = useState("Partner");
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    fetch("/api/ai/coach")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setDisabled(true); return; }
        setMessages(data.messages ?? []);
        setRemaining(data.remaining ?? 0);
        setUserId(data.userId ?? null);
        setMyName(data.myName ?? "You");
        setPartnerName(data.partnerName ?? "Partner");
        setConnectionId(data.connectionId ?? null);
      })
      .catch(() => setDisabled(true))
      .finally(() => setLoading(false));
  }, []);

  // Set up realtime: postgres_changes for new messages + broadcast for coach thinking state
  useEffect(() => {
    if (!connectionId) return;

    const channel = supabase.channel(`coach-${connectionId}`);
    channelRef.current = channel;

    channel
      // New messages inserted by either partner or the API
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "coach_messages", filter: `connection_id=eq.${connectionId}` },
        (payload) => {
          const msg = payload.new as CoachMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      )
      // Broadcast: one partner tells the other the coach is thinking
      .on("broadcast", { event: "coach_thinking" }, ({ payload }) => {
        setCoachThinking(payload.thinking as boolean);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [connectionId, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, coachThinking]);

  function broadcastThinking(thinking: boolean) {
    channelRef.current?.send({
      type: "broadcast",
      event: "coach_thinking",
      payload: { thinking },
    });
  }

  async function send() {
    const text = input.trim();
    if (!text || sending || coachThinking || remaining === 0) return;

    setSending(true);
    setCoachThinking(true);
    broadcastThinking(true);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();

      if (res.status === 503) { setDisabled(true); toast.error("Coach is currently unavailable"); return; }
      if (res.status === 429) { toast.error("Daily limit reached — come back tomorrow"); setRemaining(0); return; }
      if (!res.ok) throw new Error(data.error ?? "Failed");

      setRemaining(data.remaining ?? 0);
    } catch {
      toast.error("Couldn't send message");
      setInput(text);
    } finally {
      setSending(false);
      setCoachThinking(false);
      broadcastThinking(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const isMe = (msg: CoachMessage) => msg.role === "user" && msg.sender_user_id === userId;
  const isPartnerMsg = (msg: CoachMessage) => msg.role === "user" && msg.sender_user_id !== userId;

  const inputBlocked = coachThinking || sending || remaining === 0 || disabled;

  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Relationship Coach</h1>
          <p className="text-xs text-gray-400">Shared · Private · AI</p>
        </div>
        {remaining !== null && (
          <span className="text-xs text-gray-300 dark:text-gray-600">{remaining} left today</span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pb-2">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="h-6 w-6 animate-spin text-lavender" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : disabled ? (
          <div className="flex items-center justify-center py-20 text-center">
            <div>
              <p className="text-2xl mb-2">🔒</p>
              <p className="text-sm text-gray-400">Coach is currently unavailable</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-lavender-light to-blush-light">
              <svg viewBox="0 0 24 24" className="h-7 w-7 fill-lavender-dark"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>
            </div>
            <div>
              <p className="font-semibold text-gray-700 dark:text-gray-200">Your relationship coach</p>
              <p className="text-sm text-gray-400 mt-1">Ask anything about your relationship.<br />Both of you can chat here together.</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col gap-0.5 ${isMe(msg) ? "items-end" : "items-start"}`}>
              <span className={`text-[10px] text-gray-400 px-1 ${msg.role === "assistant" ? "pl-8" : ""}`}>
                {msg.role === "assistant" ? "Coach" : isMe(msg) ? myName : partnerName}
              </span>
              <div className={`flex items-start gap-2 ${isMe(msg) ? "flex-row-reverse" : "flex-row"}`}>
                {msg.role === "assistant" && (
                  <div className="flex h-6 w-6 mt-1 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-lavender to-blush">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>
                  </div>
                )}
                <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  isMe(msg)
                    ? "bg-lavender text-white rounded-br-sm"
                    : isPartnerMsg(msg)
                    ? "bg-blush-light text-gray-800 rounded-bl-sm"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-sm"
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Coach thinking indicator — visible to both partners */}
        {coachThinking && (
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-[10px] text-gray-400 pl-8">Coach</span>
            <div className="flex items-start gap-2">
              <div className="flex h-6 w-6 mt-1 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-lavender to-blush">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!disabled && (
        <div className="shrink-0 pt-2 border-t border-gray-100 dark:border-gray-800">
          {remaining === 0 ? (
            <p className="text-center text-xs text-gray-400 py-3">Daily limit reached — come back tomorrow</p>
          ) : coachThinking && !sending ? (
            <p className="text-center text-xs text-gray-400 py-3">Coach is responding…</p>
          ) : (
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = Math.min(el.scrollHeight, 96) + "px";
                }}
                placeholder="Ask your coach anything…"
                disabled={inputBlocked}
                rows={1}
                style={{ resize: "none", maxHeight: "96px" }}
                className="flex-1 rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-4 py-2.5 text-sm focus:border-lavender focus:outline-none focus:ring-2 focus:ring-lavender/30 transition-all overflow-y-auto disabled:opacity-50"
              />
              <button
                onClick={send}
                disabled={!input.trim() || inputBlocked}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lavender text-white disabled:opacity-40 transition-all hover:bg-lavender-dark"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
