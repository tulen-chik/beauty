import type { SeoConfig } from '../../types/seo';

export const seoConfig: SeoConfig = {
  siteName: 'Beauty Platform',
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
  author: 'Beauty Platform Team',
  creator: 'Beauty Platform',
  publisher: 'Beauty Platform',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Beauty Platform',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Beauty Platform - Find the best beauty salons near you',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@beautyplatform',
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