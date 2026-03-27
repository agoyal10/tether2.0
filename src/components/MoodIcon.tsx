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

// ─── Love moods ───────────────────────────────────────────────────────────────

function Smitten({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <defs>
        <radialGradient id="sm-face" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FEE2E2" />
          <stop offset="100%" stopColor="#FECACA" />
        </radialGradient>
      </defs>
      {/* Face */}
      <circle cx="32" cy="34" r="20" fill="url(#sm-face)" />
      <ellipse cx="27" cy="42" rx="4" ry="2.2" fill="#FCA5A5" opacity="0.6" />
      <ellipse cx="37" cy="42" rx="4" ry="2.2" fill="#FCA5A5" opacity="0.6" />
      {/* Heart eyes */}
      <path d="M23 29 C23 26 25 24 27 26 C29 24 31 26 31 29 C31 32 27 35 27 35 C27 35 23 32 23 29Z" fill="#E11D48" />
      <path d="M33 29 C33 26 35 24 37 26 C39 24 41 26 41 29 C41 32 37 35 37 35 C37 35 33 32 33 29Z" fill="#E11D48" />
      {/* Shine on hearts */}
      <circle cx="26" cy="27.5" r="1.2" fill="white" opacity="0.7" />
      <circle cx="36" cy="27.5" r="1.2" fill="white" opacity="0.7" />
      {/* Big smile */}
      <path d="M23 44 Q32 52 41 44" stroke="#E11D48" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {/* Floating hearts above */}
      <path d="M10 14 C10 12 11 10 12.5 11.5 C14 10 15 12 15 14 C15 16 12.5 18 12.5 18 C12.5 18 10 16 10 14Z" fill="#FB7185" />
      <path d="M49 8 C49 5.5 50.5 3.5 52.5 5.5 C54.5 3.5 56 5.5 56 8 C56 10.5 52.5 13 52.5 13 C52.5 13 49 10.5 49 8Z" fill="#F43F5E" />
      <path d="M55 22 C55 21 55.7 20 56.7 21 C57.7 20 58.4 21 58.4 22 C58.4 23 56.7 24.2 56.7 24.2 C56.7 24.2 55 23 55 22Z" fill="#FDA4AF" />
    </svg>
  );
}

function Adoring({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <defs>
        <linearGradient id="ad-h1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FDA4AF" />
          <stop offset="100%" stopColor="#E11D48" />
        </linearGradient>
        <linearGradient id="ad-h2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#C4B5FD" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      {/* Large pink heart */}
      <path d="M14 28 C14 20 20 14 26 18 C30 14 38 14 40 20 C46 20 50 26 46 34 C42 42 32 52 32 52 C32 52 22 44 16 36 C14 33 14 30 14 28Z" fill="url(#ad-h1)" />
      {/* Overlap purple heart */}
      <path d="M24 32 C24 24 30 18 36 22 C40 18 48 18 50 24 C56 24 60 30 56 38 C52 46 42 56 42 56 C42 56 32 48 26 40 C24 37 24 34 24 32Z" fill="url(#ad-h2)" opacity="0.85" />
      {/* Sparkles */}
      <path d="M8 18 L9 14 L10 18 L14 19 L10 20 L9 24 L8 20 L4 19Z" fill="#FCD34D" />
      <path d="M54 10 L55 7 L56 10 L59 11 L56 12 L55 15 L54 12 L51 11Z" fill="#FCD34D" />
      <circle cx="10" cy="36" r="1.5" fill="#FCD34D" />
      <circle cx="56" cy="28" r="1.2" fill="#C4B5FD" />
      {/* Heart shine */}
      <path d="M20 26 Q24 20 30 22" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.45" />
    </svg>
  );
}

function Connected({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <defs>
        <linearGradient id="cn-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="cn-b" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A5F3FC" />
          <stop offset="100%" stopColor="#0891B2" />
        </linearGradient>
      </defs>
      {/* Left figure */}
      <circle cx="18" cy="16" r="7" fill="url(#cn-a)" />
      <path d="M11 28 Q18 24 25 28 L25 46 Q18 50 11 46 Z" fill="url(#cn-a)" />
      {/* Right figure */}
      <circle cx="46" cy="16" r="7" fill="url(#cn-b)" />
      <path d="M39 28 Q46 24 53 28 L53 46 Q46 50 39 46 Z" fill="url(#cn-b)" />
      {/* Joined hands */}
      <path d="M25 36 Q32 32 39 36" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M25 36 Q32 32 39 36" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      {/* Heart above joined hands */}
      <path d="M28 22 C28 20 29.5 18 31 19.5 C32.5 18 34 20 34 22 C34 24 31 27 31 27 C31 27 28 24 28 22Z" fill="#E11D48" />
      {/* Faces */}
      <circle cx="16" cy="15" r="1.2" fill="#92400E" />
      <circle cx="20" cy="15" r="1.2" fill="#92400E" />
      <path d="M15.5 19 Q18 21.5 20.5 19" stroke="#92400E" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <circle cx="44" cy="15" r="1.2" fill="#1E3A5F" />
      <circle cx="48" cy="15" r="1.2" fill="#1E3A5F" />
      <path d="M43.5 19 Q46 21.5 48.5 19" stroke="#1E3A5F" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function Longing({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <defs>
        <linearGradient id="lg-p1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="lg-p2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C4B5FD" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id="lg-heart" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FB7185" />
          <stop offset="100%" stopColor="#E11D48" />
        </linearGradient>
      </defs>
      {/* Stars in the gap */}
      <circle cx="32" cy="7"  r="1.5" fill="#FCD34D" />
      <circle cx="24" cy="11" r="1"   fill="#FCD34D" opacity="0.7" />
      <circle cx="40" cy="9"  r="1"   fill="#FCD34D" opacity="0.7" />
      {/* Dashed distance line */}
      <line x1="26" y1="40" x2="38" y2="40" stroke="#E5E7EB" strokeWidth="1.5" strokeDasharray="2,2" opacity="0.5" />
      {/* Left figure */}
      <circle cx="12" cy="16" r="6" fill="url(#lg-p1)" />
      <path d="M6 30 Q6 46 12 50 Q18 46 18 30 Q18 22 12 22 Q6 22 6 30Z" fill="url(#lg-p1)" />
      {/* Left arm reaching right */}
      <path d="M17 30 Q22 34 26 37" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Right figure */}
      <circle cx="52" cy="16" r="6" fill="url(#lg-p2)" />
      <path d="M46 30 Q46 46 52 50 Q58 46 58 30 Q58 22 52 22 Q46 22 46 30Z" fill="url(#lg-p2)" />
      {/* Right arm reaching left */}
      <path d="M47 30 Q42 34 38 37" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Floating heart between them */}
      <path d="M28 20 C28 18 29.5 16 31 17.5 C32.5 16 34 18 34 20 C34 22 31 25 31 25 C31 25 28 22 28 20Z" fill="url(#lg-heart)" />
      {/* Sparkles near heart */}
      <path d="M20 16 L21 13 L22 16 L25 17 L22 18 L21 21 L20 18 L17 17Z" fill="#FCD34D" opacity="0.75" />
      <path d="M40 14 L41 12 L42 14 L44 15 L42 16 L41 18 L40 16 L38 15Z" fill="#FCD34D" opacity="0.75" />
    </svg>
  );
}

function Tender({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <defs>
        <radialGradient id="td-c" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="100%" stopColor="#FCD34D" />
        </radialGradient>
        <radialGradient id="td-p" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FBCFE8" />
          <stop offset="100%" stopColor="#F472B6" />
        </radialGradient>
      </defs>
      {/* Stem */}
      <path d="M32 48 Q30 54 28 60" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M31 54 Q26 52 24 48" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" />
      {/* 5 petals */}
      <ellipse cx="32" cy="22" rx="7" ry="14" fill="url(#td-p)" />
      <ellipse cx="32" cy="22" rx="7" ry="14" fill="url(#td-p)" transform="rotate(72 32 32)" />
      <ellipse cx="32" cy="22" rx="7" ry="14" fill="url(#td-p)" transform="rotate(144 32 32)" />
      <ellipse cx="32" cy="22" rx="7" ry="14" fill="url(#td-p)" transform="rotate(216 32 32)" />
      <ellipse cx="32" cy="22" rx="7" ry="14" fill="url(#td-p)" transform="rotate(288 32 32)" />
      {/* Centre */}
      <circle cx="32" cy="32" r="8"   fill="url(#td-c)" />
      <circle cx="32" cy="32" r="5.5" fill="#FDE68A" />
      {/* Centre dots */}
      <circle cx="30" cy="30" r="1"   fill="#D97706" />
      <circle cx="34" cy="30" r="1"   fill="#D97706" />
      <circle cx="32" cy="34" r="1"   fill="#D97706" />
      {/* Petal highlights */}
      <ellipse cx="32" cy="20" rx="2.5" ry="5" fill="white" opacity="0.25" />
    </svg>
  );
}

// ─── Special ──────────────────────────────────────────────────────────────────

function Katakni({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <defs>
        <radialGradient id="kt-face" cx="40%" cy="35%" r="65%">
          <stop offset="0%"   stopColor="#FCA5A5" />
          <stop offset="100%" stopColor="#DC2626" />
        </radialGradient>
        <radialGradient id="kt-steam" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#F3F4F6" />
          <stop offset="100%" stopColor="#D1D5DB" />
        </radialGradient>
      </defs>

      {/* Steam puffs — left */}
      <circle cx="10" cy="30" r="5.5" fill="url(#kt-steam)" />
      <circle cx="5"  cy="24" r="4"   fill="url(#kt-steam)" />
      <circle cx="14" cy="22" r="4.5" fill="url(#kt-steam)" />
      <circle cx="7"  cy="18" r="3"   fill="url(#kt-steam)" />
      <circle cx="14" cy="16" r="3.5" fill="url(#kt-steam)" />

      {/* Steam puffs — right */}
      <circle cx="54" cy="30" r="5.5" fill="url(#kt-steam)" />
      <circle cx="59" cy="24" r="4"   fill="url(#kt-steam)" />
      <circle cx="50" cy="22" r="4.5" fill="url(#kt-steam)" />
      <circle cx="57" cy="18" r="3"   fill="url(#kt-steam)" />
      <circle cx="50" cy="16" r="3.5" fill="url(#kt-steam)" />

      {/* Face */}
      <circle cx="32" cy="36" r="20" fill="url(#kt-face)" />
      {/* Face highlight */}
      <ellipse cx="26" cy="28" rx="5" ry="3" fill="white" opacity="0.2" transform="rotate(-20 26 28)" />

      {/* Angry flushed cheeks */}
      <ellipse cx="19" cy="42" rx="5" ry="3" fill="#991B1B" opacity="0.4" />
      <ellipse cx="45" cy="42" rx="5" ry="3" fill="#991B1B" opacity="0.4" />

      {/* Angry eyebrows — sharp V shape */}
      <path d="M20 28 L28 32" stroke="#7F1D1D" strokeWidth="3"   strokeLinecap="round" />
      <path d="M36 32 L44 28" stroke="#7F1D1D" strokeWidth="3"   strokeLinecap="round" />

      {/* Squinting eyes */}
      <ellipse cx="26" cy="34" rx="4"   ry="3"   fill="#7F1D1D" />
      <ellipse cx="38" cy="34" rx="4"   ry="3"   fill="#7F1D1D" />
      {/* Eye shine */}
      <circle cx="27.5" cy="33" r="1.2" fill="white" opacity="0.7" />
      <circle cx="39.5" cy="33" r="1.2" fill="white" opacity="0.7" />
      {/* Angry lower lid lines */}
      <path d="M22 36 Q26 38 30 36" stroke="#7F1D1D" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M34 36 Q38 38 42 36" stroke="#7F1D1D" strokeWidth="1.5" strokeLinecap="round" fill="none" />

      {/* Gritted teeth frown */}
      <path d="M23 44 Q32 40 41 44" stroke="#7F1D1D" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Teeth marks */}
      <path d="M25 43 Q32 39 39 43" stroke="#7F1D1D" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M25 43 Q32 39 39 43" stroke="white"  strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <line x1="29" y1="40.5" x2="29" y2="44" stroke="#7F1D1D" strokeWidth="1" />
      <line x1="32" y1="39.5" x2="32" y2="43" stroke="#7F1D1D" strokeWidth="1" />
      <line x1="35" y1="40.5" x2="35" y2="44" stroke="#7F1D1D" strokeWidth="1" />

      {/* Forehead vein */}
      <path d="M30 22 Q32 18 34 22 Q33 24 32 22 Q31 24 30 22Z" fill="#7F1D1D" opacity="0.6" />
    </svg>
  );
}

// ─── Naughty moods ────────────────────────────────────────────────────────────

function Soaked({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <defs>
        <linearGradient id="sk-band" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FBCFE8" />
          <stop offset="100%" stopColor="#F472B6" />
        </linearGradient>
        <linearGradient id="sk-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FCE7F3" />
          <stop offset="100%" stopColor="#F9A8D4" />
        </linearGradient>
        <radialGradient id="sk-wet" cx="50%" cy="60%" r="55%">
          <stop offset="0%" stopColor="#7DD3FC" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#BAE6FD" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#BAE6FD" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sk-drop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7DD3FC" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
      </defs>
      {/* Waistband */}
      <rect x="9" y="8" width="46" height="13" rx="6.5" fill="url(#sk-band)" />
      {/* Lace dots on waistband */}
      <circle cx="16" cy="14.5" r="1.8" fill="white" opacity="0.45" />
      <circle cx="23" cy="14.5" r="1.8" fill="white" opacity="0.45" />
      <circle cx="30" cy="14.5" r="1.8" fill="white" opacity="0.45" />
      <circle cx="37" cy="14.5" r="1.8" fill="white" opacity="0.45" />
      <circle cx="44" cy="14.5" r="1.8" fill="white" opacity="0.45" />
      {/* Bow */}
      <path d="M28 14.5 L32 11.5 L36 14.5 L32 17.5 Z" fill="#BE185D" />
      <circle cx="32" cy="14.5" r="2.2" fill="#E11D48" />
      {/* Panty body */}
      <path d="M9 21 C6 28 10 38 18 46 C22 52 28 56 32 57 C36 56 42 52 46 46 C54 38 58 28 55 21 Z" fill="url(#sk-body)" />
      {/* Wet patch — darker saturated area in crotch */}
      <ellipse cx="32" cy="47" rx="12" ry="7" fill="url(#sk-wet)" />
      <ellipse cx="32" cy="48" rx="7" ry="4" fill="#38BDF8" opacity="0.2" />
      {/* Shine on dry fabric */}
      <ellipse cx="19" cy="33" rx="3.5" ry="7" fill="white" opacity="0.15" transform="rotate(-20 19 33)" />
      {/* Drips falling from the bottom */}
      <path d="M24 56 Q23 60 24 63 Q25 61 25 57 Z" fill="url(#sk-drop)" />
      <path d="M31 58 Q30 62 31 65 Q32 63 32 59 Z" fill="url(#sk-drop)" />
      <path d="M38 58 Q37 62 38 65 Q39 63 39 59 Z" fill="url(#sk-drop)" />
      <path d="M45 56 Q44 59 45 62 Q46 60 46 57 Z" fill="url(#sk-drop)" opacity="0.7" />
      {/* Tiny hanging drop mid-air */}
      <ellipse cx="32" cy="67" rx="1.5" ry="2" fill="#7DD3FC" opacity="0.6" />
    </svg>
  );
}

function Burning({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 822 1280" className={className} fill="none">
      <defs>
        <linearGradient id="bn-fire" x1="0" y1="0" x2="0" y2="1280" gradientUnits="userSpaceOnUse">
          <stop offset="0%"  stopColor="#FEF08A" />
          <stop offset="35%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
      </defs>
      <g transform="translate(0,1280) scale(0.1,-0.1)" fill="url(#bn-fire)" stroke="none">
        <path d="M3362 12652 c-13 -601 -227 -1121 -671 -1630 -129 -149 -235 -255
-566 -567 -447 -422 -581 -563 -741 -775 -194 -257 -321 -513 -393 -793 -83
-323 -82 -757 4 -1153 30 -137 29 -124 8 -124 -44 0 -127 66 -259 205 -190
200 -249 232 -315 169 -38 -36 -37 -42 37 -229 153 -382 366 -720 678 -1074
110 -125 436 -446 601 -592 72 -63 274 -238 450 -389 406 -350 514 -447 706
-641 743 -748 1083 -1478 1140 -2445 6 -104 14 -196 18 -204 11 -22 200 -96
306 -120 350 -80 813 -63 1108 39 81 28 177 72 177 81 0 32 -35 316 -56 450
-179 1165 -665 2017 -1652 2892 -79 70 -254 221 -389 335 -586 494 -802 689
-1001 903 -401 431 -605 803 -666 1215 -80 535 40 1028 363 1494 111 161 223
295 541 651 217 244 339 396 444 553 321 481 397 949 250 1532 -28 112 -105
345 -113 345 -3 0 -7 -58 -9 -128z"/>
        <path d="M3952 11211 c-11 -6 -4 -27 31 -97 51 -102 88 -212 114 -340 26 -129
24 -511 -5 -814 -12 -124 -26 -306 -33 -406 l-12 -181 63 -123 c80 -156 179
-306 392 -593 298 -402 425 -613 502 -836 62 -179 79 -282 80 -483 1 -98 2
-178 4 -178 2 0 19 35 38 78 84 181 114 239 145 270 31 32 34 33 47 15 8 -10
34 -60 59 -112 322 -679 197 -1629 -333 -2532 -41 -69 -74 -128 -74 -131 0 -4
17 -26 37 -50 82 -97 182 -270 344 -591 168 -336 260 -498 325 -573 l34 -39
119 121 c540 553 963 1379 1120 2188 130 670 95 1312 -106 1934 -25 78 -49
142 -54 142 -15 0 -61 -89 -84 -163 -22 -70 -36 -150 -70 -402 -20 -151 -40
-234 -75 -310 -27 -58 -93 -145 -103 -135 -3 3 -10 71 -16 152 -40 515 -199
920 -522 1333 -111 142 -171 207 -552 599 -187 193 -384 402 -437 466 -367
442 -540 855 -588 1408 l-7 84 -39 13 c-50 17 -93 59 -177 172 -89 118 -124
142 -167 114z"/>
        <path d="M3294 10533 c-34 -109 -116 -257 -205 -370 -29 -37 -152 -169 -274
-293 -244 -249 -310 -322 -379 -424 -137 -201 -201 -405 -213 -676 l-5 -135
88 -125 c111 -157 321 -370 445 -453 104 -69 231 -129 319 -152 80 -21 194
-30 246 -20 l39 7 -79 40 c-175 87 -311 205 -389 338 -113 195 -134 460 -62
785 31 141 139 464 255 765 128 334 186 514 214 660 13 65 13 93 0 53z"/>
        <path d="M3249 9787 c-166 -297 -189 -581 -72 -892 44 -117 126 -272 277 -524
253 -421 316 -583 316 -810 0 -55 -3 -72 -12 -68 -99 45 -202 80 -285 96 -169
35 -346 24 -421 -25 l-26 -17 24 -10 c73 -29 175 -80 216 -108 159 -109 290
-318 335 -534 38 -180 20 -435 -42 -601 -12 -30 -19 -57 -16 -60 2 -3 38 -28
80 -57 122 -84 218 -171 389 -355 291 -312 430 -434 599 -526 l66 -36 65 69
c173 183 319 477 374 756 28 140 26 398 -5 535 -12 58 -25 109 -28 114 -3 4
-18 -28 -34 -73 -81 -234 -195 -346 -374 -367 l-54 -7 20 64 c74 242 122 480
140 702 21 261 -13 518 -100 752 -82 219 -276 490 -476 665 -38 33 -167 135
-287 226 -120 91 -260 203 -312 249 -176 157 -295 337 -331 501 -21 93 -16
279 10 362 9 30 15 56 13 57 -2 2 -24 -33 -49 -78z"/>
        <path d="M7600 7753 c-16 -48 -66 -152 -157 -323 -120 -228 -159 -370 -170
-635 -9 -209 11 -401 92 -900 59 -365 68 -455 69 -685 1 -169 -3 -236 -18
-315 -59 -319 -202 -617 -420 -874 -151 -178 -317 -325 -759 -676 l-239 -190
34 -8 c72 -20 236 0 443 53 189 49 333 71 397 62 26 -4 29 -7 23 -31 -15 -60
-91 -217 -148 -303 -80 -123 -260 -303 -387 -387 -535 -356 -1325 -455 -2095
-265 -227 57 -518 180 -680 289 -425 287 -591 670 -473 1095 43 155 135 337
250 492 35 47 56 84 51 91 -4 7 -86 107 -182 222 -272 325 -441 492 -637 629
l-82 56 -87 -92 c-234 -248 -411 -541 -511 -843 -78 -238 -106 -454 -92 -715
43 -829 650 -1622 1559 -2040 455 -209 1006 -311 1506 -280 284 17 431 42 613
102 196 64 313 124 738 376 137 81 318 181 403 222 l155 75 73 107 c100 148
307 425 561 750 l215 275 8 -56 c6 -35 3 -149 -7 -306 -9 -146 -12 -265 -7
-285 l8 -35 25 55 c294 639 416 956 492 1272 55 229 56 243 56 673 0 373 -2
410 -21 492 -42 180 -114 419 -249 828 -76 231 -155 474 -175 540 -78 259
-143 558 -176 815 -17 129 -14 501 4 615 8 50 13 91 12 93 -2 2 -9 -14 -15
-35z"/>
        <path d="M150 7053 c-19 -120 -24 -328 -11 -444 7 -57 25 -162 41 -234 36
-168 155 -592 172 -615 135 -183 209 -343 254 -550 27 -120 27 -477 1 -635
-43 -258 -96 -450 -295 -1055 -195 -591 -239 -748 -283 -1011 -27 -162 -32
-467 -11 -589 56 -313 188 -552 429 -779 59 -56 110 -101 113 -101 4 0 1 30
-6 68 -41 216 -43 514 -4 651 25 88 62 168 101 213 32 38 29 42 54 -87 98
-519 468 -1034 990 -1380 391 -258 793 -409 1285 -482 165 -24 551 -24 715 1
314 47 589 144 840 297 267 162 519 424 679 708 l36 63 -27 -5 c-219 -47 -268
-52 -523 -52 -337 0 -464 20 -1000 159 -478 125 -652 158 -924 177 -150 11
-162 13 -210 42 -28 17 -176 95 -329 173 -154 79 -315 169 -359 201 -252 181
-450 526 -517 900 -60 332 -51 624 39 1361 22 180 45 363 50 407 21 170 40
487 39 640 -2 153 -2 156 -10 75 -13 -126 -27 -183 -60 -250 -26 -52 -92 -121
-103 -109 -3 2 -11 56 -20 120 -21 148 -57 287 -107 414 -83 207 -192 378
-473 738 -209 268 -290 385 -370 537 -69 131 -116 256 -151 396 -15 60 -29
110 -30 112 -1 1 -8 -32 -15 -75z"/>
      </g>
    </svg>
  );
}

function Heated({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <defs>
        <linearGradient id="ht-b" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#374151" />
          <stop offset="100%" stopColor="#030712" />
        </linearGradient>
        <linearGradient id="ht-ring" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F3F4F6" />
          <stop offset="100%" stopColor="#9CA3AF" />
        </linearGradient>
      </defs>
      {/* Choker band */}
      <rect x="6" y="18" width="52" height="14" rx="7" fill="url(#ht-b)" />
      {/* Subtle band shine */}
      <rect x="6" y="18" width="52" height="5" rx="4" fill="white" opacity="0.06" />
      {/* Center D-ring attachment on band */}
      <rect x="29" y="16" width="6" height="9" rx="2" fill="#4B5563" />
      {/* Short chain */}
      <line x1="32" y1="25" x2="32" y2="32" stroke="#9CA3AF" strokeWidth="2.5" />
      {/* O-ring — large and clear */}
      <circle cx="32" cy="43" r="10" stroke="url(#ht-ring)" strokeWidth="4" fill="none" />
      {/* Ring shine */}
      <path d="M24 38 Q27 34 29 36" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

function Frisky({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <defs>
        <linearGradient id="fk-cup" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FCE7F3" />
          <stop offset="100%" stopColor="#F9A8D4" />
        </linearGradient>
        <linearGradient id="fk-band" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FBCFE8" />
          <stop offset="100%" stopColor="#F472B6" />
        </linearGradient>
        <linearGradient id="fk-strap" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F9A8D4" />
          <stop offset="100%" stopColor="#F472B6" />
        </linearGradient>
      </defs>
      {/* Straps going up */}
      <path d="M18 22 Q16 12 20 6"  stroke="url(#fk-strap)" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M46 22 Q48 12 44 6"  stroke="url(#fk-strap)" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* Left cup */}
      <path d="M6 35 Q6 21 18 19 Q28 17 32 26 L30 44 Q24 49 14 47 Q6 44 6 35Z" fill="url(#fk-cup)" />
      {/* Left cup top lace edge */}
      <path d="M7 34 Q8 22 18 19 Q28 17 32 26" stroke="#F472B6" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Left cup lace scallops */}
      <path d="M9 30 Q11 26 13 30 Q15 26 17 30 Q19 26 21 30 Q23 26 25 30 Q27 26 29 30" stroke="#F472B6" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.65" />
      {/* Left cup shine */}
      <ellipse cx="16" cy="28" rx="5" ry="4" fill="white" opacity="0.2" transform="rotate(-20 16 28)" />
      {/* Right cup */}
      <path d="M58 35 Q58 21 46 19 Q36 17 32 26 L34 44 Q40 49 50 47 Q58 44 58 35Z" fill="url(#fk-cup)" />
      {/* Right cup top lace edge */}
      <path d="M57 34 Q56 22 46 19 Q36 17 32 26" stroke="#F472B6" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Right cup lace scallops */}
      <path d="M55 30 Q53 26 51 30 Q49 26 47 30 Q45 26 43 30 Q41 26 39 30 Q37 26 35 30" stroke="#F472B6" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.65" />
      {/* Right cup shine */}
      <ellipse cx="48" cy="28" rx="5" ry="4" fill="white" opacity="0.2" transform="rotate(20 48 28)" />
      {/* Underwire band */}
      <path d="M6 42 Q18 51 32 51 Q46 51 58 42" stroke="url(#fk-band)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Center gore */}
      <rect x="30" y="26" width="4" height="16" rx="2" fill="url(#fk-band)" />
      {/* Center bow */}
      <path d="M27.5 27 L32 24.5 L36.5 27 L32 29.5 Z" fill="#E11D48" />
      <circle cx="32" cy="27" r="2.2" fill="#BE185D" />
    </svg>
  );
}

function Naughty({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} fill="none">
      <defs>
        <linearGradient id="nt-lips" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F9A8D4" />
          <stop offset="100%" stopColor="#DB2777" />
        </linearGradient>
      </defs>
      <path fill="url(#nt-lips)" d="M497.134,165.979c-77.641,26.641-162.047-70.516-241.156-13.172C176.915,95.479,92.509,192.62,14.868,165.979
        c-17.422-5.984-21.797-1.047-0.766,37.906c55.563,102.844,137.813,173.75,241.875,173.75c104.141,0,186.328-70.875,241.906-173.75
        C518.946,164.917,514.54,160.01,497.134,165.979z M201.306,147.682c4.828,0.922,8.281,5.516,7.656,10.469
        c-0.609,4.953-5.25,8.344-10.328,7.391c-5.109-0.953-8.484-5.859-7.625-10.797C191.868,149.838,196.446,146.76,201.306,147.682z
        M317.603,306.885c-21.297,3.156-38.859-0.625-39.109-6.281c-0.234-5.656,16.266-10.969,36.719-14
        c20.453-3.047,37.719-2.75,38.797,2.781S338.884,303.729,317.603,306.885z M255.978,273.713c-39.734,0-97.547-9.766-134.766-42.078
        c0,0,77.734-8.438,134.766-8.438c57.063,0,134.766,8.438,134.766,8.438C353.54,263.932,295.728,273.713,255.978,273.713z"/>
    </svg>
  );
}

const ICONS: Partial<Record<string, (p: { className?: string }) => React.ReactElement>> = {
  // Regular
  thriving:   (p) => <Thriving   {...p} />,
  good:       (p) => <Good       {...p} />,
  okay:       (p) => <Okay       {...p} />,
  low:        (p) => <Low        {...p} />,
  struggling: (p) => <Struggling {...p} />,
  // Love
  smitten:    (p) => <Smitten    {...p} />,
  adoring:    (p) => <Adoring    {...p} />,
  connected:  (p) => <Connected  {...p} />,
  longing:    (p) => <Longing    {...p} />,
  tender:     (p) => <Tender     {...p} />,
  // Special
  katakni:    (p) => <Katakni    {...p} />,
  // Naughty
  soaked:     (p) => <Soaked     {...p} />,
  burning:    (p) => <Burning    {...p} />,
  heated:     (p) => <Heated     {...p} />,
  frisky:     (p) => <Frisky     {...p} />,
  naughty:    (p) => <Naughty    {...p} />,
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
