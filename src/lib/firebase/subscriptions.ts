import { equalTo, get, orderByChild, push,query, ref } from 'firebase/database';

import { createOperation, deleteOperation,readOperation, updateOperation } from './crud';
import { db } from './init';
import { subscriptionBillingSchema, subscriptionPlanSchema, subscriptionSchema } from './schemas';

import type { SalonSubscription, SalonSubscriptionPlan, SubscriptionBilling } from '@/types/subscriptions';

// Операции для планов подписок
export const subscriptionPlanOperations = {
  create: (planId: string, data: Omit<SalonSubscriptionPlan, 'id'>) =>
    createOperation(`subscriptionPlans/${planId}`, data, subscriptionPlanSchema),

  read: (planId: string) => readOperation<SalonSubscriptionPlan>(`subscriptionPlans/${planId}`),

  update: (planId: string, data: Partial<SalonSubscriptionPlan>) =>
    updateOperation(`subscriptionPlans/${planId}`, data, subscriptionPlanSchema),

  delete: (planId: string) => deleteOperation(`subscriptionPlans/${planId}`),

  readAll: async (): Promise<SalonSubscriptionPlan[]> => {
    try {
      const snapshot = await get(ref(db, 'subscriptionPlans'));
      if (!snapshot.exists()) return [];
      const raw = snapshot.val() as Record<string, Omit<SalonSubscriptionPlan, 'id'>>;
      return Object.entries(raw)
        .map(([id, plan]) => ({ id, ...plan }))
        .filter(plan => plan.isActive)
        .sort((a, b) => a.price - b.price);
    } catch (error) {
      console.error('Error reading subscription plans:', error);
      return [];
    }
  },

  readActive: async (): Promise<SalonSubscriptionPlan[]> => {
    try {
      const snapshot = await get(ref(db, 'subscriptionPlans'));
      if (!snapshot.exists()) return [];
      const raw = snapshot.val() as Record<string, Omit<SalonSubscriptionPlan, 'id'>>;
      return Object.entries(raw)
        .map(([id, plan]) => ({ id, ...plan }))
        .filter(plan => plan.isActive)
        .sort((a, b) => a.price - b.price);
    } catch (error) {
      console.error('Error reading active subscription plans:', error);
      return [];
    }
  }
};

// Операции для подписок салонов
export const subscriptionOperations = {
  create: (subscriptionId: string, data: Omit<SalonSubscription, 'id'>) =>
    createOperation(`subscriptions/${subscriptionId}`, data, subscriptionSchema),

  read: (subscriptionId: string) => readOperation<SalonSubscription>(`subscriptions/${subscriptionId}`),

  update: (subscriptionId: string, data: Partial<SalonSubscription>) =>
    updateOperation(`subscriptions/${subscriptionId}`, data, subscriptionSchema),

  delete: (subscriptionId: string) => deleteOperation(`subscriptions/${subscriptionId}`),

  findBySalonId: async (salonId: string): Promise<SalonSubscription | null> => {
    if (!salonId) {
      console.error('Salon ID is required');
      return null;
    }
    
    try {
      const subscriptionsRef = query(ref(db, 'subscriptions'), orderByChild('salonId'), equalTo(salonId));
      const snapshot = await get(subscriptionsRef);
      if (!snapshot.exists()) return null;

      const subscriptions = snapshot.val() as Record<string, Omit<SalonSubscription, 'id'>>;
      const activeSubscription = Object.entries(subscriptions)
        .map(([id, sub]) => ({ ...sub, id }))
        .find(sub => sub.status === 'active' || sub.status === 'trialing');
      
      return activeSubscription || null;
    } catch (error) {
      console.error('Error finding subscription by salon ID:', error);
      return null;
    }
  },

  findAllBySalonId: async (salonId: string): Promise<SalonSubscription[]> => {
    try {
      const subscriptionsRef = query(ref(db, 'subscriptions'), orderByChild('salonId'), equalTo(salonId));
      const snapshot = await get(subscriptionsRef);
      if (!snapshot.exists()) return [];

      const subscriptions = snapshot.val() as Record<string, SalonSubscription>;
      return Object.entries(subscriptions)
        .map(([id, sub]) => ({ ...sub, id }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error finding all subscriptions by salon ID:', error);
      return [];
    }
  },

  findExpiringSoon: async (daysAhead = 7): Promise<SalonSubscription[]> => {
    if (daysAhead <= 0) {
      console.error('Days ahead must be a positive number');
      return [];
    }

    try {
      const snapshot = await get(ref(db, 'subscriptions'));
      if (!snapshot.exists()) return [];

      const now = new Date();
      const futureDate = new Date(now);
      futureDate.setDate(now.getDate() + daysAhead);

      const subscriptions = snapshot.val() as Record<string, Omit<SalonSubscription, 'id'>>;
      const expiringSubscriptions = Object.entries(subscriptions)
        .map(([id, sub]) => ({
          id,
          ...sub,
          currentPeriodEnd: new Date(sub.currentPeriodEnd).toISOString(),
          currentPeriodStart: new Date(sub.currentPeriodStart).toISOString()
        }))
        .filter(sub => {
          if (sub.status !== 'active' && sub.status !== 'trialing') return false;
          
          const endDate = new Date(sub.currentPeriodEnd);
          return endDate > now && endDate <= futureDate;
        })
        .sort((a, b) => new Date(a.currentPeriodEnd).getTime() - new Date(b.currentPeriodEnd).getTime());

      return expiringSubscriptions;
    } catch (error) {
      console.error('Error finding expiring subscriptions:', error);
      return [];
    }
  },

  cancelSubscription: async (subscriptionId: string, reason?: string): Promise<void> => {
    if (!subscriptionId) {
      throw new Error('Subscription ID is required');
    }

    try {
      // First verify subscription exists
      const subscription = await subscriptionOperations.read(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Only allow canceling active or trialing subscriptions
      if (subscription.status !== 'active' && subscription.status !== 'trialing') {
        throw new Error(`Cannot cancel subscription with status: ${subscription.status}`);
      }

      const updates: Partial<SalonSubscription> = {
        status: 'canceled',
        canceledAt: new Date().toISOString()
      };
      
      // Add note if reason is provided (using type assertion since note is not in the type)
      if (reason) {
        (updates as any).note = reason;
      }

      await updateOperation(`subscriptions/${subscriptionId}`, updates, subscriptionSchema);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      // Re-throw with more context
      throw new Error(`Failed to cancel subscription: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  renewSubscription: async (subscriptionId: string, newEndDate: string): Promise<void> => {
    if (!subscriptionId) {
      throw new Error('Subscription ID is required');
    }

    try {
      const subscription = await subscriptionOperations.read(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const plan = await subscriptionPlanOperations.read(subscription.planId);
      if (!plan) {
        throw new Error('Subscription plan not found');
      }

      // Вычисляем следующую дату платежа
      const nextPaymentDate = new Date(newEndDate);
      switch (plan.billingPeriod) {
        case 'monthly':
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
          break;
        case 'quarterly':
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 3);
          break;
        case 'yearly':
          nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
          break;
      }

      await subscriptionOperations.update(subscriptionId, {
        status: 'active',
        // endDate: newEndDate,
        // nextPaymentDate: nextPaymentDate.toISOString(),
        // updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error renewing subscription:', error);
      throw error;
    }
  }
};

// Операции для истории платежей
export const billingOperations = {
  create: async (data: Omit<SubscriptionBilling, 'id'>) => {
    try {
      const billingRef = push(ref(db, 'subscriptionBilling'));
      const billingId = billingRef.key!;
      await createOperation(`subscriptionBilling/${billingId}`, data, subscriptionBillingSchema);
      return billingId;
    } catch (error) {
      console.error('Error creating billing record:', error);
      throw error;
    }
  },

  read: (billingId: string) => readOperation<SubscriptionBilling>(`subscriptionBilling/${billingId}`),

  update: (billingId: string, data: Partial<SubscriptionBilling>) =>
    updateOperation(`subscriptionBilling/${billingId}`, data, subscriptionBillingSchema),

  findBySubscriptionId: async (subscriptionId: string): Promise<SubscriptionBilling[]> => {
    try {
      const billingRef = query(ref(db, 'subscriptionBilling'), orderByChild('subscriptionId'), equalTo(subscriptionId));
      const snapshot = await get(billingRef);
      if (!snapshot.exists()) return [];

      const billing = snapshot.val() as Record<string, SubscriptionBilling>;
      return Object.entries(billing)
        .map(([id, record]) => ({ ...record, id }))
        .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
    } catch (error) {
      console.error('Error finding billing by subscription ID:', error);
      return [];
    }
  }
};

