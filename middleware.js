import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  
  try {
    const supabase = createMiddlewareClient({ req, res });
    const { data, error } = await supabase.auth.getSession();
    
    console.log("Middleware path:", req.nextUrl.pathname);
    console.log("Session exists:", !!data.session);
    
    // If accessing dashboard routes without being logged in, redirect to auth
    if (!data.session && req.nextUrl.pathname.startsWith('/dashboard')) {
      console.log("No session, redirecting to auth");
      return NextResponse.redirect(new URL('/auth', req.url));
    }
  } catch (err) {
    console.error('Middleware error:', err);
  }
  
  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/callback'],
}; 