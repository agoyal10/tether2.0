"use client";

import { useEffect, useState } from "react";

export default function DateIdeasCard() {
  const [ideas, setIdeas] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [insufficient, setInsufficient] = useState(false);

  async function load() {
    const res = await fetch("/api/ai/date-ideas");
    if (res.status === 404 || res.status === 503) { setInsufficient(true); return; }
    const data = await res.json();
    if (data.ideas?.length) setIdeas(data.ideas);
    else setInsufficient(true);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function refresh() {
    setRefreshing(true);
    await fetch("/api/ai/date-ideas", { method: "DELETE" });
    setIdeas(null);
    await load();
    setRefreshing(false);
  }

  if (insufficient) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Date Ideas</h2>
        {!loading && expanded && (
          <button
            onClick={refresh}
            disabled={refreshing}
            className="text-xs font-semibold text-lavender hover:text-lavender-dark disabled:opacity-40"
          >
            {refreshing ? "Refreshing…" : "Refresh ↺"}
          </button>
        )}
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-peach-light to-blush-light overflow-hidden">
        <button
          onClick={() => !loading && setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🌿</span>
            <p className="text-xs font-semibold text-peach-dark uppercase tracking-widest">For today</p>
          </div>
          {loading ? (
            <div className="h-3 w-16 rounded-full bg-peach/40 animate-pulse" />
          ) : (
            <svg
              viewBox="0 0 24 24"
              className={`h-4 w-4 fill-none stroke-current text-peach-dark transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>

        {expanded && ideas && (
          <div className="flex flex-col gap-2 px-5 pb-5">
            {ideas.map((idea, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/60 text-[10px] font-bold text-peach-dark">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed text-gray-700">{idea}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
