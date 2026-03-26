"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import type { Connection, Profile } from "@/types";

export default function PartnerPage() {
  const router = useRouter();
  const supabase = createClient();
  function cached<T>(key: string): T | null {
    if (typeof window === "undefined") return null;
    try { return JSON.parse(localStorage.getItem(key) ?? "null"); } catch { return null; }
  }

  const [profile, setProfile] = useState<Profile | null>(() => cached("tether_profile"));
  const [partner, setPartner] = useState<Profile | null>(() => cached("tether_partner"));
  const [connection, setConnection] = useState<Connection | null>(() => cached("tether_connection"));
  const [partnerCode, setPartnerCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }

      const { data: p } = await supabase
        .from("profiles").select("*").eq("id", user.id).single<Profile>();
      if (p) { setProfile(p); localStorage.setItem("tether_profile", JSON.stringify(p)); }

      const { data: conn } = await supabase
        .from("connections")
        .select("*")
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .eq("status", "active")
        .single<Connection>();
      setConnection(conn ?? null);
      if (conn) {
        localStorage.setItem("tether_connection", JSON.stringify(conn));
        const partnerId = conn.user_a_id === user.id ? conn.user_b_id : conn.user_a_id;
        const { data: partnerProfile } = await supabase
          .from("profiles").select("*").eq("id", partnerId).single<Profile>();
        if (partnerProfile) { setPartner(partnerProfile); localStorage.setItem("tether_partner", JSON.stringify(partnerProfile)); }
      } else {
        localStorage.removeItem("tether_connection");
        localStorage.removeItem("tether_partner");
      }
    });
  }, [supabase, router]);

  async function copyCode() {
    if (!profile) return;
    await navigator.clipboard.writeText(profile.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function shareLink() {
    if (!profile) return;
    const url = `${window.location.origin}/join/${profile.invite_code}`;
    if (navigator.share) {
      await navigator.share({ title: "Join me on Tether 💞", url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Invite link copied!");
    }
  }

  async function connectPartner(e: React.FormEvent) {
    e.preventDefault();
    const code = partnerCode.trim().toUpperCase();
    if (!code || !profile) return;
    setLoading(true);

    const { data: found, error: findErr } = await supabase
      .from("profiles").select("id").eq("invite_code", code).single<{ id: string }>();

    if (findErr || !found) {
      toast.error("Invite code not found. Double-check and try again.");
      setLoading(false);
      return;
    }
    if (found.id === profile.id) {
      toast.error("That's your own code!");
      setLoading(false);
      return;
    }

    const [a, b] = [profile.id, found.id].sort();
    const { error } = await supabase.from("connections").upsert(
      { user_a_id: a, user_b_id: b, status: "active", created_at: new Date().toISOString() },
      { onConflict: "user_a_id,user_b_id" }
    );

    if (error) {
      toast.error("Could not connect. Please try again.");
    } else {
      toast.success("Connected! 💞");
      router.push("/dashboard");
    }
    setLoading(false);
  }

  async function disconnect() {
    if (!connection) return;
    await fetch("/api/push/disconnect", { method: "POST" });
    await supabase.from("connections").update({ status: "blocked" }).eq("id", connection.id);
    setConnection(null);
    setPartner(null);
    localStorage.removeItem("tether_connection");
    localStorage.removeItem("tether_partner");
    toast.success("Disconnected");
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Partner</h1>

      {partner ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-3xl bg-lavender-light p-5 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-lavender text-2xl text-white font-bold shrink-0">
              {partner.display_name[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800">{partner.display_name}</p>
              <p className="text-sm text-lavender-dark">Connected 💞</p>
            </div>
          </div>

          <button
            onClick={disconnect}
            className="w-full rounded-3xl border border-blush py-3 text-sm font-medium text-blush-dark hover:bg-blush-light transition-all"
          >
            Disconnect partner
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="rounded-3xl bg-lavender-light p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-lavender-dark mb-3">Invite Your Partner</p>
            <div className="flex items-center justify-between gap-3">
              <span className="text-3xl font-bold tracking-[0.25em] text-lavender-dark">
                {profile?.invite_code ?? "------"}
              </span>
              <button onClick={copyCode} className="rounded-2xl bg-white/70 px-4 py-2 text-sm font-semibold text-lavender-dark hover:bg-white transition-all">
                {copied ? "Copied!" : "Copy Code"}
              </button>
            </div>
            <button
              onClick={shareLink}
              className="mt-3 w-full rounded-2xl bg-lavender py-2.5 text-sm font-semibold text-white hover:bg-lavender-dark transition-all"
            >
              Share Invite Link 💌
            </button>
          </div>

          <form onSubmit={connectPartner} className="flex flex-col gap-3">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Enter Partner&apos;s Code</label>
            <input
              type="text"
              maxLength={6}
              value={partnerCode}
              onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
              className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-center text-xl font-bold tracking-[0.25em] uppercase focus:border-lavender focus:outline-none focus:ring-2 focus:ring-lavender/30 transition-all dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              placeholder="XXXXXX"
            />
            <button
              type="submit"
              disabled={partnerCode.length < 6 || loading}
              className="w-full rounded-3xl bg-lavender py-4 font-semibold text-white shadow-card hover:bg-lavender-dark disabled:opacity-60 transition-all"
            >
              {loading ? "Connecting…" : "Connect"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
