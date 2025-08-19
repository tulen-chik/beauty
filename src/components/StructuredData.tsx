'use client'

import { useEffect } from 'react'
import { generateStructuredData } from '@/lib/seo'

interface StructuredDataProps {
  type: 'WebSite' | 'Organization' | 'LocalBusiness' | 'Service'
  data: Record<string, any>
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  useEffect(() => {
    // Удаляем существующие structured data
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]')
    existingScripts.forEach(script => script.remove())

    // Генерируем structured data используя централизованную конфигурацию
    const structuredData = generateStructuredData(type, data)

    // Создаем и добавляем script тег
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(structuredData)
    document.head.appendChild(script)

    // Cleanup при размонтировании
    return () => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]')
      scripts.forEach(script => script.remove())
    }
  }, [type, data])

  return null
}
