import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const locales = ['en', 'ru'];
export const defaultLocale = 'ru';

const publicPages = ['/', '/auth/login', '/auth/register', '/auth/verify-email'];

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const locale = pathname.split('/')[1];
  
  // Check if the pathname starts with /app
  if (pathname.startsWith(`/${locale}/app`)) {
    const token = request.cookies.get('access_token')?.value;
    
    // If no token is present, redirect to login
    if (!token) {
      const loginUrl = new URL(`/${locale}/auth/login`, request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Handle public pages and localization
  const isPublicPage = publicPages.some(page => 
    pathname === `/${locale}${page}`
  );

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
}; 