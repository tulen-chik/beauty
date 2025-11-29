"use client"

import { motion, AnimatePresence as FramerAnimatePresence } from "framer-motion"
import { 
  ArrowLeft, 
  Building2, 
  Calendar, 
  Clock, 
  Map as MapIcon, 
  MapPin, 
  Phone, 
  Scissors, 
  Star, 
  ChevronDown, 
  ChevronUp, 
  User, 
  MessageCircle, 
  Quote 
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

import RatingStats from "@/components/RatingStats"
import RatingDisplay from "@/components/RatingDisplay"
import RatingAttachment from "@/components/Rating/RatingAttachment"

import { useSalonRating } from "@/contexts"
import { useSalon } from "@/contexts/SalonContext"
import { useSalonSchedule } from "@/contexts/SalonScheduleContext"
import { useSalonService } from "@/contexts/SalonServiceContext"
import { Salon, SalonSchedule, SalonWorkDay } from "@/types/salon"
import { SalonService } from "@/types/services"
import type { SalonRating, SalonRatingResponse } from "@/types/database"

// --- FIX: Приведение типа для AnimatePresence, чтобы исправить ошибку TypeScript ---
const AnimatePresence = FramerAnimatePresence as any;

// --- ТИПЫ ---
type ReviewWithResponse = SalonRating & {
  response?: SalonRatingResponse | null
}

// --- ЛОКАЛЬНЫЕ SKELETONS ---
const MainSkeleton = () => (
  <div className="min-h-screen bg-white animate-pulse">
    <div className="h-16 bg-gray-50 border-b border-gray-200 mb-8" />
    <div className="container mx-auto px-4">
      <div className="max-w-5xl mx-auto">
        <div className="h-64 md:h-80 rounded-3xl bg-gray-200 mb-10" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-8 w-48 bg-gray-200 rounded-full" />
            <div className="h-12 w-3/4 bg-gray-200 rounded-lg" />
            <div className="h-40 bg-gray-200 rounded-2xl" />
          </div>
          <div className="lg:col-span-1">
            <div className="h-64 bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  </div>
)

const ServicesSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="border border-gray-200 rounded-xl p-4 flex gap-3">
        <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-gray-200 rounded" />
          <div className="h-3 w-1/2 bg-gray-200 rounded" />
        </div>
      </div>
    ))}
  </div>
)

const ReviewsSkeleton = () => (
  <div className="space-y-4 animate-pulse mt-4">
    {[1, 2].map(i => (
      <div key={i} className="flex gap-4">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 bg-gray-200 rounded" />
          <div className="h-4 w-full bg-gray-200 rounded" />
        </div>
      </div>
    ))}
  </div>
)

// --- КОМПОНЕНТ ОТЗЫВА ---
const ReviewItem = ({ review }: { review: ReviewWithResponse }) => {
  console.log('Review attachments:', review.attachments);
  
  // ВРЕМЕННО: Добавляем тестовые вложения для проверки
  const testAttachments = review.attachments || [
    {
      url: 'https://picsum.photos/200/150',
      filename: 'test-image.jpg',
      type: 'image/jpeg',
      size: 12345
    }
  ];
  
  return (
    <div className="border-b border-gray-100 last:border-0 py-6 first:pt-2">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 border border-gray-200">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">
              {review.isAnonymous ? 'Анонимный пользователь' : review.customerName}
            </div>
            <div className="text-sm text-gray-500">
              {new Date(review.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        <RatingDisplay rating={review.rating} size="sm" />
      </div>

      <p className="text-gray-700 text-sm leading-relaxed pl-[52px]">{review.review}</p>

      {/* Вложения */}
      {/* {testAttachments && testAttachments.length > 0 && (
        <div className="mt-3 pl-[52px] space-y-2">
          <p className="text-xs text-gray-500 mb-2">Вложения ({testAttachments.length}):</p>
          {testAttachments.map((attachment, index) => (
            <RatingAttachment
              key={index}
              attachment={attachment}
              isOwnRating={false}
            />
          ))}
        </div>
      )} */}

      {review.response && (
        <div className="mt-4 ml-[52px] border-l-2 border-rose-200 bg-rose-50/50 rounded-r-lg p-3">
          <div className="flex items-center gap-2 mb-1 text-rose-700 font-semibold text-xs uppercase tracking-wide">
            <MessageCircle className="w-3 h-3" />
            <span>Ответ салона</span>
          </div>
          <p className="text-gray-600 text-sm italic">
            "{review.response.responseText}"
          </p>
          <div className="text-[10px] text-gray-400 mt-1 text-right">
            {review.response.respondedBy}, {new Date(review.response.createdAt).toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  )
}

export default function SalonPublicPage() {
  const params = useParams() as { salonId: string; locale: string }
  const router = useRouter()
  const { salonId, locale } = params

  const { fetchSalon } = useSalon()
  const { getSchedule } = useSalonSchedule()
  const { getServicesBySalon, getImages } = useSalonService()
  const { getRatingStats, getRatingsBySalon, getResponsesByRating } = useSalonRating()
  const t = useTranslations('search')

  // --- СОСТОЯНИЯ ЗАГРУЗКИ ---
  const [isSalonLoading, setIsSalonLoading] = useState(true)
  const [isServicesLoading, setIsServicesLoading] = useState(true)
  const [isScheduleLoading, setIsScheduleLoading] = useState(true)
  const [isRatingsLoading, setIsRatingsLoading] = useState(true)
  const [isReviewsListLoading, setIsReviewsListLoading] = useState(false)
  
  const [error, setError] = useState<string | null>(null)

  // --- ДАННЫЕ ---
  const [salon, setSalon] = useState<Salon | null>(null)
  const [schedule, setSchedule] = useState<SalonSchedule | null>(null)
  const [services, setServices] = useState<SalonService[]>([])
  const [serviceImages, setServiceImages] = useState<Record<string, string>>({})
  const [ratingStats, setRatingStats] = useState<any>(null)
  const [reviews, setReviews] = useState<ReviewWithResponse[]>([])

  // --- UI STATE ---
  const [showReviews, setShowReviews] = useState(false)
  const [reviewsLoaded, setReviewsLoaded] = useState(false)

  // 1. Загрузка Салона (Критический путь)
  useEffect(() => {
    let cancelled = false
    const loadSalon = async () => {
      try {
        setIsSalonLoading(true)
        const data = await fetchSalon(salonId)
        if (!data) throw new Error("Салон не найден")
        if (!cancelled) setSalon(data)
      } catch (e: any) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setIsSalonLoading(false)
      }
    }
    loadSalon()
    return () => { cancelled = true }
  }, [salonId, fetchSalon])

  // 2. Загрузка Услуг
  useEffect(() => {
    let cancelled = false
    const loadServices = async () => {
      try {
        setIsServicesLoading(true)
        const list = await getServicesBySalon(salonId)
        if (!cancelled) setServices(list)

        // Грузим картинки параллельно
        const imagesMap: Record<string, string> = {}
        await Promise.all(list.map(async (svc) => {
          try {
            const imgs = await getImages(svc.id)
            if (imgs && imgs[0]) imagesMap[svc.id] = imgs[0].url
          } catch (e) { console.error(e) }
        }))
        if (!cancelled) setServiceImages(imagesMap)
      } catch (e) {
        console.error(e)
      } finally {
        if (!cancelled) setIsServicesLoading(false)
      }
    }
    loadServices()
    return () => { cancelled = true }
  }, [salonId, getServicesBySalon, getImages])

  // 3. Загрузка Расписания и Статистики Рейтинга
  useEffect(() => {
    let cancelled = false
    const loadExtras = async () => {
      try {
        setIsScheduleLoading(true)
        setIsRatingsLoading(true)
        
        const [sch, stats] = await Promise.all([
          getSchedule(salonId).catch(() => null),
          getRatingStats(salonId).catch(() => null)
        ])

        if (!cancelled) {
          setSchedule(sch)
          setRatingStats(stats)
        }
      } finally {
        if (!cancelled) {
          setIsScheduleLoading(false)
          setIsRatingsLoading(false)
        }
      }
    }
    loadExtras()
    return () => { cancelled = true }
  }, [salonId, getSchedule, getRatingStats])

  // 4. Функция загрузки детальных отзывов (по требованию)
  const loadReviews = async () => {
    if (reviewsLoaded || isReviewsListLoading) return
    
    setIsReviewsListLoading(true)
    try {
      const allRatings = await getRatingsBySalon(salonId)
      // Показываем только одобренные
      const approvedRatings = allRatings.filter(r => r.status === 'approved')

      // Подгружаем ответы
      const reviewsWithResponses = await Promise.all(
        approvedRatings.map(async (rating) => {
          const responses = await getResponsesByRating(rating.id)
          return {
            ...rating,
            response: responses.length > 0 ? responses[0] : null
          }
        })
      )
      setReviews(reviewsWithResponses)
      setReviewsLoaded(true)
    } catch (e) {
      console.error("Ошибка загрузки отзывов:", e)
    } finally {
      setIsReviewsListLoading(false)
    }
  }

  const toggleReviews = () => {
    if (!showReviews && !reviewsLoaded) {
      loadReviews()
    }
    setShowReviews(!showReviews)
  }

  // --- RENDER ---

  if (isSalonLoading) return <MainSkeleton />

  if (error || !salon) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center max-w-md w-full">
          <div className="text-red-600 font-semibold mb-2">Ошибка</div>
          <div className="text-gray-700 mb-4">{error || "Салон не найден"}</div>
          <button onClick={() => router.back()} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium">Назад</button>
        </div>
      </div>
    )
  }

  // Приоритет: Аватар салона -> Изображение первой услуги -> null (плейсхолдер)
  const heroImageUrl = salon.avatarUrl || (services.length > 0 ? serviceImages[services[0].id] : null);

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
            <div className="relative h-64 md:h-80 rounded-3xl overflow-hidden shadow-xl border border-gray-200 bg-gray-100">
              {heroImageUrl ? (
                <Image src={heroImageUrl} alt={salon.name || "salon"} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <Building2 className="w-16 h-16 mb-4" strokeWidth={1} />
                  <span className="font-medium text-lg">Фотография салона отсутствует</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-6 md:py-10 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Header Info */}
              <div>
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

              {/* Services Section */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Scissors className="w-5 h-5 text-rose-600" />
                  <h3 className="text-lg font-bold text-gray-900">Услуги</h3>
                </div>
                
                {isServicesLoading ? (
                  <ServicesSkeleton />
                ) : services.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map((svc) => (
                      <div key={svc.id} className="group border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-300 bg-white">
                        <div className="flex gap-3">
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                            {serviceImages[svc.id] ? (
                              <Image src={serviceImages[svc.id]} alt={svc.name} fill className="object-cover" />
                            ) : (
                              <Scissors className="w-8 h-8 text-gray-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link href={`/${locale}/services/${svc.id}`} className="text-base font-semibold text-gray-900 group-hover:text-rose-600 line-clamp-2">
                              {svc.name}
                            </Link>
                            <div className="mt-2 flex items-center gap-3 text-sm text-gray-600">
                              <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{svc.durationMinutes} мин</div>
                              <div className="font-semibold text-rose-600">{svc.price} Br</div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <Link href={`/${locale}/services/${svc.id}`} className="flex-1 py-1.5 text-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm font-medium">Подробнее</Link>
                          <Link href={`/${locale}/book/${svc.id}`} className="flex-1 py-1.5 text-center rounded-lg bg-rose-600 text-white hover:bg-rose-700 text-sm font-semibold">Записаться</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">Услуги не найдены</div>
                )}
              </div>

              {/* Schedule Section */}
              {!isScheduleLoading && schedule && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-rose-600" />
                    <h3 className="text-lg font-bold text-gray-900">{t('mapTitle')}</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    {schedule.weeklySchedule.map((day: SalonWorkDay) => (
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
                </div>
              )}

              {/* Ratings Section */}
              {!isRatingsLoading && ratingStats && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-rose-600" />
                      <h3 className="text-lg font-bold text-gray-900">Отзывы и рейтинги</h3>
                    </div>
                    <div className="text-sm text-gray-500 font-medium">
                      {ratingStats.totalRatings} оценок
                    </div>
                  </div>
                  
                  <RatingStats stats={ratingStats} />

                  {/* Expandable Reviews List */}
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <button 
                      onClick={toggleReviews}
                      className="w-full flex items-center justify-center gap-2 py-3 text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-medium"
                    >
                      {showReviews ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Скрыть отзывы
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Показать отзывы клиентов
                        </>
                      )}
                    </button>

                    <AnimatePresence>
                      {showReviews && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          {isReviewsListLoading ? (
                            <ReviewsSkeleton />
                          ) : reviews.length > 0 ? (
                            <div className="mt-4 space-y-2">
                              {reviews.map((review) => (
                                <ReviewItem key={review.id} review={review} />
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl mt-4">
                              <Quote className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                              <p>Отзывов с текстом пока нет</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Map Section */}
              {salon.coordinates && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
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
                        `${salon.coordinates.lat},${salon.coordinates.lng}`
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