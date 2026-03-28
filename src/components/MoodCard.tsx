"use client";

import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { MOOD_CONFIGS, NAUGHTY_MOOD_CONFIGS, LOVE_MOOD_CONFIGS, KATAKNI_CONFIG, type MoodLog } from "@/types";
import MoodIcon from "@/components/MoodIcon";

const ALL_CONFIGS = [...MOOD_CONFIGS, ...NAUGHTY_MOOD_CONFIGS, ...LOVE_MOOD_CONFIGS, KATAKNI_CONFIG];

interface MoodCardProps {
  log: MoodLog;
  isPartner?: boolean;
  unreadCount?: number;
  hideLink?: boolean;
}

export default function MoodCard({ log, isPartner = false, unreadCount = 0, hideLink = false }: MoodCardProps) {
  const config = ALL_CONFIGS.find((m) => m.level === log.mood)!;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-3xl border-2 p-5 shadow-soft",
        config.color,
        config.borderColor
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {log.emoji_svg ? (
            <div className="h-10 w-10 shrink-0" dangerouslySetInnerHTML={{ __html: log.emoji_svg }} />
          ) : config.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={config.image} alt={config.label} className="h-10 w-10 object-contain" />
          ) : (
            <MoodIcon level={config.level} emoji={config.emoji} className="h-10 w-10" />
          )}
          <div>
            <p className={cn("font-semibold", config.textColor)}>{config.label}</p>
            <p className="text-xs text-gray-400">
              {isPartner ? (log.profile?.display_name ?? "Partner") : "You"}
              {" · "}
              {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        {log.is_resolved ? (
          <span className="rounded-full bg-white/60 px-2 py-0.5 text-xs text-gray-400">
            Resolved ✓
          </span>
        ) : unreadCount > 0 ? (
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-blush-dark px-1.5 text-xs font-bold text-white shadow-sm">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </div>

      {/* Note */}
      {log.note && (
        <p className="mt-3 rounded-2xl bg-white/50 px-4 py-2 text-sm text-gray-600 italic">
          &ldquo;{log.note}&rdquo;
        </p>
      )}

      {/* Gratitude */}
      {log.gratitude && (
        <p className="mt-2 rounded-2xl bg-yellow-50/80 px-4 py-2 text-sm text-yellow-700">
          💛 {log.gratitude}
        </p>
      )}

      {/* CTA */}
      {!hideLink && (
        <Link
          href={`/chat/${log.id}`}
          className={cn(
            "mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-center text-sm font-semibold transition-all hover:opacity-90 focus:outline-none",
            "bg-white/70 backdrop-blur-sm",
            config.textColor
          )}
        >
          {log.is_resolved ? "View Chat" : "Open Chat"}
          {unreadCount > 0 && (
            <span className="rounded-full bg-blush-dark px-1.5 py-0.5 text-[10px] font-bold text-white">
              {unreadCount} new
            </span>
          )}
          <span>→</span>
        </Link>
      )}
    </motion.div>
  );
}
