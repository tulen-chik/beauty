"use client"
import { useEffect, useState, useMemo } from "react"
import { useSalonService } from "@/contexts/SalonServiceContext"
import { usePromotion } from "@/contexts/PromotionContext"
import type { SalonService } from "@/types/database"
import type { ServicePromotionPlan, ServicePromotion, PromotionAnalytics } from "@/types/database"
import {
  Zap,
  BarChart2,
  Loader2,
  CheckCircle2,
  Rocket,
  CalendarOff,
  ShoppingCart,
  Clock,
  Camera,
  XCircle,
} from "lucide-react"
import { useParams } from "next/navigation"

export default function SalonServicePromotionsPage() {
  // Get salonId from URL params
  const { salonId } = useParams<{ salonId: string }>()

  // Контекст для получения списка услуг
  const { getServicesBySalon, loading: servicesLoading, getImages } = useSalonService()

  // Контекст для всей логики продвижения
  const {
    getAllServicePromotionPlans,
    findServicePromotionsBySalon,
    createServicePromotion,
    findAnalyticsForPromotion,
    loading: promotionLoading,
  } = usePromotion()

  const [services, setServices] = useState<SalonService[]>([])
  const [promotions, setPromotions] = useState<ServicePromotion[]>([])
  const [plans, setPlans] = useState<ServicePromotionPlan[]>([])
  const [imagesMap, setImagesMap] = useState<Record<string, any[]>>({})
  const [imagesLoading, setImagesLoading] = useState<Record<string, boolean>>({})

  // Состояние для модальных окон
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false)

  // Данные для модальных окон
  const [serviceToPromote, setServiceToPromote] = useState<SalonService | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [promotionToView, setPromotionToView] = useState<ServicePromotion | null>(null)
  const [analyticsData, setAnalyticsData] = useState<PromotionAnalytics[]>([])
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  // Загрузка всех необходимых данных при инициализации
  useEffect(() => {
    const loadData = async () => {
      const [fetchedServices, fetchedPromotions, fetchedPlans] = await Promise.all([
        getServicesBySalon(salonId),
        findServicePromotionsBySalon(salonId),
        getAllServicePromotionPlans(),
      ])
      setServices(fetchedServices || [])
      setPromotions(fetchedPromotions || [])
      setPlans(fetchedPlans.filter((p) => p.isActive) || []) // Показываем только активные планы

      const map: Record<string, any[]> = {}
      const loadingMap: Record<string, boolean> = {}

      for (const s of fetchedServices || []) {
        loadingMap[s.id] = true
        setImagesLoading({ ...loadingMap })
        try {
          map[s.id] = await getImages(s.id)
        } catch (error) {
          map[s.id] = []
        }
        loadingMap[s.id] = false
        setImagesLoading({ ...loadingMap })
      }
      setImagesMap(map)
    }
    loadData()
  }, [salonId, getServicesBySalon, findServicePromotionsBySalon, getAllServicePromotionPlans, getImages])

  const handlePromoteClick = (service: SalonService) => {
    setServiceToPromote(service)
    setSelectedPlanId(null) // Сбрасываем выбор плана
    setShowPurchaseModal(true)
  }

  const handlePurchasePromotion = async () => {
    if (!serviceToPromote || !selectedPlanId) return

    const plan = plans.find((p) => p.id === selectedPlanId)
    if (!plan) return

    try {
      const promotionId = `promo_${serviceToPromote.id}_${Date.now()}`
      const startDate = new Date()
      const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)

      const promotionData: Omit<ServicePromotion, "id"> = {
        serviceId: serviceToPromote.id,
        salonId: salonId,
        planId: plan.id,
        status: "active",
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await createServicePromotion(promotionId, promotionData)

      // Обновляем список продвижений
      const updatedPromotions = await findServicePromotionsBySalon(salonId)
      setPromotions(updatedPromotions)

      setShowPurchaseModal(false)
    } catch (error) {
      console.error("Failed to create promotion:", error)
    }
  }

  const handleViewAnalytics = async (promotion: ServicePromotion) => {
    setPromotionToView(promotion)
    setShowAnalyticsModal(true)
    setAnalyticsLoading(true)
    try {
      const data = await findAnalyticsForPromotion(promotion.id)
      setAnalyticsData(data)
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
      setAnalyticsData([])
    } finally {
      setAnalyticsLoading(false)
    }
  }

  // Мемоизированные данные для аналитики
  const analyticsSummary = useMemo(() => {
    if (!analyticsData || analyticsData.length === 0) {
      return { impressions: 0, clicks: 0, bookingsCount: 0 }
    }
    return analyticsData.reduce(
      (acc, curr) => ({
        impressions: acc.impressions + curr.impressions,
        clicks: acc.clicks + curr.clicks,
        bookingsCount: acc.bookingsCount + curr.bookingsCount,
      }),
      { impressions: 0, clicks: 0, bookingsCount: 0 },
    )
  }, [analyticsData])

  const loading = servicesLoading && services.length === 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Загрузка...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-soft py-6 sm:py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            {/* OPTIMIZATION: Responsive text size for the main header */}
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Продвижение услуг</h1>
            <p className="text-muted-foreground">Управляйте продвижением ваших услуг и отслеживайте результаты</p>
          </div>
        </div>

        {/* Services Grid */}
        {services.length === 0 ? (
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm text-center py-12">
            <div className="max-w-md mx-auto p-6">
              <Rocket className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Нет услуг для продвижения</h3>
              <p className="text-muted-foreground mb-6">Добавьте услуги в ваш салон, чтобы начать их продвижение</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
              const activePromotion = promotions.find((p) => p.serviceId === service.id && p.status === "active")
              const expiredPromotion = !activePromotion
                ? promotions.find((p) => p.serviceId === service.id && p.status === "expired")
                : null
              const serviceImages = imagesMap[service.id] || []

              return (
                <div
                  key={service.id}
                  className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden hover:shadow-medium transition-all duration-300 group"
                >
                  <div className="p-0">
                    <div className="relative h-48 bg-muted/50 flex items-center justify-center">
                      {imagesLoading[service.id] ? (
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      ) : serviceImages.length > 0 ? (
                        <div className="relative w-full h-full">
                          <img
                            src={serviceImages[0].url || "/salon-service-photo.jpg"}
                            alt={service.name}
                            className="w-full h-full object-cover"
                          />
                          {serviceImages.length > 1 && (
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 absolute top-2 right-2 bg-background/80 text-foreground">
                              +{serviceImages.length - 1}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <Camera className="h-12 w-12 mx-auto mb-2" />
                          <p className="text-sm">Нет фото</p>
                        </div>
                      )}

                      {/* Status Badge */}
                      {activePromotion && (
                        <div className="absolute top-3 right-3">
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-success/10 text-success border-success/20">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Активно
                          </span>
                        </div>
                      )}
                    </div>

                    {/* OPTIMIZATION: Responsive padding for mobile */}
                    <div className="p-4 sm:p-6">
                      {/* Service Header */}
                      {/* OPTIMIZATION: Stack content vertically on mobile, horizontally on larger screens */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-foreground mb-1">{service.name}</h3>
                          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {service.durationMinutes} мин
                            </div>
                            {activePromotion ? (
                              <div className="flex items-center gap-1 text-success">
                                <Zap className="h-4 w-4" />
                                <span>Продвигается</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Zap className="h-4 w-4" />
                                <span>Готово к продвижению</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* OPTIMIZATION: Align text to left on mobile, right on larger screens */}
                        <div className="text-left sm:text-right">
                          <div className="text-xl font-bold text-rose-500">{service.price} Br</div>
                          <div className="flex items-center gap-1 text-sm">
                            {service.isActive ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-success" />
                                <span className="text-success">Активна</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Неактивна</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {service.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{service.description}</p>
                      )}

                      {/* Active Promotion Details */}
                      {activePromotion && (
                        <div className="p-3 bg-success/10 rounded-lg border border-success/20 text-sm space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-foreground/80">
                            <CalendarOff className="h-4 w-4" />
                            <span>Активно до: {new Date(activePromotion.endDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      )}

                      <div className="shrink-0 bg-border h-[1px] w-full mb-4"></div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2">
                        {activePromotion ? (
                          <button
                            onClick={() => handleViewAnalytics(activePromotion)}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4"
                          >
                            <BarChart2 className="h-4 w-4 mr-2" />
                            Посмотреть аналитику
                          </button>
                        ) : (
                          <div className="space-y-2">
                            {expiredPromotion && (
                              <button
                                onClick={() => handleViewAnalytics(expiredPromotion)}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 w-full"
                              >
                                <BarChart2 className="h-4 w-4 mr-2" />
                                Прошлая аналитика
                              </button>
                            )}
                            <button
                              onClick={() => handlePromoteClick(service)}
                              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-rose-500 text-white hover:bg-rose-600 h-10 px-4 shadow-medium w-full"
                            >
                              <Rocket className="h-4 w-4 mr-2" />
                              Продвигать услугу
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Purchase Promotion Modal */}
        {showPurchaseModal && serviceToPromote && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
            <div
              // OPTIMIZATION: Responsive max-width and padding for the modal
              className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-sm sm:max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-4 sm:p-6 shadow-lg duration-200 sm:rounded-lg max-h-[90vh] overflow-y-auto"
              onWheel={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "PageUp" || e.key === "PageDown") {
                  e.stopPropagation()
                }
              }}
              tabIndex={0}
            >
              <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                <h2 className="text-lg font-semibold leading-none tracking-tight">Выберите план продвижения</h2>
                <p className="text-sm text-muted-foreground">{serviceToPromote.name}</p>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Доступные планы:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedPlanId === plan.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                    >
                      <h4 className="font-semibold text-lg">{plan.name}</h4>
                      {/* OPTIMIZATION: Responsive text size for price */}
                      <p className="text-xl sm:text-2xl font-bold my-2">
                        {plan.price} {plan.currency}
                      </p>
                      <p className="text-sm text-muted-foreground">Длительность: {plan.durationDays} дней</p>
                      <ul className="mt-3 text-sm space-y-1 list-disc list-inside">
                        {plan.features.map((feature, i) => (
                          <li key={i}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* OPTIMIZATION: Stack buttons on mobile, reverse order on larger screens */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-start gap-3 pt-6 border-t">
                <button
                  onClick={handlePurchasePromotion}
                  disabled={!selectedPlanId || promotionLoading}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-rose-500 text-white hover:bg-rose-600 h-10 px-4 w-full sm:w-auto"
                >
                  {promotionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Купить план
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowPurchaseModal(false)}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 w-full sm:w-auto"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Modal */}
        {showAnalyticsModal && promotionToView && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
            <div
              // OPTIMIZATION: Responsive max-width and padding for the modal
              className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-sm sm:max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-4 sm:p-6 shadow-lg duration-200 sm:rounded-lg max-h-[90vh] overflow-y-auto"
              onWheel={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "PageUp" || e.key === "PageDown") {
                  e.stopPropagation()
                }
              }}
              tabIndex={0}
            >
              <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                <h2 className="text-lg font-semibold leading-none tracking-tight">Аналитика продвижения</h2>
                <p className="text-sm text-muted-foreground">
                  {services.find((s) => s.id === promotionToView.serviceId)?.name}
                </p>
              </div>

              {analyticsLoading ? (
                <div className="flex justify-center items-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-center">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Всего показов</p>
                      {/* OPTIMIZATION: Responsive text size for stats */}
                      <p className="text-2xl sm:text-3xl font-bold">{analyticsSummary.impressions}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Всего кликов</p>
                      <p className="text-2xl sm:text-3xl font-bold">{analyticsSummary.clicks}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Всего записей</p>
                      <p className="text-2xl sm:text-3xl font-bold">{analyticsSummary.bookingsCount}</p>
                    </div>
                  </div>

                  <h3 className="font-medium mb-2">Статистика по дням:</h3>
                  {/* OPTIMIZATION: Make table scrollable on mobile */}
                  <div className="border rounded-lg overflow-x-auto">
                    {analyticsData.length > 0 ? (
                      <table className="w-full text-sm whitespace-nowrap">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="p-3 text-left font-medium">Дата</th>
                            <th className="p-3 text-left font-medium">Показы</th>
                            <th className="p-3 text-left font-medium">Клики</th>
                            <th className="p-3 text-left font-medium">Записи</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.map((stat) => (
                            <tr key={stat.id} className="border-b last:border-none">
                              <td className="p-3">{new Date(stat.date).toLocaleDateString()}</td>
                              <td className="p-3">{stat.impressions}</td>
                              <td className="p-3">{stat.clicks}</td>
                              <td className="p-3">{stat.bookingsCount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="p-8 text-center text-muted-foreground">Нет данных для отображения</p>
                    )}
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-6 border-t">
                <button
                  onClick={() => setShowAnalyticsModal(false)}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 w-full sm:w-auto"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}