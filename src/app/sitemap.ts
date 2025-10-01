import { MetadataRoute } from 'next'

import { locales } from '@/i18n.config'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://beauty-platform.com'
  
  // Основные страницы
  const routes = [
    '',
    '/search',
    '/blog',
    '/login',
    '/register',
  ]

  // Генерируем sitemap для всех локалей
  const sitemap: MetadataRoute.Sitemap = []

  locales.forEach((locale) => {
    routes.forEach((route) => {
      sitemap.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: route === '' ? 1 : 0.8,
      })
    })
  })

  // Добавляем статические страницы
  sitemap.push(
    {
      url: `${baseUrl}/sitemap.xml`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/robots.txt`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    }
  )

  return sitemap
}
