import React, { 
  createContext, 
  useContext, 
  useState, 
  ReactNode, 
  useMemo, 
  useCallback 
} from 'react';
import { 
  // Основные операции для услуг
  salonServiceOperations, 
  getAllSalonServices, 
  uploadServiceImage, 
  deleteServiceImage, 
  getServiceImages,
  // Добавляем прямые импорты для операций с подписками и продвижением
  salonSubscriptionOperations,
  servicePromotionOperations,
  promotionAnalyticsOperations,
} from '@/lib/firebase/database';
import type { 
  SalonService, 
  ServicePromotion, 
  PromotionAnalytics, 
  ServiceImage 
} from '@/types/database';

/**
 * Определяет полный интерфейс для контекста управления услугами салона,
 * включая CRUD операции, работу с изображениями и управление продвижением.
 */
interface SalonServiceContextType {
  // --- Методы для работы с данными услуги ---
  getService: (serviceId: string) => Promise<SalonService | null>;
  createService: (serviceId: string, data: Omit<SalonService, 'id'>) => Promise<SalonService>;
  updateService: (serviceId: string, data: Partial<SalonService>) => Promise<SalonService>;
  deleteService: (serviceId: string) => Promise<void>;
  getServicesBySalon: (salonId: string) => Promise<SalonService[]>;

  // --- Методы для работы с изображениями услуги ---
  uploadImage: (serviceId: string, file: File) => Promise<ServiceImage>;
  deleteImage: (storagePath: string) => Promise<void>;
  getImages: (serviceId: string) => Promise<ServiceImage[]>;

  // --- Методы для управления продвижением услуги ---
  promoteService: (salonId: string, serviceId: string) => Promise<ServicePromotion | null>;
  pauseServicePromotion: (promotionId: string, serviceId: string) => Promise<ServicePromotion | null>;
  getPromotedServices: (salonId: string) => Promise<ServicePromotion[]>;
  getPromotionAnalytics: (promotionId: string) => Promise<PromotionAnalytics[] | null>;

  // --- Состояния контекста ---
  loading: boolean;
  error: string | null;
}

const SalonServiceContext = createContext<SalonServiceContextType | undefined>(undefined);

/**
 * Хук для удобного доступа к SalonServiceContext.
 */
export const useSalonService = () => {
  const ctx = useContext(SalonServiceContext);
  if (!ctx) throw new Error('useSalonService must be used within a SalonServiceProvider');
  return ctx;
};

/**
 * Провайдер, который предоставляет состояние и методы для управления услугами салона.
 * Этот провайдер теперь полностью независим и не требует SalonProvider в качестве родителя.
 */
export const SalonServiceProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Реализация существующих методов ---

  const getService = useCallback(async (serviceId: string) => {
    setLoading(true);
    setError(null);
    try {
      const service = await salonServiceOperations.read(serviceId);
      setLoading(false);
      return service;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      return null;
    }
  }, []);

  const createService = useCallback(async (serviceId: string, data: Omit<SalonService, 'id'>) => {
    setLoading(true);
    setError(null);
    try {
      const service = await salonServiceOperations.create(serviceId, data);
      setLoading(false);
      return service;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      throw e;
    }
  }, []);

  const updateService = useCallback(async (serviceId: string, data: Partial<SalonService>) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await salonServiceOperations.update(serviceId, data);
      setLoading(false);
      return updated;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      throw e;
    }
  }, []);

  const deleteService = useCallback(async (serviceId: string) => {
    setLoading(true);
    setError(null);
    try {
      await salonServiceOperations.delete(serviceId);
      setLoading(false);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      throw e;
    }
  }, []);

  const getServicesBySalon = useCallback(async (salonId: string) => {
    setLoading(true);
    setError(null);
    try {
      const all = await getAllSalonServices();
      const result = Object.entries(all)
        .map(([id, data]) => ({ ...(data as any), id }))
        .filter((s) => s.salonId === salonId);
      setLoading(false);
      return result;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      return [];
    }
  }, []);

  const uploadImage = useCallback(async (serviceId: string, file: File) => {
    setLoading(true);
    setError(null);
    try {
      const img = await uploadServiceImage(serviceId, file);
      setLoading(false);
      return img;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      throw e;
    }
  }, []);

  const deleteImage = useCallback(async (storagePath: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteServiceImage(storagePath);
      setLoading(false);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      throw e;
    }
  }, []);

  const getImages = useCallback(async (serviceId: string) => {
    setLoading(true);
    setError(null);
    try {
      const images = await getServiceImages(serviceId);
      setLoading(false);
      return images;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      return [];
    }
  }, []);

  // --- Новые методы, реализованные независимо ---

  const promoteService = useCallback(async (salonId: string, serviceId: string) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Напрямую запрашиваем активную подписку салона из базы данных.
      const activeSubscription = await salonSubscriptionOperations.findBySalonId(salonId);
      if (!activeSubscription || activeSubscription.status !== 'active') {
        throw new Error('Для продвижения услуги требуется активная подписка.');
      }

      // 2. Создаем запись о продвижении.
      const now = new Date().toISOString();
      const newPromotionData: Omit<ServicePromotion, 'id'> = {
        salonId, serviceId, subscriptionId: activeSubscription.id, status: 'active',
        startDate: now, endDate: activeSubscription.endDate, createdAt: now, updatedAt: now,
      };
      const promotionId = `promo_${Date.now()}`;
      const newPromotion = await servicePromotionOperations.create(promotionId, newPromotionData);

      // 3. Обновляем статус самой услуги.
      await salonServiceOperations.update(serviceId, { promotionStatus: 'active' });
      
      setLoading(false);
      return { ...newPromotion, id: promotionId };
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      return null;
    }
  }, []);

  const pauseServicePromotion = useCallback(async (promotionId: string, serviceId: string) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Обновляем статус продвижения.
      const promotion = await servicePromotionOperations.update(promotionId, { status: 'paused' });

      // 2. Обновляем статус услуги.
      await salonServiceOperations.update(serviceId, { promotionStatus: 'paused' });

      setLoading(false);
      return promotion;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      return null;
    }
  }, []);

  const getPromotedServices = useCallback(async (salonId: string) => {
    setLoading(true);
    setError(null);
    try {
      const services = await servicePromotionOperations.findBySalonId(salonId);
      setLoading(false);
      return services;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      return [];
    }
  }, []);

  const getPromotionAnalytics = useCallback(async (promotionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const analytics = await promotionAnalyticsOperations.findByPromotionId(promotionId);
      setLoading(false);
      return analytics;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      return null;
    }
  }, []);

  // --- Сборка значения контекста ---

  const value: SalonServiceContextType = useMemo(() => ({
    getService,
    createService,
    updateService,
    deleteService,
    getServicesBySalon,
    uploadImage,
    deleteImage,
    getImages,
    loading,
    error,
    promoteService,
    pauseServicePromotion,
    getPromotedServices,
    getPromotionAnalytics,
  }), [
    getService,
    createService,
    updateService,
    deleteService,
    getServicesBySalon,
    uploadImage,
    deleteImage,
    getImages,
    loading,
    error,
    promoteService,
    pauseServicePromotion,
    getPromotedServices,
    getPromotionAnalytics,
  ]);

  return (
    <SalonServiceContext.Provider value={value}>
      {children}
    </SalonServiceContext.Provider>
  );
};