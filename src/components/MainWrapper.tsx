"use client";

import { useEffect, useState } from "react";

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => setKeyboardOpen(vv.height < window.innerHeight * 0.75);
    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, []);

  return (
    <main className={`mx-auto w-full max-w-md flex-1 px-4 pt-16 ${keyboardOpen ? "pb-0" : "pb-24"}`}>
      {children}
    </main>
  );
}
