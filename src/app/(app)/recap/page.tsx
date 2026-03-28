"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface MoodPoint {
  date: string;
  mood: string;
  score: number;
}

interface TrendsData {
  myLogs: MoodPoint[];
  partnerLogs: MoodPoint[];
  myName: string;
  partnerName: string;
  since: string;
}

// Build last-30-day grid of scores (one per day, averaged if multiple)
function buildDailyScores(logs: MoodPoint[], since: string): (number | null)[] {
  const map: Record<string, number[]> = {};
  for (const l of logs) {
    if (!map[l.date]) map[l.date] = [];
    map[l.date].push(l.score);
  }
  const days: (number | null)[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const vals = map[key];
    days.push(vals ? vals.reduce((a, b) => a + b, 0) / vals.length : null);
  }
  return days;
}

function MoodTrendsChart({ data }: { data: TrendsData }) {
  const W = 320;
  const H = 100;
  const PAD = { top: 8, right: 8, bottom: 20, left: 28 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const myScores = buildDailyScores(data.myLogs, data.since);
  const partnerScores = buildDailyScores(data.partnerLogs, data.since);

  const toX = (i: number) => PAD.left + (i / 29) * chartW;
  const toY = (s: number) => PAD.top + chartH - ((s - 1) / 4) * chartH;

  function buildPath(scores: (number | null)[]): string {
    const pts = scores
      .map((s, i) => (s !== null ? `${toX(i).toFixed(1)},${toY(s).toFixed(1)}` : null))
      .filter(Boolean) as string[];
    if (pts.length === 0) return "";
    return "M " + pts.join(" L ");
  }

  const myPath = buildPath(myScores);
  const partnerPath = buildPath(partnerScores);

  // x-axis labels: 1st, 15th, today
  const sinceDate = new Date(data.since);
  const labelDays = [0, 14, 29];
  const labels = labelDays.map((i) => {
    const d = new Date(sinceDate);
    d.setDate(d.getDate() + i);
    return { x: toX(i), label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) };
  });

  const yLabels = [
    { y: toY(5), label: "5" },
    { y: toY(3), label: "3" },
    { y: toY(1), label: "1" },
  ];

  const hasData = myScores.some((s) => s !== null) || partnerScores.some((s) => s !== null);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <span className="text-3xl">📈</span>
        <p className="text-sm text-gray-400">No check-ins yet this month</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: "visible" }}>
        {/* Y-axis gridlines */}
        {yLabels.map(({ y, label }) => (
          <g key={label}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="currentColor" strokeOpacity={0.08} strokeWidth={1} />
            <text x={PAD.left - 4} y={y + 4} fontSize={8} fill="currentColor" fillOpacity={0.35} textAnchor="end">{label}</text>
          </g>
        ))}

        {/* Partner line */}
        {partnerPath && (
          <path d={partnerPath} fill="none" stroke="#e879a0" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
        )}
        {/* My line */}
        {myPath && (
          <path d={myPath} fill="none" stroke="#8b5cf6" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
        )}

        {/* Dots */}
        {myScores.map((s, i) =>
          s !== null ? (
            <circle key={i} cx={toX(i)} cy={toY(s)} r={2} fill="#8b5cf6" />
          ) : null
        )}
        {partnerScores.map((s, i) =>
          s !== null ? (
            <circle key={i} cx={toX(i)} cy={toY(s)} r={2} fill="#e879a0" />
          ) : null
        )}

        {/* X-axis labels */}
        {labels.map(({ x, label }) => (
          <text key={label} x={x} y={H - 4} fontSize={8} fill="currentColor" fillOpacity={0.4} textAnchor="middle">{label}</text>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-5 rounded-full bg-lavender" />
          <span>{data.myName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-5 rounded-full bg-blush" />
          <span>{data.partnerName}</span>
        </div>
      </div>
    </div>
  );
}

export default function RecapPage() {
  const router = useRouter();
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(true);
  const [insufficient, setInsufficient] = useState(false);
  const [insightError, setInsightError] = useState(false);
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [trendsLoading, setTrendsLoading] = useState(true);

  const now = new Date();
  const monthName = now.toLocaleString("en-US", { month: "long", year: "numeric" });

  useEffect(() => {
    fetch("/api/ai/insights?type=monthly")
      .then((r) => r.json())
      .then((data) => {
        if (data.insight) setInsight(data.insight);
        else if (data.insufficient) setInsufficient(true);
        else setInsightError(true);
      })
      .catch(() => setInsightError(true))
      .finally(() => setInsightLoading(false));

    fetch("/api/mood-trends")
      .then((r) => r.json())
      .then((data) => {
        if (data.myLogs) setTrends(data);
      })
      .catch(() => {})
      .finally(() => setTrendsLoading(false));
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

      {/* Mood trends chart */}
      <section className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Mood Trends · Last 30 Days</p>
        <div className="rounded-3xl bg-gray-50 dark:bg-gray-800 p-5">
          {trendsLoading ? (
            <div className="flex flex-col gap-3">
              <div className="h-24 rounded-2xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
              <div className="flex gap-4">
                <div className="h-3 w-16 rounded-full bg-gray-100 dark:bg-gray-700 animate-pulse" />
                <div className="h-3 w-16 rounded-full bg-gray-100 dark:bg-gray-700 animate-pulse" />
              </div>
            </div>
          ) : trends ? (
            <MoodTrendsChart data={trends} />
          ) : (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <span className="text-2xl">💤</span>
              <p className="text-xs text-gray-400">No partner connected yet</p>
            </div>
          )}
        </div>
      </section>

      {/* Monthly AI insight */}
      <div className="rounded-3xl bg-gradient-to-br from-lavender-light to-blush-light p-6">
        {insightLoading ? (
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
