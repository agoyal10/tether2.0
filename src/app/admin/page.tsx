"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Stats {
  users: { total: number; newThisWeek: number; recent: { id: string; display_name: string; created_at: string; is_premium: boolean; is_banned: boolean }[] };
  couples: { active: number; pending: number };
  checkins: { today: number; thisWeek: number; total: number };
  ai: { insightsToday: number; emojiToday: number };
  revenue: { premium: number };
  killSwitches: { key: string; value: string; updated_at: string }[];
  push: { subscriptions: number; driftAlertsToday: number };
}

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-800 p-4 flex flex-col gap-1 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function Toggle({ label, enabled, onToggle }: { label: string; enabled: boolean; onToggle: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
      <button
        onClick={() => onToggle(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? "bg-lavender" : "bg-gray-200 dark:bg-gray-600"}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/stats");
    if (res.status === 403) { router.push("/dashboard"); return; }
    if (!res.ok) { setError(true); setLoading(false); return; }
    setStats(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function banUser(userId: string, banned: boolean) {
    await fetch("/api/admin/ban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, banned }),
    });
    setStats((s) => {
      if (!s) return s;
      return {
        ...s,
        users: {
          ...s.users,
          recent: s.users.recent.map((u) => u.id === userId ? { ...u, is_banned: banned } : u),
        },
      };
    });
  }

  async function toggleKillSwitch(key: string, value: boolean) {
    if (!stats) return;
    const newValue = value ? "true" : "false";
    await fetch("/api/admin/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: newValue }),
    });
    setStats((s) => {
      if (!s) return s;
      return {
        ...s,
        killSwitches: s.killSwitches.map((k) => k.key === key ? { ...k, value: newValue } : k),
      };
    });
  }

  async function setConfigValue(key: string, value: string) {
    await fetch("/api/admin/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    setStats((s) => {
      if (!s) return s;
      return {
        ...s,
        killSwitches: s.killSwitches.map((k) => k.key === key ? { ...k, value } : k),
      };
    });
  }

  function getSwitch(key: string) {
    return stats?.killSwitches.find((k) => k.key === key)?.value === "true";
  }

  function getConfigValue(key: string, fallback: string) {
    return stats?.killSwitches.find((k) => k.key === key)?.value ?? fallback;
  }

  const SWITCH_LABELS: Record<string, string> = {
    ai_coach_enabled: "Coach",
    ai_date_ideas_enabled: "Date ideas",
    ai_drift_alert_enabled: "Drift alerts (mood nudges)",
  };

  // Merge DB rows with defaults so all known keys always appear
  const SWITCH_DEFAULTS: Record<string, string> = {
    ai_coach_enabled: "true",
    ai_date_ideas_enabled: "true",
    ai_drift_alert_enabled: "true",
  };
  const mergedSwitches = Object.keys(SWITCH_LABELS).map((key) => {
    const existing = stats?.killSwitches.find((k) => k.key === key);
    return existing ?? { key, value: SWITCH_DEFAULTS[key] ?? "true", updated_at: "" };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400 text-sm">Failed to load stats.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-5 pb-10">
      <div className="mx-auto max-w-2xl flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Admin</h1>
            <p className="text-xs text-gray-400 mt-0.5">Tether dashboard</p>
          </div>
          <button
            onClick={load}
            className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-all"
          >
            Refresh ↺
          </button>
        </div>

        {/* Users */}
        <section className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Users</p>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total" value={stats.users.total} />
            <StatCard label="New this week" value={stats.users.newThisWeek} />
          </div>
          <div className="rounded-2xl bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 px-4 pt-4 pb-2">Recent signups</p>
            {stats.users.recent.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-4 py-2.5 border-t border-gray-50 dark:border-gray-700">
                <div>
                  <p className={`text-sm font-medium ${u.is_banned ? "line-through text-gray-400" : "text-gray-800 dark:text-gray-100"}`}>{u.display_name}</p>
                  <p className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <div className="flex items-center gap-2">
                  {u.is_premium && !u.is_banned && (
                    <span className="text-[10px] font-bold bg-gradient-to-r from-lavender to-blush-dark text-white px-2 py-0.5 rounded-full">Premium</span>
                  )}
                  {u.is_banned ? (
                    <button
                      onClick={() => banUser(u.id, false)}
                      className="text-[10px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full hover:bg-green-100 hover:text-green-700 transition-colors"
                    >
                      Unban
                    </button>
                  ) : (
                    <button
                      onClick={() => banUser(u.id, true)}
                      className="text-[10px] font-semibold text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 px-2 py-0.5 rounded-full transition-colors"
                    >
                      Ban
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Couples */}
        <section className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Couples</p>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Connected" value={stats.couples.active} />
            <StatCard label="Pending" value={stats.couples.pending} />
          </div>
        </section>

        {/* Check-ins */}
        <section className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Check-ins</p>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Today" value={stats.checkins.today} />
            <StatCard label="This week" value={stats.checkins.thisWeek} />
            <StatCard label="All time" value={stats.checkins.total} />
          </div>
        </section>

        {/* AI usage */}
        <section className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">AI Usage (today)</p>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Insights generated" value={stats.ai.insightsToday} />
            <StatCard label="Emoji generated" value={stats.ai.emojiToday} />
          </div>
        </section>

        {/* Revenue */}
        <section className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Revenue</p>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Premium users" value={stats.revenue.premium} sub={`$${(stats.revenue.premium * 4.99).toFixed(2)} MRR`} />
            <StatCard label="Free users" value={stats.users.total - stats.revenue.premium} />
          </div>
        </section>

        {/* Push */}
        <section className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Push Notifications</p>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Subscriptions" value={stats.push.subscriptions} />
            <StatCard label="Drift alerts today" value={stats.push.driftAlertsToday} />
          </div>
        </section>

        {/* Kill switches */}
        <section className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Kill Switches</p>
          <div className="rounded-2xl bg-white dark:bg-gray-800 px-4 shadow-sm">
            {mergedSwitches.map((sw) => (
              <Toggle
                key={sw.key}
                label={SWITCH_LABELS[sw.key]}
                enabled={sw.value === "true"}
                onToggle={(v) => toggleKillSwitch(sw.key, v)}
              />
            ))}
          </div>
        </section>

        {/* Numeric config */}
        <section className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Limits</p>
          <div className="rounded-2xl bg-white dark:bg-gray-800 px-4 py-3 shadow-sm flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Coach messages / couple / day</p>
              <p className="text-xs text-gray-400">Counts both partners' messages + coach replies</p>
            </div>
            <input
              type="number"
              min={0}
              max={1000}
              defaultValue={getConfigValue("ai_coach_daily_limit", "50")}
              onBlur={(e) => setConfigValue("ai_coach_daily_limit", e.target.value)}
              className="w-20 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-800 dark:text-gray-100 text-center focus:border-lavender focus:outline-none focus:ring-2 focus:ring-lavender/30"
            />
          </div>
        </section>

      </div>
    </div>
  );
}
