import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Public config values safe to expose to authenticated users
const PUBLIC_KEYS = ["ai_force_standard_model"];

export async function GET() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("app_config")
    .select("key, value")
    .in("key", PUBLIC_KEYS);

  const config: Record<string, string> = {};
  for (const row of data ?? []) {
    config[row.key] = row.value;
  }
  return NextResponse.json(config);
}
