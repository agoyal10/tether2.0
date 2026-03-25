import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { generateInviteCode } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  // We need to set cookies on the response, so we build the response first
  // and pass it into the Supabase client so it can write the session cookie.
  const isNewUser = { value: false };
  let redirectTo = `${origin}/dashboard`;

  const response = NextResponse.redirect(redirectTo);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  // Create profile on first Google sign-in
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", data.user.id)
    .single();

  if (!existing) {
    isNewUser.value = true;
    const displayName =
      data.user.user_metadata?.full_name ||
      data.user.user_metadata?.name ||
      data.user.email?.split("@")[0] ||
      "Friend";

    await supabase.from("profiles").insert({
      id: data.user.id,
      display_name: displayName,
      avatar_url: data.user.user_metadata?.avatar_url ?? null,
      invite_code: generateInviteCode(),
    });

    redirectTo = `${origin}/invite`;
  }

  // Update the redirect URL and return with session cookies attached
  response.headers.set("location", redirectTo);
  return response;
}
