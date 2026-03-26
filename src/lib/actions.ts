"use server";

import { revalidateTag } from "next/cache";

export async function revalidateProfileCache(userId: string) {
  revalidateTag(`profile-${userId}`);
}
