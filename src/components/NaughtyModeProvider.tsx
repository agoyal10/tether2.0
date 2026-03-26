"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type CheckinMode = "sweet" | "naughty" | "love";

interface CheckinModeCtx {
  mode: CheckinMode;
  naughtyMode: boolean;
  loveMode: boolean;
  setMode: (m: CheckinMode) => void;
  toggle: () => void;
}

const Ctx = createContext<CheckinModeCtx>({
  mode: "sweet",
  naughtyMode: false,
  loveMode: false,
  setMode: () => {},
  toggle: () => {},
});

export function NaughtyModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<CheckinMode>("sweet");

  useEffect(() => {
    const saved = localStorage.getItem("checkinMode");
    if (saved === "naughty" || saved === "love" || saved === "sweet") {
      setModeState(saved);
    } else if (localStorage.getItem("naughtyMode") === "true") {
      // migrate legacy naughtyMode flag
      setModeState("naughty");
    }
  }, []);

  function setMode(m: CheckinMode) {
    setModeState(m);
    localStorage.setItem("checkinMode", m);
  }

  function toggle() {
    setMode(mode === "sweet" ? "naughty" : mode === "naughty" ? "love" : "sweet");
  }

  return (
    <Ctx.Provider value={{ mode, naughtyMode: mode === "naughty", loveMode: mode === "love", setMode, toggle }}>
      {children}
    </Ctx.Provider>
  );
}

export function useNaughtyMode() {
  return useContext(Ctx);
}
