import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState} from 'react';


import type {
  PromotionAnalytics,
  ServicePromotion,
  ServicePromotionPlan,
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
      const response = await fetch(`/api/promotions/plans/${planId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to get service promotion plan');
      }
      return await response.json();
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
      const response = await fetch('/api/promotions/plans');
      if (!response.ok) throw new Error('Failed to get all service promotion plans');
      return await response.json();
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
      const response = await fetch('/api/promotions/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, ...data }),
      });
      if (!response.ok) throw new Error('Failed to create service promotion plan');
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  // ДОБАВЛЕННЫЙ МЕТОД
  const updateServicePromotionPlan = useCallback(async (planId: string, data: Partial<ServicePromotionPlan>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/promotions/plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update service promotion plan');
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
      const response = await fetch(`/api/promotions/plans/${planId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete service promotion plan');
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
      const response = await fetch(`/api/promotions/services/${promotionId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to get service promotion');
      }
      return await response.json();
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
      const response = await fetch(`/api/salons/${salonId}/promotions`);
      if (!response.ok) throw new Error('Failed to find service promotions by salon');
      return await response.json();
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
      const response = await fetch(`/api/services/${serviceId}/promotions/active`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to find active service promotion');
      }
      return await response.json();
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
      const response = await fetch('/api/promotions/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promotionId, ...data }),
      });
      if (!response.ok) throw new Error('Failed to create service promotion');
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
      const response = await fetch(`/api/promotions/services/${promotionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update service promotion');
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
      const response = await fetch(`/api/promotions/analytics/${analyticsId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to get promotion analytics');
      }
      return await response.json();
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
      const response = await fetch(`/api/promotions/services/${servicePromotionId}/analytics`);
      if (!response.ok) throw new Error('Failed to find promotion analytics');
      return await response.json();
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
      const response = await fetch('/api/promotions/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analyticsId, ...data }),
      });
      if (!response.ok) throw new Error('Failed to create promotion analytics');
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