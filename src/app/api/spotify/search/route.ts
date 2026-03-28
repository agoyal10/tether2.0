import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Module-level token cache (valid within a serverless instance lifetime)
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.token;

  const credentials = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  const data = await res.json();
  if (!data.access_token) throw new Error("Failed to get Spotify token");

  // Cache with 60s buffer before actual expiry
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.token;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ tracks: [] });

  try {
    const token = await getAccessToken();
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=12`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message ?? `Spotify error ${res.status}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tracks = (data.tracks?.items ?? []).map((t: any) => ({
      id: t.id,
      name: t.name,
      artist: t.artists?.[0]?.name ?? "Unknown artist",
      album: t.album?.name ?? "",
      image: t.album?.images?.[1]?.url ?? t.album?.images?.[0]?.url ?? "",
      preview: t.preview_url ?? null,
      url: t.external_urls?.spotify ?? `https://open.spotify.com/track/${t.id}`,
    }));

    return NextResponse.json({ tracks });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[spotify/search]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
