import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Strip any scripts, event handlers, or external references from SVG
function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")       // remove <script> blocks
    .replace(/\bon\w+\s*=/gi, "data-removed=")         // remove event handlers (onclick= etc)
    .replace(/javascript\s*:/gi, "")                   // remove javascript: URIs
    .replace(/<use[^>]*href\s*=\s*["'][^"']*["'][^>]*>/gi, "") // remove <use> with external refs
    .replace(/xlink:href\s*=\s*["'][^"']*["']/gi, "") // remove xlink:href
    .trim();
}

const FREE_DAILY_LIMIT = 5;
const PREMIUM_DAILY_LIMIT = 20;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const VALID_MOODS = new Set(["thriving","good","okay","low","struggling","katakni","soaked","burning","heated","frisky","naughty","smitten","adoring","connected","longing","tender"]);
  const body = await req.json() as { mood: string; note?: string };
  const mood = typeof body.mood === "string" ? body.mood.slice(0, 50) : "";
  const note = typeof body.note === "string" ? body.note.slice(0, 200) : undefined;
  if (!mood || !VALID_MOODS.has(mood)) return NextResponse.json({ error: "Invalid mood" }, { status: 400 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("model_emoji, is_premium")
    .eq("id", user.id)
    .single<{ model_emoji: string; is_premium: boolean }>();

  const isPremium = profile?.is_premium ?? false;
  const dailyLimit = isPremium ? PREMIUM_DAILY_LIMIT : FREE_DAILY_LIMIT;
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Check + increment usage atomically via upsert
  const { data: usage } = await admin
    .from("emoji_usage")
    .select("count")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  const currentCount = usage?.count ?? 0;
  if (currentCount >= dailyLimit) {
    return NextResponse.json(
      { error: "Daily limit reached", limit: dailyLimit, remaining: 0 },
      { status: 429 }
    );
  }

  await admin.from("emoji_usage").upsert(
    { user_id: user.id, date: today, count: currentCount + 1 },
    { onConflict: "user_id,date" }
  );

  // Haiku by default; Sonnet only if premium and explicitly opted in
  const { data: forceStandardRow } = await admin.from("app_config").select("value").eq("key", "ai_force_standard_model").single();
  const forceStandard = forceStandardRow?.value === "true";
  const modelPref = profile?.model_emoji ?? "haiku";
  const model = (!forceStandard && isPremium && modelPref === "sonnet") ? "claude-sonnet-4-6" : "claude-haiku-4-5-20251001";

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
  const svg = sanitizeSvg(svgMatch ? svgMatch[0] : raw);

  return NextResponse.json({ svg, remaining: dailyLimit - (currentCount + 1) });
}
