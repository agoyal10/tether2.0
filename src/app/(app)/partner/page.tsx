"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import type { Connection, Profile } from "@/types";

interface MediaPreviewItem { id: string; url: string; isVideo: boolean; }

function NudgePartnerButton({ partnerName }: { partnerName: string }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  async function nudge() {
    if (sent || loading) return;
    setLoading(true);
    const res = await fetch("/api/push/nudge", { method: "POST" });
    setLoading(false);
    if (res.ok) {
      setSent(true);
      toast.success(`Nudged ${partnerName}!`);
      setTimeout(() => setSent(false), 5 * 60 * 1000);
    } else if (res.status === 429) {
      const { retryAfter } = await res.json();
      const mins = Math.ceil(retryAfter / 60);
      toast.error(`Already nudged recently — try again in ${mins} minute${mins === 1 ? "" : "s"}`);
    } else {
      toast.error("Couldn't send nudge");
    }
  }
  return (
    <button
      onClick={nudge}
      disabled={sent || loading}
      className="w-full rounded-3xl bg-lavender py-3 text-sm font-semibold text-white hover:bg-lavender-dark disabled:opacity-60 transition-all"
    >
      {loading ? "Sending…" : sent ? "Nudge sent ✓" : `Ask ${partnerName} to check in 💌`}
    </button>
  );
}

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
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [mediaPreviews, setMediaPreviews] = useState<MediaPreviewItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [lightbox, setLightbox] = useState<MediaPreviewItem | null>(null);

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

        // Fetch last 9 shared media
        const { data: msgs } = await supabase
          .from("messages")
          .select("id, media_path")
          .in("sender_id", [user.id, partnerId])
          .not("media_path", "is", null)
          .order("created_at", { ascending: false })
          .limit(9);

        if (msgs?.length) {
          const paths = msgs.map((m) => m.media_path as string);
          const res = await fetch("/api/media/sign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paths }),
          });
          const { urls } = await res.json();
          setMediaPreviews(
            msgs.filter((m) => urls[m.media_path]).map((m) => ({
              id: m.id,
              url: urls[m.media_path],
              isVideo: /\.(mp4|mov|webm|avi)$/i.test(m.media_path),
            }))
          );
        }
        setMediaLoading(false);
      } else {
        localStorage.removeItem("tether_connection");
        localStorage.removeItem("tether_partner");
        setMediaLoading(false);
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

  async function sendFlowers() {
    const res = await fetch("/api/flowers/send", { method: "POST" });
    if (res.ok) toast.success("Flowers sent! 🌸");
    else toast.error("Couldn't send flowers");
  }

  async function saveMedia(url: string, isVideo: boolean) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const ext = isVideo ? "mp4" : "jpg";
      const file = new File([blob], `tether-${Date.now()}.${ext}`, { type: blob.type });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl; a.download = file.name;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(blobUrl);
      }
    } catch { /* silent */ }
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
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={() => setLightbox(null)}>
          {lightbox.isVideo ? (
            <video src={lightbox.url} controls autoPlay playsInline className="max-h-full max-w-full" onClick={(e) => e.stopPropagation()} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={lightbox.url} alt="" className="max-h-screen max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
          )}
          <div className="absolute flex items-center gap-2" style={{ top: "calc(env(safe-area-inset-top, 0px) + 12px)", right: "12px" }}>
            <button
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white"
              onClick={async (e) => { e.stopPropagation(); await saveMedia(lightbox.url, lightbox.isVideo); }}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M12 16l-5-5h3V4h4v7h3l-5 5zm-7 4h14v-2H5v2z"/></svg>
            </button>
            <button className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white text-base font-bold" onClick={() => setLightbox(null)}>×</button>
          </div>
        </div>
      )}
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
            onClick={sendFlowers}
            className="w-full rounded-3xl bg-blush py-3 text-sm font-semibold text-white hover:bg-blush-dark transition-all"
          >
            Send flowers 🌸
          </button>

          <NudgePartnerButton partnerName={partner.display_name} />

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Shared Media</p>
              {!mediaLoading && mediaPreviews.length > 0 && (
                <Link href="/media" className="text-xs font-semibold text-lavender hover:text-lavender-dark">See all →</Link>
              )}
            </div>
            {mediaLoading ? (
              <div className="grid grid-cols-3 gap-1">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                ))}
              </div>
            ) : mediaPreviews.length > 0 ? (
              <div className="grid grid-cols-3 gap-1">
                {mediaPreviews.map((item) => (
                  <button key={item.id} onClick={() => setLightbox(item)} className="relative aspect-square overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 block">
                    {item.isVideo ? (
                      <>
                        <video src={item.url} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white drop-shadow"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      </>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.url} alt="" className="h-full w-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">No media shared yet</p>
            )}
          </div>

          <div className="mt-8">
            {confirmDisconnect ? (
              <div className="rounded-3xl border border-blush bg-blush-light/40 p-4 flex flex-col gap-3">
                <p className="text-sm font-medium text-gray-700 text-center">Disconnect from {partner.display_name}?</p>
                <p className="text-xs text-gray-400 text-center">Your chat history will be preserved if you reconnect.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDisconnect(false)}
                    className="flex-1 rounded-2xl border border-gray-400 py-2.5 text-sm font-semibold text-gray-200 hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={disconnect}
                    className="flex-1 rounded-2xl bg-blush py-2.5 text-sm font-semibold text-white hover:bg-blush-dark transition-all"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDisconnect(true)}
                className="w-full rounded-3xl border border-gray-200 py-3 text-sm font-medium text-gray-400 hover:border-blush hover:text-blush-dark transition-all"
              >
                Disconnect partner
              </button>
            )}
          </div>
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
