import { Metadata } from 'next';
import { Robots } from 'next/dist/lib/metadata/types/metadata-types';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

import '@/styles/globals.css';

import { siteConfig } from '@/constant/config';
import { locales } from '@/i18n.config';
import { Providers } from '@/providers/Providers';
import SiteHeader from '@/components/layout/SiteHeader';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import { seoConfig } from '@/lib/seo';

export const metadata: Metadata = {
  ...(process.env.NODE_ENV === 'production' && {
    metadataBase: new URL(seoConfig.siteUrl),
  }),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.title}`,
  },
  description: seoConfig.description,
  keywords: seoConfig.keywords,
  authors: [{ name: seoConfig.author }],
  creator: seoConfig.creator,
  publisher: seoConfig.publisher,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    ...seoConfig.openGraph,
    title: siteConfig.title,
    description: seoConfig.description,
    url: seoConfig.siteUrl,
  },
  twitter: {
    ...seoConfig.twitter,
    title: siteConfig.title,
    description: seoConfig.description,
  },
  robots: seoConfig.robots as Robots,
  verification: seoConfig.verification,
  alternates: {
    canonical: seoConfig.siteUrl,
    languages: {
      'en-US': '/en',
      'ru-RU': '/ru',
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: siteConfig.title,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false as const,
  themeColor: '#be185d',
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Enable static rendering for Server Components with next-intl
  setRequestLocale(locale);
  let messages;
  try {
    messages = (await import(`@/messages/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }

    return (
    <html lang={locale}>
      <body>
        <GoogleAnalytics />
        <NextIntlClientProvider locale={locale} messages={messages}>
        <Providers>
          <SiteHeader locale={locale} />
          <main className="min-h-screen px-3 sm:px-0">
            {children}
          </main>
        </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
} 