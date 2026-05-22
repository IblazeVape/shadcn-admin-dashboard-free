// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Let background API endpoints pass through unhindered
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // 2. Check if the secure portal session cookie exists
  const sessionToken = request.cookies.get('portal_session')?.value;

  // 3. If they don't have a session cookie, instantly bounce them to our login trigger route
  if (!sessionToken) {
    // This will transparently trigger our /api/login route which throws them to account.iblazevape.co.uk
    return NextResponse.redirect(new URL('/api/login', request.url));
  }

  // 4. If they are authenticated, let them proceed normally
  return NextResponse.next();
}

// Ensure the middleware monitors all pages across the portal
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
