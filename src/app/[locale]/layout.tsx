import { Metadata } from 'next';
import * as React from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import '@/styles/globals.css';
import '@/styles/colors.css';

import { siteConfig } from '@/constant/config';
import { locales, defaultLocale } from '@/i18n.config';
import { AuthProvider } from '@/contexts/AuthContext';
import { PublicationProvider } from '@/contexts/PublicationContext';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = params.locale;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  
  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: locale === 'ru' 
        ? 'Rocket - Создавайте вирусные клипы из стримов'
        : 'Rocket - Create Viral Clips from Streams',
      template: `%s | ${siteConfig.title}`,
    },
    description: locale === 'ru'
      ? 'Автоматизируйте создание клипов из стримов для TikTok и Instagram. ИИ поможет найти самые интересные моменты и создаст вирусный контент.'
      : 'Automate clip creation from streams for TikTok and Instagram. AI helps find the most interesting moments and creates viral content.',
    keywords: locale === 'ru'
      ? 'стримы, клипы, тикток, инстаграм, нарезка видео, вирусный контент, стримеры, контент-мейкеры'
      : 'streams, clips, tiktok, instagram, video editing, viral content, streamers, content creators',
    robots: { index: true, follow: true },
    icons: {
      icon: '/favicon/favicon.ico',
      shortcut: '/favicon/favicon-16x16.png',
      apple: '/favicon/apple-touch-icon.png',
    },
    manifest: `/favicon/site.webmanifest`,
    openGraph: {
      url: siteConfig.url,
      title: locale === 'ru'
        ? 'Rocket - Создавайте вирусные клипы из стримов'
        : 'Rocket - Create Viral Clips from Streams',
      description: locale === 'ru'
        ? 'Автоматизируйте создание клипов из стримов для TikTok и Instagram. ИИ поможет найти самые интересные моменты и создаст вирусный контент.'
        : 'Automate clip creation from streams for TikTok and Instagram. AI helps find the most interesting moments and creates viral content.',
      siteName: siteConfig.title,
      images: [`${siteConfig.url}/images/og.jpg`],
      type: 'website',
      locale: locale === 'ru' ? 'ru_RU' : 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: locale === 'ru'
        ? 'Rocket - Создавайте вирусные клипы из стримов'
        : 'Rocket - Create Viral Clips from Streams',
      description: locale === 'ru'
        ? 'Автоматизируйте создание клипов из стримов для TikTok и Instagram. ИИ поможет найти самые интересные моменты и создаст вирусный контент.'
        : 'Automate clip creation from streams for TikTok and Instagram. AI helps find the most interesting moments and creates viral content.',
      images: [`${siteConfig.url}/images/og.jpg`],
    },
    authors: [
      {
        name: 'Eugene Soldatsenko',
      },
    ],
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const locale = params.locale;
  
  // Enable static rendering
  setRequestLocale(locale);

  let messages;
  try {
    messages = (await import(`@/messages/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }

  return (
    <html lang={locale} className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className="h-full overflow-x-hidden">
        <NextIntlClientProvider locale={locale} messages={messages} timeZone="Europe/Moscow">
          <AuthProvider>
            <PublicationProvider>
              {children}
            </PublicationProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
} 