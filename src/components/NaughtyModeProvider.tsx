"use client";

import { createContext, useContext, useEffect, useState } from "react";

const Ctx = createContext({ naughtyMode: false, toggle: () => {} });

export function NaughtyModeProvider({ children }: { children: React.ReactNode }) {
  const [naughtyMode, setNaughtyMode] = useState(false);

  useEffect(() => {
    setNaughtyMode(localStorage.getItem("naughtyMode") === "true");
  }, []);

  function toggle() {
    setNaughtyMode((prev) => {
      const next = !prev;
      localStorage.setItem("naughtyMode", String(next));
      return next;
    });
  }

  return <Ctx.Provider value={{ naughtyMode, toggle }}>{children}</Ctx.Provider>;
}

export function useNaughtyMode() {
  return useContext(Ctx);
}
