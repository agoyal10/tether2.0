import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single<{ stripe_customer_id: string | null }>();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ is_premium: false });
  }

  // Check active subscriptions directly from Stripe
  const subscriptions = await stripe.subscriptions.list({
    customer: profile.stripe_customer_id,
    status: "active",
    limit: 1,
  });

  const isPremium = subscriptions.data.length > 0;
  const sub = subscriptions.data[0];

  await admin.from("profiles").update({
    is_premium: isPremium,
    ...(sub ? { stripe_subscription_id: sub.id } : {}),
  }).eq("id", user.id);

  return NextResponse.json({ is_premium: isPremium });
}
