"use client";

import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function PushSetup() {
  usePushNotifications();
  return null;
}
