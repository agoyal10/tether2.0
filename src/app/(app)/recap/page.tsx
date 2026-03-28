"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RecapPage() {
  const router = useRouter();
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [insufficient, setInsufficient] = useState(false);
  const [error, setError] = useState(false);

  const now = new Date();
  const monthName = now.toLocaleString("en-US", { month: "long", year: "numeric" });

  useEffect(() => {
    fetch("/api/ai/insights?type=monthly")
      .then((r) => r.json())
      .then((data) => {
        if (data.insight) setInsight(data.insight);
        else if (data.insufficient) setInsufficient(true);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current strokeWidth-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Monthly Recap</h1>
          <p className="text-sm text-gray-400">{monthName}</p>
        </div>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-lavender-light to-blush-light p-6">
        {loading ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-5 w-5 rounded-full bg-white/50 animate-pulse" />
              <div className="h-3 w-24 rounded-full bg-white/50 animate-pulse" />
            </div>
            <div className="h-3 w-full rounded-full bg-white/50 animate-pulse" />
            <div className="h-3 w-5/6 rounded-full bg-white/50 animate-pulse" />
            <div className="h-3 w-full rounded-full bg-white/50 animate-pulse" />
            <div className="h-3 w-4/6 rounded-full bg-white/50 animate-pulse" />
            <div className="h-3 w-5/6 rounded-full bg-white/50 animate-pulse" />
          </div>
        ) : insight ? (
          <>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">💞</span>
              <p className="text-xs font-semibold text-lavender-dark uppercase tracking-widest">Your month together</p>
            </div>
            <p className="text-sm leading-relaxed text-gray-700">{insight}</p>
          </>
        ) : insufficient ? (
          <div className="text-center py-6">
            <span className="text-3xl">📅</span>
            <p className="mt-3 text-sm font-medium text-gray-600">Not enough check-ins yet</p>
            <p className="mt-1 text-xs text-gray-400">Keep checking in together — your monthly recap will appear once you both have a few more.</p>
          </div>
        ) : (
          <div className="text-center py-6">
            <span className="text-3xl">😕</span>
            <p className="mt-3 text-sm text-gray-400">Couldn&apos;t load recap right now. Try again later.</p>
          </div>
        )}
      </div>

      {insight && (
        <p className="text-center text-xs text-gray-300">Generated with care by AI · {monthName}</p>
      )}
    </div>
  );
}
