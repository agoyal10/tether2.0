"use client";

import { useEffect, useState } from "react";

type PermissionState = NotificationPermission | "unsupported" | "needs-install";

export function usePushNotifications() {
  const [state, setState] = useState<PermissionState>("unsupported");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      // On iOS Safari (not installed), PushManager is unavailable
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
      if (isIOS && !isStandalone) {
        setState("needs-install");
      }
      return;
    }
    setState(Notification.permission);
    navigator.serviceWorker.register("/sw.js").catch(console.warn);
  }, []);

  async function requestPermission() {
    if (state !== "default") return;

    // Notification.requestPermission() MUST be the first await — iOS voids
    // the user gesture if any other async call precedes it.
    const result = await Notification.requestPermission();
    setState(result);
    if (result !== "granted") return;

    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) return;

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      ) as unknown as ArrayBuffer,
    });

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    });
  }

  return { state, requestPermission };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
