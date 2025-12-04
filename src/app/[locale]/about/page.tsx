"use client"

import { useTranslations } from "next-intl"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  const tCommon = useTranslations("common")

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-rose-600 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{tCommon("backToHome")}</span>
        </Link>

        <div className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">О компании</h1>
          </div>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Общие сведения</h2>
            <p className="text-gray-700 leading-relaxed">
              ИП Солдатенко Анастасия Дмитриевна оказывает услуги в сфере обработки данных и предоставления услуг по размещению информации.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Реквизиты организации</h2>
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <ul className="space-y-3">
                <li>
                  <strong>Полное юридическое наименование:</strong> ИП Солдатенко Анастасия Дмитриевна
                </li>
                <li>
                  <strong>Адрес по месту нахождения:</strong> 220112, г. Минск, ул. Янки Лучины, дом 70
                </li>
                <li>
                  <strong>УНП:</strong> 193911137
                </li>
                <li>
                  <strong>ОКВЭД:</strong> 63119 Прочая обработка данных, предоставление услуг по размещению информации и связанная с этим деятельность
                </li>
                <li>
                  <strong>Электронная почта:</strong> <a href="mailto:soldatenkonastasia@gmail.com" className="text-rose-600 hover:underline">soldatenkonastasia@gmail.com</a>
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Контакты</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              По всем вопросам, связанным с работой сервиса, вы можете обратиться к нам через электронную почту:
            </p>
            <div className="mt-6 p-6 bg-rose-50 rounded-lg border border-rose-100">
              <p className="text-gray-700 mb-2">
                Email: <a href="mailto:soldatenkonastasia@gmail.com" className="text-rose-600 hover:underline font-medium">soldatenkonastasia@gmail.com</a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}