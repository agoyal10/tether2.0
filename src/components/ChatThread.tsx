"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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

export default function ChatThread({ moodLogId, currentUserId, initialMessages }: ChatThreadProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<{ path: string; type: "image" | "video" } | null>(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isInitialMount = useRef(true);

  const EMOJIS = ["❤️","💞","😘","🥰","😍","💋","🔥","💦","😈","🫦","🥵","💫","✨","🌹","💌","🫶","😊","😂","🤣","😭","🙈","💀","🫠","😏","🤭","😉","🧋","💯","👀","🤤"];
  const CUSTOM_STICKERS = [
    { src: "/sticker-angry.png", alt: "angry", size: "h-8 w-8" },
    { src: "/sticker-cozy.png", alt: "cozy", size: "h-8 w-8" },
    { src: "/sticker-payal.png", alt: "Payal", size: "h-8 w-8" },
    { src: "/sticker-katakna.png", alt: "katakna", size: "h-5 w-5" },
  ];
  const supabase = createClient();

  // Fetch signed URLs for given paths
  async function fetchSignedUrlsForPaths(paths: string[]) {
    if (!paths.length) return;
    const res = await fetch("/api/media/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paths }),
    });
    const { urls } = await res.json();
    if (urls) setSignedUrls((prev) => ({ ...prev, ...urls }));
  }

  useEffect(() => {
    const paths = initialMessages.map((m) => m.media_path).filter(Boolean) as string[];
    fetchSignedUrlsForPaths(paths);
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${moodLogId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `mood_log_id=eq.${moodLogId}`,
      }, async (payload) => {
        const { data: profile } = await supabase
          .from("profiles").select("*").eq("id", payload.new.sender_id).single();
        const newMsg = { ...(payload.new as Message), profile: profile as Profile };
        setMessages((prev) => [...prev, newMsg]);
        if (newMsg.media_path) fetchSignedUrlsForPaths([newMsg.media_path]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [moodLogId, supabase]);


  // Scroll to bottom on first render (also after images load)
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    // Fallback: re-scroll after images/videos may have loaded and expanded content
    const timer = setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Smooth scroll for new messages
  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/media/upload", { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error ?? "Upload failed");
      setUploading(false);
      return;
    }

    const type = file.type.startsWith("video/") ? "video" : "image";
    setPendingMedia({ path: data.path, type });

    // Get a signed URL for the preview
    await fetchSignedUrlsForPaths([data.path]);
    setUploading(false);
  }

  async function sendMessage() {
    if ((!content.trim() && !pendingMedia) || sending) return;
    setSending(true);
    const trimmed = content.trim();
    const media = pendingMedia; // capture before any awaits

    await supabase.from("messages").insert({
      mood_log_id: moodLogId,
      sender_id: currentUserId,
      content: trimmed,
      media_path: media?.path ?? null,
    });

    const notifContent = trimmed || (media?.type === "video" ? "Sent a video 🎥" : "Sent a photo 📷");
    fetch("/api/push/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moodLogId, content: notifContent }),
    }).catch(() => {});

    setContent("");
    setPendingMedia(null);
    setShowEmojis(false);
    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function renderMedia(msg: Message) {
    if (!msg.media_path) return null;
    const url = signedUrls[msg.media_path];
    if (!url) return (
      <div className="mt-1 flex h-12 w-12 items-center justify-center">
        <svg className="h-5 w-5 animate-spin text-gray-300" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );

    const isVideo = msg.media_path.match(/\.(mp4|mov|webm|avi)$/i);
    if (isVideo) {
      return (
        <video
          src={url}
          controls
          playsInline
          className="mt-1 max-w-[240px] rounded-2xl overflow-hidden"
        />
      );
    }
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="Shared photo" className="mt-1 max-w-[240px] rounded-2xl object-cover" />
      </a>
    );
  }

  const isMineClass = "rounded-br-md bg-lavender text-white";
  const isTheirsClass = "rounded-bl-md bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-100";

  function isEmojiOnly(str: string) {
    return /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\u{FE0F}\u{200D}\s]+$/u.test(str.trim());
  }

  return (
    <div className="flex h-full flex-col">
      {/* Message list */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 dark:bg-gray-900">
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
                {msg.content?.startsWith("/sticker-") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={msg.content} alt="sticker" className="h-10 w-10 object-contain" />
                ) : msg.media_path && !msg.content ? (
                  <div className={cn("max-w-[78%]", isMine ? "items-end flex flex-col" : "items-start flex flex-col")}>
                    {renderMedia(msg)}
                  </div>
                ) : (
                  <>
                    {msg.media_path && renderMedia(msg)}
                    {msg.content && (
                      isEmojiOnly(msg.content) ? (
                        <span className="text-4xl leading-none">{msg.content}</span>
                      ) : (
                        <div className={cn("max-w-[78%] rounded-3xl px-4 py-2.5 text-sm leading-relaxed shadow-soft", isMine ? isMineClass : isTheirsClass)}>
                          {msg.content}
                        </div>
                      )
                    )}
                  </>
                )}
                <span className="text-[10px] text-gray-300 px-1">
                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Media preview */}
      {pendingMedia && signedUrls[pendingMedia.path] && (
        <div className="border-t border-gray-100 bg-white px-4 pt-3 dark:border-gray-800 dark:bg-gray-900">
          <div className="relative inline-block">
            {pendingMedia.type === "video" ? (
              <video src={signedUrls[pendingMedia.path]} className="h-24 rounded-xl object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={signedUrls[pendingMedia.path]} alt="Preview" className="h-24 rounded-xl object-cover" />
            )}
            <button
              onClick={() => setPendingMedia(null)}
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-white text-xs"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Emoji picker */}
      {showEmojis && (
        <div className="border-t border-gray-100 bg-white px-4 py-2 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap gap-1.5">
            {CUSTOM_STICKERS.map((s) => (
              <button
                key={s.src}
                onClick={async () => {
                  setShowEmojis(false);
                  await supabase.from("messages").insert({
                    mood_log_id: moodLogId,
                    sender_id: currentUserId,
                    content: s.src,
                    media_path: null,
                  });
                }}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.src} alt={s.alt} className={`${s.size} object-contain`} />
              </button>
            ))}
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => {
                  setContent((prev) => prev + e);
                  textareaRef.current?.focus();
                }}
                className="text-xl leading-none p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="border-t border-gray-100 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2 rounded-3xl border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-lavender focus-within:bg-white transition-all dark:border-gray-700 dark:bg-gray-800 dark:focus-within:bg-gray-700">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            aria-label="Attach media"
            className="flex h-7 w-7 shrink-0 items-center justify-center text-gray-400 hover:text-lavender transition-all disabled:opacity-40"
          >
            {uploading ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
              </svg>
            )}
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowEmojis((v) => !v)}
            aria-label="Emoji"
            className="flex h-7 w-7 shrink-0 items-center justify-center text-gray-400 hover:text-lavender transition-all"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
            </svg>
          </button>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => { setContent(e.target.value); setShowEmojis(false); }}
            onKeyDown={handleKeyDown}
            placeholder="Write a message…"
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none dark:text-gray-100 dark:placeholder:text-gray-600"
            style={{ maxHeight: "120px" }}
          />
          <button
            onClick={sendMessage}
            disabled={(!content.trim() && !pendingMedia) || sending}
            aria-label="Send"
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all",
              (content.trim() || pendingMedia)
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
