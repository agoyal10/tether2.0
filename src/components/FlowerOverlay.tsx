"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

const FLOWERS = ["🌸", "🌺", "🌼", "🌷", "🌻", "🪷", "💐"];

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

const PETALS = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  flower: FLOWERS[i % FLOWERS.length],
  x: randomBetween(2, 98),       // % from left
  delay: randomBetween(0, 1.8),
  duration: randomBetween(2.5, 4.5),
  size: randomBetween(1.6, 3.2), // rem
  rotate: randomBetween(-30, 30),
  sway: randomBetween(-40, 40),  // px horizontal drift
}));

export default function FlowerOverlay() {
  const [gift, setGift] = useState<{ id: string; senderName: string } | null>(null);
  const [visible, setVisible] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("flowers")
        .select("id, profile:profiles!flowers_from_user_id_fkey(display_name)")
        .eq("to_user_id", user.id)
        .is("seen_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        const profile = data.profile as unknown as { display_name: string } | null;
        const senderName = profile?.display_name ?? "Your partner";
        setGift({ id: data.id, senderName });
        setVisible(true);
      }
    }
    check();
  }, [supabase]);

  async function dismiss() {
    setVisible(false);
    await fetch("/api/flowers/seen", { method: "POST" });
  }

  return (
    <AnimatePresence>
      {visible && gift && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          onClick={dismiss}
        >
          {/* Falling petals */}
          {PETALS.map((p) => (
            <motion.span
              key={p.id}
              initial={{ y: -80, x: `${p.x}vw`, opacity: 0, rotate: p.rotate }}
              animate={{
                y: "110vh",
                x: [`${p.x}vw`, `calc(${p.x}vw + ${p.sway}px)`, `${p.x}vw`],
                opacity: [0, 1, 1, 0],
                rotate: p.rotate + 180,
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: "easeIn",
                x: { duration: p.duration, ease: "easeInOut", repeat: Infinity },
                repeat: Infinity,
                repeatDelay: randomBetween(0.2, 1),
              }}
              className="pointer-events-none absolute top-0 select-none"
              style={{ fontSize: `${p.size}rem`, left: 0 }}
            >
              {p.flower}
            </motion.span>
          ))}

          {/* Centre card */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
            className="relative z-10 flex flex-col items-center gap-3 rounded-3xl bg-white/90 px-10 py-8 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-6xl">💐</span>
            <p className="text-xl font-bold text-gray-800">{gift.senderName}</p>
            <p className="text-sm text-gray-500">sent you flowers 🌸</p>
            <button
              onClick={dismiss}
              className="mt-2 rounded-2xl bg-lavender px-6 py-2.5 text-sm font-semibold text-white hover:bg-lavender-dark transition-all"
            >
              Thank you 💕
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
