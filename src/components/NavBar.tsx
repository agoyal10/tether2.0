"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useKeyboardOpen } from "@/components/KeyboardProvider";

export default function NavBar() {
  const path = usePathname();
  const [unread, setUnread] = useState(0);
  const [hasPartner, setHasPartner] = useState(false);
  const keyboardOpen = useKeyboardOpen();
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

      if (!conn) { setUnread(0); setHasPartner(false); return; }
      setHasPartner(true);
      const partnerId = conn.user_a_id === user.id ? conn.user_b_id : conn.user_a_id;

      // Get partner's mood log IDs
      const { data: logs } = await supabase
        .from("mood_logs").select("id").eq("user_id", partnerId);
      if (!logs || logs.length === 0) { setUnread(0); return; }

      const logIds = logs.map((l: { id: string }) => l.id);

      // Fetch reads and messages in parallel
      const [{ data: reads }, { data: msgs }] = await Promise.all([
        supabase.from("chat_reads").select("mood_log_id, last_read_at")
          .eq("user_id", user.id).in("mood_log_id", logIds),
        supabase.from("messages").select("mood_log_id, sender_id, created_at")
          .in("mood_log_id", logIds).eq("sender_id", partnerId),
      ]);
      const lastReadMap: Record<string, string> = {};
      (reads ?? []).forEach(({ mood_log_id, last_read_at }: { mood_log_id: string; last_read_at: string }) => {
        lastReadMap[mood_log_id] = last_read_at;
      });

      const count = (msgs ?? []).filter(({ mood_log_id, created_at }: { mood_log_id: string; created_at: string }) => {
        const lastRead = lastReadMap[mood_log_id];
        return !lastRead || new Date(created_at) > new Date(lastRead);
      }).length;

      setUnread(count);
    }

    fetchUnread();

    // Re-fetch when tab becomes visible (catches connect/disconnect while app was in background)
    const onVisible = () => { if (document.visibilityState === "visible") fetchUnread(); };
    document.addEventListener("visibilitychange", onVisible);

    const channel = supabase
      .channel("navbar-unread")
      .on("postgres_changes", { event: "*", schema: "public", table: "connections" }, fetchUnread)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, fetchUnread)
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_reads" }, fetchUnread)
      .subscribe();

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const NAV_ICONS: Record<string, (active: boolean) => React.ReactNode> = {
    "/dashboard": (active) => (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
    "/checkin": (active) => (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        {active ? (
          <path d="M12 3C7.03 3 3 6.58 3 11c0 2.17.92 4.14 2.41 5.57L4 21l4.62-1.39C9.96 20.19 10.96 20.4 12 20.4c4.97 0 9-3.58 9-8s-4.03-8-9-8z" />
        ) : (
          <path d="M12 3C7.03 3 3 6.58 3 11c0 2.17.92 4.14 2.41 5.57L4 21l4.62-1.39C9.96 20.19 10.96 20.4 12 20.4c4.97 0 9-3.58 9-8s-4.03-8-9-8z" />
        )}
      </svg>
    ),
    "/partner": (active) => (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    ),
    "/settings": (active) => (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" fill={active ? "white" : "none"} stroke="currentColor" strokeWidth={1.8} />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
    "/coach": (active) => (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        {active ? (
          <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm1 15h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
        ) : (
          <>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 17v-2M12 7c1.1 0 2 .9 2 2 0 .55-.22 1.05-.59 1.41l-1.24 1.26C11.45 12.1 11 13.1 11 14.5" strokeLinecap="round" />
          </>
        )}
      </svg>
    ),
  };

  const NAV_ITEMS = [
    { href: "/dashboard", label: "Home",     badge: unread > 0, disabled: false },
    { href: "/checkin",   label: "Check-in", badge: false,      disabled: !hasPartner },
    { href: "/partner",   label: "Partner",  badge: false,      disabled: false },
    { href: "/coach",     label: "Coach",    badge: false,      disabled: !hasPartner },
    { href: "/settings",  label: "Settings", badge: false,      disabled: false },
  ];

  if (keyboardOpen) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80">
      <div className="mx-auto flex max-w-md items-center justify-around px-4 py-2">
        {NAV_ITEMS.map((item) => {
          const active = path === item.href;
          if (item.disabled) {
            return (
              <div
                key={item.href}
                className="relative flex flex-col items-center gap-0.5 rounded-2xl px-2 py-2 text-xs font-medium text-gray-300 dark:text-gray-600 cursor-not-allowed select-none"
                title="Connect a partner first"
              >
                <span className="opacity-40">{NAV_ICONS[item.href]?.(false)}</span>
                {item.label}
              </div>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-0.5 rounded-2xl px-2 py-2 text-xs font-medium transition-all",
                active ? "bg-lavender-light text-lavender-dark dark:bg-lavender/20 dark:text-lavender" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              )}
            >
              {NAV_ICONS[item.href]?.(active)}
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
