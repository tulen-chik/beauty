import { seoConfig } from './config/seo';
import type {
  WebSiteSchema,
  OrganizationSchema,
  LocalBusinessSchema,
  ServiceSchema,
  BreadcrumbListSchema,
  StructuredData,
  Review, // Импортируем тип Review
  BreadcrumbListItem // Импортируем тип BreadcrumbListItem
} from '../types/seo';
export function generateStructuredData(type: 'WebSite', data: Partial<Omit<WebSiteSchema, '@type' | '@context'>>): WebSiteSchema;
export function generateStructuredData(type: 'Organization', data: Partial<Omit<OrganizationSchema, '@type' | '@context'>>): OrganizationSchema;
export function generateStructuredData(type: 'BeautySalon' | 'HairSalon' | 'NailSalon' | 'DaySpa', data: Omit<LocalBusinessSchema, '@type' | '@context'>): LocalBusinessSchema;
export function generateStructuredData(type: 'Service', data: Omit<ServiceSchema, '@type' | '@context'>): ServiceSchema;
export function generateStructuredData(type: 'BreadcrumbList', data: Omit<BreadcrumbListSchema, '@type' | '@context'>): BreadcrumbListSchema;

// Основная реализация функции
export function generateStructuredData(
  type: StructuredData['@type'],
  data: any
): StructuredData {
  // Убираем '@type' из базового объекта
  const baseData = {
    '@context': 'https://schema.org' as const,
  };

  switch (type) {
    case 'WebSite':
      return {
        ...baseData,
        '@type': 'WebSite', // Указываем тип здесь
        name: data.name || seoConfig.siteName,
        description: data.description || seoConfig.description,
        url: data.url || seoConfig.siteUrl,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${seoConfig.siteUrl}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      };

    case 'Organization':
      return {
        ...baseData,
        '@type': 'Organization', // Указываем тип здесь
        name: data.name || seoConfig.siteName,
        url: data.url || seoConfig.siteUrl,
        logo: data.logo || `${seoConfig.siteUrl}/logo.png`,
        sameAs: [
          'https://facebook.com/beautyplatform',
          'https://instagram.com/beautyplatform',
          'https://twitter.com/beautyplatform',
        ],
      };

    case 'BeautySalon':
    case 'HairSalon':
    case 'NailSalon':
    case 'DaySpa':
      return {
        ...baseData,
        '@type': type, // Указываем тип здесь (он будет 'BeautySalon', 'HairSalon' и т.д.)
        ...data,
        // Добавим явную типизацию для map, чтобы избежать неявного 'any'
        review: data.reviews?.map((review: Omit<Review, '@type'>) => ({
          '@type': 'Review' as const,
          author: {
            '@type': 'Person' as const,
            name: review.author.name,
          },
          reviewRating: {
            '@type': 'Rating' as const,
            ratingValue: review.reviewRating.ratingValue,
          },
          reviewBody: review.reviewBody,
        })),
      };

    case 'Service':
      return {
        ...baseData,
        '@type': 'Service', // Указываем тип здесь
        ...data,
      };

    case 'BreadcrumbList':
      return {
        ...baseData,
        '@type': 'BreadcrumbList', // Указываем тип здесь
        itemListElement: data.items?.map((item: { name: string; path: string }, index: number): BreadcrumbListItem => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: `${seoConfig.siteUrl}${item.path}`,
        })),
      };

    default:
      // Эта проверка гарантирует, что все возможные типы были обработаны
      const exhaustiveCheck: never = type;
      return exhaustiveCheck;
  }
}