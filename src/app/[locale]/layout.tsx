import { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

import '@/styles/globals.css';

// Предполагается, что seoConfig находится здесь
import { seoConfig } from '@/lib/config/seo'; 
import { generateStructuredData } from '@/lib/seo'; // Ваша функция для генерации JSON-LD

import GoogleAnalytics from '@/components/GoogleAnalytics';
import SiteHeader from '@/components/layout/SiteHeader';

import { locales } from '@/i18n.config';
import { Providers } from '@/providers/Providers';

// 1. Используем функцию generateMetadata для большей гибкости
export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  
  // Здесь можно добавить логику для перевода метаданных, если потребуется
  // const t = await getTranslator(locale, 'Metadata');

  return {
    // 2. Устанавливаем metadataBase всегда для корректной работы OG-изображений
    metadataBase: new URL(seoConfig.siteUrl),
    title: {
      default: seoConfig.siteName, // Используем siteName из конфига
      template: `%s | ${seoConfig.siteName}`,
    },
    description: seoConfig.description,
    keywords: seoConfig.keywords,
    authors: [{ name: seoConfig.author, url: seoConfig.siteUrl }],
    creator: seoConfig.creator,
    publisher: seoConfig.publisher,
    
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },

    // 3. Динамически генерируем alternates из i18n конфига
    alternates: {
      canonical: '/',
      languages: locales.reduce((acc, loc) => {
        acc[loc] = `/${loc}`;
        return acc;
      }, {} as Record<string, string>),
    },

    openGraph: {
      ...seoConfig.openGraph,
      title: seoConfig.siteName,
      description: seoConfig.description,
      url: seoConfig.siteUrl,
    },

    twitter: {
      ...seoConfig.twitter,
      title: seoConfig.siteName,
      description: seoConfig.description,
    },

    robots: seoConfig.robots, // Типы должны совпадать, 'as' не требуется
    verification: seoConfig.verification,

    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: seoConfig.siteName,
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
  setRequestLocale(locale);
  let messages;
  try {
    messages = (await import(`@/messages/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }

  // 4. Генерируем JSON-LD для главной страницы
  const websiteSchema = generateStructuredData('WebSite', {});
  const organizationSchema = generateStructuredData('Organization', {});

  return (
    <html lang={locale}>
      <head>
        {/* 5. Внедряем структурированные данные в <head> */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body>
        <GoogleAnalytics />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <SiteHeader locale={locale} />
            <main className="min-h-screen px-3 sm:px-0">{children}</main>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}