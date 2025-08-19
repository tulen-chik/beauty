// SEO Configuration
export const seoConfig = {
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
}

// Generate structured data for different page types
export const generateStructuredData = (type: string, data: Record<string, any>) => {
  const baseData = {
    '@context': 'https://schema.org',
    '@type': type,
  }

  switch (type) {
    case 'WebSite':
      return {
        ...baseData,
        name: data.name || seoConfig.siteName,
        description: data.description || seoConfig.description,
        url: data.url || seoConfig.siteUrl,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${seoConfig.siteUrl}/search?q={search_term_string}`
          },
          'query-input': 'required name=search_term_string'
        }
      }

    case 'Organization':
      return {
        ...baseData,
        name: data.name || seoConfig.siteName,
        url: data.url || seoConfig.siteUrl,
        logo: data.logo || `${seoConfig.siteUrl}/logo.png`,
        sameAs: [
          'https://facebook.com/beautyplatform',
          'https://instagram.com/beautyplatform',
          'https://twitter.com/beautyplatform'
        ]
      }

    case 'LocalBusiness':
      return {
        ...baseData,
        name: data.name,
        description: data.description,
        address: {
          '@type': 'PostalAddress',
          streetAddress: data.address?.streetAddress,
          addressLocality: data.address?.addressLocality,
          addressRegion: data.address?.addressRegion,
          postalCode: data.address?.postalCode,
          addressCountry: data.address?.addressCountry
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: data.geo?.latitude,
          longitude: data.geo?.longitude
        },
        telephone: data.telephone,
        email: data.email,
        url: data.url,
        openingHours: data.openingHours,
        priceRange: data.priceRange
      }

    case 'Service':
      return {
        ...baseData,
        name: data.name,
        description: data.description,
        provider: {
          '@type': 'LocalBusiness',
          name: data.provider?.name
        },
        areaServed: {
          '@type': 'City',
          name: data.areaServed?.name
        },
        priceRange: data.priceRange,
        serviceType: data.serviceType
      }

    default:
      return baseData
  }
}
