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

// Strip markdown headings/bold from AI text
function stripMarkdown(text: string): string {
  return text
    .replace(/^#+\s+.+\n?/gm, "")   // remove # headings
    .replace(/\*\*(.+?)\*\*/g, "$1") // remove **bold**
    .replace(/\*(.+?)\*/g, "$1")     // remove *italic*
    .trim();
}

// Build date-keyed score map from logs
function buildScoreMap(logs: MoodPoint[]): Record<string, number> {
  const map: Record<string, number[]> = {};
  for (const l of logs) {
    if (!map[l.date]) map[l.date] = [];
    map[l.date].push(l.score);
  }
  const result: Record<string, number> = {};
  for (const [k, v] of Object.entries(map)) {
    result[k] = v.reduce((a, b) => a + b, 0) / v.length;
  }
  return result;
}

function MoodTrendsChart({ data }: { data: TrendsData }) {
  const myMap = buildScoreMap(data.myLogs);
  const partnerMap = buildScoreMap(data.partnerLogs);

  // Dynamic range: from first check-in to today
  const allDates = [...data.myLogs.map(l => l.date), ...data.partnerLogs.map(l => l.date)].sort();
  if (allDates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <span className="text-3xl">📈</span>
        <p className="text-sm text-gray-400">No check-ins yet this month</p>
      </div>
    );
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const startStr = allDates[0];
  const startDate = new Date(startStr);
  const endDate = new Date(todayStr);
  const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86400000));

  // Build ordered day list
  const days: string[] = [];
  for (let i = 0; i <= totalDays; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }

  const W = 300;
  const H = 110;
  const PAD = { top: 12, right: 12, bottom: 22, left: 12 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const toX = (i: number) => PAD.left + (i / Math.max(1, days.length - 1)) * chartW;
  const toY = (s: number) => PAD.top + chartH - ((s - 1) / 4) * chartH;

  // Build smooth connected path segments (skip gaps)
  function buildLinePath(scoreMap: Record<string, number>): string {
    const segments: string[] = [];
    let segment: string[] = [];
    days.forEach((d, i) => {
      const s = scoreMap[d];
      if (s !== undefined) {
        segment.push(`${toX(i).toFixed(1)},${toY(s).toFixed(1)}`);
      } else {
        if (segment.length > 0) { segments.push("M " + segment.join(" L ")); segment = []; }
      }
    });
    if (segment.length > 0) segments.push("M " + segment.join(" L "));
    return segments.join(" ");
  }

  // Build area fill path (closed polygon per segment)
  function buildAreaPath(scoreMap: Record<string, number>): string {
    const segments: string[] = [];
    let seg: { i: number; s: number }[] = [];
    days.forEach((d, i) => {
      const s = scoreMap[d];
      if (s !== undefined) {
        seg.push({ i, s });
      } else {
        if (seg.length > 0) {
          const top = seg.map(p => `${toX(p.i).toFixed(1)},${toY(p.s).toFixed(1)}`).join(" L ");
          const bottom = [...seg].reverse().map(p => `${toX(p.i).toFixed(1)},${toY(1).toFixed(1)}`).join(" L ");
          segments.push(`M ${top} L ${bottom} Z`);
          seg = [];
        }
      }
    });
    if (seg.length > 0) {
      const top = seg.map(p => `${toX(p.i).toFixed(1)},${toY(p.s).toFixed(1)}`).join(" L ");
      const bottom = [...seg].reverse().map(p => `${toX(p.i).toFixed(1)},${toY(1).toFixed(1)}`).join(" L ");
      segments.push(`M ${top} L ${bottom} Z`);
    }
    return segments.join(" ");
  }

  const myLine = buildLinePath(myMap);
  const partnerLine = buildLinePath(partnerMap);
  const myArea = buildAreaPath(myMap);
  const partnerArea = buildAreaPath(partnerMap);

  // X-axis labels: start and today
  const xLabels = [
    { i: 0, label: new Date(startStr).toLocaleDateString("en-US", { month: "short", day: "numeric" }) },
    { i: days.length - 1, label: "Today" },
  ];

  // Mood emoji bands (top, mid, bottom)
  const moodBands = [
    { y: toY(5), emoji: "🚀", label: "Thriving" },
    { y: toY(3), emoji: "☁️", label: "Okay" },
    { y: toY(1), emoji: "🌊", label: "Struggling" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="myGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="partnerGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ec4899" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Mood band gridlines */}
        {moodBands.map(({ y, emoji }) => (
          <g key={emoji}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
              stroke="currentColor" strokeOpacity={0.07} strokeWidth={1} strokeDasharray="3 3" />
            <text x={W - PAD.right + 4} y={y + 4} fontSize={9} textAnchor="start" opacity={0.35}>{emoji}</text>
          </g>
        ))}

        {/* Area fills */}
        {partnerArea && <path d={partnerArea} fill="url(#partnerGrad)" />}
        {myArea && <path d={myArea} fill="url(#myGrad)" />}

        {/* Lines */}
        {partnerLine && (
          <path d={partnerLine} fill="none" stroke="#ec4899" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" opacity={0.75} />
        )}
        {myLine && (
          <path d={myLine} fill="none" stroke="#8b5cf6" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* Dots */}
        {days.map((d, i) => {
          const ms = myMap[d];
          const ps = partnerMap[d];
          return (
            <g key={d}>
              {ps !== undefined && <circle cx={toX(i)} cy={toY(ps)} r={2.5} fill="#ec4899" opacity={0.85} />}
              {ms !== undefined && <circle cx={toX(i)} cy={toY(ms)} r={2.5} fill="#8b5cf6" />}
            </g>
          );
        })}

        {/* X-axis labels */}
        {xLabels.map(({ i, label }) => (
          <text key={label} x={toX(i)} y={H - 4} fontSize={9} fill="currentColor"
            fillOpacity={0.4} textAnchor={i === 0 ? "start" : "end"}>{label}</text>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-5 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-6 rounded-full bg-lavender opacity-80" />
          <span>{data.myName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-6 rounded-full bg-pink-400 opacity-80" />
          <span>{data.partnerName}</span>
        </div>
      </div>
    </div>
  );
}

export default function RecapPage() {
  const router = useRouter();
  const [weeklyInsight, setWeeklyInsight] = useState<string | null>(null);
  const [weeklyInsufficient, setWeeklyInsufficient] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(true);
  const [insufficient, setInsufficient] = useState(false);
  const [insightError, setInsightError] = useState(false);
  const [monthlyPremiumRequired, setMonthlyPremiumRequired] = useState(false);
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [trendsLoading, setTrendsLoading] = useState(true);

  const now = new Date();
  const monthName = now.toLocaleString("en-US", { month: "long", year: "numeric" });

  useEffect(() => {
    Promise.all([
      fetch("/api/ai/insights?type=weekly").then((r) => r.json()),
      fetch("/api/ai/insights?type=monthly").then((r) => r.json()),
      fetch("/api/mood-trends").then((r) => r.json()),
    ]).then(([weekly, monthly, trendsData]) => {
      if (weekly.insight) setWeeklyInsight(stripMarkdown(weekly.insight));
      else if (weekly.insufficient) setWeeklyInsufficient(true);

      if (monthly.insight) setInsight(stripMarkdown(monthly.insight));
      else if (monthly.insufficient) setInsufficient(true);
      else if (monthly.premiumRequired) setMonthlyPremiumRequired(true);
      else setInsightError(true);

      if (trendsData.myLogs) setTrends(trendsData);
    }).catch(() => setInsightError(true))
      .finally(() => { setInsightLoading(false); setTrendsLoading(false); });
  }, []);

  const loading = insightLoading || trendsLoading;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Insights</h1>
          <p className="text-sm text-gray-400">{monthName}</p>
        </div>
      </div>

      {/* Single flowing card */}
      <div className="rounded-3xl bg-gray-50 dark:bg-gray-800/60 overflow-hidden">

        {/* Chart */}
        <div className="p-5 pb-4">
          {trendsLoading ? (
            <div className="flex flex-col gap-3">
              <div className="h-28 rounded-2xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
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

        {/* Weekly insight */}
        {!loading && (
          <div className="border-t border-gray-100 dark:border-gray-700/60 px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">This week</p>
            {weeklyInsight ? (
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{weeklyInsight}</p>
            ) : (
              <p className="text-sm text-gray-400 italic">Keep checking in — your weekly insight will appear here.</p>
            )}
          </div>
        )}

        {/* Divider between insights */}
        {!loading && (weeklyInsight || weeklyInsufficient) && (insight || insufficient) && (
          <div className="mx-5 border-t border-dashed border-gray-200 dark:border-gray-700" />
        )}

        {/* Monthly insight */}
        {!loading && (
          <div className="px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">This month</p>
            {insightLoading ? null : monthlyPremiumRequired ? (
              <div className="rounded-2xl bg-gradient-to-br from-lavender/10 to-blush/10 border border-lavender/20 p-4 flex flex-col gap-2">
                <p className="text-sm font-semibold text-lavender-dark dark:text-lavender">✨ Premium feature</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Unlock your monthly relationship recap with a Premium subscription.</p>
                <button
                  onClick={() => router.push("/settings")}
                  className="mt-1 self-start rounded-xl bg-lavender px-4 py-1.5 text-xs font-semibold text-white hover:bg-lavender-dark transition-all"
                >
                  Upgrade →
                </button>
              </div>
            ) : insight ? (
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{insight}</p>
            ) : insufficient ? (
              <p className="text-sm text-gray-400 italic">Not enough check-ins yet — keep going together.</p>
            ) : insightError ? (
              <p className="text-sm text-gray-400 italic">Couldn&apos;t load right now. Try again later.</p>
            ) : null}
          </div>
        )}

        {loading && (
          <div className="px-5 pb-5 flex flex-col gap-2">
            <div className="h-3 w-full rounded-full bg-gray-100 dark:bg-gray-700 animate-pulse" />
            <div className="h-3 w-5/6 rounded-full bg-gray-100 dark:bg-gray-700 animate-pulse" />
            <div className="h-3 w-4/6 rounded-full bg-gray-100 dark:bg-gray-700 animate-pulse" />
          </div>
        )}
      </div>

      <p className="text-center text-xs text-gray-300">Generated with care by AI</p>
    </div>
  );
}
