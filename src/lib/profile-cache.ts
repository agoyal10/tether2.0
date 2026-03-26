import { unstable_cache } from "next/cache";
import { createAdminClient } from "./supabase/admin";
import type { Profile } from "@/types";

export function getCachedProfile(userId: string): Promise<Profile | null> {
  return unstable_cache(
    async () => {
      const admin = createAdminClient();
      const { data } = await admin
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single<Profile>();
      return data ?? null;
    },
    [`profile-${userId}`],
    { revalidate: 300, tags: [`profile-${userId}`] }
  )();
}
