"use client"

import { motion } from "framer-motion"
import { 
  ArrowLeft, 
  Building2, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Images, 
  Map as MapIcon, 
  MapPin, 
  MessageCircle, 
  Quote, 
  Scissors, 
  Star, 
  User 
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

import ChatButton from "@/components/ChatButton"
import RatingDisplay from "@/components/RatingDisplay"
import RatingAttachment from "@/components/Rating/RatingAttachment"
import { SalonScheduleDisplay } from "@/components/SalonScheduleDisplay"
import ImageCarouselModal from "./components/ImageCarouselModal"

import { useSalonRating } from "@/contexts"
import { useChat } from "@/contexts/ChatContext"
import { useSalon } from "@/contexts/SalonContext"
import { useSalonSchedule } from "@/contexts/SalonScheduleContext"
import { useSalonService } from "@/contexts/SalonServiceContext"
import { useUser } from "@/contexts/UserContext"
import type { SalonRating, SalonRatingResponse } from "@/types/database"

// --- ТИПЫ ---
type Service = {
  id: string
  salonId: string
  name: string
  description?: string
  price: number
  durationMinutes: number
  isApp?: boolean
}

type ReviewWithResponse = SalonRating & {
  response?: SalonRatingResponse | null
}

// --- ЛОКАЛЬНЫЕ КОМПОНЕНТЫ SKELETON ---

// Скелет для галереи/героя
const HeroSkeleton = () => (
  <div className="w-full h-72 md:h-96 rounded-3xl bg-gray-200 animate-pulse border border-gray-200" />
);

// Скелет для карточки салона (сайдбар)
const SalonCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 animate-pulse sticky top-6">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/4 bg-gray-200 rounded"></div>
        <div className="h-5 w-1/2 bg-gray-200 rounded"></div>
      </div>
    </div>
    <div className="h-5 w-3/4 bg-gray-200 rounded"></div>
    <div className="h-12 w-full bg-gray-200 rounded-lg mt-4"></div>
    <div className="h-12 w-full bg-gray-200 rounded-lg"></div>
  </div>
);

// Скелет для отзывов
const ReviewsSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    {[1, 2].map(i => (
      <div key={i} className="flex gap-4">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex justify-between">
            <div className="h-4 w-1/3 bg-gray-200 rounded" />
            <div className="h-4 w-20 bg-gray-200 rounded" />
          </div>
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-2/3 bg-gray-200 rounded" />
        </div>
      </div>
    ))}
  </div>
);

// Скелет для карты/расписания
const InfoBlockSkeleton = () => (
  <div className="bg-white rounded-3xl border border-gray-200 p-6 h-64 animate-pulse">
    <div className="h-6 w-1/3 bg-gray-200 rounded mb-4"></div>
    <div className="space-y-2">
      <div className="h-4 w-full bg-gray-200 rounded"></div>
      <div className="h-4 w-full bg-gray-200 rounded"></div>
      <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
    </div>
  </div>
);

// --- КОМПОНЕНТ ОТЗЫВА ---
const ReviewItem = ({ review }: { review: ReviewWithResponse }) => {
  return (
    <div className="border-b border-gray-100 last:border-0 py-6">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">{review.customerName || "Гость"}</div>
            <div className="text-xs text-gray-500">
              {new Date(review.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        <div className="flex bg-yellow-50 px-2 py-1 rounded-lg">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
            />
          ))}
        </div>
      </div>

      <p className="text-gray-700 mt-3 leading-relaxed">{review.review}</p>

      {/* Вложения */}
      {review.attachments && review.attachments.length > 0 && (
        <div className="mt-3 space-y-2">
          {review.attachments.map((attachment, index) => (
            <RatingAttachment
              key={index}
              attachment={attachment}
              isOwnRating={false}
            />
          ))}
        </div>
      )}

      {review.response && (
        <div className="mt-4 ml-4 pl-4 border-l-2 border-rose-200 bg-rose-50/50 rounded-r-lg p-4">
          <div className="flex items-center gap-2 mb-2 text-rose-700 font-semibold text-sm">
            <MessageCircle className="w-4 h-4" />
            <span>Ответ салона ({review.response.respondedBy})</span>
          </div>
          <p className="text-gray-600 text-sm italic">
            "{review.response.responseText}"
          </p>
          <div className="text-xs text-gray-400 mt-2">
            {new Date(review.response.createdAt).toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ServicePublicPage() {
  const params = useParams() as { serviceId: string; locale: string }
  const router = useRouter()
  const { serviceId, locale } = params

  const { getService, getImages } = useSalonService()
  const { fetchSalon } = useSalon()
  const { getSchedule } = useSalonSchedule()
  const { getRatingStats, getRatingsBySalon, getResponsesByRating } = useSalonRating()
  const { currentUser } = useUser()
  const t = useTranslations('search')

  // --- СОСТОЯНИЯ ЗАГРУЗКИ ---
  const [serviceLoading, setServiceLoading] = useState(true)
  const [imagesLoading, setImagesLoading] = useState(true)
  const [salonLoading, setSalonLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // --- ДАННЫЕ ---
  const [service, setService] = useState<Service | null>(null)
  const [images, setImages] = useState<Array<{ id: string; url: string; storagePath: string }>>([])
  const [salon, setSalon] = useState<any>(null)
  const [schedule, setSchedule] = useState<any>(null)
  const [ratingStats, setRatingStats] = useState<any>(null)
  const [reviews, setReviews] = useState<ReviewWithResponse[]>([])

  const [currentSlide, setCurrentSlide] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 1. Загрузка основной информации об услуге (Критический путь)
  useEffect(() => {
    let cancelled = false
    const loadService = async () => {
      try {
        setServiceLoading(true)
        const raw = await getService(serviceId)
        if (!raw) {
          setError("Услуга не найдена")
          return
        }
        if (!cancelled) {
          setService({ id: serviceId, ...(raw as any) })
        }
      } catch (e: any) {
        setError(e?.message || "Ошибка загрузки")
      } finally {
        if (!cancelled) setServiceLoading(false)
      }
    }
    loadService()
    return () => { cancelled = true }
  }, [serviceId, getService])

  // 2. Загрузка изображений (Зависит от serviceId, но не блокирует UI)
  useEffect(() => {
    let cancelled = false
    const loadImages = async () => {
      try {
        setImagesLoading(true)
        const imgs = await getImages(serviceId)
        if (!cancelled) setImages(imgs || [])
      } catch (e) {
        console.error("Ошибка загрузки изображений:", e)
      } finally {
        if (!cancelled) setImagesLoading(false)
      }
    }
    loadImages()
    return () => { cancelled = true }
  }, [serviceId, getImages])

  // 3. Загрузка данных салона, расписания и статистики (Зависит от service.salonId)
  useEffect(() => {
    if (!service?.salonId) return

    let cancelled = false
    const loadSalonData = async () => {
      try {
        setSalonLoading(true)
        const [salonData, sch, stats] = await Promise.all([
          fetchSalon(service.salonId),
          getSchedule(service.salonId),
          getRatingStats(service.salonId)
        ])
        
        if (!cancelled) {
          setSalon(salonData)
          setSchedule(sch)
          setRatingStats(stats)
        }
      } catch (e) {
        console.error("Ошибка загрузки данных салона:", e)
      } finally {
        if (!cancelled) setSalonLoading(false)
      }
    }
    loadSalonData()
    return () => { cancelled = true }
  }, [service?.salonId, fetchSalon, getSchedule, getRatingStats])

  // 4. Загрузка отзывов (Зависит от service.salonId)
  useEffect(() => {
    if (!service?.salonId) return

    let cancelled = false
    const loadReviews = async () => {
      try {
        setReviewsLoading(true)
        const allRatings = await getRatingsBySalon(service.salonId)
        const serviceRatings = allRatings.filter(
          r => r.serviceId === serviceId && r.status === 'approved'
        )

        const reviewsWithResponses = await Promise.all(
          serviceRatings.map(async (rating) => {
            const responses = await getResponsesByRating(rating.id)
            return {
              ...rating,
              response: responses.length > 0 ? responses[0] : null
            }
          })
        )

        if (!cancelled) setReviews(reviewsWithResponses)
      } catch (e) {
        console.error("Ошибка загрузки отзывов:", e)
      } finally {
        if (!cancelled) setReviewsLoading(false)
      }
    }
    loadReviews()
    return () => { cancelled = true }
  }, [service?.salonId, serviceId, getRatingsBySalon, getResponsesByRating])

  // Если грузится сама услуга - показываем минимальный лоадер или скелетон всей страницы
  if (serviceLoading) {
    return (
      <div className="min-h-screen bg-white animate-pulse">
        <div className="container mx-auto px-4 py-8">
          <div className="h-8 w-32 bg-gray-200 rounded mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-96 bg-gray-200 rounded-3xl"></div>
              <div className="h-10 w-3/4 bg-gray-200 rounded"></div>
            </div>
            <div className="lg:col-span-1">
              <div className="h-64 bg-gray-200 rounded-2xl"></div>
            </div>
          </div>
        </div>
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

  const renderSalonInfo = () => {
    if (salonLoading) return <SalonCardSkeleton />;

    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
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
    )
  }

  return (
    <>
      {isModalOpen && images.length > 0 && (
        <ImageCarouselModal
          images={images}
          startIndex={currentSlide}
          onClose={() => setIsModalOpen(false)}
          setCurrentSlide={setCurrentSlide}
        />
      )}

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
              {imagesLoading ? (
                <HeroSkeleton />
              ) : (
                <div className="relative h-72 md:h-96 rounded-3xl overflow-hidden shadow-xl border border-gray-200 bg-gray-100">
                  {images.length > 0 ? (
                    <Image 
                      src={images[0].url} 
                      alt={service.name} 
                      fill 
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <Images className="w-16 h-16 mb-4" strokeWidth={1} />
                      <span className="font-medium text-lg">Фотография отсутствует</span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Mobile Salon Info */}
        <section className="lg:hidden py-6 bg-gray-50">
          <div className="container mx-auto px-4">
            {renderSalonInfo()}
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
                      <div className="font-bold text-rose-600 text-lg">{service.price} Br</div>
                    )}
                  </div>
                </div>

                {service.description && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">{t('description') || 'Описание'}</h3>
                    <p className="text-gray-700 leading-relaxed font-medium">{service.description}</p>
                  </div>
                )}

                {/* Галерея (если загружена и есть фото) */}
                {!imagesLoading && images.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Images className="w-5 h-5 text-rose-600" />
                      <h3 className="text-lg font-bold text-gray-900">{t('preview') || 'Галерея'}</h3>
                    </div>
                    
                    <div className="relative">
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="relative w-full aspect-video max-h-96 rounded-xl overflow-hidden border border-gray-200 mb-4 bg-gray-100 cursor-pointer group"
                        aria-label="Открыть галерею"
                      >
                        <Image
                          src={images[currentSlide].url}
                          alt={`service image ${currentSlide + 1}`}
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </button>

                      {images.length > 1 && (
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
                      )}
                    </div>
                  </div>
                )}

                {/* СЕКЦИЯ ОТЗЫВОВ */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6" id="reviews">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Quote className="w-5 h-5 text-rose-600 fill-rose-600" />
                      Отзывы об услуге
                    </h3>
                    {!reviewsLoading && reviews.length > 0 && (
                      <span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-sm font-bold">
                        {reviews.length}
                      </span>
                    )}
                  </div>

                  {reviewsLoading ? (
                    <ReviewsSkeleton />
                  ) : reviews.length > 0 ? (
                    <div className="space-y-2">
                      {reviews.map((review) => (
                        <ReviewItem key={review.id} review={review} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">Отзывов об этой услуге пока нет</p>
                      <p className="text-sm text-gray-400">Будьте первым, кто оценит качество!</p>
                    </div>
                  )}
                </div>

                {/* Карта и Расписание */}
                {salonLoading ? (
                  <InfoBlockSkeleton />
                ) : (
                  <>
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
                  </>
                )}
              </div>

              {/* Sidebar */}
              <div className="hidden lg:block lg:col-span-1">
                <div className="sticky top-6">
                  {renderSalonInfo()}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}