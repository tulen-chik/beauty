"use client"

import { useTranslations } from "next-intl"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  const t = useTranslations("pages.about")
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

        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t("title")}</h1>
          <p className="text-xl text-gray-600 mb-8">{t("subtitle")}</p>
          
          <div className="mb-12">
            <p className="text-gray-700 leading-relaxed mb-6">{t("description")}</p>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t("mission.title")}</h2>
            <p className="text-gray-700 leading-relaxed">{t("mission.description")}</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t("values.title")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[0, 1, 2].map((index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-100">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {t(`values.items.${index}.title`)}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {t(`values.items.${index}.description`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

