"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";
import { MOOD_CONFIGS, NAUGHTY_MOOD_CONFIGS, LOVE_MOOD_CONFIGS, KATAKNI_CONFIG, type MoodLevel } from "@/types";
import MoodIcon from "@/components/MoodIcon";
import type { CheckinMode } from "@/components/NaughtyModeProvider";

interface MoodScaleProps {
  onSubmit: (mood: MoodLevel, note: string, emojiSvg?: string, gratitude?: string) => Promise<void>;
  isLoading?: boolean;
  naughtyMode?: boolean;
  mode?: CheckinMode;
}

export default function MoodScale({ onSubmit, isLoading = false, naughtyMode = false, mode }: MoodScaleProps) {
  const [selected, setSelected] = useState<MoodLevel | null>(null);
  const [note, setNote] = useState("");
  const [gratitude, setGratitude] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [emojiSvg, setEmojiSvg] = useState<string | null>(null);
  const [generatingEmoji, setGeneratingEmoji] = useState(false);
  const [emojiPrompt, setEmojiPrompt] = useState("");
  const [emojiRemaining, setEmojiRemaining] = useState<number | null>(null);
  const [emojiLimitHit, setEmojiLimitHit] = useState(false);

  const resolvedMode = mode ?? (naughtyMode ? "naughty" : "sweet");
  const configs =
    resolvedMode === "naughty"
      ? NAUGHTY_MOOD_CONFIGS
      : resolvedMode === "love"
      ? LOVE_MOOD_CONFIGS
      : [...MOOD_CONFIGS, KATAKNI_CONFIG];
  const selectedConfig = configs.find((m) => m.level === selected);

  // Reset selection when mode changes
  const [prevMode, setPrevMode] = useState(resolvedMode);
  if (resolvedMode !== prevMode) {
    setPrevMode(resolvedMode);
    setSelected(null);
  }

  // Reset emoji when mood selection changes
  useEffect(() => {
    setEmojiSvg(null);
    setEmojiPrompt("");
  }, [selected]);

  async function generateEmoji() {
    if (!selected) return;
    haptic(20);
    setGeneratingEmoji(true);
    try {
      const res = await fetch("/api/ai/emoji", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: selected, note: emojiPrompt.trim() || undefined }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setEmojiLimitHit(true);
      } else if (data.svg) {
        setEmojiSvg(data.svg);
        setEmojiRemaining(data.remaining ?? null);
      }
    } catch {}
    setGeneratingEmoji(false);
  }

  async function handleSubmit() {
    if (!selected) return;
    haptic([30, 20, 60]);
    try {
      await onSubmit(selected, note.trim(), emojiSvg ?? undefined, gratitude.trim() || undefined);
      setSubmitted(true);
    } catch {
      // parent handles error toast; stay on form so user can retry
    }
  }

  if (submitted && selectedConfig) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 py-10 text-center"
      >
        {emojiSvg ? (
          <div className="h-16 w-16" dangerouslySetInnerHTML={{ __html: emojiSvg }} />
        ) : selectedConfig.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={selectedConfig.image} alt={selectedConfig.label} className="h-16 w-16 object-contain" />
        ) : (
          <MoodIcon level={selectedConfig.level} emoji={selectedConfig.emoji} className="h-16 w-16" />
        )}
        <p className="text-xl font-semibold text-gray-700">Check-in sent!</p>
        <p className="text-sm text-gray-400">
          Your partner has been notified.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Heading */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-800">
          {resolvedMode === "naughty"
            ? "How naughty are you? 😈"
            : resolvedMode === "love"
            ? "Send some love 💕"
            : "How are you feeling?"}
        </h2>
        <p className="mt-1 text-sm text-gray-400">
          {resolvedMode === "naughty"
            ? "Let your partner know what you're craving…"
            : resolvedMode === "love"
            ? "Share how much you love and miss them."
            : "Tap an emoji to share your current mood with your partner."}
        </p>
      </div>

      {/* Emoji Scale */}
      <div className="flex items-center justify-between gap-1">
        {configs.map((config) => {
          const isSelected = selected === config.level;
          return (
            <motion.button
              key={config.level}
              onClick={() => setSelected(config.level)}
              whileTap={{ scale: 0.88 }}
              whileHover={{ scale: 1.08 }}
              aria-label={config.label}
              aria-pressed={isSelected}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-2xl border-2 px-1 py-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-lavender",
                isSelected
                  ? [config.color, config.borderColor, "shadow-card"]
                  : "border-transparent bg-gray-50 hover:bg-gray-100"
              )}
            >
              {config.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={config.image} alt={config.label} className={cn("h-7 w-7 object-contain transition-all", isSelected ? "scale-110" : "")} />
              ) : (
                <MoodIcon level={config.level} emoji={config.emoji} className={cn("h-7 w-7 transition-all", isSelected ? "scale-110" : "")} />
              )}
              <span
                className={cn(
                  "text-[10px] font-medium leading-tight",
                  isSelected ? config.textColor : "text-gray-400"
                )}
              >
                {config.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Description chip */}
      <AnimatePresence mode="wait">
        {selectedConfig && (
          <motion.p
            key={selectedConfig.level}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className={cn(
              "rounded-2xl px-4 py-2 text-sm font-medium",
              selectedConfig.color,
              selectedConfig.textColor
            )}
          >
            {selectedConfig.description}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Optional Note */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="mood-note" className="text-sm font-medium text-gray-600 dark:text-gray-300">
          Add a note{" "}
          <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          id="mood-note"
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 280))}
          placeholder="What's on your mind?"
          rows={2}
          className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-300 focus:border-lavender focus:bg-white focus:outline-none focus:ring-2 focus:ring-lavender/30 transition-all dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:bg-gray-700"
        />
      </div>

      {/* Gratitude prompt removed — future plan */}

      {/* Emoji generation */}
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-col gap-2 mt-1">
          {emojiLimitHit ? (
            <p className="text-xs text-blush-dark font-medium">Daily emoji limit reached — resets tomorrow.</p>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={emojiPrompt}
                onChange={(e) => setEmojiPrompt(e.target.value.slice(0, 100))}
                placeholder="Describe your emoji… (optional)"
                disabled={!selected}
                className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-700 placeholder:text-gray-300 focus:border-lavender focus:bg-white focus:outline-none focus:ring-2 focus:ring-lavender/30 transition-all dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-600 disabled:opacity-40"
              />
              <button
                type="button"
                onClick={generateEmoji}
                disabled={!selected || generatingEmoji}
                className="flex items-center gap-1.5 rounded-2xl bg-lavender/10 px-3 py-1.5 text-xs font-semibold text-lavender hover:bg-lavender/20 disabled:opacity-40 transition-all shrink-0"
              >
                {generatingEmoji ? (
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                ) : "✨"}
                {generatingEmoji ? "Generating…" : "Generate"}
              </button>
            </div>
          )}
          {emojiSvg && (
            <div className="flex items-center gap-1.5">
              <div className="h-8 w-8" dangerouslySetInnerHTML={{ __html: emojiSvg }} />
              <button
                type="button"
                onClick={() => setEmojiSvg(null)}
                className="text-gray-300 hover:text-gray-500 text-sm leading-none"
              >×</button>
              {emojiRemaining !== null && emojiRemaining <= 2 && (
                <span className="text-xs text-gray-400">{emojiRemaining} left today</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Submit */}
      <motion.button
        onClick={handleSubmit}
        disabled={!selected || isLoading}
        whileTap={{ scale: 0.97 }}
        className={cn(
          "mt-2 w-full rounded-3xl py-4 text-base font-semibold tracking-wide transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-lavender",
          selected && !isLoading
            ? "bg-lavender text-white shadow-card hover:bg-lavender-dark"
            : "cursor-not-allowed bg-gray-100 text-gray-300"
        )}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Sending…
          </span>
        ) : (
          "Share with Partner"
        )}
      </motion.button>
    </div>
  );
}
