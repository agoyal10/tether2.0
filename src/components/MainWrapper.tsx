"use client";

import { useKeyboardOpen } from "@/components/KeyboardProvider";

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const keyboardOpen = useKeyboardOpen();

  return (
    <main className={`mx-auto w-full max-w-md flex-1 px-4 pt-16 ${keyboardOpen ? "pb-0" : "pb-24"}`}>
      {children}
    </main>
  );
}
