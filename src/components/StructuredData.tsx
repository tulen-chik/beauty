'use client'

import { useEffect } from 'react'
import { generateStructuredData } from '@/lib/seo'
// Вам все еще нужны эти типы для определения пропсов
import type {
  WebSiteSchema,
  OrganizationSchema,
  LocalBusinessSchema,
  ServiceSchema,
} from '@/types/seo'

// Эта карта типов остается здесь, в компоненте, так как она нужна для создания
// правильного типа пропсов.
type StructuredDataMap = {
  'WebSite': Partial<Omit<WebSiteSchema, '@type' | '@context'>>;
  'Organization': Partial<Omit<OrganizationSchema, '@type' | '@context'>>;
  'BeautySalon': Omit<LocalBusinessSchema, '@type' | '@context'>;
  'HairSalon': Omit<LocalBusinessSchema, '@type' | '@context'>;
  'NailSalon': Omit<LocalBusinessSchema, '@type' | '@context'>;
  'DaySpa': Omit<LocalBusinessSchema, '@type' | '@context'>;
  'Service': Omit<ServiceSchema, '@type' | '@context'>;
  'BreadcrumbList': { items: { name: string; path: string }[] };
}

// Тип для пропсов, который связывает 'type' и 'data'. Он остается без изменений.
type StructuredDataProps = {
  [K in keyof StructuredDataMap]: {
    type: K;
    data: StructuredDataMap[K];
  }
}[keyof StructuredDataMap];


export default function StructuredData({ type, data }: StructuredDataProps) {
  useEffect(() => {
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]')
    existingScripts.forEach(script => script.remove())

    // ИСПРАВЛЕНИЕ: Используем switch для сужения типов перед вызовом.
    // Это позволяет TypeScript выбрать правильную перегрузку функции.
    let structuredData;

    switch (type) {
      case 'WebSite':
        // Внутри этого блока type === 'WebSite', и data имеет правильный тип.
        structuredData = generateStructuredData(type, data);
        break;

      case 'Organization':
        structuredData = generateStructuredData(type, data);
        break;

      // Для этих типов используется одна и та же перегрузка.
      case 'BeautySalon':
      case 'HairSalon':
      case 'NailSalon':
      case 'DaySpa':
        structuredData = generateStructuredData(type, data);
        break;

      case 'Service':
        structuredData = generateStructuredData(type, data);
        break;

      case 'BreadcrumbList':
        structuredData = generateStructuredData(type, data);
        break;
    }

    // Если structuredData была успешно сгенерирована, добавляем ее на страницу.
    if (structuredData) {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.text = JSON.stringify(structuredData)
      document.head.appendChild(script)

      // Функция очистки, которая удалит именно этот скрипт.
      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script)
        }
      }
    }
  }, [type, data])

  return null
}