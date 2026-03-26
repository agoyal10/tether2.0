"use client";

export const dynamic = "force-dynamic";

import { useEffect, useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { revalidateProfileCache } from "@/lib/actions";
import ThemeToggle from "@/components/ThemeToggle";
import type { Profile } from "@/types";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  type FullProfile = Profile & { reminder_enabled: boolean; reminder_hour: number; reminder_timezone: string };

  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [email, setEmail] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [savingReminder, setSavingReminder] = useState(false);

  // Load from localStorage before first paint — skipped on server, runs sync on client
  useLayoutEffect(() => {
    try {
      const cached = localStorage.getItem("tether_profile");
      if (cached) {
        const p = JSON.parse(cached) as FullProfile;
        setProfile(p);
        setNameInput(p.display_name ?? "");
        setReminderEnabled(p.reminder_enabled ?? false);
      }
      const cachedEmail = localStorage.getItem("tether_email");
      if (cachedEmail) setEmail(cachedEmail);
    } catch {}
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      const userEmail = user.email ?? "";
      setEmail(userEmail);
      localStorage.setItem("tether_email", userEmail);

      const { data: p } = await supabase
        .from("profiles").select("*").eq("id", user.id).single();
      if (p) {
        setProfile(p);
        setNameInput(p.display_name);
        setReminderEnabled(p.reminder_enabled ?? false);
        localStorage.setItem("tether_profile", JSON.stringify(p));
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
      const updated = { ...profile, display_name: name };
      setProfile(updated);
      localStorage.setItem("tether_profile", JSON.stringify(updated));
      revalidateProfileCache(profile.id);
      toast.success("Name updated!");
      setEditingName(false);
    }
    setSavingName(false);
  }

  async function saveReminder(enabled: boolean) {
    if (!profile) return;
    setSavingReminder(true);
    const { error } = await supabase.from("profiles").update({
      reminder_enabled: enabled,
    }).eq("id", profile.id);
    if (error) {
      toast.error("Could not save reminder.");
    } else {
      setReminderEnabled(enabled);
      toast.success(enabled ? "Reminder on!" : "Reminder off");
    }
    setSavingReminder(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Settings</h1>

      {/* Profile */}
      <section className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Profile</p>
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
                <button onClick={() => setEditingName(true)} className="text-xs text-lavender hover:underline shrink-0">
                  Edit
                </button>
              </div>
            )}
            <p className="text-sm text-gray-400 truncate mt-0.5">{email}</p>
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Appearance</p>
        <div className="rounded-3xl bg-gray-50 dark:bg-gray-800 p-5 flex items-center justify-between">
          <p className="font-medium text-gray-800 dark:text-gray-100">Dark mode</p>
          <ThemeToggle />
        </div>
      </section>

      {/* Reminders */}
      <section className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Daily Reminder</p>
        <div className="rounded-3xl bg-gray-50 dark:bg-gray-800 p-5 flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-800 dark:text-gray-100">Remind me to check in</p>
            <p className="text-xs text-gray-400 mt-0.5">Daily nudge at 8:00 PM if you haven&apos;t checked in</p>
          </div>
          <button
            onClick={() => saveReminder(!reminderEnabled)}
            disabled={savingReminder}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              reminderEnabled ? "bg-lavender" : "bg-gray-200 dark:bg-gray-600"
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              reminderEnabled ? "translate-x-6" : "translate-x-1"
            }`} />
          </button>
        </div>
      </section>

      {/* Account */}
      <section className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Account</p>
        <button
          onClick={logout}
          className="w-full rounded-3xl border border-blush py-3 text-sm font-medium text-blush-dark hover:bg-blush-light transition-all"
        >
          Log out
        </button>
      </section>
    </div>
  );
}
