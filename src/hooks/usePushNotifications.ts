"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type PermissionState = NotificationPermission | "unsupported" | "needs-install";

export function usePushNotifications() {
  const [state, setState] = useState<PermissionState>("unsupported");

  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as { standalone?: boolean }).standalone === true;

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      if (isIOS && !isStandalone) setState("needs-install");
      return;
    }

    setState(Notification.permission);
    navigator.serviceWorker.register("/sw.js").catch(console.warn);
  }, []);

  async function requestPermission() {
    if (state !== "default") return;

    // Must be first await — iOS voids user gesture after any preceding async call
    const result = await Notification.requestPermission();
    setState(result);

    if (result === "denied") {
      toast.error("Notifications blocked. Go to iPhone Settings → Tether → Notifications to enable.");
      return;
    }
    if (result !== "granted") return;

    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        toast.success("Notifications enabled! 🔔");
        return;
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        toast.error("Push config missing — contact support.");
        return;
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as ArrayBuffer,
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      if (res.ok) {
        toast.success("Notifications enabled! 🔔");
      } else {
        toast.error("Could not save subscription. Try again.");
      }
    } catch (err) {
      console.error("Push subscription error:", err);
      toast.error("Something went wrong enabling notifications.");
    }
  }

  return { state, requestPermission };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
