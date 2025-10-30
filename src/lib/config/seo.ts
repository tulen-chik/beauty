import type { SeoConfig } from '../../types/seo';

export const seoConfig: SeoConfig = {
  siteName: 'Charming',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://beauty-platform.com',
  description: 'Find the best beauty salons near you. Book appointments online with verified beauty professionals.',
  keywords: [
    'beauty salon',
    'beauty services',
    'hair salon',
    'nail salon',
    'spa',
    'massage',
    'beauty booking',
    'online booking',
    'beauty appointments',
    'salon management',
    'beauty professionals',
    'cosmetology',
    'beauty platform'
  ],
  author: 'Charming Team',
  creator: 'Charming',
  publisher: 'Charming',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Charming',
    images: [
      {
        url: '/images/logo.jpg',
        width: 1200,
        height: 630,
        alt: 'Charming - Find the best beauty salons near you',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@Charming',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || 'your-google-verification-code',
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || 'your-yandex-verification-code',
  },
};