"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function NudgeButton({ partnerName }: { partnerName: string }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function nudge() {
    if (sent || loading) return;
    setLoading(true);
    const res = await fetch("/api/push/nudge", { method: "POST" });
    setLoading(false);
    if (res.ok) {
      setSent(true);
      toast.success(`Nudged ${partnerName}!`);
      setTimeout(() => setSent(false), 5 * 60 * 1000);
    } else if (res.status === 429) {
      const { retryAfter } = await res.json();
      const mins = Math.ceil(retryAfter / 60);
      toast.error(`Already nudged recently — try again in ${mins} minute${mins === 1 ? "" : "s"}`);
    } else {
      toast.error("Couldn't send nudge");
    }
  }

  return (
    <button
      onClick={nudge}
      disabled={sent || loading}
      className="mt-2 rounded-2xl bg-lavender/10 px-3 py-1.5 text-xs font-semibold text-lavender disabled:opacity-50 transition-all hover:bg-lavender/20"
    >
      {loading ? "…" : sent ? "Nudged ✓" : "Ask to check in 💌"}
    </button>
  );
}
