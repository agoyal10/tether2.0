"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export default function NavBar() {
  const path = usePathname();
  const [unread, setUnread] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    async function fetchUnread() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: conn } = await supabase
        .from("connections")
        .select("user_a_id, user_b_id")
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .eq("status", "active")
        .single();

      if (!conn) { setUnread(0); return; }
      const partnerId = conn.user_a_id === user.id ? conn.user_b_id : conn.user_a_id;

      // Get partner's mood log IDs
      const { data: logs } = await supabase
        .from("mood_logs").select("id").eq("user_id", partnerId);
      if (!logs || logs.length === 0) { setUnread(0); return; }

      const logIds = logs.map((l: { id: string }) => l.id);

      // Get last-read timestamps
      const { data: reads } = await supabase
        .from("chat_reads").select("mood_log_id, last_read_at")
        .eq("user_id", user.id).in("mood_log_id", logIds);
      const lastReadMap: Record<string, string> = {};
      (reads ?? []).forEach(({ mood_log_id, last_read_at }: { mood_log_id: string; last_read_at: string }) => {
        lastReadMap[mood_log_id] = last_read_at;
      });

      // Count partner messages sent after last read
      const { data: msgs } = await supabase
        .from("messages").select("mood_log_id, sender_id, created_at")
        .in("mood_log_id", logIds).eq("sender_id", partnerId);

      const count = (msgs ?? []).filter(({ mood_log_id, created_at }: { mood_log_id: string; created_at: string }) => {
        const lastRead = lastReadMap[mood_log_id];
        return !lastRead || new Date(created_at) > new Date(lastRead);
      }).length;

      setUnread(count);
    }

    fetchUnread();

    const channel = supabase
      .channel("navbar-unread")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, fetchUnread)
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_reads" }, fetchUnread)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  const NAV_ITEMS = [
    { href: "/dashboard", label: "Home",     icon: "🏠", badge: unread > 0 },
    { href: "/checkin",   label: "Check-in", icon: "💬", badge: false },
    { href: "/partner",   label: "Partner",  icon: "💞", badge: false },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80">
      <div className="mx-auto flex max-w-md items-center justify-around px-4 py-2">
        {NAV_ITEMS.map((item) => {
          const active = path === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-0.5 rounded-2xl px-4 py-2 text-xs font-medium transition-all",
                active ? "bg-lavender-light text-lavender-dark dark:bg-lavender/20 dark:text-lavender" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              )}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
              {item.badge && (
                <span className="absolute right-2 top-1.5 h-2.5 w-2.5 rounded-full bg-blush-dark ring-2 ring-white" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
