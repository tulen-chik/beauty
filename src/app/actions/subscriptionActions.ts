'use server';

import { Firestore, Settings } from '@google-cloud/firestore';
import { subscriptionBillingSchema, subscriptionPlanSchema, subscriptionSchema } from '@/lib/firebase/schemas';
import type { SalonSubscription, SalonSubscriptionPlan, SubscriptionBilling } from '@/types/subscriptions';

// Глобальная переменная для кэширования инстанса
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

// Вспомогательная функция для чтения документа
const readDoc = async <T>(collection: string, id: string): Promise<T | null> => {
  try {
    const snap = await getDb().collection(collection).doc(id).get();
    return snap.exists ? (snap.data() as T) : null;
  } catch (err: any) {
    if (err && (err.code === 5 || err.code === 'not-found')) {
      return null;
    }
    throw err;
  }
};

// ==========================================
// --- Subscription Plans Actions ---
// ==========================================

export async function createSubscriptionPlanAction(planId: string, data: Omit<SalonSubscriptionPlan, 'id'>) {
  const validated = subscriptionPlanSchema.parse(data);
  await getDb().collection('subscriptionPlans').doc(planId).set(validated);
  return { ...validated, id: planId } as SalonSubscriptionPlan;
}

export async function getSubscriptionPlanAction(planId: string) {
  const data = await readDoc<SalonSubscriptionPlan>('subscriptionPlans', planId);
  return data ? { ...data, id: planId } : null;
}

export async function updateSubscriptionPlanAction(planId: string, data: Partial<SalonSubscriptionPlan>) {
  const db = getDb();
  const docRef = db.collection('subscriptionPlans').doc(planId);
  
  const snap = await docRef.get();
  if (!snap.exists) throw new Error('Subscription plan not found');
  
  const current = snap.data() as SalonSubscriptionPlan;
  const validated = subscriptionPlanSchema.partial().parse(data);
  const updated = { ...current, ...validated };
  
  await docRef.set(updated, { merge: true });
  return { ...updated, id: planId } as SalonSubscriptionPlan;
}

export async function deleteSubscriptionPlanAction(planId: string) {
  await getDb().collection('subscriptionPlans').doc(planId).delete();
}

export async function getAllSubscriptionPlansAction(): Promise<SalonSubscriptionPlan[]> {
  const snap = await getDb().collection('subscriptionPlans').get();
  if (snap.empty) return [];
  
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<SalonSubscriptionPlan, 'id'>) }))
    .filter((plan) => (plan as any).isActive)
    .sort((a: any, b: any) => a.price - b.price) as SalonSubscriptionPlan[];
}

export async function getActiveSubscriptionPlansAction(): Promise<SalonSubscriptionPlan[]> {
  return getAllSubscriptionPlansAction();
}

// ==========================================
// --- Subscription Actions ---
// ==========================================

export async function createSubscriptionAction(subscriptionId: string, data: Omit<SalonSubscription, 'id'>) {
  const validated = subscriptionSchema.parse(data);
  await getDb().collection('subscriptions').doc(subscriptionId).set(validated);
  return { ...validated, id: subscriptionId } as SalonSubscription;
}

export async function getSubscriptionAction(subscriptionId: string) {
  const data = await readDoc<SalonSubscription>('subscriptions', subscriptionId);
  return data ? { ...data, id: subscriptionId } : null;
}

export async function updateSubscriptionAction(subscriptionId: string, data: Partial<SalonSubscription>) {
  const db = getDb();
  const docRef = db.collection('subscriptions').doc(subscriptionId);

  const snap = await docRef.get();
  if (!snap.exists) throw new Error('Subscription not found');

  const current = snap.data() as SalonSubscription;
  const validated = subscriptionSchema.partial().parse(data);
  const updated = { ...current, ...validated };

  await docRef.set(updated, { merge: true });
  return { ...updated, id: subscriptionId } as SalonSubscription;
}

export async function deleteSubscriptionAction(subscriptionId: string) {
  await getDb().collection('subscriptions').doc(subscriptionId).delete();
}

export async function getSubscriptionBySalonIdAction(salonId: string): Promise<SalonSubscription | null> {
  const snap = await getDb()
    .collection('subscriptions')
    .where('salonId', '==', salonId)
    .get();

  if (snap.empty) return null;

  const list = snap.docs.map((d) => ({ 
    ...(d.data() as Omit<SalonSubscription, 'id'>), 
    id: d.id 
  } as SalonSubscription));

  const found = list.find((s) => s.status === 'active' || s.status === 'trialing');
  return found || null;
}

export async function getAllSubscriptionsBySalonIdAction(salonId: string): Promise<SalonSubscription[]> {
  const snap = await getDb()
    .collection('subscriptions')
    .where('salonId', '==', salonId)
    .get();

  if (snap.empty) return [];

  return snap.docs
    .map((d) => ({ 
      ...(d.data() as Omit<SalonSubscription, 'id'>), 
      id: d.id 
    } as SalonSubscription))
    .sort((a, b) => new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime());
}

export async function getExpiringSubscriptionsAction(daysAhead = 7): Promise<SalonSubscription[]> {
  if (daysAhead <= 0) return [];
  
  const snap = await getDb().collection('subscriptions').get();
  if (snap.empty) return [];

  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setDate(now.getDate() + daysAhead);

  const subs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

  return subs
    .map((s: any) => ({
      ...s,
      currentPeriodEnd: new Date(s.currentPeriodEnd).toISOString(),
      currentPeriodStart: new Date(s.currentPeriodStart).toISOString(),
    }))
    .filter((s: any) => {
      if (s.status !== 'active' && s.status !== 'trialing') return false;
      const end = new Date(s.currentPeriodEnd);
      return end > now && end <= futureDate;
    })
    .sort((a: any, b: any) => new Date(a.currentPeriodEnd).getTime() - new Date(b.currentPeriodEnd).getTime());
}

export async function cancelSubscriptionAction(subscriptionId: string, reason?: string): Promise<void> {
  const db = getDb();
  const docRef = db.collection('subscriptions').doc(subscriptionId);
  
  const snap = await docRef.get();
  if (!snap.exists) throw new Error('Subscription not found');
  
  const current = snap.data() as SalonSubscription;

  if (current.status !== 'active' && current.status !== 'trialing') {
    throw new Error(`Cannot cancel subscription with status: ${current.status}`);
  }

  const updates: Partial<SalonSubscription> = { 
    status: 'canceled', 
    canceledAt: new Date().toISOString() 
  } as any;

  if (reason) (updates as any).note = reason;

  await docRef.set(updates, { merge: true });
}

export async function renewSubscriptionAction(subscriptionId: string, newEndDate: string): Promise<void> {
  const db = getDb();
  const docRef = db.collection('subscriptions').doc(subscriptionId);
  
  const snap = await docRef.get();
  if (!snap.exists) throw new Error('Subscription not found');

  await docRef.set({ status: 'active' }, { merge: true });
}

// ==========================================
// --- Billing Actions ---
// ==========================================

export async function createBillingAction(data: Omit<SubscriptionBilling, 'id'>): Promise<string> {
  const schemaValidated = subscriptionBillingSchema.parse(data);
  const col = getDb().collection('subscriptionBilling');
  
  const docRef = col.doc();
  await docRef.set(schemaValidated);
  
  return docRef.id;
}

export async function getBillingAction(billingId: string) {
  const data = await readDoc<SubscriptionBilling>('subscriptionBilling', billingId);
  return data ? { ...data, id: billingId } : null;
}

export async function updateBillingAction(billingId: string, data: Partial<SubscriptionBilling>) {
  const db = getDb();
  const docRef = db.collection('subscriptionBilling').doc(billingId);
  
  const snap = await docRef.get();
  if (!snap.exists) throw new Error('Billing not found');
  
  const current = snap.data() as SubscriptionBilling;
  const validated = subscriptionBillingSchema.partial().parse(data);
  const updated = { ...current, ...validated };
  
  await docRef.set(updated, { merge: true });
  return { ...updated, id: billingId } as SubscriptionBilling;
}

export async function getBillingBySubscriptionIdAction(subscriptionId: string): Promise<SubscriptionBilling[]> {
  const snap = await getDb()
    .collection('subscriptionBilling')
    .where('subscriptionId', '==', subscriptionId)
    .get();

  if (snap.empty) return [];

  return snap.docs
    .map((d) => ({ 
      ...(d.data() as Omit<SubscriptionBilling, 'id'>), 
      id: d.id 
    } as SubscriptionBilling))
    .sort((a, b) => new Date((b as any).paymentDate).getTime() - new Date((a as any).paymentDate).getTime());
}