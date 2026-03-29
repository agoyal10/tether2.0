"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import toast from "react-hot-toast";
import type { Profile } from "@/types";

const TOTAL_STEPS = 3;

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const { state: notifState, requestPermission } = usePushNotifications();

  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hasPartner, setHasPartner] = useState(false);
  const [partnerCode, setPartnerCode] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }

      const { data: p } = await supabase
        .from("profiles").select("*").eq("id", user.id).single<Profile>();
      if (p) setProfile(p);

      const { data: conn } = await supabase
        .from("connections")
        .select("id")
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .eq("status", "active")
        .maybeSingle();
      if (conn) setHasPartner(true);
    });
  }, [supabase, router]);

  function finish() {
    localStorage.setItem("tether_onboarded", "1");
    router.push("/dashboard");
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
    if (!profile) return;
    const code = partnerCode.trim().toUpperCase();
    setConnecting(true);

    const { data: found, error: findErr } = await supabase
      .from("profiles").select("id").eq("invite_code", code).single<{ id: string }>();

    if (findErr || !found) {
      toast.error("Invite code not found. Double-check and try again.");
      setConnecting(false);
      return;
    }
    if (found.id === profile.id) {
      toast.error("That's your own code!");
      setConnecting(false);
      return;
    }

    const [a, b] = [profile.id, found.id].sort();
    const { error } = await supabase.from("connections").upsert(
      { user_a_id: a, user_b_id: b, status: "pending", requester_id: profile.id },
      { onConflict: "user_a_id,user_b_id" }
    );

    if (error) {
      toast.error("Could not connect. Please try again.");
    } else {
      setRequestSent(true);
      setHasPartner(true);
    }
    setConnecting(false);
  }

  const dots = (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i + 1 === step
              ? "h-2 w-5 bg-lavender"
              : i + 1 < step
              ? "h-2 w-2 bg-lavender/40"
              : "h-2 w-2 bg-gray-200 dark:bg-gray-700"
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="flex min-h-[80vh] flex-col justify-between gap-8 pt-4">
      {dots}

      <div className="flex flex-col gap-6 flex-1 justify-center">

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="flex flex-col gap-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <span className="text-6xl">💞</span>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Welcome to Tether</h1>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                A shared space for you and your partner to stay emotionally connected — even on the busiest days.
              </p>
            </div>

            <div className="flex flex-col gap-3 text-left">
              {[
                { icon: "🌤️", title: "Daily check-ins", desc: "Share how you're feeling in seconds" },
                { icon: "💬", title: "AI relationship coach", desc: "Get personalized advice anytime" },
                { icon: "✨", title: "Weekly insights", desc: "See your emotional patterns together" },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3 rounded-2xl bg-gray-50 dark:bg-gray-800 p-4">
                  <span className="text-xl shrink-0">{icon}</span>
                  <div>
                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Connect partner */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div className="text-center">
              <span className="text-5xl">💌</span>
              <h2 className="mt-3 text-2xl font-bold text-gray-800 dark:text-gray-100">Connect your partner</h2>
              <p className="mt-1 text-sm text-gray-400">Share your invite link or enter their code</p>
            </div>

            {requestSent ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <span className="text-5xl">🎉</span>
                <p className="font-semibold text-gray-800 dark:text-gray-100">Request sent!</p>
                <p className="text-sm text-gray-400">Waiting for your partner to accept.</p>
              </div>
            ) : hasPartner ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <span className="text-5xl">✅</span>
                <p className="font-semibold text-gray-800 dark:text-gray-100">Already connected!</p>
              </div>
            ) : (
              <>
                {/* Invite */}
                <div className="rounded-3xl bg-lavender-light dark:bg-lavender/20 p-5 flex flex-col gap-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-lavender-dark dark:text-lavender">Your invite code</p>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-3xl font-bold tracking-[0.25em] text-lavender-dark dark:text-lavender">
                      {profile?.invite_code ?? "------"}
                    </span>
                    <button onClick={copyCode} className="rounded-2xl bg-white/70 dark:bg-white/10 px-4 py-2 text-sm font-semibold text-lavender-dark dark:text-lavender hover:bg-white transition-all">
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <button
                    onClick={shareLink}
                    className="w-full rounded-2xl bg-lavender py-2.5 text-sm font-semibold text-white hover:bg-lavender-dark transition-all"
                  >
                    Share Invite Link 💌
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-gray-100 dark:bg-gray-700" />
                  <span className="text-xs text-gray-300">or enter their code</span>
                  <div className="h-px flex-1 bg-gray-100 dark:bg-gray-700" />
                </div>

                <form onSubmit={connectPartner} className="flex flex-col gap-3">
                  <input
                    type="text"
                    maxLength={6}
                    value={partnerCode}
                    onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                    className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-center text-xl font-bold tracking-[0.25em] uppercase focus:border-lavender focus:outline-none focus:ring-2 focus:ring-lavender/30 transition-all dark:text-gray-100"
                    placeholder="XXXXXX"
                  />
                  <button
                    type="submit"
                    disabled={partnerCode.length < 6 || connecting}
                    className="w-full rounded-3xl bg-lavender py-4 font-semibold text-white shadow-card hover:bg-lavender-dark disabled:opacity-60 transition-all"
                  >
                    {connecting ? "Connecting…" : "Connect"}
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        {/* Step 3: Notifications */}
        {step === 3 && (
          <div className="flex flex-col gap-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <span className="text-6xl">🔔</span>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Stay in the loop</h2>
              <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
                Get notified when your partner checks in, sends a message, or needs a little extra love.
              </p>
            </div>

            {notifState === "granted" ? (
              <div className="rounded-2xl bg-green-50 dark:bg-green-900/20 p-4 text-sm font-medium text-green-700 dark:text-green-400">
                ✓ Notifications are enabled
              </div>
            ) : notifState === "denied" ? (
              <div className="rounded-2xl bg-gray-50 dark:bg-gray-800 p-4 text-sm text-gray-500">
                Notifications blocked. You can enable them later in iPhone Settings → Tether → Notifications.
              </div>
            ) : notifState === "needs-install" ? (
              <div className="rounded-2xl bg-lavender-light dark:bg-lavender/20 p-4 text-sm text-lavender-dark dark:text-lavender">
                Add Tether to your Home Screen first, then enable notifications from Settings.
              </div>
            ) : (
              <button
                onClick={requestPermission}
                className="w-full rounded-3xl bg-lavender py-4 font-semibold text-white shadow-card hover:bg-lavender-dark transition-all"
              >
                Enable notifications
              </button>
            )}
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex flex-col gap-3 pb-2">
        <button
          onClick={() => {
            if (step < TOTAL_STEPS) setStep((s) => s + 1);
            else finish();
          }}
          className="w-full rounded-3xl bg-lavender py-4 font-semibold text-white shadow-card hover:bg-lavender-dark transition-all"
        >
          {step === TOTAL_STEPS ? "Get started →" : "Next →"}
        </button>
        {step < TOTAL_STEPS && (
          <button onClick={finish} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}
