"use client"

import { useTranslations } from "next-intl"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function TermsPage() {
  const t = useTranslations("pages.terms")
  const tCommon = useTranslations("common")

  const sections = [
    "acceptance",
    "userAccount",
    "useOfService",
    "booking",
    "prohibited",
    "liability",
    "modifications"
  ]

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
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{t("title")}</h1>
            <p className="text-sm text-gray-500">
              {t("lastUpdated")}: {new Date().toLocaleDateString("ru-RU", { 
                year: "numeric", 
                month: "long", 
                day: "numeric" 
              })}
            </p>
          </div>

          <div className="mb-8">
            <p className="text-gray-700 leading-relaxed">{t("introduction")}</p>
          </div>

          <div className="space-y-8">
            {sections.map((section) => (
              <div key={section} className="border-b border-gray-200 pb-8 last:border-0">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {t(`sections.${section}.title`)}
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  {t(`sections.${section}.content`)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-rose-50 rounded-lg border border-rose-100">
            <p className="text-gray-700 mb-4 font-medium">{t("contact")}</p>
            <div className="space-y-2 text-gray-600">
              <p>
                Email: <a href="mailto:info@charming.by" className="text-rose-600 hover:underline">info@charming.by</a>
              </p>
              <p>
                Телефон: <a href="tel:+375291234567" className="text-rose-600 hover:underline">+375 (29) 123-45-67</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

