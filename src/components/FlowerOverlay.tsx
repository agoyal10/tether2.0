"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

// Realistic rose petal SVG paths (bezier curves)
const PETAL_PATHS = [
  // Full rounded petal
  "M0,0 C-10,-18 -14,-40 -9,-58 C-4,-72 4,-72 9,-58 C14,-40 10,-18 0,0Z",
  // Slightly cupped petal
  "M0,0 C-12,-15 -18,-38 -12,-56 C-6,-70 2,-68 10,-54 C16,-38 10,-16 0,0Z",
  // Narrow elongated petal
  "M0,0 C-7,-20 -10,-44 -6,-62 C-2,-76 2,-76 6,-62 C10,-44 7,-20 0,0Z",
  // Wide open petal
  "M0,0 C-14,-12 -22,-32 -16,-52 C-10,-68 6,-70 14,-54 C20,-36 14,-14 0,0Z",
  // Slightly folded petal
  "M0,0 C-8,-14 -16,-34 -14,-54 C-12,-68 -2,-72 8,-58 C14,-42 10,-18 0,0Z",
];

const PETAL_COLORS = [
  { fill: "#F2A4BA", stroke: "#E07090" },
  { fill: "#FBBCCC", stroke: "#E8889E" },
  { fill: "#F9D0DA", stroke: "#E8A0B0" },
  { fill: "#E8869E", stroke: "#C85E7E" },
  { fill: "#FDD0DC", stroke: "#F0A0B8" },
  { fill: "#F4B8C8", stroke: "#DC8898" },
];

const PETALS = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  path: PETAL_PATHS[i % PETAL_PATHS.length],
  color: PETAL_COLORS[i % PETAL_COLORS.length],
  x: randomBetween(2, 98),
  delay: randomBetween(0, 2.2),
  duration: randomBetween(3, 5.5),
  size: randomBetween(22, 42),       // px viewBox scale
  rotate: randomBetween(-60, 60),
  sway: randomBetween(-50, 50),
  opacity: randomBetween(0.75, 1),
}));

// Simple rose SVG for the card
function RoseIcon() {
  return (
    <svg viewBox="0 0 80 80" className="h-20 w-20" fill="none">
      <defs>
        <radialGradient id="rg1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FBBCCC" />
          <stop offset="100%" stopColor="#E07090" />
        </radialGradient>
        <radialGradient id="rg2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F9D0DA" />
          <stop offset="100%" stopColor="#F2A4BA" />
        </radialGradient>
      </defs>
      {/* Outer petals */}
      <ellipse cx="40" cy="22" rx="10" ry="16" fill="url(#rg2)" transform="rotate(-20 40 40)" />
      <ellipse cx="40" cy="22" rx="10" ry="16" fill="url(#rg2)" transform="rotate(20 40 40)" />
      <ellipse cx="40" cy="22" rx="10" ry="16" fill="url(#rg2)" transform="rotate(70 40 40)" />
      <ellipse cx="40" cy="22" rx="10" ry="16" fill="url(#rg2)" transform="rotate(-70 40 40)" />
      <ellipse cx="40" cy="22" rx="10" ry="16" fill="url(#rg2)" transform="rotate(120 40 40)" />
      <ellipse cx="40" cy="22" rx="10" ry="16" fill="url(#rg2)" transform="rotate(-120 40 40)" />
      {/* Inner petals */}
      <ellipse cx="40" cy="26" rx="8" ry="13" fill="url(#rg1)" transform="rotate(0 40 40)" />
      <ellipse cx="40" cy="26" rx="8" ry="13" fill="url(#rg1)" transform="rotate(60 40 40)" />
      <ellipse cx="40" cy="26" rx="8" ry="13" fill="url(#rg1)" transform="rotate(120 40 40)" />
      <ellipse cx="40" cy="26" rx="8" ry="13" fill="url(#rg1)" transform="rotate(180 40 40)" />
      <ellipse cx="40" cy="26" rx="8" ry="13" fill="url(#rg1)" transform="rotate(240 40 40)" />
      <ellipse cx="40" cy="26" rx="8" ry="13" fill="url(#rg1)" transform="rotate(300 40 40)" />
      {/* Centre */}
      <circle cx="40" cy="40" r="8" fill="#E07090" />
      <circle cx="40" cy="40" r="5" fill="#FBBCCC" />
      {/* Stem */}
      <path d="M40 56 Q38 66 36 74" stroke="#5C8A3C" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M38 64 Q32 60 30 54" stroke="#5C8A3C" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function FlowerOverlay() {
  const [gift, setGift] = useState<{ id: string; senderName: string } | null>(null);
  const [visible, setVisible] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function check() {
      if (visible) return;
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
    const onVisible = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: "rgba(10,5,15,0.72)", backdropFilter: "blur(6px)" }}
          onClick={dismiss}
        >
          {/* Falling rose petals */}
          {PETALS.map((p) => (
            <motion.div
              key={p.id}
              initial={{ y: -60, opacity: 0, rotate: p.rotate }}
              animate={{
                y: "115vh",
                x: [0, p.sway, 0, -p.sway * 0.5, 0],
                opacity: [0, p.opacity, p.opacity, p.opacity * 0.6, 0],
                rotate: [p.rotate, p.rotate + 120, p.rotate + 200],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: "easeIn",
                repeat: Infinity,
                repeatDelay: randomBetween(0.3, 1.2),
              }}
              className="pointer-events-none absolute select-none"
              style={{ left: `${p.x}%`, top: 0 }}
            >
              <svg
                width={p.size}
                height={p.size * 1.4}
                viewBox="-25 -80 50 85"
              >
                <defs>
                  <linearGradient id={`pg${p.id}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={p.color.fill} stopOpacity="0.95" />
                    <stop offset="100%" stopColor={p.color.stroke} stopOpacity="0.8" />
                  </linearGradient>
                </defs>
                <path
                  d={p.path}
                  fill={`url(#pg${p.id})`}
                  stroke={p.color.stroke}
                  strokeWidth="0.5"
                  strokeOpacity="0.4"
                />
              </svg>
            </motion.div>
          ))}

          {/* Centre card */}
          <motion.div
            initial={{ scale: 0.75, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ delay: 0.35, type: "spring", stiffness: 240, damping: 22 }}
            className="relative z-10 flex flex-col items-center gap-4 rounded-3xl px-10 py-9 text-center shadow-2xl"
            style={{ background: "rgba(255,255,255,0.96)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <RoseIcon />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-rose-400 mb-1">With love</p>
              <p className="text-2xl font-bold text-gray-800">{gift.senderName}</p>
              <p className="mt-1 text-sm text-gray-400">sent you roses</p>
            </div>
            <button
              onClick={dismiss}
              className="mt-1 rounded-2xl px-8 py-2.5 text-sm font-semibold text-white transition-all"
              style={{ background: "linear-gradient(135deg, #F2A4BA, #E07090)" }}
            >
              Thank you
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
