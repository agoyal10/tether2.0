"use client";

import Link from "next/link";
import { useState } from "react";
import { haptic } from "@/lib/haptics";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { MOOD_CONFIGS, NAUGHTY_MOOD_CONFIGS, LOVE_MOOD_CONFIGS, KATAKNI_CONFIG, type MoodLog, type MoodConfig } from "@/types";
import type { Reaction } from "@/types";
import MoodIcon from "@/components/MoodIcon";

const ALL_CONFIGS = [...MOOD_CONFIGS, ...NAUGHTY_MOOD_CONFIGS, ...LOVE_MOOD_CONFIGS, KATAKNI_CONFIG];
const REACTION_OPTIONS = ["❤️", "😍", "🥺", "😘", "💕", "🔥", "😂", "🫶"];

export function MiniCard({
  log,
  label,
  unread = 0,
  reactions = [],
  currentUserId,
  lastSeen,
}: {
  log: MoodLog;
  label: string;
  unread?: number;
  reactions?: Reaction[];
  currentUserId?: string;
  lastSeen?: string | null;
}) {
  const config = ALL_CONFIGS.find((m) => m.level === log.mood) as MoodConfig;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [optimisticReactions, setOptimisticReactions] = useState<Reaction[]>(reactions);
  const myReaction = optimisticReactions.find((r) => r.user_id === currentUserId);
  const isPartner = log.user_id !== currentUserId;

  async function react(emoji: string) {
    haptic(20);
    setPickerOpen(false);
    const isToggleOff = myReaction?.emoji === emoji;

    // Optimistic update
    if (isToggleOff) {
      setOptimisticReactions((prev) => prev.filter((r) => r.user_id !== currentUserId));
      await fetch("/api/reactions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mood_log_id: log.id }) });
    } else {
      const fake: Reaction = { id: "tmp", mood_log_id: log.id, user_id: currentUserId!, emoji, created_at: new Date().toISOString() };
      setOptimisticReactions((prev) => [...prev.filter((r) => r.user_id !== currentUserId), fake]);
      await fetch("/api/reactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mood_log_id: log.id, emoji }) });
    }
  }

  // Group reactions by emoji
  const grouped: Record<string, number> = {};
  optimisticReactions.forEach((r) => { grouped[r.emoji] = (grouped[r.emoji] ?? 0) + 1; });

  return (
    <div className={cn("flex flex-col gap-2 rounded-3xl border-2 p-4", config.color, config.borderColor)}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
        {unread > 0 && (
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-blush-dark px-1.5 text-[11px] font-bold text-white shadow-sm">
            {unread}
          </span>
        )}
      </div>

      <Link href={`/chat/${log.id}`} className="flex items-center gap-2">
        {log.emoji_svg ? (
          <div className="h-8 w-8 shrink-0" dangerouslySetInnerHTML={{ __html: log.emoji_svg }} />
        ) : config.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={config.image} alt={config.label} className="h-8 w-8 object-contain" />
        ) : (
          <MoodIcon level={config.level} emoji={config.emoji} className="h-8 w-8" />
        )}
        <div>
          <p className={cn("text-sm font-bold", config.textColor)}>{config.label}</p>
          <p className="text-[11px] text-gray-400">
            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
          </p>
        </div>
      </Link>

      {log.note && (
        <p className="truncate rounded-xl bg-white/50 px-2 py-1 text-xs italic text-gray-500">
          &ldquo;{log.note}&rdquo;
        </p>
      )}

      {/* Last seen (partner only, no log) */}
      {isPartner && lastSeen && (
        <p className="text-[10px] text-gray-400">{formatLastSeen(lastSeen)}</p>
      )}

      {/* Reactions row */}
      <div className="flex items-center gap-1 flex-wrap mt-0.5">
        {Object.entries(grouped).map(([emoji, count]) => (
          <button
            key={emoji}
            onClick={() => react(emoji)}
            className={cn(
              "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs transition-all",
              myReaction?.emoji === emoji
                ? "bg-white/80 ring-1 ring-lavender"
                : "bg-white/40 hover:bg-white/60"
            )}
          >
            <span>{emoji}</span>
            {count > 1 && <span className="text-gray-500">{count}</span>}
          </button>
        ))}

        {/* React button — only on partner's card, only if no reaction yet */}
        {isPartner && !myReaction && (
          <div className="relative">
            <button
              onClick={() => setPickerOpen((v) => !v)}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white/40 text-sm hover:bg-white/60 transition-all"
            >
              +
            </button>
            {pickerOpen && (
              <div className="absolute bottom-8 left-0 z-10 flex gap-1 rounded-2xl bg-white dark:bg-gray-800 shadow-lg p-2 border border-gray-100 dark:border-gray-700">
                {REACTION_OPTIONS.map((emoji) => (
                  <button key={emoji} onClick={() => react(emoji)} className="text-lg hover:scale-125 transition-transform">
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function HistoryChip({ log, unread = 0 }: { log: MoodLog; unread?: number }) {
  const config = ALL_CONFIGS.find((m) => m.level === log.mood) as MoodConfig;

  return (
    <Link
      href={`/chat/${log.id}`}
      className={cn(
        "relative flex shrink-0 flex-col items-center gap-1 rounded-2xl border-2 px-3 pb-2.5 pt-5 transition-all active:scale-95",
        config.color,
        config.borderColor
      )}
    >
      {unread > 0 && (
        <span className="absolute right-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-blush-dark px-1 text-[9px] font-bold text-white">
          {unread}
        </span>
      )}
      {log.emoji_svg ? (
        <div className="h-7 w-7 shrink-0" dangerouslySetInnerHTML={{ __html: log.emoji_svg }} />
      ) : config.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={config.image} alt={config.label} className="h-7 w-7 object-contain" />
      ) : (
        <MoodIcon level={config.level} emoji={config.emoji} className="h-7 w-7" />
      )}
      <span className={cn("text-[10px] font-semibold", config.textColor)}>{config.label}</span>
      <span className="text-[9px] text-gray-400">
        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
      </span>
    </Link>
  );
}

function formatLastSeen(lastSeen: string): string {
  const diff = Date.now() - new Date(lastSeen).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "Active just now";
  if (mins < 60) return `Active ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Active ${hrs}h ago`;
  return `Active ${Math.floor(hrs / 24)}d ago`;
}
