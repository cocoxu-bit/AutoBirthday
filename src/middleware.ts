import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('__session')?.value;
  const pathname = request.nextUrl.pathname;
  
  const isAuthRoute = pathname === '/login' || pathname === '/register';
  
  // Direct onboarding: root / redirects to /register (unauthenticated) or /dashboard (authenticated)
  if (pathname === '/') {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/register', request.url));
    }
  }

  // Protected SaaS dashboard routes
  const isProtectedRoute = 
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/whatsapp') ||
    pathname.startsWith('/contacts') ||
    pathname.startsWith('/templates') ||
    pathname.startsWith('/wishes') ||
    pathname.startsWith('/settings');

  if (!session && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/cron|api/webhooks|_next/static|_next/image|favicon.ico).*)',
  ],
};
