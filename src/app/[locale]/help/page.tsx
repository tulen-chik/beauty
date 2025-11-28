"use client"

import { useTranslations } from "next-intl"
import { ArrowLeft, Mail, Phone, Clock } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function HelpPage() {
  const t = useTranslations("pages.help")
  const tFooter = useTranslations("footer")
  const tCommon = useTranslations("common")

  // Определяем структуру FAQ
  const faqData = [
    {
      section: "general",
      items: [
        { q: "Как зарегистрироваться на платформе?", a: "Нажмите кнопку 'Регистрация' в правом верхнем углу страницы, заполните необходимые данные и подтвердите email." },
        { q: "Как забронировать услугу?", a: "Найдите нужную услугу через поиск, выберите удобное время, заполните форму бронирования и подтвердите запись." },
        { q: "Как отменить бронирование?", a: "Перейдите в раздел 'Мои записи' в вашем профиле, найдите нужную запись и нажмите 'Отменить'. Вы также можете связаться с салоном через чат." }
      ]
    },
    {
      section: "booking",
      items: [
        { q: "Можно ли перенести запись?", a: "Да, вы можете перенести запись, связавшись с салоном через встроенный чат на платформе." },
        { q: "Что делать, если я опоздал?", a: "Свяжитесь с салоном как можно скорее. В зависимости от политики салона, запись может быть перенесена или отменена." }
      ]
    },
    {
      section: "account",
      items: [
        { q: "Как изменить данные профиля?", a: "Перейдите в раздел 'Профиль', нажмите 'Настройки' и отредактируйте необходимые данные." },
        { q: "Как удалить аккаунт?", a: "Обратитесь в службу поддержки через форму обратной связи или напишите нам на email." }
      ]
    },
    {
      section: "technical",
      items: [
        { q: "Проблемы с загрузкой страницы", a: "Проверьте ваше интернет-соединение, очистите кэш браузера и попробуйте обновить страницу. Если проблема сохраняется, свяжитесь с поддержкой." },
        { q: "Не приходят уведомления", a: "Проверьте настройки уведомлений в вашем профиле и убедитесь, что они включены в настройках браузера." }
      ]
    }
  ]

  const [openSection, setOpenSection] = useState<string | null>(null)
  const [openItem, setOpenItem] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section)
    setOpenItem(null)
  }

  const toggleItem = (itemKey: string) => {
    setOpenItem(openItem === itemKey ? null : itemKey)
  }

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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t("title")}</h1>
          <p className="text-xl text-gray-600 mb-12">{t("subtitle")}</p>

          <div className="space-y-6 mb-12">
            {faqData.map((sectionData) => (
              <div key={sectionData.section} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection(sectionData.section)}
                  className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left flex items-center justify-between"
                >
                  <h2 className="text-xl font-semibold text-gray-900">
                    {t(`sections.${sectionData.section}.title`)}
                  </h2>
                  <span className="text-gray-500">
                    {openSection === sectionData.section ? "−" : "+"}
                  </span>
                </button>
                
                {openSection === sectionData.section && (
                  <div className="px-6 py-4 space-y-4">
                    {sectionData.items.map((item, index) => {
                      const itemKey = `${sectionData.section}-${index}`
                      return (
                        <div key={itemKey} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                          <button
                            onClick={() => toggleItem(itemKey)}
                            className="w-full text-left flex items-start justify-between gap-4"
                          >
                            <h3 className="font-medium text-gray-900 flex-1">
                              {t(`sections.${sectionData.section}.items.${index}.question`) || item.q}
                            </h3>
                            <span className="text-rose-600 shrink-0">
                              {openItem === itemKey ? "−" : "+"}
                            </span>
                          </button>
                          {openItem === itemKey && (
                            <p className="mt-2 text-gray-600 leading-relaxed">
                              {t(`sections.${sectionData.section}.items.${index}.answer`) || item.a}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 p-8 bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg border border-rose-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {t("contactSupport.title")}
            </h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              {t("contactSupport.description")}
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <p className="text-sm text-gray-600 font-medium">{t("contactSupport.email")}</p>
                  <a 
                    href={`mailto:${tFooter("emailValue")}`} 
                    className="text-rose-600 hover:underline"
                  >
                    {tFooter("emailValue")}
                  </a>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <p className="text-sm text-gray-600 font-medium">{t("contactSupport.phone")}</p>
                  <a 
                    href={`tel:${tFooter("phoneValue").replace(/\s/g, "").replace(/[()]/g, "")}`} 
                    className="text-rose-600 hover:underline"
                  >
                    {tFooter("phoneValue")}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-rose-600 shrink-0" />
                <p className="text-gray-600">{t("contactSupport.workingHours")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

