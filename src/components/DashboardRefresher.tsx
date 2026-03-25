"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DashboardRefresher({ partnerId }: { partnerId: string }) {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("dashboard-refresh")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mood_logs", filter: `user_id=eq.${partnerId}` },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => router.refresh()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [partnerId, router, supabase]);

  return null;
}
