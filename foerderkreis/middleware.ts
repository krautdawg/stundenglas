import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isLoggedIn = !!token;
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

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isProtectedRoute && !isLoggedIn) {
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
