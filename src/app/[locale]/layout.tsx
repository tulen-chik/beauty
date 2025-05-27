import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n.config';
import { AuthProvider } from '@/contexts/AuthContext';
import { PublicationProvider } from '@/contexts/PublicationContext';
// import '../globals.css';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const messages = (await import(`@/messages/${locale}.json`)).default;
  
  return {
    title: locale === 'ru' 
      ? 'Glossa - Изучайте языки с помощью карточек'
      : 'Glossa - Learn Languages with Flashcards',
    description: locale === 'ru'
      ? 'Создавайте свои коллекции карточек, тренируйтесь и отслеживайте прогресс в изучении языков'
      : 'Create your own flashcard collections, practice, and track your language learning progress',
    keywords: locale === 'ru'
      ? 'языки, карточки, обучение, flashcards, language learning'
      : 'languages, flashcards, learning, language learning',
    openGraph: {
      title: locale === 'ru'
        ? 'Glossa - Изучайте языки с помощью карточек'
        : 'Glossa - Learn Languages with Flashcards',
      description: locale === 'ru'
        ? 'Создавайте свои коллекции карточек, тренируйтесь и отслеживайте прогресс в изучении языков'
        : 'Create your own flashcard collections, practice, and track your language learning progress',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: locale === 'ru'
        ? 'Glossa - Изучайте языки с помощью карточек'
        : 'Glossa - Learn Languages with Flashcards',
      description: locale === 'ru'
        ? 'Создавайте свои коллекции карточек, тренируйтесь и отслеживайте прогресс в изучении языков'
        : 'Create your own flashcard collections, practice, and track your language learning progress',
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
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
        <NextIntlClientProvider locale={locale} messages={messages}>
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