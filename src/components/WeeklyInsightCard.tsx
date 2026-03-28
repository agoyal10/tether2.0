"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function WeeklyInsightCard() {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [insufficient, setInsufficient] = useState(false);
  const [expanded, setExpanded] = useState(false);

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

  if (loading) return null;

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

      <div className="rounded-3xl bg-gradient-to-br from-lavender-light to-blush-light overflow-hidden">
        {insufficient || !insight ? (
          <div className="flex items-center gap-3 px-5 py-4">
            <span className="text-lg">📅</span>
            <p className="text-xs text-lavender-dark/70">Keep checking in together — your weekly insight will appear here.</p>
          </div>
        ) : (
          <>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-4"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">✨</span>
                <p className="text-xs font-semibold text-lavender-dark uppercase tracking-widest">This week</p>
              </div>
              <svg
                viewBox="0 0 24 24"
                className={`h-4 w-4 fill-none stroke-current text-lavender-dark transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expanded && (
              <p className="text-sm leading-relaxed text-gray-700 px-5 pb-5">{insight}</p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
