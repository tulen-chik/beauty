"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Scissors, Building2, MapPin, Clock, ArrowLeft, Calendar, Images, CheckCircle, Map as MapIcon, MessageCircle, Star } from "lucide-react"
import { useTranslations } from "next-intl"

import { useSalonService } from "@/contexts/SalonServiceContext"
import { useSalon } from "@/contexts/SalonContext"
import { useSalonSchedule } from "@/contexts/SalonScheduleContext"
import { useUser } from "@/contexts/UserContext"
import { useChat } from "@/contexts/ChatContext"
import { useSalonRating } from "@/contexts"
import { SalonScheduleDisplay } from "@/components/SalonScheduleDisplay"
import ChatButton from "@/components/ChatButton"
import RatingDisplay from "@/components/RatingDisplay"

type Service = {
  id: string
  salonId: string
  name: string
  description?: string
  price: number
  durationMinutes: number
  isApp?: boolean
}

export default function ServicePublicPage() {
  const params = useParams() as { serviceId: string; locale: string }
  const router = useRouter()
  const { serviceId, locale } = params

  const { getService, getImages } = useSalonService()
  const { fetchSalon } = useSalon()
  const { getSchedule } = useSalonSchedule()
  const { getRatingStats } = useSalonRating()
  const { currentUser } = useUser()
  const { createOrGetChat } = useChat()
  const t = useTranslations('search')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [service, setService] = useState<Service | null>(null)
  const [images, setImages] = useState<Array<{ id: string; url: string; storagePath: string }>>([])
  const [salon, setSalon] = useState<any>(null)
  const [schedule, setSchedule] = useState<any>(null)
  const [ratingStats, setRatingStats] = useState<any>(null)
  const [currentSlide, setCurrentSlide] = useState(0)

  const coverUrl = useMemo(() => images[0]?.url || "/placeholder.svg", [images])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const raw = await getService(serviceId)
        if (!raw) {
          setError("Услуга не найдена")
          setLoading(false)
          return
        }
        const s: Service = { id: serviceId, ...(raw as any) }
        if (cancelled) return
        setService(s)

        try {
          const imgs = await getImages(serviceId)
          if (!cancelled) setImages(imgs || [])
        } catch (e) {
          // ИСПРАВЛЕНО: Добавлена обработка ошибки
          console.error("Не удалось загрузить изображения:", e)
        }

        if (s.salonId) {
          try {
            const salonData = await fetchSalon(s.salonId)
            if (!cancelled) setSalon(salonData)
          } catch (e) {
            // ИСПРАВЛЕНО: Добавлена обработка ошибки
            console.error("Не удалось загрузить данные салона:", e)
          }
          try {
            const sch = await getSchedule(s.salonId)
            if (!cancelled) setSchedule(sch)
          } catch (e) {
            // ИСПРАВЛЕНО: Добавлена обработка ошибки
            console.error("Не удалось загрузить расписание:", e)
          }
          
          try {
            const stats = await getRatingStats(s.salonId)
            if (!cancelled) setRatingStats(stats)
          } catch (e) {
            console.error("Не удалось загрузить рейтинги:", e)
          }
        }
      } catch (e: any) {
        setError(e?.message || "Ошибка загрузки")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [serviceId, getService, getImages, fetchSalon, getSchedule])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-600">Загрузка...</div>
      </div>
    )
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center max-w-md w-full">
          <div className="text-red-600 font-semibold mb-2">Ошибка</div>
          <div className="text-gray-700 mb-4">{error || "Услуга не найдена"}</div>
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
            {salon?.id && (
              <Link
                href={`/${locale}/s/${salon.id}`}
                className="text-rose-600 hover:text-rose-700 font-semibold"
              >
                Перейти в салон
              </Link>
            )}
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
            <div className="relative h-72 md:h-96 rounded-3xl overflow-hidden shadow-xl border border-gray-200">
              <Image src={coverUrl} alt={service.name} fill className="object-cover" />
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
                  <Scissors className="w-4 h-4" />
                  {t('servicesTitle')}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4 mb-3">{service.name}</h1>
                <div className="flex flex-wrap items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4" /><span className="font-medium">{service.durationMinutes} мин</span></div>
                  {typeof service.price === "number" && (
                    <div className="font-bold text-rose-600 text-lg">{service.price} ₽</div>
                  )}
                </div>
              </div>

              {service.description && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{t('description') || 'Описание'}</h3>
                  <p className="text-gray-700 leading-relaxed font-medium">{service.description}</p>
                </div>
              )}

              {images.length > 1 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Images className="w-5 h-5 text-rose-600" />
                    <h3 className="text-lg font-bold text-gray-900">{t('preview') || 'Галерея'}</h3>
                  </div>
                  
                  {/* Слайдер с адаптивными размерами */}
                  <div className="relative">
                    {/* Основное изображение - адаптивное по размеру */}
                    <div className="relative w-full aspect-video max-h-96 rounded-xl overflow-hidden border border-gray-200 mb-4 bg-gray-100">
                      <Image
                        src={images[currentSlide].url}
                        alt={`service image ${currentSlide + 1}`}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                      />
                    </div>

                    {/* Навигация */}
                    {images.length > 1 && (
                      <div className="flex items-center justify-center gap-4 mb-4">
                        <button
                          onClick={() => setCurrentSlide((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                          className="p-3 rounded-full bg-white border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
                          aria-label="Предыдущее изображение"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        
                        <div className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                          {currentSlide + 1} / {images.length}
                        </div>

                        <button
                          onClick={() => setCurrentSlide((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                          className="p-3 rounded-full bg-white border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
                          aria-label="Следующее изображение"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {/* Миниатюры с адаптивными размерами */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                      {images.map((img, index) => (
                        <button
                          key={img.id}
                          onClick={() => setCurrentSlide(index)}
                          className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                            index === currentSlide
                              ? 'border-rose-600 ring-2 ring-rose-100 scale-105'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Image
                            src={img.url}
                            alt={`thumbnail ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 20vw, (max-width: 768px) 15vw, 10vw"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {schedule && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{t('mapTitle')}</h3>
                  <SalonScheduleDisplay schedule={schedule} />
                  <div className="mt-3 text-xs text-gray-600 flex items-center gap-2">
                    <CheckCircle className="w-3 h-3" />
                    <span>{t('loadingMap')}</span>
                  </div>
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
              <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-rose-600 rounded-xl">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Салон</div>
                    <div className="text-base font-semibold text-gray-900">{salon?.name || "Салон"}</div>
                  </div>
                </div>
                {salon?.address && (
                  <div className="flex items-start gap-2 text-gray-700 mb-3">
                    <MapPin className="w-4 h-4 mt-0.5 text-gray-500" />
                    <span className="text-sm font-medium">{salon.address}</span>
                  </div>
                )}
                
                {ratingStats && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-700">Рейтинг салона</span>
                    </div>
                    <RatingDisplay rating={ratingStats.averageRating} showValue size="sm" />
                    <div className="text-xs text-gray-500 mt-1">
                      {ratingStats.totalRatings} отзывов
                    </div>
                  </div>
                )}
                {/* show only booking button when service.isApp === true,
                    only chat button when service.isApp === false.
                    if isApp is undefined (legacy), show both */}
                <div className="grid grid-cols-1 gap-3">
                  <Link
                    href={`/${locale}/s/${salon?.id || service.salonId}`}
                    className="w-full py-3 px-4 text-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium transition-colors duration-200"
                  >
                    {t('aboutSalon')}
                  </Link>

                  {service?.isApp === true && (
                    <Link
                      href={`/${locale}/book/${service.id}`}
                      className="w-full py-3 px-4 text-center rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors duration-200"
                    >
                      {t('book')}
                    </Link>
                  )}

                  {service?.isApp === false && currentUser && salon && (
                    <ChatButton
                      salonId={salon.id}
                      customerUserId={currentUser.userId}
                      customerName={currentUser.displayName}
                      serviceId={service.id}
                      className="w-full py-3 px-4 text-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium transition-colors duration-200"
                      variant="button"
                    />
                  )}

                  {/* legacy: if isApp is undefined, show both options */}
                  {service?.isApp === undefined && (
                    <>
                      {currentUser && salon && (
                        <ChatButton
                          salonId={salon.id}
                          customerUserId={currentUser.userId}
                          customerName={currentUser.displayName}
                          serviceId={service.id}
                          className="w-full py-3 px-4 text-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium transition-colors duration-200"
                          variant="button"
                        />
                      )}
                      <Link
                        href={`/${locale}/book/${service.id}`}
                        className="w-full py-3 px-4 text-center rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors duration-200"
                      >
                        {t('book')}
                      </Link>
                    </>
                  )}
                </div>

                <div className="mt-4 text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{t('tryDifferent')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}