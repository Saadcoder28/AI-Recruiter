// app/auth/callback/route.js         ← adjust path if needed
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies as getCookies } from "next/headers";

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code       = requestUrl.searchParams.get("code");
  const error      = requestUrl.searchParams.get("error");
  const errorDesc  = requestUrl.searchParams.get("error_description");

  /* 1. handle auth error --------------------------------------------------*/
  if (error) {
    return NextResponse.redirect(
      new URL(
        `/auth?error=${encodeURIComponent(errorDesc || error)}`,
        requestUrl.origin
      )
    );
  }

  /* 2. exchange code for session -----------------------------------------*/
  if (code) {
    try {
      /* cookies() is async in recent Next.js canaries */
      const cookieStore = await getCookies();

      const supabase = createRouteHandlerClient({
        cookies: () => cookieStore,
      });

      await supabase.auth.exchangeCodeForSession(code);

      // choose where to land after successful sign‑in
      return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
    } catch (err) {
      console.error("Auth exchange failed:", err);
      return NextResponse.redirect(
        new URL("/auth?error=Authentication failed", requestUrl.origin)
      );
    }
  }

  /* 3. fallback: redirect to /auth ---------------------------------------*/
  return NextResponse.redirect(new URL("/auth", requestUrl.origin));
}
