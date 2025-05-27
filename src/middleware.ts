import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'ru'],

  // If this locale is matched, pathnames work without a prefix (e.g. `/about`)
  defaultLocale: 'ru',

  // Redirect to default locale if no locale is specified
  localePrefix: 'always'
});

export const config = {
  // Skip all paths that should not be internationalized
  matcher: ['/((?!api|_next|.*\\..*).*)']
}; 