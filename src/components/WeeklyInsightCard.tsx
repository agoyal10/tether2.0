"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function WeeklyInsightCard() {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [insufficient, setInsufficient] = useState(false);

  useEffect(() => {
    fetch("/api/ai/insights?type=weekly")
      .then((r) => r.json())
      .then((data) => {
        if (data.insight) setInsight(data.insight);
        else if (data.insufficient) setInsufficient(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (insufficient) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Weekly Insight
        </h2>
        <Link href="/recap" className="text-xs font-semibold text-lavender hover:text-lavender-dark">
          Monthly recap →
        </Link>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-lavender-light to-blush-light p-5">
        {loading ? (
          <div className="flex flex-col gap-2">
            <div className="h-3 w-full rounded-full bg-white/50 animate-pulse" />
            <div className="h-3 w-5/6 rounded-full bg-white/50 animate-pulse" />
            <div className="h-3 w-4/6 rounded-full bg-white/50 animate-pulse" />
          </div>
        ) : insight ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">✨</span>
              <p className="text-xs font-semibold text-lavender-dark uppercase tracking-widest">This week</p>
            </div>
            <p className="text-sm leading-relaxed text-gray-700">{insight}</p>
          </>
        ) : (
          <p className="text-sm text-gray-400 text-center py-2">No insight available yet</p>
        )}
      </div>
    </section>
  );
}
