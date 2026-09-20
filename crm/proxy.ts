import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allowed public routes without authentication:
  // - Landing page ('/')
  // - Authentication pages ('/auth/*')
  // - Internal Next.js static / images / icons
  // - Public API endpoints like auth ('/api/auth/*')
  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.');

  // Retrieve session token from Better Auth cookie
  const sessionToken =
    request.cookies.get('better-auth.session_token')?.value ||
    request.cookies.get('__Secure-better-auth.session_token')?.value;

  // If user is already authenticated and visits /auth/sign-in or /auth/sign-up,
  // redirect them directly to the dashboard
  if (pathname.startsWith('/auth') && sessionToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If route is protected and no session token exists, redirect to sign-in
  if (!isPublicRoute && !sessionToken) {
    const signInUrl = new URL('/auth/sign-in', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

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
