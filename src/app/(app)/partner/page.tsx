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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string>("");
  const [partner, setPartner] = useState<Profile | null>(null);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [partnerCode, setPartnerCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Profile editing state
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      setEmail(user.email ?? "");

      const { data: p } = await supabase
        .from("profiles").select("*").eq("id", user.id).single<Profile>();
      setProfile(p);
      if (p) setNameInput(p.display_name);

      const { data: conn } = await supabase
        .from("connections")
        .select("*")
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .eq("status", "active")
        .single<Connection>();
      setConnection(conn);

      if (conn) {
        const partnerId = conn.user_a_id === user.id ? conn.user_b_id : conn.user_a_id;
        const { data: partnerProfile } = await supabase
          .from("profiles").select("*").eq("id", partnerId).single<Profile>();
        setPartner(partnerProfile);
      }
    });
  }, [supabase, router]);

  async function saveName() {
    const name = nameInput.trim();
    if (!name || !profile || name === profile.display_name) { setEditingName(false); return; }
    setSavingName(true);
    const { error } = await supabase.from("profiles").update({ display_name: name }).eq("id", profile.id);
    if (error) {
      toast.error("Could not save name.");
    } else {
      setProfile({ ...profile, display_name: name });
      toast.success("Name updated!");
      setEditingName(false);
    }
    setSavingName(false);
  }

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
      { user_a_id: a, user_b_id: b, status: "active" },
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
    await supabase.from("connections").update({ status: "blocked" }).eq("id", connection.id);
    setConnection(null);
    setPartner(null);
    toast.success("Disconnected");
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Partner</h1>
        <button
          onClick={logout}
          className="rounded-2xl px-3 py-1.5 text-xs font-medium text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 transition-all"
        >
          Log out
        </button>
      </div>

      {/* Profile card */}
      <div className="rounded-3xl bg-gray-50 dark:bg-gray-800 p-5 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-lavender text-2xl text-white font-bold shrink-0">
          {profile?.display_name[0].toUpperCase() ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                maxLength={40}
                className="flex-1 rounded-xl border border-lavender bg-white dark:bg-gray-700 px-3 py-1.5 text-sm font-semibold text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-lavender/30"
              />
              <button
                onClick={saveName}
                disabled={savingName}
                className="rounded-xl bg-lavender px-3 py-1.5 text-xs font-semibold text-white hover:bg-lavender-dark disabled:opacity-60 transition-all"
              >
                {savingName ? "…" : "Save"}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">{profile?.display_name}</p>
              <button
                onClick={() => setEditingName(true)}
                className="text-xs text-lavender hover:underline shrink-0"
              >
                Edit
              </button>
            </div>
          )}
          <p className="text-sm text-gray-400 truncate mt-0.5">{email}</p>
        </div>
      </div>

      {/* Connected state */}
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
        /* Not connected state */
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
            <label className="text-sm font-medium text-gray-600">Enter Partner&apos;s Code</label>
            <input
              type="text"
              maxLength={6}
              value={partnerCode}
              onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
              className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-center text-xl font-bold tracking-[0.25em] uppercase focus:border-lavender focus:outline-none focus:ring-2 focus:ring-lavender/30 transition-all"
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
