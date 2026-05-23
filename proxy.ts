// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Let background API endpoints pass through unhindered
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // 2. Check if the secure portal session cookie exists
  const sessionToken = request.cookies.get("portal_session")?.value;

  // 3. If they don't have a session cookie, instantly bounce them to our login trigger
  if (!sessionToken) {
    return NextResponse.redirect(new URL("/api/login", request.url));
  }

  // 4. Session is valid; let them view the root domain directly
  return NextResponse.next();
}

export const config = {
  // Broaden the matcher to cover all paths across the app directory
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};