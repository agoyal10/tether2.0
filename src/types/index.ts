// ─── Domain Types ─────────────────────────────────────────────────────────────

export type MoodLevel =
  | "thriving" | "good" | "okay" | "low" | "struggling"
  | "soaked" | "burning" | "heated" | "frisky" | "naughty";

export interface MoodConfig {
  level: MoodLevel;
  emoji: string;
  label: string;
  color: string;       // Tailwind bg class
  textColor: string;   // Tailwind text class
  borderColor: string; // Tailwind border class
  description: string;
}

export const NAUGHTY_MOOD_CONFIGS: MoodConfig[] = [
  {
    level: "soaked",
    emoji: "💦",
    label: "Soaked",
    color: "bg-sky-light",
    textColor: "text-sky-dark",
    borderColor: "border-sky",
    description: "Way too turned on right now",
  },
  {
    level: "burning",
    emoji: "🥵",
    label: "Burning",
    color: "bg-blush-light",
    textColor: "text-blush-dark",
    borderColor: "border-blush",
    description: "Need you right now",
  },
  {
    level: "heated",
    emoji: "🔥",
    label: "Heated",
    color: "bg-peach-light",
    textColor: "text-peach-dark",
    borderColor: "border-peach",
    description: "Can't stop thinking about you",
  },
  {
    level: "frisky",
    emoji: "💋",
    label: "Frisky",
    color: "bg-lavender-light",
    textColor: "text-lavender-dark",
    borderColor: "border-lavender",
    description: "Feeling playful and flirty",
  },
  {
    level: "naughty",
    emoji: "😈",
    label: "Naughty",
    color: "bg-sage-light",
    textColor: "text-sage-dark",
    borderColor: "border-sage",
    description: "Mischievous thoughts…",
  },
];

export const MOOD_CONFIGS: MoodConfig[] = [
  {
    level: "thriving",
    emoji: "🚀",
    label: "Thriving",
    color: "bg-sage-light",
    textColor: "text-sage-dark",
    borderColor: "border-sage",
    description: "Feeling amazing and full of energy",
  },
  {
    level: "good",
    emoji: "😊",
    label: "Good",
    color: "bg-sky-light",
    textColor: "text-sky-dark",
    borderColor: "border-sky",
    description: "Things are going well",
  },
  {
    level: "okay",
    emoji: "☁️",
    label: "Okay",
    color: "bg-lavender-light",
    textColor: "text-lavender-dark",
    borderColor: "border-lavender",
    description: "Somewhere in the middle",
  },
  {
    level: "low",
    emoji: "🌧️",
    label: "Low",
    color: "bg-peach-light",
    textColor: "text-peach-dark",
    borderColor: "border-peach",
    description: "Could use some support",
  },
  {
    level: "struggling",
    emoji: "🌊",
    label: "Struggling",
    color: "bg-blush-light",
    textColor: "text-blush-dark",
    borderColor: "border-blush",
    description: "Having a really hard time",
  },
];

// ─── Database Row Types ────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  invite_code: string;
  created_at: string;
  updated_at: string;
}

export interface Connection {
  id: string;
  user_a_id: string;
  user_b_id: string;
  status: "pending" | "active" | "blocked";
  created_at: string;
}

export interface MoodLog {
  id: string;
  user_id: string;
  mood: MoodLevel;
  note: string | null;
  is_resolved: boolean;
  created_at: string;
  // joined
  profile?: Profile;
}

export interface Message {
  id: string;
  mood_log_id: string;
  sender_id: string;
  content: string;
  media_path: string | null;
  created_at: string;
  // joined
  profile?: Profile;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}
