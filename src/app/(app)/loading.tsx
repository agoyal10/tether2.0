"use client";

import { motion } from "framer-motion";

export default function AppLoading() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6">
      <motion.span
        className="text-5xl"
        animate={{ scale: [1, 1.2, 1], rotate: [0, 8, -8, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      >
        💞
      </motion.span>
      <motion.p
        className="text-sm font-medium text-lavender-dark dark:text-lavender"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      >
        just a sec…
      </motion.p>
    </div>
  );
}
