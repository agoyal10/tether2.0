"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
  const [lightbox, setLightbox] = useState<MediaItem | null>(null);
  const [filter, setFilter] = useState<"all" | "photos" | "videos">("all");

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
        .select("id, media_path, created_at")
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

  async function saveMedia(url: string, isVideo: boolean) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const ext = isVideo ? "mp4" : "jpg";
      const file = new File([blob], `tether-${Date.now()}.${ext}`, { type: blob.type });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl; a.download = file.name;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(blobUrl);
      }
    } catch { /* silent */ }
  }

  const filtered = items.filter((i) =>
    filter === "all" ? true : filter === "videos" ? i.isVideo : !i.isVideo
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current strokeWidth-2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Shared Media</h1>
      </div>

      {/* Filter tabs */}
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
              onClick={() => setLightbox(item)}
              className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
            >
              {item.isVideo ? (
                <>
                  <video src={item.url} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="h-8 w-8 fill-white drop-shadow-lg"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                </>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt="" className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightbox(null)}
        >
          {lightbox.isVideo ? (
            <video
              src={lightbox.url}
              controls
              autoPlay
              playsInline
              className="max-h-full max-w-full"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lightbox.url}
              alt=""
              className="max-h-screen max-w-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <div className="absolute flex items-center gap-2" style={{ top: "calc(env(safe-area-inset-top, 0px) + 12px)", right: "12px" }}>
            <button
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white"
              onClick={async (e) => { e.stopPropagation(); await saveMedia(lightbox.url, lightbox.isVideo); }}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M12 16l-5-5h3V4h4v7h3l-5 5zm-7 4h14v-2H5v2z"/></svg>
            </button>
            <button className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white text-base font-bold" onClick={() => setLightbox(null)}>×</button>
          </div>
        </div>
      )}
    </div>
  );
}
