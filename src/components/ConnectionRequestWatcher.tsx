"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Watches for new pending connections and refreshes the dashboard so the
// PendingConnectionBanner appears without the user having to manually reload.
export default function ConnectionRequestWatcher({ userId }: { userId: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const channel = supabase
      .channel("connection-requests")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "connections" },
        (payload) => {
          const row = payload.new as { user_a_id: string; user_b_id: string; requester_id: string };
          // Only refresh if I'm the inviter (involved but not the requester)
          const isInvolved = row.user_a_id === userId || row.user_b_id === userId;
          const isRequester = row.requester_id === userId;
          if (isInvolved && !isRequester) router.refresh();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, router, supabase]);

  return null;
}
