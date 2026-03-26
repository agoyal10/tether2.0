"use client";

import { motion } from "framer-motion";

const emojis = ["🚀", "😊", "☁️", "🌧️", "🌊", "💕", "🥰", "😈", "💞"];

const questions = [
  "how are you feeling?",
  "what's on your mind?",
  "how's your heart today?",
  "ready to check in?",
];

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-8 px-6">
      {/* Emoji wave */}
      <div className="flex items-end gap-2">
        {emojis.map((emoji, i) => (
          <motion.span
            key={i}
            className="text-2xl"
            animate={{ y: [0, -12, 0], scale: [1, 1.25, 1] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.12,
              ease: "easeInOut",
            }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>

      {/* Cycling question text */}
      <div className="h-8 overflow-hidden">
        <motion.div
          animate={{ y: questions.map((_, i) => `-${i * 2}rem`) }}
          transition={{
            duration: questions.length * 2,
            repeat: Infinity,
            ease: "easeInOut",
            times: questions.map((_, i) => i / questions.length),
          }}
          className="flex flex-col"
        >
          {questions.map((q, i) => (
            <p
              key={i}
              className="h-8 text-center text-lg font-semibold text-lavender-dark dark:text-lavender"
              style={{ lineHeight: "2rem" }}
            >
              {q}
            </p>
          ))}
        </motion.div>
      </div>

      {/* Pulsing dots */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-2 w-2 rounded-full bg-lavender"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}
