"use client";

export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import MoodScale from "@/components/MoodScale";
import { useNaughtyMode } from "@/components/NaughtyModeProvider";
import type { MoodLevel } from "@/types";

export default function CheckinPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const { mode, toggle: toggleMode } = useNaughtyMode();

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

  const modeLabel = mode === "naughty" ? "😈 Naughty" : mode === "love" ? "💕 Love" : "😇 Sweet";
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
          {modeLabel}
        </button>
      </div>
      <div className={`rounded-4xl p-6 shadow-card transition-colors ${cardBg}`}>
        <MoodScale onSubmit={handleSubmit} isLoading={loading} mode={mode} />
      </div>
    </div>
  );
}
