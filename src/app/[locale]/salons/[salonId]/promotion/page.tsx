"use client"
import { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useSalonService } from "@/contexts/SalonServiceContext";
import { usePromotion } from "@/contexts/PromotionContext"; // Главный контекст для этой страницы
import type { SalonService } from "@/types/database"; // Используем ваш точный тип
import type { ServicePromotionPlan, ServicePromotion, PromotionAnalytics } from "@/types/database";
import { 
  Zap, 
  BarChart2, 
  X, 
  Loader2,
  CheckCircle2,
  Rocket,
  CalendarOff,
  TrendingUp,
  Eye,
  ShoppingCart,
  Clock
} from "lucide-react";

export default function SalonServicePromotionsPage({ params }: { params: { salonId: string } }) {
  const t = useTranslations("SalonPromotionsPage");
  const { salonId } = params;
  
  // Контекст для получения списка услуг
  const { getServicesBySalon, loading: servicesLoading } = useSalonService();
  
  // Контекст для всей логики продвижения
  const { 
    getAllServicePromotionPlans,
    findServicePromotionsBySalon,
    createServicePromotion,
    findAnalyticsForPromotion,
    loading: promotionLoading 
  } = usePromotion();
  
  const [services, setServices] = useState<SalonService[]>([]);
  const [promotions, setPromotions] = useState<ServicePromotion[]>([]);
  const [plans, setPlans] = useState<ServicePromotionPlan[]>([]);

  // Состояние для модальных окон
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  // Данные для модальных окон
  const [serviceToPromote, setServiceToPromote] = useState<SalonService | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [promotionToView, setPromotionToView] = useState<ServicePromotion | null>(null);
  const [analyticsData, setAnalyticsData] = useState<PromotionAnalytics[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Загрузка всех необходимых данных при инициализации
  useEffect(() => {
    const loadData = async () => {
      const [fetchedServices, fetchedPromotions, fetchedPlans] = await Promise.all([
        getServicesBySalon(salonId),
        findServicePromotionsBySalon(salonId),
        getAllServicePromotionPlans()
      ]);
      setServices(fetchedServices || []);
      setPromotions(fetchedPromotions || []);
      setPlans(fetchedPlans.filter(p => p.isActive) || []); // Показываем только активные планы
    };
    loadData();
  }, [salonId, getServicesBySalon, findServicePromotionsBySalon, getAllServicePromotionPlans]);

  // Обработчик открытия модального окна покупки
  const handlePromoteClick = (service: SalonService) => {
    setServiceToPromote(service);
    setSelectedPlanId(null); // Сбрасываем выбор плана
    setShowPurchaseModal(true);
  };

  // Обработчик покупки и активации продвижения
  const handlePurchasePromotion = async () => {
    if (!serviceToPromote || !selectedPlanId) return;

    const plan = plans.find(p => p.id === selectedPlanId);
    if (!plan) return;

    try {
      const promotionId = `promo_${serviceToPromote.id}_${Date.now()}`;
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

      const promotionData: Omit<ServicePromotion, 'id'> = {
        serviceId: serviceToPromote.id,
        salonId: salonId,
        planId: plan.id,
        status: 'active',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await createServicePromotion(promotionId, promotionData);
      
      // Обновляем список продвижений
      const updatedPromotions = await findServicePromotionsBySalon(salonId);
      setPromotions(updatedPromotions);

      setShowPurchaseModal(false);
    } catch (error) {
      console.error("Failed to create promotion:", error);
      // Здесь можно показать ошибку пользователю
    }
  };

  // Обработчик открытия модального окна аналитики
  const handleViewAnalytics = async (promotion: ServicePromotion) => {
    setPromotionToView(promotion);
    setShowAnalyticsModal(true);
    setAnalyticsLoading(true);
    try {
      const data = await findAnalyticsForPromotion(promotion.id);
      setAnalyticsData(data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      setAnalyticsData([]);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Мемоизированные данные для аналитики
  const analyticsSummary = useMemo(() => {
    if (!analyticsData || analyticsData.length === 0) {
      // ИЗМЕНЕНИЕ 1: Инициализируем с bookingsCount
      return { impressions: 0, clicks: 0, bookingsCount: 0 };
    }
    return analyticsData.reduce((acc, curr) => ({
      impressions: acc.impressions + curr.impressions,
      clicks: acc.clicks + curr.clicks,
      // ИЗМЕНЕНИЕ 1: Суммируем в bookingsCount
      bookingsCount: acc.bookingsCount + curr.bookingsCount,
    }), { impressions: 0, clicks: 0, bookingsCount: 0 }); // ИЗМЕНЕНИЕ 1: Начальное значение с bookingsCount
  }, [analyticsData]);

  const loading = servicesLoading && services.length === 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>{t("loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t("header.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("header.subtitle")}
            </p>
          </div>
        </div>

        {/* Services Grid */}
        {services.length === 0 ? (
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm text-center py-12">
            <div className="max-w-md mx-auto p-6">
              <Rocket className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t("emptyState.title")}</h3>
              <p className="text-muted-foreground mb-6">
                {t("emptyState.description")}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
              const activePromotion = promotions.find(p => p.serviceId === service.id && p.status === 'active');
              const expiredPromotion = !activePromotion ? promotions.find(p => p.serviceId === service.id && p.status === 'expired') : null;

              return (
                <div key={service.id} className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden hover:shadow-medium transition-all duration-300 group">
                  <div className="p-0">
                    {/* Service Header with Visual Status */}
                    <div className="relative h-32 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <div className="text-center">
                        <Zap className="h-12 w-12 mx-auto mb-2 text-primary" />
                        <div className="text-sm font-medium text-primary">
                          {activePromotion ? t("serviceCard.promotionActive") : t("serviceCard.readyToPromote")}
                        </div>
                      </div>
                      
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

                    <div className="p-6">
                      {/* Service Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-foreground mb-1">
                            {service.name}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {service.durationMinutes} {t("serviceCard.minutes")}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-primary">
                            {service.price} ₽
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {service.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {service.description}
                        </p>
                      )}
                      
                      {/* Active Promotion Details */}
                      {activePromotion && (
                        <div className="p-3 bg-success/10 rounded-lg border border-success/20 text-sm space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-foreground/80">
                            <CalendarOff className="h-4 w-4" />
                            <span>{t("serviceCard.activeUntil", { date: new Date(activePromotion.endDate).toLocaleDateString() })}</span>
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
                            {t("serviceCard.viewAnalyticsButton")}
                          </button>
                        ) : (
                          <div className="space-y-2">
                            {expiredPromotion && (
                              <button
                                onClick={() => handleViewAnalytics(expiredPromotion)}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 w-full"
                              >
                                <BarChart2 className="h-4 w-4 mr-2" />
                                {t("serviceCard.viewPastAnalyticsButton")}
                              </button>
                            )}
                            <button
                              onClick={() => handlePromoteClick(service)}
                              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-primary text-primary-foreground h-10 px-4 shadow-medium hover:bg-primary/90 w-full"
                            >
                              <Rocket className="h-4 w-4 mr-2" />
                              {t("serviceCard.promoteButton")}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Purchase Promotion Modal */}
        {showPurchaseModal && serviceToPromote && (
          <div className="fixed inset-0 z-50 bg-background/100 backdrop-blur-sm">
            <div
              className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 sm:rounded-lg max-h-[90vh] overflow-y-auto"
              onWheel={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'PageUp' || e.key === 'PageDown') {
                  e.stopPropagation();
                }
              }}
              tabIndex={0}
            >
              <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                <h2 className="text-lg font-semibold leading-none tracking-tight">
                  {t("purchaseModal.title")}
                </h2>
                <p className="text-sm text-muted-foreground">{serviceToPromote.name}</p>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium">{t("purchaseModal.selectPlan")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plans.map(plan => (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedPlanId === plan.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                    >
                      <h4 className="font-semibold text-lg">{plan.name}</h4>
                      <p className="text-2xl font-bold my-2">{plan.price} ₽</p>
                      <p className="text-sm text-muted-foreground">{t("purchaseModal.duration", { days: plan.durationDays })}</p>
                      <ul className="mt-3 text-sm space-y-1 list-disc list-inside">
                        {plan.features.map((feature, i) => <li key={i}>{feature}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t">
                <button
                  onClick={() => setShowPurchaseModal(false)}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 flex-1 sm:flex-none"
                >
                  {t("purchaseModal.cancelButton")}
                </button>
                <button
                  onClick={handlePurchasePromotion}
                  disabled={!selectedPlanId || promotionLoading}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-primary text-primary-foreground h-10 px-4"
                >
                  {promotionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {t("purchaseModal.confirmButton")}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Modal */}
        {showAnalyticsModal && promotionToView && (
          <div className="fixed inset-0 z-50 bg-background/100 backdrop-blur-sm">
            <div
              className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 sm:rounded-lg max-h-[90vh] overflow-y-auto"
              onWheel={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'PageUp' || e.key === 'PageDown') {
                  e.stopPropagation();
                }
              }}
              tabIndex={0}
            >
              <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                <h2 className="text-lg font-semibold leading-none tracking-tight">
                  {t("analyticsModal.title")}
                </h2>
                <p className="text-sm text-muted-foreground">{services.find(s => s.id === promotionToView.serviceId)?.name}</p>
              </div>

              {analyticsLoading ? (
                <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
              ) : (
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-center">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">{t("analyticsModal.totalImpressions")}</p>
                      <p className="text-3xl font-bold">{analyticsSummary.impressions}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">{t("analyticsModal.totalClicks")}</p>
                      <p className="text-3xl font-bold">{analyticsSummary.clicks}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">{t("analyticsModal.totalBookings")}</p>
                      {/* ИЗМЕНЕНИЕ 2: Отображаем bookingsCount */}
                      <p className="text-3xl font-bold">{analyticsSummary.bookingsCount}</p>
                    </div>
                  </div>

                  <h3 className="font-medium mb-2">{t("analyticsModal.dailyStats")}</h3>
                  <div className="border rounded-lg">
                    {analyticsData.length > 0 ? (
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="p-3 text-left font-medium">{t("analyticsModal.date")}</th>
                            <th className="p-3 text-left font-medium">{t("analyticsModal.impressions")}</th>
                            <th className="p-3 text-left font-medium">{t("analyticsModal.clicks")}</th>
                            <th className="p-3 text-left font-medium">{t("analyticsModal.bookings")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.map(stat => (
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
                      <p className="p-8 text-center text-muted-foreground">{t("analyticsModal.noData")}</p>
                    )}
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-6 border-t">
                <button
                  onClick={() => setShowAnalyticsModal(false)}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 flex-1 sm:flex-none"
                >
                  {t("analyticsModal.closeButton")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}