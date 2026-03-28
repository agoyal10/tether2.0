"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface MediaItem {
  id: string;
  path: string;
  url: string;
  isVideo: boolean;
  createdAt: string;
}

export default function MediaPage() {
  const router = useRouter();
  const supabase = createClient();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "photos" | "videos">("all");
  const [selecting, setSelecting] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const [imgScale, setImgScale] = useState(1);
  const [imgTranslate, setImgTranslate] = useState({ x: 0, y: 0 });
  const pinchRef = useRef<{ startDist: number; startScale: number } | null>(null);
  const panRef = useRef<{ startX: number; startY: number; startTx: number; startTy: number } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }

      const { data: conn } = await supabase
        .from("connections")
        .select("user_a_id, user_b_id")
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .eq("status", "active")
        .single();

      if (!conn) { setLoading(false); return; }
      const partnerId = conn.user_a_id === user.id ? conn.user_b_id : conn.user_a_id;

      const { data: msgs } = await supabase
        .from("messages")
        .select("id, media_path, created_at, sender_id")
        .in("sender_id", [user.id, partnerId])
        .not("media_path", "is", null)
        .order("created_at", { ascending: false });

      if (!msgs?.length) { setLoading(false); return; }

      const paths = msgs.map((m) => m.media_path as string);
      const res = await fetch("/api/media/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paths }),
      });
      const { urls } = await res.json();

      setItems(
        msgs
          .filter((m) => urls[m.media_path])
          .map((m) => ({
            id: m.id,
            path: m.media_path,
            url: urls[m.media_path],
            isVideo: /\.(mp4|mov|webm|avi)$/i.test(m.media_path),
            createdAt: m.created_at,
          }))
      );
      setLoading(false);
    });
  }, [supabase, router]);

  async function openForSave(url: string) {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write("<html><body style='margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh'><p style='color:white;font-family:sans-serif'>Loading…</p></body></html>");
    try {
      const blob = await fetch(url).then((r) => r.blob());
      const blobUrl = URL.createObjectURL(blob);
      win.location.href = blobUrl;
    } catch { win.close(); }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function cancelSelect() {
    setSelecting(false);
    setSelected(new Set());
  }

  async function deleteSelected() {
    if (!selected.size) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/media/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageIds: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      setItems((prev) => prev.filter((i) => !selected.has(i.id)));
      toast.success(`Deleted ${data.deleted} item${data.deleted === 1 ? "" : "s"}`);
      cancelSelect();
    } catch {
      toast.error("Couldn't delete media");
    } finally {
      setDeleting(false);
    }
  }

  const filtered = items.filter((i) =>
    filter === "all" ? true : filter === "videos" ? i.isVideo : !i.isVideo
  );

  // Reset zoom when switching photos
  useEffect(() => {
    setImgScale(1);
    setImgTranslate({ x: 0, y: 0 });
  }, [lightboxIndex]);

  function handleImgTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      );
      pinchRef.current = { startDist: dist, startScale: imgScale };
      panRef.current = null;
      touchStartX.current = null;
    } else if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      panRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, startTx: imgTranslate.x, startTy: imgTranslate.y };
      pinchRef.current = null;
    }
  }

  function handleImgTouchMove(e: React.TouchEvent) {
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

  function handleImgTouchEnd(e: React.TouchEvent, hasPrev: boolean, hasNext: boolean, index: number) {
    pinchRef.current = null;
    panRef.current = null;
    // Snap back if over-pinched below 1x
    setImgScale((prev) => { if (prev < 1) { setImgTranslate({ x: 0, y: 0 }); return 1; } return prev; });
    // Swipe navigation only when not zoomed
    if (imgScale <= 1 && touchStartX.current !== null) {
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      if (dx < -50 && hasNext) setLightboxIndex(index + 1);
      else if (dx > 50 && hasPrev) setLightboxIndex(index - 1);
    }
    touchStartX.current = null;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        {selecting ? (
          <button onClick={cancelSelect} className="text-sm font-medium text-gray-400 hover:text-gray-600">
            Cancel
          </button>
        ) : (
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current strokeWidth-2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
        )}
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex-1">
          {selecting && selected.size > 0 ? `${selected.size} selected` : "Shared Media"}
        </h1>
        {!loading && filtered.length > 0 && !selecting && (
          <button
            onClick={() => setSelecting(true)}
            className="text-sm font-semibold text-lavender hover:text-lavender-dark"
          >
            Select
          </button>
        )}
      </div>

      {/* Filter tabs */}
      {!selecting && (
        <div className="flex gap-2">
          {(["all", "photos", "videos"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-all ${
                filter === f ? "bg-lavender text-white" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="h-6 w-6 animate-spin text-lavender" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-20 text-center text-sm text-gray-400">No {filter === "all" ? "media" : filter} shared yet</p>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => selecting ? toggleSelect(item.id) : setLightboxIndex(filtered.indexOf(item))}
              className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
            >
              {item.isVideo ? (
                <>
                  <video src={item.url} className="h-full w-full object-cover" />
                  {!selecting && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="h-8 w-8 fill-white drop-shadow-lg"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  )}
                </>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt="" className="h-full w-full object-cover" />
              )}

              {/* Selection overlay */}
              {selecting && (
                <div className={`absolute inset-0 transition-colors ${selected.has(item.id) ? "bg-lavender/30" : "bg-transparent"}`}>
                  <div className={`absolute bottom-1.5 right-1.5 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selected.has(item.id)
                      ? "bg-lavender border-lavender"
                      : "bg-white/60 border-white backdrop-blur-sm"
                  }`}>
                    {selected.has(item.id) && (
                      <svg viewBox="0 0 24 24" className="h-3 w-3 fill-none stroke-white" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Delete bar */}
      {selecting && selected.size > 0 && (
        <div className="sticky bottom-4">
          <button
            onClick={deleteSelected}
            disabled={deleting}
            className="w-full rounded-3xl bg-blush py-3.5 text-sm font-semibold text-white hover:bg-blush-dark disabled:opacity-60 transition-all shadow-card"
          >
            {deleting ? "Deleting…" : `Delete ${selected.size} item${selected.size === 1 ? "" : "s"}`}
          </button>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && filtered[lightboxIndex] && (() => {
        const item = filtered[lightboxIndex];
        const hasPrev = lightboxIndex > 0;
        const hasNext = lightboxIndex < filtered.length - 1;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
            onClick={() => { if (imgScale <= 1) setLightboxIndex(null); }}
          >
            {item.isVideo ? (
              <video
                src={item.url}
                controls
                autoPlay
                playsInline
                className="max-h-full max-w-full"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.url}
                alt=""
                className="max-h-screen max-w-full object-contain"
                style={{
                  transform: `translate(${imgTranslate.x}px, ${imgTranslate.y}px) scale(${imgScale})`,
                  transition: pinchRef.current || panRef.current ? "none" : "transform 0.15s ease",
                  touchAction: "none",
                  cursor: imgScale > 1 ? "grab" : "default",
                }}
                onClick={(e) => e.stopPropagation()}
                onTouchStart={handleImgTouchStart}
                onTouchMove={handleImgTouchMove}
                onTouchEnd={(e) => handleImgTouchEnd(e, hasPrev, hasNext, lightboxIndex)}
              />
            )}

            {/* Top-right buttons */}
            <div className="absolute flex items-center gap-2" style={{ top: "calc(env(safe-area-inset-top, 0px) + 12px)", right: "12px" }}>
              <button
                className="flex h-7 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white px-2.5 text-[11px] font-semibold"
                onClick={(e) => { e.stopPropagation(); openForSave(item.url); }}
              >
                Open
              </button>
              <button
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white text-base font-bold"
                onClick={() => setLightboxIndex(null)}
              >×</button>
            </div>

            {/* Prev / Next arrows */}
            {hasPrev && (
              <button
                className="absolute left-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white"
                style={{ top: "50%", transform: "translateY(-50%)" }}
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {hasNext && (
              <button
                className="absolute right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white"
                style={{ top: "50%", transform: "translateY(-50%)" }}
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Counter */}
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/60">
              {lightboxIndex + 1} / {filtered.length}
            </p>
          </div>
        );
      })()}
    </div>
  );
}
