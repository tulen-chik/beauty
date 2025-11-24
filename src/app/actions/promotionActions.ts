'use server';

import { Firestore, Settings } from '@google-cloud/firestore';

import { promotionAnalyticsSchema, servicePromotionPlanSchema, servicePromotionSchema } from '@/lib/firebase/schemas';
import type { PromotionAnalytics, ServicePromotion, ServicePromotionPlan } from '@/types/database';

let firestoreInstance: Firestore | null = null;

function getDb(): Firestore {
  if (!firestoreInstance) {
    const firestoreSettings: Settings = {
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      databaseId: 'beautyfirestore',
      credentials: {
        client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        private_key: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      },
      ignoreUndefinedProperties: true,
    };
    firestoreInstance = new Firestore(firestoreSettings);
  }
  return firestoreInstance;
}

const readDoc = async <T>(collection: string, id: string): Promise<T | null> => {
  const snap = await getDb().collection(collection).doc(id).get();
  return snap.exists ? (snap.data() as T) : null;
};

export const servicePromotionPlanActions = {
  create: async (planId: string, data: Omit<ServicePromotionPlan, 'id'>) => {
    const validated = servicePromotionPlanSchema.parse(data);
    await getDb().collection('servicePromotionPlans').doc(planId).set(validated);
    return { ...validated, id: planId } as ServicePromotionPlan;
  },
  read: async (planId: string) => {
    const data = await readDoc<ServicePromotionPlan>('servicePromotionPlans', planId);
    return data ? { ...data, id: planId } : null;
  },
  update: async (planId: string, data: Partial<ServicePromotionPlan>) => {
    const current = await readDoc<ServicePromotionPlan>('servicePromotionPlans', planId);
    if (!current) throw new Error('Plan not found');
    const validated = servicePromotionPlanSchema.partial().parse(data);
    const updated = { ...current, ...validated };
    await getDb().collection('servicePromotionPlans').doc(planId).set(updated, { merge: true });
    return { ...updated, id: planId } as ServicePromotionPlan;
  },
  delete: async (planId: string) => {
    await getDb().collection('servicePromotionPlans').doc(planId).delete();
  },
  readAll: async (): Promise<ServicePromotionPlan[]> => {
    const snap = await getDb().collection('servicePromotionPlans').get();
    if (snap.empty) return [];
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ServicePromotionPlan, 'id'>) }));
  },
};

export const servicePromotionActions = {
  create: async (promotionId: string, data: Omit<ServicePromotion, 'id'>) => {
    const validated = servicePromotionSchema.parse(data);
    await getDb().collection('servicePromotions').doc(promotionId).set(validated);
    return { ...validated, id: promotionId } as ServicePromotion;
  },
  read: async (promotionId: string) => {
    const data = await readDoc<ServicePromotion>('servicePromotions', promotionId);
    return data ? { ...data, id: promotionId } : null;
  },
  update: async (promotionId: string, data: Partial<ServicePromotion>) => {
    const current = await readDoc<ServicePromotion>('servicePromotions', promotionId);
    if (!current) throw new Error('Promotion not found');
    const validated = servicePromotionSchema.partial().parse(data);
    const updated = { ...current, ...validated };
    await getDb().collection('servicePromotions').doc(promotionId).set(updated, { merge: true });
    return { ...updated, id: promotionId } as ServicePromotion;
  },
  delete: async (promotionId: string) => {
    await getDb().collection('servicePromotions').doc(promotionId).delete();
  },
  findBySalonId: async (salonId: string): Promise<ServicePromotion[]> => {
    const snap = await getDb().collection('servicePromotions').where('salonId', '==', salonId).get();
    if (snap.empty) return [];
    return snap.docs
      .map((d) => ({ ...(d.data() as Omit<ServicePromotion, 'id'>), id: d.id }))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .reverse();
  },
  findActiveByServiceId: async (serviceId: string): Promise<ServicePromotion | null> => {
    const snap = await getDb().collection('servicePromotions').where('serviceId', '==', serviceId).get();
    if (snap.empty) return null;
    const list = snap.docs.map((d) => ({ ...(d.data() as Omit<ServicePromotion, 'id'>), id: d.id } as ServicePromotion));
    const active = list.find((p) => (p as any).status === 'active');
    return active || null;
  },
};

export const promotionAnalyticsActions = {
  create: async (analyticsId: string, data: Omit<PromotionAnalytics, 'id'>) => {
    const validated = promotionAnalyticsSchema.parse(data);
    await getDb().collection('promotionAnalytics').doc(analyticsId).set(validated);
    return { ...validated, id: analyticsId } as PromotionAnalytics;
  },
  read: async (analyticsId: string) => {
    const data = await readDoc<PromotionAnalytics>('promotionAnalytics', analyticsId);
    return data ? { ...data, id: analyticsId } : null;
  },
  update: async (analyticsId: string, data: Partial<PromotionAnalytics>) => {
    const current = await readDoc<PromotionAnalytics>('promotionAnalytics', analyticsId);
    if (!current) throw new Error('Analytics not found');
    const validated = promotionAnalyticsSchema.partial().parse(data);
    const updated = { ...current, ...validated };
    await getDb().collection('promotionAnalytics').doc(analyticsId).set(updated, { merge: true });
    return { ...updated, id: analyticsId } as PromotionAnalytics;
  },
  delete: async (analyticsId: string) => {
    await getDb().collection('promotionAnalytics').doc(analyticsId).delete();
  },
  findByServicePromotionId: async (servicePromotionId: string): Promise<PromotionAnalytics[]> => {
    const snap = await getDb().collection('promotionAnalytics').where('servicePromotionId', '==', servicePromotionId).get();
    if (snap.empty) return [];
    return snap.docs
      .map((d) => ({ ...(d.data() as Omit<PromotionAnalytics, 'id'>), id: d.id }))
      .sort((a, b) => new Date((a as any).date).getTime() - new Date((b as any).date).getTime())
      .reverse();
  },
};

