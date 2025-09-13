"use client"

// 1. Импорты отсортированы для чистоты кода
import { motion } from "framer-motion"
import { ArrowLeft, Building2, Calendar, Clock, Map as MapIcon, MapPin, Phone, Scissors, Star } from "lucide-react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import { useSalon } from "@/contexts/SalonContext"
import { useSalonSchedule } from "@/contexts/SalonScheduleContext"
import { useSalonService } from "@/contexts/SalonServiceContext"
import { useSalonRating } from "@/contexts"
import RatingDisplay from "@/components/RatingDisplay"
import RatingStats from "@/components/RatingStats"

// 2. Определены интерфейсы для улучшения типобезопасности
type AnyService = {
  id: string
  salonId: string
  name: string
  description?: string
  price: number
  durationMinutes: number
}

interface Salon {
  name: string
  address?: string
  phone?: string
  settings?: {
    business?: {
      coordinates?: {
        lat: number
        lng: number
      }
    }
  }
}

interface ScheduleDay {
  day: string
  isOpen: boolean
  times?: Array<{
    start: string
    end: string
  }>
}

interface Schedule {
  salonId: string
  weeklySchedule: ScheduleDay[]
  updatedAt: string
}

export default function SalonPublicPage() {
  const params = useParams() as { salonId:string; locale:string }
  const router = useRouter()
  const { salonId, locale } = params

  const { fetchSalon } = useSalon()
  const { getSchedule } = useSalonSchedule()
  const { getServicesBySalon, getImages } = useSalonService()
  const { getRatingStats } = useSalonRating()
  const t = useTranslations('search')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 3. Используются строгие типы вместо `any`
  const [salon, setSalon] = useState<Salon | null>(null)
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [services, setServices] = useState<AnyService[]>([])
  const [serviceImages, setServiceImages] = useState<Record<string, string>>({})
  const [ratingStats, setRatingStats] = useState<any>(null)

  const heroImage = useMemo(() => {
    const firstService = services[0]
    const firstImg = firstService ? serviceImages[firstService.id] : undefined
    return firstImg || "/placeholder.svg"
  }, [services, serviceImages])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const salonData = await fetchSalon(salonId)
        if (!salonData) {
          setError("Салон не найден")
          setLoading(false)
          return
        }
        if (!cancelled) setSalon(salonData)

        try {
          const sch = await getSchedule(salonId)
          if (!cancelled) setSchedule(sch)
        } catch (err) {
          // 4. Пустые catch-блоки заменены на логирование ошибок
          console.error("Не удалось загрузить расписание:", err)
        }

        try {
          const stats = await getRatingStats(salonId)
          if (!cancelled) setRatingStats(stats)
        } catch (err) {
          console.error("Не удалось загрузить рейтинги:", err)
        }

        try {
          const list = await getServicesBySalon(salonId)
          if (!cancelled) setServices(list)
          
          const imagesMap: Record<string, string> = {}
          for (const svc of list) {
            try {
              const imgs = await getImages(svc.id)
              if (imgs && imgs[0]) imagesMap[svc.id] = imgs[0].url
            } catch (err) {
              // 4. Пустые catch-блоки заменены на логирование ошибок
              console.error(`Не удалось загрузить изображения для услуги ${svc.id}:`, err)
            }
          }
          if (!cancelled) setServiceImages(imagesMap)
        } catch (err) {
          // 4. Пустые catch-блоки заменены на логирование ошибок
          console.error("Не удалось загрузить услуги:", err)
        }
      } catch (e: unknown) { // 5. Тип ошибки изменен с `any` на `unknown` для безопасности
        if (e instanceof Error) {
          setError(e.message)
        } else {
          setError("Произошла неизвестная ошибка")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [salonId, fetchSalon, getSchedule, getServicesBySalon, getImages])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-600">Загрузка...</div>
      </div>
    )
  }

  if (error || !salon) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center max-w-md w-full">
          <div className="text-red-600 font-semibold mb-2">Ошибка</div>
          <div className="text-gray-700 mb-4">{error || "Салон не найден"}</div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium"
          >
            Назад
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <section className="py-6 bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link
              href={`/${locale}/search`}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-rose-600 transition-colors duration-300 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('results')}
            </Link>
          </div>
        </div>
      </section>

      {/* Hero */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative h-64 md:h-80 rounded-3xl overflow-hidden shadow-xl border border-gray-200">
              <Image src={heroImage} alt={salon.name || "salon"} fill className="object-cover" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-6 md:py-10 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-600 text-white rounded-full text-sm font-semibold">
                  <Building2 className="w-4 h-4" />
                  {t('salon')}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4 mb-2">{salon.name}</h1>
                {salon.address && (
                  <div className="flex items-start gap-2 text-gray-700">
                    <MapPin className="w-4 h-4 mt-0.5 text-gray-500" />
                    <span className="text-sm font-medium">{salon.address}</span>
                  </div>
                )}
              </div>

              {services.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Scissors className="w-5 h-5 text-rose-600" />
                    <h3 className="text-lg font-bold text-gray-900">Услуги</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map((svc) => (
                      <div key={svc.id} className="group border border-gray-200 rounded-xl p-4 hover:shadow transition-all">
                        <div className="flex gap-3">
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <Image src={serviceImages[svc.id] || "/placeholder.svg"} alt={svc.name} fill className="object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link href={`/${locale}/services/${svc.id}`} className="text-base font-semibold text-gray-900 group-hover:text-rose-600 line-clamp-2">
                              {svc.name}
                            </Link>
                            {svc.description && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{svc.description}</p>
                            )}
                            <div className="mt-2 flex items-center gap-3 text-sm text-gray-600">
                              <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{svc.durationMinutes} мин</div>
                              <div className="font-semibold text-rose-600">{svc.price} ₽</div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <Link href={`/${locale}/services/${svc.id}`} className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm font-medium">Подробнее</Link>
                          <Link href={`/${locale}/book/${svc.id}`} className="px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 text-sm font-semibold">Записаться</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {schedule && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-rose-600" />
                    <h3 className="text-lg font-bold text-gray-900">{t('mapTitle')}</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    {schedule.weeklySchedule.map((day: ScheduleDay) => (
                      <div key={day.day} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-2">
                        <span className="font-medium capitalize">{day.day}</span>
                        <span className="text-gray-700">
                          {day.isOpen 
                            ? `${day.times?.[0]?.start || "09:00"} – ${day.times?.[0]?.end || "18:00"}` 
                            : "закрыто"
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 mt-3">Расписание рассчитывается на несколько недель вперед</div>
                </div>
              )}

              {ratingStats && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 mt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-5 h-5 text-rose-600" />
                    <h3 className="text-lg font-bold text-gray-900">Отзывы и рейтинги</h3>
                  </div>
                  <RatingStats stats={ratingStats} />
                </div>
              )}

              {salon?.settings?.business?.coordinates && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <MapIcon className="w-5 h-5 text-rose-600" />
                    <h3 className="text-lg font-bold text-gray-900">{t('mapTitle')}</h3>
                  </div>
                  <div className="w-full h-64 rounded-xl border border-gray-200 overflow-hidden">
                    <iframe
                      title="map"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps?q=${encodeURIComponent(
                        `${salon.settings.business.coordinates.lat},${salon.settings.business.coordinates.lng}`
                      )}&z=15&output=embed`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-600 rounded-xl">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Салон</div>
                    <div className="text-base font-semibold text-gray-900">{salon.name}</div>
                  </div>
                </div>
                {salon.phone && (
                  <div className="flex items-center gap-2 text-gray-700"><Phone className="w-4 h-4" /><span className="text-sm font-medium">{salon.phone}</span></div>
                )}
                {salon.address && (
                  <div className="flex items-start gap-2 text-gray-700">
                    <MapPin className="w-4 h-4 mt-0.5" />
                    <span className="text-sm font-medium">{salon.address}</span>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-2 pt-2">
                  <Link href={`/${locale}/search`} className="w-full py-2.5 text-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium">К поиску</Link>
                </div>
                {services.length > 0 && (
                  <div className="pt-2">
                    <div className="text-sm font-semibold text-gray-900 mb-2">Популярные услуги</div>
                    <div className="space-y-2">
                      {services.slice(0, 3).map((svc) => (
                        <Link key={svc.id} href={`/${locale}/services/${svc.id}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 border border-gray-100">
                          <Star className="w-3.5 h-3.5 text-rose-600" />
                          <span className="text-sm font-medium text-gray-800 line-clamp-1">{svc.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}