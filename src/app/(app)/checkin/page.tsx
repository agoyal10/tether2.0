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
  const { naughtyMode, toggle: toggleNaughty } = useNaughtyMode();

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
      return;
    }

    // Notify partner via push (best-effort)
    await fetch("/api/push/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moodLogId: log.id }),
    }).catch(() => {});

    toast.success(naughtyMode ? "Sent! They'll know 😈" : "Check-in sent! 💞");
    setTimeout(() => router.push("/dashboard"), 1500);
    setLoading(false);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Check In</h1>
        <button
          onClick={toggleNaughty}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
            naughtyMode
              ? "bg-blush text-white shadow-card"
              : "bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-500"
          }`}
        >
          {naughtyMode ? "😈 Naughty" : "😇 Sweet"}
        </button>
      </div>
      <div className={`rounded-4xl p-6 shadow-card transition-colors ${
        naughtyMode ? "bg-blush-light dark:bg-gray-900" : "bg-white dark:bg-gray-900"
      }`}>
        <MoodScale onSubmit={handleSubmit} isLoading={loading} naughtyMode={naughtyMode} />
      </div>
    </div>
  );
}
