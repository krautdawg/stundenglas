import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// For database session strategy, we check for the session cookie
// The actual session validation happens server-side
function hasSessionCookie(req: NextRequest): boolean {
  // Check for both secure and non-secure cookie names
  const sessionCookie = 
    req.cookies.get("__Secure-next-auth.session-token") ||
    req.cookies.get("next-auth.session-token") ||
    req.cookies.get("authjs.session-token") ||
    req.cookies.get("__Secure-authjs.session-token");
  
  return !!sessionCookie?.value;
}

export async function middleware(req: NextRequest) {
  const hasSession = hasSessionCookie(req);
  const isAuthPage = req.nextUrl.pathname.startsWith("/login");
  const isProtectedRoute =
    req.nextUrl.pathname.startsWith("/(protected)") ||
    req.nextUrl.pathname === "/dashboard" ||
    req.nextUrl.pathname.startsWith("/dashboard") ||
    req.nextUrl.pathname === "/profile" ||
    req.nextUrl.pathname.startsWith("/profile") ||
    req.nextUrl.pathname === "/hours" ||
    req.nextUrl.pathname.startsWith("/hours") ||
    req.nextUrl.pathname === "/jobs" ||
    req.nextUrl.pathname.startsWith("/jobs") ||
    req.nextUrl.pathname === "/kreise" ||
    req.nextUrl.pathname.startsWith("/kreise") ||
    req.nextUrl.pathname === "/leaderboard" ||
    req.nextUrl.pathname.startsWith("/leaderboard") ||
    req.nextUrl.pathname === "/admin" ||
    req.nextUrl.pathname.startsWith("/admin");

  // Redirect logged-in users away from auth pages
  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Redirect unauthenticated users to login
  if (isProtectedRoute && !hasSession) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/hours/:path*",
    "/jobs/:path*",
    "/kreise/:path*",
    "/leaderboard/:path*",
    "/admin/:path*",
    "/login/:path*",
  ],
};
