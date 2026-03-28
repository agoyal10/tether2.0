"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LastSeenUpdater({ userId }: { userId: string }) {
  useEffect(() => {
    const supabase = createClient();
    supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", userId).then(() => {});
  }, [userId]);

  return null;
}
