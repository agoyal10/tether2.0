import React from "react";

// Custom SVG mood icons for the 5 regular moods.
// All icons use a 64×64 viewBox. Size is controlled via className (e.g. "w-10 h-10").

function Thriving({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="t-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#C4B5FD" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id="t-flame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="60%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
        <radialGradient id="t-window" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#BFDBFE" />
          <stop offset="100%" stopColor="#3B82F6" />
        </radialGradient>
      </defs>

      {/* Stars */}
      <circle cx="9"  cy="10" r="1.8" fill="#FCD34D" />
      <circle cx="55" cy="14" r="1.4" fill="#FCD34D" />
      <circle cx="52" cy="6"  r="1"   fill="#FCD34D" />
      <circle cx="13" cy="5"  r="1"   fill="#FCD34D" />
      <circle cx="57" cy="28" r="1.2" fill="#FCD34D" />
      {/* Star sparkles */}
      <path d="M7 20 L8 17 L9 20 L12 21 L9 22 L8 25 L7 22 L4 21Z" fill="#FCD34D" />
      <path d="M54 38 L55 36 L56 38 L58 39 L56 40 L55 42 L54 40 L52 39Z" fill="#C4B5FD" />

      {/* Left fin */}
      <path d="M22 40 L14 52 L22 48 Z" fill="#6D28D9" />
      {/* Right fin */}
      <path d="M42 40 L50 52 L42 48 Z" fill="#6D28D9" />

      {/* Rocket body */}
      <rect x="22" y="28" width="20" height="20" rx="3" fill="url(#t-body)" />
      {/* Nose cone */}
      <path d="M22 28 Q22 10 32 6 Q42 10 42 28 Z" fill="url(#t-body)" />
      {/* Body highlight */}
      <path d="M26 20 Q28 12 32 9 Q30 12 29 20 Z" fill="white" opacity="0.25" />

      {/* Window */}
      <circle cx="32" cy="36" r="7"   fill="white" opacity="0.9" />
      <circle cx="32" cy="36" r="5.5" fill="url(#t-window)" />
      {/* Cute face in window */}
      <circle cx="30" cy="35" r="1"   fill="#1E3A5F" />
      <circle cx="34" cy="35" r="1"   fill="#1E3A5F" />
      <path d="M30 38 Q32 40 34 38" stroke="#1E3A5F" strokeWidth="1.2" strokeLinecap="round" />
      {/* Eye shine */}
      <circle cx="30.8" cy="34.4" r="0.4" fill="white" />
      <circle cx="34.8" cy="34.4" r="0.4" fill="white" />

      {/* Flames */}
      <path d="M25 48 Q27 56 29 60 Q32 64 32 64 Q32 64 35 60 Q37 56 39 48 Z" fill="url(#t-flame)" />
      <path d="M28 48 Q29 54 32 58 Q35 54 36 48 Z" fill="#FDE68A" opacity="0.9" />
    </svg>
  );
}

function Good({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="g-sun" cx="40%" cy="35%" r="65%">
          <stop offset="0%"   stopColor="#FEF08A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </radialGradient>
      </defs>

      {/* Rays */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
        <rect
          key={i}
          x="30" y="4" width="4" height="10" rx="2"
          fill="#FCD34D"
          transform={`rotate(${deg} 32 32)`}
        />
      ))}

      {/* Sun body */}
      <circle cx="32" cy="32" r="16" fill="url(#g-sun)" />
      {/* Body highlight */}
      <ellipse cx="27" cy="26" rx="5" ry="3" fill="white" opacity="0.25" transform="rotate(-30 27 26)" />

      {/* Eyes */}
      <ellipse cx="27" cy="30" rx="2"   ry="2.5" fill="#92400E" />
      <ellipse cx="37" cy="30" rx="2"   ry="2.5" fill="#92400E" />
      <circle  cx="27.8" cy="29.2" r="0.7" fill="white" />
      <circle  cx="37.8" cy="29.2" r="0.7" fill="white" />

      {/* Smile */}
      <path d="M25 36 Q32 42 39 36" stroke="#92400E" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* Rosy cheeks */}
      <ellipse cx="23" cy="35" rx="3.5" ry="2.2" fill="#FCA5A5" opacity="0.55" />
      <ellipse cx="41" cy="35" rx="3.5" ry="2.2" fill="#FCA5A5" opacity="0.55" />
    </svg>
  );
}

function Okay({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ok-cloud" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%"   stopColor="#F1F5F9" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>
      </defs>

      {/* Cloud puffs — back layer (shadow) */}
      <circle cx="22" cy="36" r="10" fill="#B0BEC5" opacity="0.35" />
      <circle cx="32" cy="34" r="13" fill="#B0BEC5" opacity="0.35" />
      <circle cx="43" cy="36" r="10" fill="#B0BEC5" opacity="0.35" />

      {/* Cloud puffs — main */}
      <circle cx="21" cy="35" r="10" fill="url(#ok-cloud)" />
      <circle cx="32" cy="32" r="13" fill="url(#ok-cloud)" />
      <circle cx="43" cy="35" r="10" fill="url(#ok-cloud)" />
      {/* Cloud base fill */}
      <rect x="11" y="35" width="42" height="14" rx="7" fill="url(#ok-cloud)" />
      {/* Highlight */}
      <ellipse cx="27" cy="27" rx="6" ry="3.5" fill="white" opacity="0.5" transform="rotate(-15 27 27)" />

      {/* Neutral face */}
      <circle cx="27" cy="36" r="2"   fill="#64748B" />
      <circle cx="37" cy="36" r="2"   fill="#64748B" />
      <circle cx="27.7" cy="35.3" r="0.7" fill="white" />
      <circle cx="37.7" cy="35.3" r="0.7" fill="white" />
      {/* Flat mouth */}
      <path d="M27 41 L37 41" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Low({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lw-cloud" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%"   stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id="lw-drop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>

      {/* Cloud puffs */}
      <circle cx="21" cy="28" r="10" fill="url(#lw-cloud)" />
      <circle cx="32" cy="25" r="13" fill="url(#lw-cloud)" />
      <circle cx="43" cy="28" r="10" fill="url(#lw-cloud)" />
      <rect x="11" y="28" width="42" height="12" rx="6" fill="url(#lw-cloud)" />
      {/* Highlight */}
      <ellipse cx="26" cy="20" rx="5" ry="3" fill="white" opacity="0.2" transform="rotate(-15 26 20)" />

      {/* Sad face */}
      <circle cx="27" cy="29" r="2"   fill="#1E293B" />
      <circle cx="37" cy="29" r="2"   fill="#1E293B" />
      <circle cx="27.7" cy="28.3" r="0.7" fill="white" />
      <circle cx="37.7" cy="28.3" r="0.7" fill="white" />
      {/* Sad mouth */}
      <path d="M27 34 Q32 31 37 34" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* Raindrops */}
      <path d="M22 42 Q21 46 22 50 Q23 54 22 58" stroke="url(#lw-drop)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M32 44 Q31 49 32 53 Q33 57 32 61" stroke="url(#lw-drop)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M42 42 Q41 46 42 50 Q43 54 42 58" stroke="url(#lw-drop)" strokeWidth="2.5" strokeLinecap="round" />

      {/* Drop tips */}
      <ellipse cx="22" cy="58" rx="1.5" ry="2.5" fill="#2563EB" opacity="0.7" />
      <ellipse cx="32" cy="61" rx="1.5" ry="2.5" fill="#2563EB" opacity="0.7" />
      <ellipse cx="42" cy="58" rx="1.5" ry="2.5" fill="#2563EB" opacity="0.7" />
    </svg>
  );
}

function Struggling({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="st-wave1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>
        <linearGradient id="st-wave2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#7DD3FC" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id="st-deep" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#0C4A6E" />
        </linearGradient>
      </defs>

      {/* Deep water body */}
      <rect x="2" y="38" width="60" height="24" rx="4" fill="url(#st-deep)" />

      {/* Back wave */}
      <path
        d="M2 36 Q10 28 18 34 Q26 40 34 32 Q42 24 50 30 Q58 36 62 30 L62 50 L2 50 Z"
        fill="url(#st-wave2)"
        opacity="0.75"
      />

      {/* Main wave */}
      <path
        d="M2 40 Q8 30 16 36 Q24 42 32 30 Q40 18 50 28 Q56 34 62 26 L62 56 L2 56 Z"
        fill="url(#st-wave1)"
      />

      {/* Curl / foam at wave peak */}
      <path
        d="M30 30 Q36 22 42 26 Q46 28 44 32 Q42 28 38 28 Q34 28 32 32 Z"
        fill="white"
        opacity="0.55"
      />
      <path
        d="M48 28 Q52 24 56 26 Q58 27 57 30 Q56 27 53 27 Q51 27 50 30 Z"
        fill="white"
        opacity="0.4"
      />

      {/* Foam dots */}
      <circle cx="20" cy="36" r="1.5" fill="white" opacity="0.6" />
      <circle cx="26" cy="38" r="1"   fill="white" opacity="0.5" />
      <circle cx="14" cy="38" r="1"   fill="white" opacity="0.45" />
      <circle cx="54" cy="32" r="1.2" fill="white" opacity="0.5" />

      {/* Small person barely above water */}
      <circle cx="32" cy="26" r="4"   fill="#FED7AA" />
      {/* Hair */}
      <path d="M28 24 Q32 20 36 24" fill="#92400E" />
      {/* Tiny face */}
      <circle cx="30.5" cy="25.5" r="0.9" fill="#92400E" />
      <circle cx="33.5" cy="25.5" r="0.9" fill="#92400E" />
      <path d="M30.5 28 Q32 30 33.5 28" stroke="#92400E" strokeWidth="0.8" strokeLinecap="round" fill="none" />
      {/* Arms reaching up */}
      <path d="M28 28 Q24 24 22 20" stroke="#FED7AA" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M36 28 Q40 24 42 20" stroke="#FED7AA" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

const ICONS: Partial<Record<string, (p: { className?: string }) => React.ReactElement>> = {
  thriving:   (p) => <Thriving   {...p} />,
  good:       (p) => <Good       {...p} />,
  okay:       (p) => <Okay       {...p} />,
  low:        (p) => <Low        {...p} />,
  struggling: (p) => <Struggling {...p} />,
};

interface MoodIconProps {
  level: string;
  className?: string;
  /** Fallback emoji if no custom SVG exists for this mood */
  emoji: string;
}

export default function MoodIcon({ level, className, emoji }: MoodIconProps) {
  const Icon = ICONS[level];
  if (Icon) return <Icon className={className} />;
  // Fallback for love/naughty moods — keep emoji
  return <span style={{ fontSize: "inherit" }}>{emoji}</span>;
}
