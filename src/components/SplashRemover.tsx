"use client";

import { useEffect } from "react";

export default function SplashRemover() {
  useEffect(() => {
    const el = document.getElementById("tether-splash");
    if (!el) return;
    el.style.opacity = "0";
    const t = setTimeout(() => el.remove(), 400);
    return () => clearTimeout(t);
  }, []);
  return null;
}
