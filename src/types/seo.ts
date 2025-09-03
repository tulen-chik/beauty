interface OpenGraphImage {
    url: string;
    width: number;
    height: number;
    alt: string;
  }
  
  interface OpenGraph {
    type: 'website' | 'article' | 'profile';
    locale: string;
    siteName: string;
    images?: OpenGraphImage[];
  }
  
  interface Twitter {
    card: 'summary' | 'summary_large_image' | 'app' | 'player';
    creator: string;
    images?: string[];
  }
  
  interface Robots {
    index: boolean;
    follow: boolean;
    googleBot?: {
      index: boolean;
      follow: boolean;
      'max-video-preview': number;
      'max-image-preview': 'none' | 'standard' | 'large';
      'max-snippet': number;
    };
  }
  
  export interface SeoConfig {
    siteName: string;
    siteUrl: string;
    description: string;
    keywords: string[];
    author: string;
    creator: string;
    publisher: string;
    openGraph: OpenGraph;
    twitter: Twitter;
    robots: Robots;
    verification?: {
      google?: string;
      yandex?: string;
    };
  }
  
  // --- Типы для структурированных данных (Schema.org) ---
  
  interface BaseSchema {
    '@context': 'https://schema.org';
    '@type': string;
  }
  
  export interface WebSiteSchema extends BaseSchema {
    '@type': 'WebSite';
    name: string;
    description: string;
    url: string;
    potentialAction: {
      '@type': 'SearchAction';
      target: {
        '@type': 'EntryPoint';
        urlTemplate: string;
      };
      'query-input': 'required name=search_term_string';
    };
  }
  
  export interface OrganizationSchema extends BaseSchema {
    '@type': 'Organization';
    name: string;
    url: string;
    logo: string;
    sameAs: string[];
  }
  
  interface PostalAddress {
    '@type': 'PostalAddress';
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  }
  
  interface GeoCoordinates {
    '@type': 'GeoCoordinates';
    latitude?: number;
    longitude?: number;
  }
  
  interface AggregateRating {
    '@type': 'AggregateRating';
    ratingValue?: string;
    reviewCount?: string;
  }
  
  export interface Review {
    '@type': 'Review';
    author: {
      '@type': 'Person';
      name: string;
    };
    reviewRating: {
      '@type': 'Rating';
      ratingValue: string;
    };
    reviewBody: string;
  }
  
  export interface LocalBusinessSchema extends BaseSchema {
    '@type': 'BeautySalon' | 'HairSalon' | 'NailSalon' | 'DaySpa';
    name: string;
    description: string;
    image?: string;
    address?: PostalAddress;
    geo?: GeoCoordinates;
    telephone?: string;
    email?: string;
    url: string;
    openingHours?: string | string[]; // ISO 8601 format
    priceRange?: string;
    aggregateRating?: AggregateRating;
    review?: Review[];
  }
  
  interface Offer {
    '@type': 'Offer';
    price?: string;
    priceCurrency?: string;
  }
  
  export interface ServiceSchema extends BaseSchema {
    '@type': 'Service';
    name: string;
    description: string;
    provider?: {
      '@type': 'LocalBusiness';
      name: string;
    };
    areaServed?: {
      '@type': 'City';
      name: string;
    };
    offers?: Offer;
    serviceType?: string;
  }
  
  export interface BreadcrumbListItem {
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }
  
  export interface BreadcrumbListSchema extends BaseSchema {
    '@type': 'BreadcrumbList';
    itemListElement: BreadcrumbListItem[];
  }
  
  // --- Тип для данных, передаваемых в generateStructuredData ---
  
  export type StructuredData =
    | WebSiteSchema
    | OrganizationSchema
    | LocalBusinessSchema
    | ServiceSchema
    | BreadcrumbListSchema;