import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { mood, note } = await req.json() as { mood: string; note?: string };
  if (!mood) return NextResponse.json({ error: "Mood required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("model_emoji, is_premium")
    .eq("id", user.id)
    .single<{ model_emoji: string; is_premium: boolean }>();

  // Non-premium always uses sonnet for emoji (it's the default locked value)
  const modelPref = profile?.model_emoji ?? "sonnet";
  const model = modelPref === "sonnet" ? "claude-sonnet-4-6" : "claude-haiku-4-5-20251001";

  const prompt = `Create a tiny, expressive SVG emoji (64x64 viewBox) that captures this mood: "${mood}"${note ? ` — note: "${note}"` : ""}.

Rules:
- viewBox="0 0 64 64", no width/height attributes
- Max 5 simple shapes (circles, paths, ellipses)
- Warm expressive colors, no text
- Think: abstract emoji / mood icon
- Return ONLY the raw SVG element, no explanation

Example (happy sunny mood):
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="28" fill="#FFD93D"/><circle cx="22" cy="26" r="4" fill="#333"/><circle cx="42" cy="26" r="4" fill="#333"/><path d="M20 40 Q32 52 44 40" stroke="#333" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;

  const message = await anthropic.messages.create({
    model,
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = (message.content[0] as { type: string; text: string }).text.trim();
  const svgMatch = raw.match(/<svg[\s\S]*?<\/svg>/i);
  const svg = svgMatch ? svgMatch[0] : raw;

  return NextResponse.json({ svg });
}
