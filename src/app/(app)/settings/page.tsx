"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "@/components/ThemeToggle";
import type { Profile } from "@/types";

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const ampm = i < 12 ? "AM" : "PM";
  const h = i % 12 === 0 ? 12 : i % 12;
  return { value: i, label: `${h}:00 ${ampm}` };
});

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile & { reminder_enabled: boolean; reminder_hour: number; reminder_timezone: string } | null>(null);
  const [email, setEmail] = useState("");

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(20);
  const [savingReminder, setSavingReminder] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      setEmail(user.email ?? "");

      const { data: p } = await supabase
        .from("profiles").select("*").eq("id", user.id).single();
      if (p) {
        setProfile(p);
        setNameInput(p.display_name);
        setReminderEnabled(p.reminder_enabled ?? false);
        setReminderHour(p.reminder_hour ?? 20);
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

  async function saveReminder(enabled: boolean, hour: number) {
    if (!profile) return;
    setSavingReminder(true);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const { error } = await supabase.from("profiles").update({
      reminder_enabled: enabled,
      reminder_hour: hour,
      reminder_timezone: timezone,
    }).eq("id", profile.id);
    if (error) {
      toast.error("Could not save reminder.");
    } else {
      setReminderEnabled(enabled);
      setReminderHour(hour);
      setProfile({ ...profile, reminder_enabled: enabled, reminder_hour: hour, reminder_timezone: timezone });
      toast.success(enabled ? "Reminder set!" : "Reminder off");
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
        <div className="rounded-3xl bg-gray-50 dark:bg-gray-800 p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800 dark:text-gray-100">Remind me to check in</p>
              <p className="text-xs text-gray-400 mt-0.5">Get a notification if you haven&apos;t checked in</p>
            </div>
            <button
              onClick={() => saveReminder(!reminderEnabled, reminderHour)}
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

          {reminderEnabled && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-300">Reminder time</p>
              <select
                value={reminderHour}
                onChange={(e) => saveReminder(true, Number(e.target.value))}
                className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm font-medium text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-lavender/30"
              >
                {HOURS.map((h) => (
                  <option key={h.value} value={h.value}>{h.label}</option>
                ))}
              </select>
            </div>
          )}
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
