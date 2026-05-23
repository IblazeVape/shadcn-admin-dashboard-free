// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let authentication routes, static files, and images pass through
  if (
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/api/callback") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/public") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Check for the session cookie
  const sessionToken = request.cookies.get("portal_session")?.value;

  // If no session exists, redirect to login
  if (!sessionToken) {
    return NextResponse.redirect(new URL("/api/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
