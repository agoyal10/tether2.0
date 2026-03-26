"use client";

import { useState, useEffect } from "react";

export default function SplashScreen() {
  const [phase, setPhase] = useState<"visible" | "fading" | "gone">("visible");

  useEffect(() => {
    const fade = setTimeout(() => setPhase("fading"), 50);
    const gone = setTimeout(() => setPhase("gone"), 500);
    return () => { clearTimeout(fade); clearTimeout(gone); };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      aria-hidden="true"
      className="splash-bg"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        opacity: phase === "fading" ? 0 : 1,
        transition: "opacity 0.4s ease",
      }}
    >
      <span className="splash-emoji">💞</span>
      <p className="splash-text">how are you feeling?</p>
      <div className="splash-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  );
}
