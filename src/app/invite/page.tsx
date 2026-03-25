"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

export default function InvitePage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [partnerCode, setPartnerCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single<Profile>()
        .then(({ data }) => setProfile(data));
    });
  }, [supabase, router]);

  async function copyCode() {
    if (!profile) return;
    await navigator.clipboard.writeText(profile.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function connectPartner(e: React.FormEvent) {
    e.preventDefault();
    const code = partnerCode.trim().toUpperCase();
    if (!code || !profile) return;
    setLoading(true);

    // Find partner by invite code
    const { data: partner, error: findErr } = await supabase
      .from("profiles")
      .select("id")
      .eq("invite_code", code)
      .single<{ id: string }>();

    if (findErr || !partner) {
      toast.error("Invite code not found. Double-check and try again.");
      setLoading(false);
      return;
    }

    if (partner.id === profile.id) {
      toast.error("That's your own code!");
      setLoading(false);
      return;
    }

    // Create connection (user_a always has the smaller UUID for uniqueness)
    const [a, b] = [profile.id, partner.id].sort();
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

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <span className="text-5xl">💌</span>
          <h1 className="mt-3 text-2xl font-bold text-gray-800">Connect with Your Partner</h1>
          <p className="mt-1 text-sm text-gray-400">
            Share your code or enter theirs to link your accounts.
          </p>
        </div>

        {/* Your Code */}
        <div className="rounded-3xl bg-lavender-light p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-lavender-dark">
            Your Invite Code
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-3xl font-bold tracking-[0.25em] text-lavender-dark">
              {profile?.invite_code ?? "------"}
            </span>
            <button
              onClick={copyCode}
              className="rounded-2xl bg-lavender px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-lavender-dark"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Enter Partner Code */}
        <form onSubmit={connectPartner} className="flex flex-col gap-3">
          <label className="text-sm font-medium text-gray-600">
            Enter Partner&apos;s Code
          </label>
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
    </main>
  );
}
