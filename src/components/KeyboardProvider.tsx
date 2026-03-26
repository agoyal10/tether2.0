"use client";

import { createContext, useContext, useEffect, useState } from "react";

const KeyboardContext = createContext(false);

export function useKeyboardOpen() {
  return useContext(KeyboardContext);
}

export function KeyboardProvider({ children }: { children: React.ReactNode }) {
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const baseHeight = vv.height; // capture before keyboard ever opens
    const onResize = () => setKeyboardOpen(vv.height < baseHeight * 0.75);
    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, []);

  return (
    <KeyboardContext.Provider value={keyboardOpen}>
      {children}
    </KeyboardContext.Provider>
  );
}
