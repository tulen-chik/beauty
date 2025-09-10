import type { ServicePromotion, ServicePromotionPlan, PromotionAnalytics } from '@/types/database';
import { servicePromotionPlanSchema, servicePromotionSchema, promotionAnalyticsSchema } from './schemas';
import { createOperation, readOperation, updateOperation, deleteOperation } from './crud';
import { db } from './init';
import { equalTo, get, orderByChild, query, ref } from 'firebase/database';

export const servicePromotionPlanOperations = {
  create: (planId: string, data: Omit<ServicePromotionPlan, 'id'>) =>
    createOperation(`servicePromotionPlans/${planId}`, data, servicePromotionPlanSchema),

  read: (planId: string) => readOperation<ServicePromotionPlan>(`servicePromotionPlans/${planId}`),

  update: (planId: string, data: Partial<ServicePromotionPlan>) =>
    updateOperation(`servicePromotionPlans/${planId}`, data, servicePromotionPlanSchema),

  delete: (planId: string) => deleteOperation(`servicePromotionPlans/${planId}`),

  readAll: async (): Promise<ServicePromotionPlan[]> => {
    const snapshot = await get(ref(db, 'servicePromotionPlans'));
    if (!snapshot.exists()) return [];
    const raw = snapshot.val() as Record<string, Omit<ServicePromotionPlan, 'id'>>;
    return Object.entries(raw).map(([id, plan]) => ({ id, ...plan }));
  },
};

export const servicePromotionOperations = {
  create: (promotionId: string, data: Omit<ServicePromotion, 'id'>) =>
    createOperation(`servicePromotions/${promotionId}`, data, servicePromotionSchema),

  read: (promotionId: string) => readOperation<ServicePromotion>(`servicePromotions/${promotionId}`),

  update: (promotionId: string, data: Partial<ServicePromotion>) =>
    updateOperation(`servicePromotions/${promotionId}`, data, servicePromotionSchema),

  delete: (promotionId: string) => deleteOperation(`servicePromotions/${promotionId}`),

  findBySalonId: async (salonId: string): Promise<ServicePromotion[]> => {
    try {
      const promotionsRef = query(ref(db, 'servicePromotions'), orderByChild('salonId'), equalTo(salonId));
      const snapshot = await get(promotionsRef);
      if (!snapshot.exists()) return [];

      const promotions = snapshot.val() as Record<string, ServicePromotion>;
      return Object.entries(promotions)
        .map(([id, promo]) => ({ ...promo, id }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (_) {
      return [];
    }
  },

  findActiveByServiceId: async (serviceId: string): Promise<ServicePromotion | null> => {
    try {
      const promotionsRef = query(ref(db, 'servicePromotions'), orderByChild('serviceId'), equalTo(serviceId));
      const snapshot = await get(promotionsRef);
      if (!snapshot.exists()) return null;

      const promotions = snapshot.val() as Record<string, ServicePromotion>;
      const activePromotion = Object.values(promotions).find(promo => promo.status === 'active');
      return activePromotion || null;
    } catch (_) {
      return null;
    }
  },
};

export const promotionAnalyticsOperations = {
  create: (analyticsId: string, data: Omit<PromotionAnalytics, 'id'>) =>
    createOperation(`promotionAnalytics/${analyticsId}`, data, promotionAnalyticsSchema),

  read: (analyticsId: string) => readOperation<PromotionAnalytics>(`promotionAnalytics/${analyticsId}`),

  update: (analyticsId: string, data: Partial<PromotionAnalytics>) =>
    updateOperation(`promotionAnalytics/${analyticsId}`, data, promotionAnalyticsSchema),

  delete: (analyticsId: string) => deleteOperation(`promotionAnalytics/${analyticsId}`),

  findByServicePromotionId: async (servicePromotionId: string): Promise<PromotionAnalytics[]> => {
    try {
      const analyticsRef = query(ref(db, 'promotionAnalytics'), orderByChild('servicePromotionId'), equalTo(servicePromotionId));
      const snapshot = await get(analyticsRef);
      if (!snapshot.exists()) return [];

      const analytics = snapshot.val() as Record<string, PromotionAnalytics>;
      return Object.entries(analytics)
        .map(([id, record]) => ({ ...record, id }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (_) {
      return [];
    }
  },
};
