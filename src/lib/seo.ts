// Импорты отсортированы для исправления предупреждения simple-import-sort/imports
import { seoConfig } from './config/seo';
import type {
  BreadcrumbListItem,
  BreadcrumbListSchema,
  LocalBusinessSchema,
  OrganizationSchema,
  Review,
  ServiceSchema,
  StructuredData,
  WebSiteSchema,
} from '../types/seo';

// Определяем объединенный тип для всех возможных форм входных данных,
// чтобы избежать использования 'any'.
export type StructuredDataInput =
  | Partial<Omit<WebSiteSchema, '@type' | '@context'>>
  | Partial<Omit<OrganizationSchema, '@type' | '@context'>>
  | Omit<LocalBusinessSchema, '@type' | '@context'>
  | Omit<ServiceSchema, '@type' | '@context'>
  // Тип для данных BreadcrumbList был скорректирован, чтобы соответствовать реализации.
  | { items: { name: string; path: string }[] };

// Перегрузки функций для обеспечения строгой типизации
export function generateStructuredData(type: 'WebSite', data: Partial<Omit<WebSiteSchema, '@type' | '@context'>>): WebSiteSchema;
export function generateStructuredData(type: 'Organization', data: Partial<Omit<OrganizationSchema, '@type' | '@context'>>): OrganizationSchema;
export function generateStructuredData(type: 'BeautySalon' | 'HairSalon' | 'NailSalon' | 'DaySpa', data: Omit<LocalBusinessSchema, '@type' | '@context'>): LocalBusinessSchema;
export function generateStructuredData(type: 'Service', data: Omit<ServiceSchema, '@type' | '@context'>): ServiceSchema;
// Тип 'data' был исправлен, чтобы отражать фактические ожидаемые входные данные (объект с массивом 'items').
export function generateStructuredData(type: 'BreadcrumbList', data: { items: { name: string; path: string }[] }): BreadcrumbListSchema;

// Основная реализация функции
export function generateStructuredData(
  type: StructuredData['@type'],
  data: StructuredDataInput
): StructuredData {
  const baseData = {
    '@context': 'https://schema.org' as const,
  };

  switch (type) {
    case 'WebSite':
      return {
        ...baseData,
        '@type': 'WebSite',
        name: (data as Partial<WebSiteSchema>).name || seoConfig.siteName,
        description: (data as Partial<WebSiteSchema>).description || seoConfig.description,
        url: (data as Partial<WebSiteSchema>).url || seoConfig.siteUrl,
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
        '@type': 'Organization',
        name: (data as Partial<OrganizationSchema>).name || seoConfig.siteName,
        url: (data as Partial<OrganizationSchema>).url || seoConfig.siteUrl,
        logo: (data as Partial<OrganizationSchema>).logo || `${seoConfig.siteUrl}/logo.png`,
        sameAs: [
          'https://facebook.com/beautyplatform',
          'https://instagram.com/beautyplatform',
          'https://twitter.com/beautyplatform',
        ],
      };

    case 'BeautySalon':
    case 'HairSalon':
    case 'NailSalon':
    case 'DaySpa': {
      // ИСПРАВЛЕНИЕ: Деструктурируем 'review', чтобы обработать его отдельно и избежать ошибки перезаписи.
      // Также исправлено 'reviews' на 'review' в соответствии со схемой.
      const { review, ...restOfData } = data as Omit<LocalBusinessSchema, '@type' | '@context'>;
      return {
        ...baseData,
        '@type': type,
        ...restOfData, // Распространяем остальные данные.
        // Проходим по деструктурированному свойству 'review'.
        review: review?.map((reviewItem: Omit<Review, '@type'>) => ({
          '@type': 'Review' as const,
          author: {
            '@type': 'Person' as const,
            name: reviewItem.author.name,
          },
          reviewRating: {
            '@type': 'Rating' as const,
            ratingValue: reviewItem.reviewRating.ratingValue,
          },
          reviewBody: reviewItem.reviewBody,
        })),
      };
    }

    case 'Service': {
      // ИСПРАВЛЕНИЕ: Деструктурируем, чтобы явно исключить свойства, которые могут быть перезаписаны.
      const { '@type': ignoredType, ...restOfData } = data as ServiceSchema;
      return {
        ...baseData,
        '@type': 'Service',
        ...restOfData, // Безопасно распространяем остальные данные.
      };
    }

    case 'BreadcrumbList':
      return {
        ...baseData,
        '@type': 'BreadcrumbList',
        // ИСПРАВЛЕНИЕ: Теперь объект 'data' корректно имеет свойство 'items' благодаря исправленному типу.
        itemListElement: (data as { items: { name: string; path: string }[] }).items?.map((item: { name: string; path: string }, index: number): BreadcrumbListItem => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: `${seoConfig.siteUrl}${item.path}`,
        })),
      };

    default: {
      // ИСПРАВЛЕНИЕ: Оборачиваем в фигурные скобки, чтобы исправить ошибку no-case-declarations.
      const exhaustiveCheck: never = type;
      return exhaustiveCheck;
    }
  }
}