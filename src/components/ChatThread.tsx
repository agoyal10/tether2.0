"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
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
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [locating, setLocating] = useState(false);
  const [showMusic, setShowMusic] = useState(false);
  const [musicQuery, setMusicQuery] = useState("");
  const [musicResults, setMusicResults] = useState<SpotifyTrack[]>([]);
  const [musicLoading, setMusicLoading] = useState(false);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const [giphyQuery, setGiphyQuery] = useState("");
  const [giphyResults, setGiphyResults] = useState<{ id: string; url: string; preview: string; title: string }[]>([]);
  const [giphyLoading, setGiphyLoading] = useState(false);
  const giphyInputRef = useRef<HTMLInputElement>(null);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesContentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isInitialMount = useRef(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);
  const pushDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [imgScale, setImgScale] = useState(1);
  const [imgTranslate, setImgTranslate] = useState({ x: 0, y: 0 });
  const pinchRef = useRef<{ startDist: number; startScale: number } | null>(null);
  const panRef = useRef<{ startX: number; startY: number; startTx: number; startTy: number } | null>(null);

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

    if (pushDebounceRef.current) clearTimeout(pushDebounceRef.current);
    pushDebounceRef.current = setTimeout(() => {
      fetch("/api/push/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moodLogId, content: "Sent a GIF 🎞️" }),
      }).catch(() => {});
    }, 2000);
  }

  async function sendLocation() {
    setShowAttachMenu(false);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        const locContent = `location:${latitude.toFixed(6)},${longitude.toFixed(6)}`;

        const optimisticId = `optimistic-${Date.now()}`;
        const optimistic: Message = {
          id: optimisticId,
          mood_log_id: moodLogId,
          sender_id: currentUserId,
          content: locContent,
          media_path: null,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimistic]);

        const { data: inserted } = await supabase.from("messages").insert({
          mood_log_id: moodLogId,
          sender_id: currentUserId,
          content: locContent,
          media_path: null,
        }).select().single();

        if (inserted) {
          setMessages((prev) => prev.map((m) => m.id === optimisticId ? { ...inserted } : m));
          broadcastMessage(inserted);
        }

        if (pushDebounceRef.current) clearTimeout(pushDebounceRef.current);
        pushDebounceRef.current = setTimeout(() => {
          fetch("/api/push/message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ moodLogId, content: "Shared their location 📍" }),
          }).catch(() => {});
        }, 2000);
      },
      () => {
        setLocating(false);
        alert("Could not get your location. Please allow location access and try again.");
      },
      { timeout: 10000 }
    );
  }

  async function requestLocation() {
    setShowAttachMenu(false);
    const locContent = `location-request:`;

    const optimisticId = `optimistic-${Date.now()}`;
    const optimistic: Message = {
      id: optimisticId,
      mood_log_id: moodLogId,
      sender_id: currentUserId,
      content: locContent,
      media_path: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    const { data: inserted } = await supabase.from("messages").insert({
      mood_log_id: moodLogId,
      sender_id: currentUserId,
      content: locContent,
      media_path: null,
    }).select().single();

    if (inserted) {
      setMessages((prev) => prev.map((m) => m.id === optimisticId ? { ...inserted } : m));
      broadcastMessage(inserted);
    }

    if (pushDebounceRef.current) clearTimeout(pushDebounceRef.current);
    pushDebounceRef.current = setTimeout(() => {
      fetch("/api/push/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moodLogId, content: "Wants to know where you are 📍" }),
      }).catch(() => {});
    }, 2000);
  }

  type SpotifyTrack = {
    id: string;
    name: string;
    artist: string;
    album: string;
    image: string;
    preview: string | null;
    url: string;
  };

  const [musicError, setMusicError] = useState<string | null>(null);

  useEffect(() => {
    if (!showMusic) return;
    const controller = new AbortController();
    const delay = setTimeout(async () => {
      if (!musicQuery.trim()) { setMusicResults([]); setMusicError(null); return; }
      setMusicLoading(true);
      setMusicError(null);
      try {
        const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(musicQuery)}`, { signal: controller.signal });
        const json = await res.json();
        if (!res.ok) {
          setMusicError(json.error ?? "Search failed");
          setMusicResults([]);
        } else {
          setMusicResults(json.tracks ?? []);
        }
      } catch { /* aborted */ }
      setMusicLoading(false);
    }, 400);
    return () => { clearTimeout(delay); controller.abort(); };
  }, [showMusic, musicQuery]);

  async function sendTrack(track: SpotifyTrack) {
    setShowMusic(false);
    setMusicQuery("");
    setMusicResults([]);

    const trackContent = `spotify:${JSON.stringify(track)}`;
    const optimisticId = `optimistic-${Date.now()}`;
    const optimistic: Message = {
      id: optimisticId,
      mood_log_id: moodLogId,
      sender_id: currentUserId,
      content: trackContent,
      media_path: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    const { data: inserted } = await supabase.from("messages").insert({
      mood_log_id: moodLogId,
      sender_id: currentUserId,
      content: trackContent,
      media_path: null,
    }).select().single();

    if (inserted) {
      setMessages((prev) => prev.map((m) => m.id === optimisticId ? { ...inserted } : m));
      broadcastMessage(inserted);
    }

    if (pushDebounceRef.current) clearTimeout(pushDebounceRef.current);
    pushDebounceRef.current = setTimeout(() => {
      fetch("/api/push/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moodLogId, content: `Shared a song: ${track.name} — ${track.artist} 🎵` }),
      }).catch(() => {});
    }, 2000);
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

  // Re-fetch messages when app comes back to foreground (e.g. tapping a push notification)
  useEffect(() => {
    async function refetchOnVisible() {
      if (document.visibilityState !== "visible") return;
      const { data } = await supabase
        .from("messages")
        .select("*, profile:profiles(*), media_path")
        .eq("mood_log_id", moodLogId)
        .order("created_at", { ascending: true });
      if (!data) return;
      setMessages(data as Message[]);
      const paths = (data as Message[]).map((m) => m.media_path).filter(Boolean) as string[];
      if (paths.length) fetchSignedUrlsForPaths(paths);
    }
    document.addEventListener("visibilitychange", refetchOnVisible);
    return () => document.removeEventListener("visibilitychange", refetchOnVisible);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moodLogId]);

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


  // Scroll to bottom on first render, then keep scrolling as images load and expand content
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;

    // ResizeObserver: re-scroll whenever content height grows (images loading in)
    // Stop after 5 seconds so we don't fight the user scrolling up
    let active = true;
    const timer = setTimeout(() => { active = false; }, 5000);
    const observer = new ResizeObserver(() => {
      if (active) container.scrollTop = container.scrollHeight;
    });
    // Observe the wrapper div containing all messages
    const inner = messagesContentRef.current ?? container.firstElementChild;
    if (inner) observer.observe(inner);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  // Smooth scroll for new messages or typing indicator
  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPartnerTyping]);

  async function compressImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const MAX = 2048;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
          else { width = Math.round(width * MAX / height); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Compression failed")), "image/jpeg", 0.85);
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setShowAttachMenu(false);

    setUploading(true);
    const uploadToast = toast.loading("Uploading…");

    try {
      const isVideo = file.type.startsWith("video/");
      let uploadBlob: Blob = file;
      let filename = file.name;

      // Compress images (handles HEIC→JPEG conversion + size reduction)
      if (!isVideo) {
        uploadBlob = await compressImage(file);
        filename = filename.replace(/\.[^.]+$/, ".jpg");
      }

      const formData = new FormData();
      formData.append("file", new File([uploadBlob], filename, { type: isVideo ? file.type : "image/jpeg" }));

      const res = await fetch("/api/media/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Upload failed", { id: uploadToast });
        return;
      }

      setPendingMedia({ path: data.path, type: isVideo ? "video" : "image" });
      await fetchSignedUrlsForPaths([data.path]);
      toast.dismiss(uploadToast);
    } catch (err) {
      console.error("[upload]", err);
      toast.error("Upload failed — try again", { id: uploadToast });
    } finally {
      setUploading(false);
    }
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
    if (textareaRef.current) { textareaRef.current.style.height = "auto"; }
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
    // Debounce push: wait 2s after last message before notifying partner
    if (pushDebounceRef.current) clearTimeout(pushDebounceRef.current);
    pushDebounceRef.current = setTimeout(() => {
      fetch("/api/push/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moodLogId, content: notifContent }),
      }).catch(() => {});
    }, 2000);

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
      <button onClick={() => setLightboxUrl(url)} className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="Shared photo" className="mt-1 max-w-[240px] rounded-2xl object-cover" />
      </button>
    );
  }

  // Reset zoom when lightbox opens/closes
  useEffect(() => {
    setImgScale(1);
    setImgTranslate({ x: 0, y: 0 });
  }, [lightboxUrl]);

  function handleLightboxTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      );
      pinchRef.current = { startDist: dist, startScale: imgScale };
      panRef.current = null;
    } else if (e.touches.length === 1) {
      panRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        startTx: imgTranslate.x,
        startTy: imgTranslate.y,
      };
      pinchRef.current = null;
    }
  }

  function handleLightboxTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && pinchRef.current) {
      const dist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      );
      const newScale = Math.min(5, Math.max(1, pinchRef.current.startScale * (dist / pinchRef.current.startDist)));
      setImgScale(newScale);
      if (newScale <= 1) setImgTranslate({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && panRef.current && imgScale > 1) {
      const dx = e.touches[0].clientX - panRef.current.startX;
      const dy = e.touches[0].clientY - panRef.current.startY;
      setImgTranslate({ x: panRef.current.startTx + dx, y: panRef.current.startTy + dy });
    }
  }

  function handleLightboxTouchEnd() {
    pinchRef.current = null;
    panRef.current = null;
    setImgScale((prev) => {
      if (prev < 1) { setImgTranslate({ x: 0, y: 0 }); return 1; }
      return prev;
    });
  }

  const isMineClass = "rounded-br-md bg-lavender text-white";
  const isTheirsClass = "rounded-bl-md bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-100";

  function renderTextWithLinks(text: string) {
    const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) =>
      i % 2 === 1 ? (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline break-all opacity-90">
          {part}
        </a>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  }

  function isEmojiOnly(str: string) {
    return /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\u{FE0F}\u{200D}\s]+$/u.test(str.trim());
  }

  return (
    <div className="flex h-full flex-col">
      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => { if (imgScale <= 1) setLightboxUrl(null); }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Photo"
            className="max-h-full max-w-full object-contain"
            style={{
              transform: `translate(${imgTranslate.x}px, ${imgTranslate.y}px) scale(${imgScale})`,
              transition: pinchRef.current || panRef.current ? "none" : "transform 0.15s ease",
              touchAction: "none",
              cursor: imgScale > 1 ? "grab" : "default",
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleLightboxTouchStart}
            onTouchMove={handleLightboxTouchMove}
            onTouchEnd={handleLightboxTouchEnd}
          />
          <div className="absolute flex items-center gap-2" style={{ top: "calc(env(safe-area-inset-top, 0px) + 12px)", right: "12px" }}>
            <button
              className="flex h-7 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white px-2.5 text-[11px] font-semibold"
              onClick={(e) => {
                e.stopPropagation();
                const win = window.open("", "_blank");
                if (!win) return;
                win.document.write("<html><body style='margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh'><p style='color:white;font-family:sans-serif'>Loading…</p></body></html>");
                fetch(lightboxUrl).then((r) => r.blob()).then((blob) => { win.location.href = URL.createObjectURL(blob); }).catch(() => win.close());
              }}
            >Open</button>
            <button
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white text-base font-bold"
              onClick={() => setLightboxUrl(null)}
            >×
            </button>
          </div>
        </div>
      )}
      {/* Message list */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4 dark:bg-gray-900">
        <div ref={messagesContentRef} className="flex flex-col gap-3">
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
                {msg.content?.startsWith("location:") ? (() => {
                  const [lat, lng] = msg.content.slice(9).split(",").map(Number);
                  const mapsUrl = `https://maps.google.com/maps?q=${lat},${lng}`;
                  const senderName = msg.profile?.display_name;
                  const label = isMine ? "Your location" : `${senderName}'s location`;
                  return (
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="block">
                      <div className={cn("flex items-center gap-3 rounded-2xl px-4 py-3 max-w-[220px] shadow-soft", isMine ? "bg-lavender text-white" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100")}>
                        <span className="text-2xl shrink-0">📍</span>
                        <div>
                          <p className="text-xs font-semibold">{label}</p>
                          <p className={cn("text-[10px] mt-0.5", isMine ? "text-white/70" : "text-gray-400")}>Tap to open in Maps</p>
                        </div>
                      </div>
                    </a>
                  );
                })() : msg.content?.startsWith("location-request:") ? (() => {
                  const senderName = msg.profile?.display_name;
                  const requestLabel = isMine ? "You requested their location" : `${senderName} wants to know your location`;
                  return (
                    <div className={cn("rounded-2xl px-4 py-3 max-w-[220px] shadow-soft", isMine ? "bg-lavender text-white" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100")}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">📍</span>
                        <p className="text-xs font-semibold">{requestLabel}</p>
                      </div>
                      {!isMine && (
                        <button
                          onClick={sendLocation}
                          disabled={locating}
                          className="w-full rounded-xl bg-lavender py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                        >
                          {locating ? "Getting location…" : "Share my location"}
                        </button>
                      )}
                    </div>
                  );
                })() : msg.content?.startsWith("spotify:") ? (() => {
                  let track: SpotifyTrack | null = null;
                  try { track = JSON.parse(msg.content.slice(8)); } catch { return null; }
                  if (!track) return null;
                  return (
                    <div className={cn("rounded-2xl overflow-hidden max-w-[260px] shadow-soft", isMine ? "bg-lavender text-white" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100")}>
                      <div className="flex items-center gap-3 p-3">
                        {track.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={track.image} alt={track.album} className="h-12 w-12 rounded-lg shrink-0 object-cover" />
                        ) : (
                          <div className="h-12 w-12 rounded-lg shrink-0 bg-black/20 flex items-center justify-center text-xl">🎵</div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate">{track.name}</p>
                          <p className={cn("text-[11px] truncate mt-0.5", isMine ? "text-white/70" : "text-gray-400")}>{track.artist}</p>
                          <p className={cn("text-[10px] truncate", isMine ? "text-white/50" : "text-gray-300")}>{track.album}</p>
                        </div>
                      </div>
                      {track.preview && (
                        <audio controls src={track.preview} className="w-full h-8" style={{ colorScheme: isMine ? "dark" : "light" }} />
                      )}
                      <a
                        href={track.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn("flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold border-t", isMine ? "border-white/20 text-white/80 hover:text-white" : "border-gray-100 dark:border-gray-700 text-[#1DB954] hover:text-[#1aa34a]")}
                      >
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                        Open in Spotify
                      </a>
                    </div>
                  );
                })() : msg.content?.startsWith("giphy:") ? (
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
                          {renderTextWithLinks(msg.content)}
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
                onMouseDown={(e) => e.preventDefault()}
                onClick={async () => {
                  setShowEmojis(false);

                  // Optimistically show the sticker immediately
                  const optimisticId = `optimistic-${Date.now()}`;
                  const optimistic: Message = {
                    id: optimisticId,
                    mood_log_id: moodLogId,
                    sender_id: currentUserId,
                    content: s.src,
                    media_path: null,
                    created_at: new Date().toISOString(),
                  };
                  setMessages((prev) => [...prev, optimistic]);

                  const { data: inserted } = await supabase.from("messages").insert({
                    mood_log_id: moodLogId,
                    sender_id: currentUserId,
                    content: s.src,
                    media_path: null,
                  }).select().single();

                  if (inserted) {
                    setMessages((prev) => prev.map((m) => m.id === optimisticId ? { ...inserted } : m));
                    broadcastMessage(inserted);
                  }
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
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setContent((prev) => prev + e);
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
          <div className="px-3 pt-2 pb-1 flex items-center gap-2">
            <input
              ref={giphyInputRef}
              value={giphyQuery}
              onChange={(e) => setGiphyQuery(e.target.value)}
              placeholder="Search GIFs…"
              className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 placeholder:text-gray-300 focus:border-lavender focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              autoFocus
            />
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { setShowGiphy(false); setGiphyQuery(""); }}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none px-1"
            >
              ×
            </button>
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

      {/* Attach tray (photo / GIF / location) */}
      {showAttachMenu && (
        <div className="border-t border-gray-100 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
          <div className="grid grid-cols-4 gap-2">
            {/* Photo */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex flex-col items-center gap-1.5 rounded-2xl bg-gray-50 py-3 text-gray-500 hover:bg-lavender/10 hover:text-lavender transition-all dark:bg-gray-800 dark:text-gray-400 disabled:opacity-40"
            >
              {uploading ? (
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
              )}
              <span className="text-[11px] font-medium">Photo</span>
            </button>
            {/* GIF */}
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { setShowAttachMenu(false); setShowGiphy(true); setShowEmojis(false); }}
              className="flex flex-col items-center gap-1.5 rounded-2xl bg-gray-50 py-3 text-gray-500 hover:bg-lavender/10 hover:text-lavender transition-all dark:bg-gray-800 dark:text-gray-400"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M11.5 9H13v6h-1.5V9zm-4 0H10c.8 0 1.5.7 1.5 1.5v1c0 .6-.4 1.2-1 1.4l1 2.1H10l-.9-2H9V15H7.5V9h-1zm1.5 3h1v-1.5H9V12zm8-3h-3v6h1.5v-2H18v-1.5h-1.5v-1H18V9z"/><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16H5V5h14v14z"/></svg>
              <span className="text-[11px] font-medium">GIF</span>
            </button>
            {/* Location */}
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={sendLocation}
              disabled={locating}
              className="flex flex-col items-center gap-1.5 rounded-2xl bg-gray-50 py-3 text-gray-500 hover:bg-lavender/10 hover:text-lavender transition-all dark:bg-gray-800 dark:text-gray-400 disabled:opacity-40"
            >
              {locating ? (
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              )}
              <span className="text-[11px] font-medium">{locating ? "…" : "Location"}</span>
            </button>
            {/* Music */}
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { setShowAttachMenu(false); setShowMusic(true); setTimeout(() => musicInputRef.current?.focus(), 50); }}
              className="flex flex-col items-center gap-1.5 rounded-2xl bg-gray-50 py-3 text-gray-500 hover:bg-lavender/10 hover:text-lavender transition-all dark:bg-gray-800 dark:text-gray-400"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6Z"/>
              </svg>
              <span className="text-[11px] font-medium">Music</span>
            </button>
          </div>
          {/* Request location — subtle link below grid */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={requestLocation}
            className="mt-2 w-full text-center text-[11px] text-gray-400 hover:text-lavender transition-colors"
          >
            Ask for their location instead →
          </button>
        </div>
      )}

      {/* Music picker */}
      {showMusic && (
        <div className="border-t border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2 px-3 pt-2 pb-1">
            <input
              ref={musicInputRef}
              value={musicQuery}
              onChange={(e) => setMusicQuery(e.target.value)}
              placeholder="Search songs, artists…"
              className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 placeholder:text-gray-300 focus:border-[#1DB954] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              autoFocus
            />
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { setShowMusic(false); setMusicQuery(""); setMusicResults([]); }}
              className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none px-1"
            >
              ×
            </button>
          </div>
          <div className="h-52 overflow-y-auto px-2 pb-2">
            {musicLoading ? (
              <div className="flex h-full items-center justify-center">
                <svg className="h-5 w-5 animate-spin text-[#1DB954]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              </div>
            ) : musicError ? (
              <p className="py-6 text-center text-xs text-red-400">{musicError}</p>
            ) : !musicQuery.trim() ? (
              <p className="py-6 text-center text-xs text-gray-400">Search for a song to share</p>
            ) : musicResults.length === 0 ? (
              <p className="py-6 text-center text-xs text-gray-400">No results found</p>
            ) : (
              <div className="flex flex-col gap-1 pt-1">
                {musicResults.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => sendTrack(track)}
                    className="flex items-center gap-3 rounded-xl px-2 py-1.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                  >
                    {track.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={track.image} alt={track.album} className="h-10 w-10 rounded-lg shrink-0 object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg shrink-0 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg">🎵</div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">{track.name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{track.artist} · {track.album}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="pb-1 text-center text-[9px] text-gray-300">Powered by Spotify</p>
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
          {/* + button — opens attach tray */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { setShowAttachMenu((v) => !v); setShowEmojis(false); setShowGiphy(false); setShowMusic(false); setMusicQuery(""); setMusicResults([]); }}
            aria-label="Attach"
            className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-lg font-light transition-all", showAttachMenu ? "bg-lavender text-white" : "text-gray-400 hover:text-lavender")}
          >
            {showAttachMenu ? "×" : "+"}
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { setShowEmojis((v) => !v); setShowGiphy(false); setShowAttachMenu(false); }}
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
              setShowAttachMenu(false);
              setShowMusic(false);
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
            className="flex-1 resize-none bg-transparent text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none dark:text-gray-100 dark:placeholder:text-gray-600 overflow-y-auto"
            style={{ maxHeight: "64px", height: "auto" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 64) + "px";
            }}
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
