"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { MOOD_CONFIGS, NAUGHTY_MOOD_CONFIGS, KATAKNI_CONFIG, type MoodLog, type MoodConfig } from "@/types";

const ALL_CONFIGS = [...MOOD_CONFIGS, ...NAUGHTY_MOOD_CONFIGS, KATAKNI_CONFIG];

export function MiniCard({
  log,
  label,
  unread = 0,
}: {
  log: MoodLog;
  label: string;
  unread?: number;
}) {
  const config = ALL_CONFIGS.find((m) => m.level === log.mood) as MoodConfig;

  return (
    <Link
      href={`/chat/${log.id}`}
      className={cn(
        "flex flex-col gap-2 rounded-3xl border-2 p-4 transition-all active:scale-95",
        config.color,
        config.borderColor
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
          {label}
        </p>
        {unread > 0 && (
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-blush-dark px-1.5 text-[11px] font-bold text-white shadow-sm">
            {unread}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {config.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={config.image} alt={config.label} className="h-8 w-8 object-contain" />
        ) : (
          <span className="text-3xl">{config.emoji}</span>
        )}
        <div>
          <p className={cn("text-sm font-bold", config.textColor)}>{config.label}</p>
          <p className="text-[11px] text-gray-400">
            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>
      {log.note && (
        <p className="truncate rounded-xl bg-white/50 px-2 py-1 text-xs italic text-gray-500">
          &ldquo;{log.note}&rdquo;
        </p>
      )}
    </Link>
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
      {config.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={config.image} alt={config.label} className="h-7 w-7 object-contain" />
      ) : (
        <span className="text-2xl">{config.emoji}</span>
      )}
      <span className={cn("text-[10px] font-semibold", config.textColor)}>{config.label}</span>
      <span className="text-[9px] text-gray-400">
        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
      </span>
    </Link>
  );
}
