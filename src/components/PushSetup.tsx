"use client";

import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function PushSetup() {
  const { state, requestPermission } = usePushNotifications();

  if (state === "needs-install") {
    return (
      <div className="fixed bottom-20 left-0 right-0 z-40 mx-auto max-w-md px-4">
        <div className="flex items-start gap-3 rounded-2xl bg-lavender px-4 py-3 shadow-card">
          <span className="text-xl">📲</span>
          <p className="text-sm text-white leading-snug">
            To get notifications, tap <strong>Share → Add to Home Screen</strong> and open Tether from there.
          </p>
        </div>
      </div>
    );
  }

  if (state !== "default") return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-40 mx-auto max-w-md px-4">
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-lavender px-4 py-3 shadow-card">
        <p className="text-sm text-white">
          🔔 Get notified when your partner checks in
        </p>
        <button
          onClick={requestPermission}
          className="shrink-0 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-lavender-dark transition-all hover:bg-lavender-light"
        >
          Enable
        </button>
      </div>
    </div>
  );
}
