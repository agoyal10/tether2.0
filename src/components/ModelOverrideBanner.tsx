"use client";

import { useEffect, useState } from "react";

export default function ModelOverrideBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((cfg) => setShow(cfg.ai_force_standard_model === "true"))
      .catch(() => {});
  }, []);

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-500 text-white text-xs font-medium text-center px-4 py-2 leading-snug">
      Admin has set all AI models to Standard. Advanced models are currently unavailable.
    </div>
  );
}
