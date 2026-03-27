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
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <defs>
        <linearGradient id="bn-ll" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FB7185" />
          <stop offset="100%" stopColor="#9F1239" />
        </linearGradient>
      </defs>
      {/* Upper lip — cupid bow */}
      <path d="M8 30 Q14 18 23 23 Q28 16 32 21 Q36 16 41 23 Q50 18 56 30 Q46 37 32 37 Q18 37 8 30Z" fill="#BE123C" />
      {/* Lower lip — full and rounded */}
      <path d="M8 30 Q11 52 32 54 Q53 52 56 30 Q46 37 32 37 Q18 37 8 30Z" fill="url(#bn-ll)" />
      {/* Shine on lower lip */}
      <ellipse cx="32" cy="43" rx="10" ry="3.5" fill="white" opacity="0.2" />
      {/* Shine on upper lip left lobe */}
      <ellipse cx="21" cy="25" rx="4" ry="2" fill="white" opacity="0.18" transform="rotate(-25 21 25)" />
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
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <defs>
        <linearGradient id="nt-cf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FBCFE8" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      {/* Left cuff — donut shape */}
      <circle cx="15" cy="32" r="13" fill="url(#nt-cf)" />
      <circle cx="15" cy="32" r="7.5" fill="white" />
      <circle cx="15" cy="32" r="4"   fill="url(#nt-cf)" />
      {/* Right cuff */}
      <circle cx="49" cy="32" r="13" fill="url(#nt-cf)" />
      <circle cx="49" cy="32" r="7.5" fill="white" />
      <circle cx="49" cy="32" r="4"   fill="url(#nt-cf)" />
      {/* Connecting bar */}
      <rect x="28" y="29" width="8" height="6" rx="3" fill="#BE185D" />
      {/* Shine on each cuff */}
      <ellipse cx="10" cy="24" rx="3.5" ry="5" fill="white" opacity="0.3" transform="rotate(-20 10 24)" />
      <ellipse cx="44" cy="24" rx="3.5" ry="5" fill="white" opacity="0.3" transform="rotate(-20 44 24)" />
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
