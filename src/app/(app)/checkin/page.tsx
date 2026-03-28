"use client";

export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import MoodScale from "@/components/MoodScale";
import { useNaughtyMode } from "@/components/NaughtyModeProvider";
import type { MoodLevel } from "@/types";

interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  image: string;
  preview: string | null;
  url: string;
}

export default function CheckinPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const { mode, toggle: toggleMode } = useNaughtyMode();

  // Song picker state
  const [showSongPicker, setShowSongPicker] = useState(false);
  const [selectedSong, setSelectedSong] = useState<SpotifyTrack | null>(null);
  const [songQuery, setSongQuery] = useState("");
  const [songResults, setSongResults] = useState<SpotifyTrack[]>([]);
  const [songLoading, setSongLoading] = useState(false);
  const [songError, setSongError] = useState<string | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function searchSongs(q: string) {
    setSongQuery(q);
    setSongError(null);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!q.trim()) { setSongResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSongLoading(true);
      const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      setSongLoading(false);
      if (!res.ok) { setSongError(json.error ?? "Search failed"); setSongResults([]); return; }
      setSongResults(json.tracks ?? []);
    }, 400);
  }

  function pickSong(track: SpotifyTrack) {
    setSelectedSong(track);
    setShowSongPicker(false);
    setSongQuery("");
    setSongResults([]);
  }

  async function handleSubmit(mood: MoodLevel, note: string) {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: log, error } = await supabase
      .from("mood_logs")
      .insert({ user_id: user.id, mood, note: note || null })
      .select()
      .single();

    if (error) {
      toast.error("Could not save check-in. Try again.");
      setLoading(false);
      throw error;
    }

    // If a song was selected, send it as the first message in the chat
    if (selectedSong) {
      await supabase.from("messages").insert({
        mood_log_id: log.id,
        sender_id: user.id,
        content: `spotify:${JSON.stringify(selectedSong)}`,
      }).catch(() => {});
    }

    // Notify partner via push (best-effort)
    await fetch("/api/push/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moodLogId: log.id }),
    }).catch(() => {});

    const successMsg =
      mode === "naughty" ? "Sent! They'll know 😈" :
      mode === "love" ? "Love sent! 💕" :
      "Check-in sent! 💞";
    toast.success(successMsg);
    setTimeout(() => router.push("/dashboard"), 1500);
    setLoading(false);
  }

  const modeLabel = mode === "naughty" ? "Naughty" : mode === "love" ? "Love" : "Sweet";
  const modeIcon =
    mode === "naughty" ? (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
        <path d="M6 8 Q4 2 7 1 Q8 4 7 7Z" />
        <path d="M14 8 Q16 2 13 1 Q12 4 13 7Z" />
        <circle cx="10" cy="13" r="5" />
        <path d="M7.5 12.5 Q10 11 12.5 12.5" stroke="white" strokeWidth="1" fill="none" strokeLinecap="round" />
      </svg>
    ) : mode === "love" ? (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
        <path d="M10 17 C10 17 2 11 2 6.5 C2 4 4 2 6.5 3 C8 3.5 9 5 10 5 C11 5 12 3.5 13.5 3 C16 2 18 4 18 6.5 C18 11 10 17 10 17Z" />
      </svg>
    ) : (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
        <circle cx="10" cy="11" r="5" />
        <ellipse cx="10" cy="4" rx="5" ry="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  const modeBg =
    mode === "naughty" ? "bg-blush text-white shadow-card" :
    mode === "love" ? "bg-lavender text-white shadow-card" :
    "bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-500";
  const cardBg =
    mode === "naughty" ? "bg-blush-light dark:bg-gray-900" :
    mode === "love" ? "bg-lavender-light dark:bg-gray-900" :
    "bg-white dark:bg-gray-900";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Check In</h1>
        <button
          onClick={toggleMode}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${modeBg}`}
        >
          {modeIcon}{modeLabel}
        </button>
      </div>
      <div className={`rounded-4xl p-6 shadow-card transition-colors ${cardBg}`}>
        <MoodScale onSubmit={handleSubmit} isLoading={loading} mode={mode} />
      </div>

      {/* Song picker */}
      <div className="mt-4">
        {selectedSong ? (
          <div className="rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-3 flex items-center gap-3">
            {selectedSong.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedSong.image} alt={selectedSong.album} className="h-10 w-10 rounded-lg object-cover shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">{selectedSong.name}</p>
              <p className="text-xs text-gray-400 truncate">{selectedSong.artist}</p>
            </div>
            <button
              onClick={() => setSelectedSong(null)}
              className="text-gray-300 hover:text-gray-500 transition-colors text-lg leading-none px-1"
            >
              ×
            </button>
          </div>
        ) : showSongPicker ? (
          <div className="rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                autoFocus
                type="text"
                value={songQuery}
                onChange={(e) => searchSongs(e.target.value)}
                placeholder="Search songs…"
                className="flex-1 rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 focus:border-lavender focus:outline-none focus:ring-2 focus:ring-lavender/30"
              />
              <button
                onClick={() => { setShowSongPicker(false); setSongQuery(""); setSongResults([]); }}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none px-1"
              >
                ×
              </button>
            </div>
            {songLoading && (
              <p className="py-3 text-center text-xs text-gray-400">Searching…</p>
            )}
            {songError && (
              <p className="py-3 text-center text-xs text-red-400">{songError}</p>
            )}
            {!songLoading && !songError && songResults.length > 0 && (
              <ul className="max-h-52 overflow-y-auto flex flex-col gap-1">
                {songResults.map((track) => (
                  <li key={track.id}>
                    <button
                      onClick={() => pickSong(track)}
                      className="w-full flex items-center gap-3 rounded-2xl px-2 py-1.5 hover:bg-lavender/10 transition-colors text-left"
                    >
                      {track.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={track.image} alt={track.album} className="h-9 w-9 rounded-lg object-cover shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">{track.name}</p>
                        <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {!songLoading && !songError && songQuery.trim() && songResults.length === 0 && (
              <p className="py-3 text-center text-xs text-gray-400">No results found</p>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowSongPicker(true)}
            className="w-full rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 py-3 text-sm text-gray-400 hover:border-lavender hover:text-lavender transition-all"
          >
            🎵 Add a song
          </button>
        )}
      </div>
    </div>
  );
}
