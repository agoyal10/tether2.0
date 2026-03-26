"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  const [showGiphy, setShowGiphy] = useState(false);
  const [giphyQuery, setGiphyQuery] = useState("");
  const [giphyResults, setGiphyResults] = useState<{ id: string; url: string; preview: string; title: string }[]>([]);
  const [giphyLoading, setGiphyLoading] = useState(false);
  const giphyInputRef = useRef<HTMLInputElement>(null);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isInitialMount = useRef(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);

  const GIPHY_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY;

  // Fetch GIFs (trending when query empty, search otherwise)
  useEffect(() => {
    if (!showGiphy || !GIPHY_KEY) return;
    const controller = new AbortController();
    const delay = setTimeout(async () => {
      setGiphyLoading(true);
      try {
        const endpoint = giphyQuery.trim()
          ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(giphyQuery)}&limit=24&rating=pg-13`
          : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=24&rating=pg-13`;
        const res = await fetch(endpoint, { signal: controller.signal });
        const json = await res.json();
        setGiphyResults(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (json.data ?? []).map((g: any) => ({
            id: g.id,
            url: g.images.original.url,
            preview: g.images.fixed_width_small.url,
            title: g.title,
          }))
        );
      } catch { /* aborted or network error */ }
      setGiphyLoading(false);
    }, giphyQuery ? 400 : 0);
    return () => { clearTimeout(delay); controller.abort(); };
  }, [showGiphy, giphyQuery, GIPHY_KEY]);

  async function sendGif(url: string) {
    setShowGiphy(false);
    setGiphyQuery("");

    const optimisticId = `optimistic-${Date.now()}`;
    const optimistic: Message = {
      id: optimisticId,
      mood_log_id: moodLogId,
      sender_id: currentUserId,
      content: `giphy:${url}`,
      media_path: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    const { data: inserted } = await supabase.from("messages").insert({
      mood_log_id: moodLogId,
      sender_id: currentUserId,
      content: `giphy:${url}`,
      media_path: null,
    }).select().single();

    if (inserted) {
      setMessages((prev) => prev.map((m) => m.id === optimisticId ? { ...inserted } : m));
      broadcastMessage(inserted);
    }

    fetch("/api/push/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moodLogId, content: "Sent a GIF 🎞️" }),
    }).catch(() => {});
  }

  const EMOJIS =["❤️","💞","😘","🥰","😍","💋","🔥","💦","😈","🫦","🥵","💫","✨","🌹","💌","🫶","😊","😂","🤣","😭","🙈","💀","🫠","😏","🤭","😉","🧋","💯","👀","🤤"];
  const CUSTOM_STICKERS = [
    { src: "/sticker-angry.png",   alt: "angry",   traySize: "h-8 w-8", chatSize: "h-10 w-10" },
    { src: "/sticker-cozy.png",    alt: "cozy",    traySize: "h-8 w-8", chatSize: "h-10 w-10" },
    { src: "/sticker-payal.png",   alt: "Payal",   traySize: "h-8 w-8", chatSize: "h-10 w-10" },
    { src: "/sticker-katakna.png", alt: "katakna", traySize: "h-5 w-5", chatSize: "h-10 w-10" },
  ];
  const stickerChatSize: Record<string, string> = Object.fromEntries(
    CUSTOM_STICKERS.map((s) => [s.src, s.chatSize])
  );
  const supabase = useMemo(() => createClient(), []);

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
      // Broadcast: partner sends us a message directly via WebSocket (primary path)
      .on("broadcast", { event: "new_message" }, async ({ payload }) => {
        const incoming = payload.message as Message;
        if (incoming.sender_id === currentUserId) return; // already shown optimistically
        const { data: profile } = await supabase
          .from("profiles").select("*").eq("id", incoming.sender_id).single();
        const newMsg = { ...incoming, profile: profile as Profile };
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        if (newMsg.media_path) fetchSignedUrlsForPaths([newMsg.media_path]);
        setIsPartnerTyping(false);
      })
      // postgres_changes: fallback for reconnects / missed broadcasts
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
      }, async (payload) => {
        const incoming = payload.new as Message;
        if (incoming.mood_log_id !== moodLogId) return;
        if (incoming.sender_id === currentUserId) return; // sender already sees optimistic msg
        const { data: profile } = await supabase
          .from("profiles").select("*").eq("id", incoming.sender_id).single();
        const newMsg = { ...incoming, profile: profile as Profile };
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        if (newMsg.media_path) fetchSignedUrlsForPaths([newMsg.media_path]);
        setIsPartnerTyping(false);
      })
      .on("broadcast", { event: "typing" }, () => {
        setIsPartnerTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsPartnerTyping(false), 3000);
      })
      .subscribe();
    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moodLogId]);


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

  // Smooth scroll for new messages or typing indicator
  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPartnerTyping]);

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

  async function broadcastMessage(msg: Message) {
    channelRef.current?.send({
      type: "broadcast",
      event: "new_message",
      payload: { message: msg },
    });
  }

  async function sendMessage() {
    if ((!content.trim() && !pendingMedia) || sending) return;
    setSending(true);
    const trimmed = content.trim();
    const media = pendingMedia;

    // Optimistically show message immediately
    const optimisticId = `optimistic-${Date.now()}`;
    const optimistic: Message = {
      id: optimisticId,
      mood_log_id: moodLogId,
      sender_id: currentUserId,
      content: trimmed,
      media_path: media?.path ?? null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setContent("");
    setPendingMedia(null);
    setShowEmojis(false);

    const { data: inserted } = await supabase.from("messages").insert({
      mood_log_id: moodLogId,
      sender_id: currentUserId,
      content: trimmed,
      media_path: media?.path ?? null,
    }).select().single();

    if (inserted) {
      // Swap optimistic entry for real DB row
      setMessages((prev) => prev.map((m) => m.id === optimisticId ? { ...inserted } : m));
      broadcastMessage(inserted);
    }

    const notifContent = trimmed || (media?.type === "video" ? "Sent a video 🎥" : "Sent a photo 📷");
    fetch("/api/push/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moodLogId, content: notifContent }),
    }).catch(() => {});

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
                {msg.content?.startsWith("giphy:") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={msg.content.slice(6)} alt="GIF" className="mt-1 max-w-[200px] rounded-2xl" />
                ) : msg.content?.startsWith("/sticker-") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={msg.content} alt="sticker" className={`${stickerChatSize[msg.content] ?? "h-10 w-10"} object-contain`} />
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
                        <div className={cn("max-w-[78%] break-words rounded-3xl px-4 py-2.5 text-sm leading-relaxed shadow-soft", isMine ? isMineClass : isTheirsClass)}>
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
        <AnimatePresence>
          {isPartnerTyping && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="flex items-start"
            >
              <div className="rounded-3xl rounded-bl-md bg-white px-4 py-3 shadow-soft dark:bg-gray-800">
                <div className="flex gap-1 items-center h-4">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
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
                <img src={s.src} alt={s.alt} className={`${s.traySize} object-contain`} />
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

      {/* GIPHY picker */}
      {showGiphy && (
        <div className="border-t border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="px-3 pt-2 pb-1">
            <input
              ref={giphyInputRef}
              value={giphyQuery}
              onChange={(e) => setGiphyQuery(e.target.value)}
              placeholder="Search GIFs…"
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 placeholder:text-gray-300 focus:border-lavender focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              autoFocus
            />
          </div>
          <div className="h-48 overflow-y-auto px-2 pb-2">
            {giphyLoading ? (
              <div className="flex h-full items-center justify-center">
                <svg className="h-5 w-5 animate-spin text-lavender" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              </div>
            ) : !GIPHY_KEY ? (
              <p className="py-4 text-center text-xs text-gray-400">Add NEXT_PUBLIC_GIPHY_API_KEY to enable GIFs</p>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {giphyResults.map((gif) => (
                  <button
                    key={gif.id}
                    onClick={() => sendGif(gif.url)}
                    className="overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-lavender"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={gif.preview} alt={gif.title} className="h-20 w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="pb-1 text-center text-[9px] text-gray-300">Powered by GIPHY</p>
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
            onClick={() => { setShowGiphy((v) => !v); setShowEmojis(false); }}
            aria-label="GIF"
            className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded text-[10px] font-bold tracking-tight transition-all border", showGiphy ? "border-lavender bg-lavender text-white" : "border-gray-300 text-gray-400 hover:border-lavender hover:text-lavender dark:border-gray-600")}
          >
            GIF
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { setShowEmojis((v) => !v); setShowGiphy(false); }}
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
            onChange={(e) => {
              setContent(e.target.value);
              setShowEmojis(false);
              // Broadcast typing — throttle to once per second
              const now = Date.now();
              if (channelRef.current && now - lastTypingSentRef.current > 1000) {
                lastTypingSentRef.current = now;
                channelRef.current.send({ type: "broadcast", event: "typing", payload: {} });
              }
            }}
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
