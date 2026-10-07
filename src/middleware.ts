import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { matchLocaleFromHeader } from '@/lib/i18n/config';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('__session')?.value;
  const pathname = request.nextUrl.pathname;
  
  const isAuthRoute = pathname === '/login' || pathname === '/register';
  
  // Allow unauthenticated visitors to see the landing page (src/app/page.tsx)
  // If user is already authenticated and visits '/', redirect them to '/dashboard'
  if (pathname === '/' && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Protected SaaS dashboard routes
  const isProtectedRoute = 
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname.startsWith('/admin') ||
    (pathname.startsWith('/tools') && !pathname.startsWith('/tools/fake-chat')) ||
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

  const response = NextResponse.next();

  // If user does not have a NEXT_LOCALE cookie set, auto-detect device language from Accept-Language header
  if (!request.cookies.has('NEXT_LOCALE')) {
    const acceptLanguage = request.headers.get('accept-language');
    const detectedLocale = matchLocaleFromHeader(acceptLanguage);
    response.cookies.set('NEXT_LOCALE', detectedLocale, {
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax',
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api/cron|api/webhooks|_next/static|_next/image|favicon.ico).*)',
  ],
};
