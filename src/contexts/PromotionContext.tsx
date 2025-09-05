import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
  useCallback
} from 'react';
import {
  servicePromotionPlanOperations,
  servicePromotionOperations,
  promotionAnalyticsOperations,
} from '@/lib/firebase/database';
import type {
  ServicePromotionPlan,
  ServicePromotion,
  PromotionAnalytics,
} from '@/types/database';

/**
 * Определяет обновленный интерфейс для контекста управления продвижением.
 */
interface PromotionContextType {
  // --- Методы для работы с планами продвижения УСЛУГ ---
  getServicePromotionPlan: (planId: string) => Promise<ServicePromotionPlan | null>;
  getAllServicePromotionPlans: () => Promise<ServicePromotionPlan[]>;
  createServicePromotionPlan: (planId: string, data: Omit<ServicePromotionPlan, 'id'>) => Promise<void>; // ДОБАВЛЕНО
  updateServicePromotionPlan: (planId: string, data: Partial<ServicePromotionPlan>) => Promise<void>; // ДОБАВЛЕНО
  deleteServicePromotionPlan: (planId: string) => Promise<void>; // ДОБАВЛЕНО

  // --- Методы для управления продвижением услуг (теперь это основной объект) ---
  getServicePromotion: (promotionId: string) => Promise<ServicePromotion | null>;
  findServicePromotionsBySalon: (salonId: string) => Promise<ServicePromotion[]>;
  findActiveServicePromotion: (serviceId: string) => Promise<ServicePromotion | null>;
  createServicePromotion: (promotionId: string, data: Omit<ServicePromotion, 'id'>) => Promise<void>;
  updateServicePromotion: (promotionId: string, data: Partial<ServicePromotion>) => Promise<void>;

  // --- Методы для работы с аналитикой продвижения ---
  getPromotionAnalytics: (analyticsId: string) => Promise<PromotionAnalytics | null>;
  findAnalyticsForPromotion: (servicePromotionId: string) => Promise<PromotionAnalytics[]>;
  createPromotionAnalytics: (analyticsId: string, data: Omit<PromotionAnalytics, 'id'>) => Promise<void>;

  // --- Состояния контекста ---
  loading: boolean;
  error: string | null;
}

const PromotionContext = createContext<PromotionContextType | undefined>(undefined);

/**
 * Хук для удобного доступа к PromotionContext.
 */
export const usePromotion = () => {
  const ctx = useContext(PromotionContext);
  if (!ctx) throw new Error('usePromotion must be used within a PromotionProvider');
  return ctx;
};

/**
 * Провайдер, который предоставляет состояние и методы для управления продвижением.
 */
export const PromotionProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Реализация методов для планов продвижения ---

  const getServicePromotionPlan = useCallback(async (planId: string) => {
    setLoading(true);
    setError(null);
    try {
      return await servicePromotionPlanOperations.read(planId);
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllServicePromotionPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await servicePromotionPlanOperations.readAll();
    } catch (e: any) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ДОБАВЛЕННЫЙ МЕТОД
  const createServicePromotionPlan = useCallback(async (planId: string, data: Omit<ServicePromotionPlan, 'id'>) => {
    setLoading(true);
    setError(null);
    try {
      await servicePromotionPlanOperations.create(planId, data);
    } catch (e: any) {
      setError(e.message);
      throw e; // Пробрасываем ошибку выше, чтобы компонент мог ее обработать
    } finally {
      setLoading(false);
    }
  }, []);

  // ДОБАВЛЕННЫЙ МЕТОД
  const updateServicePromotionPlan = useCallback(async (planId: string, data: Partial<ServicePromotionPlan>) => {
    setLoading(true);
    setError(null);
    try {
      await servicePromotionPlanOperations.update(planId, data);
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  // ДОБАВЛЕННЫЙ МЕТОД
  const deleteServicePromotionPlan = useCallback(async (planId: string) => {
    setLoading(true);
    setError(null);
    try {
      await servicePromotionPlanOperations.delete(planId);
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);


  // --- Реализация методов для продвижения услуг ---

  const getServicePromotion = useCallback(async (promotionId: string) => {
    setLoading(true);
    setError(null);
    try {
      return await servicePromotionOperations.read(promotionId);
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const findServicePromotionsBySalon = useCallback(async (salonId: string) => {
    setLoading(true);
    setError(null);
    try {
      return await servicePromotionOperations.findBySalonId(salonId);
    } catch (e: any) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const findActiveServicePromotion = useCallback(async (serviceId: string) => {
    setLoading(true);
    setError(null);
    try {
      return await servicePromotionOperations.findActiveByServiceId(serviceId);
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createServicePromotion = useCallback(async (promotionId: string, data: Omit<ServicePromotion, 'id'>) => {
    setLoading(true);
    setError(null);
    try {
      await servicePromotionOperations.create(promotionId, data);
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateServicePromotion = useCallback(async (promotionId: string, data: Partial<ServicePromotion>) => {
    setLoading(true);
    setError(null);
    try {
      await servicePromotionOperations.update(promotionId, data);
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Реализация методов для аналитики продвижения ---

  const getPromotionAnalytics = useCallback(async (analyticsId: string) => {
    setLoading(true);
    setError(null);
    try {
      return await promotionAnalyticsOperations.read(analyticsId);
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const findAnalyticsForPromotion = useCallback(async (servicePromotionId: string) => {
    setLoading(true);
    setError(null);
    try {
      return await promotionAnalyticsOperations.findByServicePromotionId(servicePromotionId);
    } catch (e: any) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createPromotionAnalytics = useCallback(async (analyticsId: string, data: Omit<PromotionAnalytics, 'id'>) => {
    setLoading(true);
    setError(null);
    try {
      await promotionAnalyticsOperations.create(analyticsId, data);
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Сборка значения контекста ---

  const value: PromotionContextType = useMemo(() => ({
    getServicePromotionPlan,
    getAllServicePromotionPlans,
    createServicePromotionPlan, // ДОБАВЛЕНО
    updateServicePromotionPlan, // ДОБАВЛЕНО
    deleteServicePromotionPlan, // ДОБАВЛЕНО
    getServicePromotion,
    findServicePromotionsBySalon,
    findActiveServicePromotion,
    createServicePromotion,
    updateServicePromotion,
    getPromotionAnalytics,
    findAnalyticsForPromotion,
    createPromotionAnalytics,
    loading,
    error,
  }), [
    getServicePromotionPlan,
    getAllServicePromotionPlans,
    createServicePromotionPlan, // ДОБАВЛЕНО
    updateServicePromotionPlan, // ДОБАВЛЕНО
    deleteServicePromotionPlan, // ДОБАВЛЕНО
    getServicePromotion,
    findServicePromotionsBySalon,
    findActiveServicePromotion,
    createServicePromotion,
    updateServicePromotion,
    getPromotionAnalytics,
    findAnalyticsForPromotion,
    createPromotionAnalytics,
    loading,
    error,
  ]);

  return (
    <PromotionContext.Provider value={value}>
      {children}
    </PromotionContext.Provider>
  );
};