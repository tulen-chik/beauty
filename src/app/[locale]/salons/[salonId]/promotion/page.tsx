"use client"
import {
  BarChart2,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  Rocket,
  ShoppingCart,
  TrendingUp,
  X,
  XCircle,
  Zap,
} from "lucide-react"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import { usePromotion } from "@/contexts/PromotionContext"
import { useSalonService } from "@/contexts/SalonServiceContext"

import type { SalonService } from "@/types/database"
import type { PromotionAnalytics, ServicePromotion, ServicePromotionPlan } from "@/types/database"

// --- SKELETONS ---

const ServicePromotionCardSkeleton = () => (
  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
    <div className="h-48 bg-slate-100 animate-pulse"></div>
    <div className="p-5 space-y-4">
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-2 flex-1">
          <div className="h-6 w-3/4 bg-slate-200 rounded animate-pulse"></div>
          <div className="h-4 w-1/2 bg-slate-100 rounded animate-pulse"></div>
        </div>
        <div className="h-8 w-20 bg-slate-200 rounded animate-pulse"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-slate-100 rounded w-full animate-pulse"></div>
        <div className="h-4 bg-slate-100 rounded w-5/6 animate-pulse"></div>
      </div>
      <div className="h-px bg-slate-100 w-full"></div>
      <div className="h-11 w-full bg-slate-200 rounded-xl animate-pulse"></div>
    </div>
  </div>
);

const SalonServicePromotionsPageSkeleton = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 mb-10">
          <div className="h-10 w-64 bg-slate-200 rounded-lg animate-pulse"></div>
          <div className="h-5 w-96 bg-slate-100 rounded-md animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <ServicePromotionCardSkeleton key={i} />)}
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

export default function SalonServicePromotionsPage() {
  const { salonId } = useParams<{ salonId: string }>()
  const { getServicesBySalon, loading: servicesLoading, getImages } = useSalonService()
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

  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false)

  const [serviceToPromote, setServiceToPromote] = useState<SalonService | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [promotionToView, setPromotionToView] = useState<ServicePromotion | null>(null)
  const [analyticsData, setAnalyticsData] = useState<PromotionAnalytics[]>([])
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const [fetchedServices, fetchedPromotions, fetchedPlans] = await Promise.all([
        getServicesBySalon(salonId),
        findServicePromotionsBySalon(salonId),
        getAllServicePromotionPlans(),
      ])
      setServices(fetchedServices || [])
      setPromotions(fetchedPromotions || [])
      setPlans(fetchedPlans.filter((p) => p.isActive) || [])

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
    setSelectedPlanId(null)
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
    return <SalonServicePromotionsPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Продвижение услуг
          </h1>
          <p className="text-lg text-slate-500 max-w-3xl">
            Запускайте рекламные кампании, привлекайте больше клиентов и отслеживайте эффективность ваших услуг в реальном времени.
          </p>
        </div>

        {/* Services Grid */}
        {services.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Rocket className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Нет услуг для продвижения</h3>
              <p className="text-slate-500 mb-6 leading-relaxed">
                Добавьте услуги в ваш салон, чтобы начать их продвижение и получать больше записей.
              </p>
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
                  className={`group relative flex flex-col bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                    activePromotion 
                      ? 'border-rose-200 shadow-lg shadow-rose-100/50 ring-1 ring-rose-100' 
                      : 'border-slate-200 shadow-sm hover:shadow-xl hover:border-rose-100'
                  }`}
                >
                  {/* Image Section */}
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    {imagesLoading[service.id] ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
                      </div>
                    ) : serviceImages.length > 0 ? (
                      <>
                        <img
                          src={serviceImages[0].url}
                          alt={service.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60" />
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <Camera className="h-10 w-10 mb-2 opacity-50" />
                        <span className="text-xs font-medium">Нет фото</span>
                      </div>
                    )}

                    {/* Status Badge Overlay */}
                    <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                      {activePromotion && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-white text-rose-600 shadow-md">
                          <Zap className="h-3 w-3 mr-1 fill-current" />
                          PROMO
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="flex flex-col flex-1 p-5">
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <h3 className="font-bold text-lg text-slate-900 leading-tight line-clamp-2">
                        {service.name}
                      </h3>
                      <span className="text-lg font-bold text-rose-600 whitespace-nowrap shrink-0">
                        {service.price} Br
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-slate-500 mb-4">
                      <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="font-medium">{service.durationMinutes} мин</span>
                      </div>
                      {service.isActive ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span className="font-medium">Активна</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                          <XCircle className="h-3.5 w-3.5" />
                          <span className="font-medium">Скрыта</span>
                        </div>
                      )}
                    </div>

                    {/* Active Promotion Info */}
                    {activePromotion && (
                      <div className="mb-4 p-3 bg-gradient-to-r from-rose-50 to-white rounded-xl border border-rose-100">
                        <div className="flex items-center gap-2 text-sm text-rose-800 font-medium mb-1">
                          <TrendingUp className="h-4 w-4" />
                          <span>Продвижение активно</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-rose-600/80">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>до {new Date(activePromotion.endDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}

                    <div className="mt-auto pt-4 border-t border-slate-100">
                      {activePromotion ? (
                        <button
                          onClick={() => handleViewAnalytics(activePromotion)}
                          className="w-full inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 h-11 px-4 shadow-sm"
                        >
                          <BarChart2 className="h-4 w-4 mr-2 text-slate-400" />
                          Аналитика
                        </button>
                      ) : (
                        <div className="space-y-3">
                          {expiredPromotion && (
                            <button
                              onClick={() => handleViewAnalytics(expiredPromotion)}
                              className="w-full inline-flex items-center justify-center rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 transition-colors"
                            >
                              <BarChart2 className="h-3.5 w-3.5 mr-1.5" />
                              Смотреть прошлую статистику
                            </button>
                          )}
                          <button
                            onClick={() => handlePromoteClick(service)}
                            className="w-full inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all bg-rose-600 text-white hover:bg-rose-700 active:scale-95 h-11 px-4 shadow-lg shadow-rose-200"
                          >
                            <Rocket className="h-4 w-4 mr-2" />
                            Запустить продвижение
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Purchase Modal */}
        {showPurchaseModal && serviceToPromote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowPurchaseModal(false)} />
            
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Выберите план</h2>
                  <p className="text-sm text-slate-500 mt-0.5">для услуги «{serviceToPromote.name}»</p>
                </div>
                <button onClick={() => setShowPurchaseModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {plans.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {plans.map((plan) => {
                      const isSelected = selectedPlanId === plan.id;
                      return (
                        <div
                          key={plan.id}
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                            isSelected 
                              ? "border-rose-500 bg-rose-50/50 shadow-md" 
                              : "border-slate-200 hover:border-rose-200 hover:bg-slate-50"
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-3 right-3 text-rose-600">
                              <CheckCircle2 className="h-5 w-5 fill-rose-100" />
                            </div>
                          )}
                          <h4 className={`font-bold text-lg mb-1 ${isSelected ? 'text-rose-900' : 'text-slate-900'}`}>{plan.name}</h4>
                          <div className="flex items-baseline gap-1 mb-3">
                            <span className="text-2xl font-extrabold text-slate-900">{plan.price}</span>
                            <span className="text-sm font-medium text-slate-500">{plan.currency}</span>
                          </div>
                          <div className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-600 mb-4">
                            <Clock className="h-3 w-3 mr-1" />
                            {plan.durationDays} дней
                          </div>
                          <ul className="space-y-2">
                            {plan.features.map((feature, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                <Check className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
                                <span className="leading-tight">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-slate-500">Нет доступных планов для продвижения.</p>
                  </div>
                )}
              </div>

              <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex flex-col-reverse sm:flex-row gap-3">
                <button
                  onClick={() => setShowPurchaseModal(false)}
                  className="flex-1 h-11 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handlePurchasePromotion}
                  disabled={!selectedPlanId || promotionLoading}
                  className="flex-1 h-11 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-rose-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {promotionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" />
                      Оплатить и запустить
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Modal */}
        {showAnalyticsModal && promotionToView && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowAnalyticsModal(false)} />
            
            <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Аналитика</h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {services.find((s) => s.id === promotionToView.serviceId)?.name}
                  </p>
                </div>
                <button onClick={() => setShowAnalyticsModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {analyticsLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 text-center">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Показы</p>
                        <p className="text-3xl font-extrabold text-slate-900">{analyticsSummary.impressions}</p>
                      </div>
                      <div className="p-5 bg-purple-50 rounded-2xl border border-purple-100 text-center">
                        <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">Клики</p>
                        <p className="text-3xl font-extrabold text-slate-900">{analyticsSummary.clicks}</p>
                      </div>
                      <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Записи</p>
                        <p className="text-3xl font-extrabold text-slate-900">{analyticsSummary.bookingsCount}</p>
                      </div>
                    </div>

                    {/* Table */}
                    <div>
                      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        Детализация по дням
                      </h3>
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                          {analyticsData.length > 0 ? (
                            <table className="w-full text-sm text-left">
                              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                <tr>
                                  <th className="px-4 py-3">Дата</th>
                                  <th className="px-4 py-3 text-right">Показы</th>
                                  <th className="px-4 py-3 text-right">Клики</th>
                                  <th className="px-4 py-3 text-right">Записи</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {analyticsData.map((stat) => (
                                  <tr key={stat.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-slate-700">
                                      {new Date(stat.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-right text-slate-600">{stat.impressions}</td>
                                    <td className="px-4 py-3 text-right text-slate-600">{stat.clicks}</td>
                                    <td className="px-4 py-3 text-right font-bold text-slate-900">{stat.bookingsCount}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="p-8 text-center text-slate-500">
                              Нет данных за выбранный период
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex justify-end">
                <button
                  onClick={() => setShowAnalyticsModal(false)}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
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