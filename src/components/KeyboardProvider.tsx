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
    const onResize = () => setKeyboardOpen(vv.height < window.innerHeight * 0.75);
    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, []);

  return (
    <KeyboardContext.Provider value={keyboardOpen}>
      {children}
    </KeyboardContext.Provider>
  );
}
