'use client'; // Обязательно для контекста

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

// Импортируем отдельные функции
import {
  // Plans
  createSubscriptionPlanAction,
  getSubscriptionPlanAction,
  updateSubscriptionPlanAction,
  deleteSubscriptionPlanAction,
  getAllSubscriptionPlansAction,
  getActiveSubscriptionPlansAction,
  // Subscriptions
  createSubscriptionAction,
  getSubscriptionAction,
  updateSubscriptionAction,
  getSubscriptionBySalonIdAction,
  getAllSubscriptionsBySalonIdAction,
  getExpiringSubscriptionsAction,
  cancelSubscriptionAction,
  renewSubscriptionAction,
  // Billing
  createBillingAction,
  getBillingAction,
  updateBillingAction,
  getBillingBySubscriptionIdAction
} from '@/app/actions/subscriptionActions';

import type {
  SalonSubscription,
  SalonSubscriptionPlan,
  SubscriptionBilling,
} from '@/types/subscriptions';

// Custom hook for debouncing
function useDebounce(callback: () => void, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback();
    }, delay);
  }, [callback, delay]);

  return debouncedCallback;
}

const handleError = (e: any) => {
  console.error(e);
  const errorMessage = e.message || 'Произошла ошибка';
  return Promise.reject(new Error(errorMessage));
};

interface SubscriptionContextType {
  getSubscriptionPlan: (planId: string) => Promise<SalonSubscriptionPlan | null>;
  getAllSubscriptionPlans: () => Promise<SalonSubscriptionPlan[]>;
  getActiveSubscriptionPlans: () => Promise<SalonSubscriptionPlan[]>;
  createSubscriptionPlan: (planId: string, data: Omit<SalonSubscriptionPlan, 'id'>) => Promise<void>;
  updateSubscriptionPlan: (planId: string, data: Partial<SalonSubscriptionPlan>) => Promise<void>;
  deleteSubscriptionPlan: (planId: string) => Promise<void>;

  getSubscription: (subscriptionId: string) => Promise<SalonSubscription | null>;
  getSalonSubscription: (salonId: string) => Promise<SalonSubscription | null>;
  getSalonSubscriptions: (salonId: string) => Promise<SalonSubscription[]>;
  createSubscription: (subscriptionId: string, data: Omit<SalonSubscription, 'id'>) => Promise<void>;
  updateSubscription: (subscriptionId: string, data: Partial<SalonSubscription>) => Promise<void>;
  cancelSubscription: (subscriptionId: string, reason?: string) => Promise<void>;
  renewSubscription: (subscriptionId: string, newEndDate: string) => Promise<void>;
  getExpiringSoonSubscriptions: (daysAhead?: number) => Promise<SalonSubscription[]>;

  createBilling: (data: Omit<SubscriptionBilling, 'id'>) => Promise<string | null>;
  getBilling: (billingId: string) => Promise<SubscriptionBilling | null>;
  updateBilling: (billingId: string, data: Partial<SubscriptionBilling>) => Promise<void>;
  getSubscriptionBilling: (subscriptionId: string) => Promise<SubscriptionBilling[]>;

  getSubscriptionFeatures: (salonId: string) => Promise<string[]>;

  loading: boolean;
  error: string | null;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within a SubscriptionProvider');
  return ctx;
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider = ({ children }: SubscriptionProviderProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const batchedOperations = useRef<Map<string, Promise<any>>>(new Map());

  const clearErrorDebounced = useDebounce(() => setError(null), 5000);

  const executeOperation = useCallback(async function<T>(
    operation: () => Promise<T>,
    { cacheKey, defaultValue }: { cacheKey?: string; defaultValue: T }
  ): Promise<T> {
    if (cacheKey && batchedOperations.current.has(cacheKey)) {
      return batchedOperations.current.get(cacheKey);
    }

    setLoading(true);
    setError(null);

    const promise = operation()
      .catch((e: any) => {
        const errorMessage = e.message || 'Произошла ошибка';
        setError(errorMessage);
        clearErrorDebounced();
        handleError(e);
        return defaultValue;
      })
      .finally(() => {
        setLoading(false);
        if (cacheKey) {
          batchedOperations.current.delete(cacheKey);
        }
      });

    if (cacheKey) {
      batchedOperations.current.set(cacheKey, promise);
    }

    return promise;
  }, [clearErrorDebounced]);

  // --- Plans ---
  const getSubscriptionPlan = useCallback(
    (planId: string) => 
      executeOperation(() => getSubscriptionPlanAction(planId), { defaultValue: null }),
    [executeOperation]
  );

  const getAllSubscriptionPlans = useCallback(
    () => 
      executeOperation(() => getAllSubscriptionPlansAction(), { defaultValue: [] }),
    [executeOperation]
  );

  const getActiveSubscriptionPlans = useCallback(
    () => 
      executeOperation(() => getActiveSubscriptionPlansAction(), { defaultValue: [] }),
    [executeOperation]
  );

  const createSubscriptionPlan = useCallback(
    async (planId: string, data: Omit<SalonSubscriptionPlan, 'id'>) => {
      await executeOperation(() => createSubscriptionPlanAction(planId, data), { defaultValue: undefined });
    },
    [executeOperation]
  );

  const updateSubscriptionPlan = useCallback(
    async (planId: string, data: Partial<SalonSubscriptionPlan>) => {
      await executeOperation(() => updateSubscriptionPlanAction(planId, data), { defaultValue: undefined });
    },
    [executeOperation]
  );

  const deleteSubscriptionPlan = useCallback(
    async (planId: string) => {
      await executeOperation(() => deleteSubscriptionPlanAction(planId), { defaultValue: undefined });
    },
    [executeOperation]
  );

  // --- Subscriptions ---
  const getSubscription = useCallback(
    (subscriptionId: string) => 
      executeOperation(() => getSubscriptionAction(subscriptionId), { defaultValue: null }),
    [executeOperation]
  );

  const getSalonSubscription = useCallback(
    (salonId: string) => 
      executeOperation(() => getSubscriptionBySalonIdAction(salonId), { defaultValue: null }),
    [executeOperation]
  );

  const getSalonSubscriptions = useCallback(
    (salonId: string) => 
      executeOperation(() => getAllSubscriptionsBySalonIdAction(salonId), { defaultValue: [] }),
    [executeOperation]
  );

  const createSubscription = useCallback(
    async (subscriptionId: string, data: Omit<SalonSubscription, 'id'>) => {
      await executeOperation(() => createSubscriptionAction(subscriptionId, data), { defaultValue: undefined });
    },
    [executeOperation]
  );

  const updateSubscription = useCallback(
    async (subscriptionId: string, data: Partial<SalonSubscription>) => {
      await executeOperation(() => updateSubscriptionAction(subscriptionId, data), { defaultValue: undefined });
    },
    [executeOperation]
  );

  const cancelSubscription = useCallback(
    async (subscriptionId: string, reason?: string) => {
      await executeOperation(() => cancelSubscriptionAction(subscriptionId, reason), { defaultValue: undefined });
    },
    [executeOperation]
  );

  const renewSubscription = useCallback(
    async (subscriptionId: string, newEndDate: string) => {
      await executeOperation(() => renewSubscriptionAction(subscriptionId, newEndDate), { defaultValue: undefined });
    },
    [executeOperation]
  );

  const getExpiringSoonSubscriptions = useCallback(
    (daysAhead = 7) => 
      executeOperation(() => getExpiringSubscriptionsAction(daysAhead), { defaultValue: [] }),
    [executeOperation]
  );

  // --- Billing ---
  const createBilling = useCallback(
    (data: Omit<SubscriptionBilling, 'id'>): Promise<string | null> => {
      return executeOperation(() => createBillingAction(data), { defaultValue: null });
    },
    [executeOperation]
  );

  const getBilling = useCallback(
    (billingId: string) => 
      executeOperation(() => getBillingAction(billingId), { defaultValue: null }),
    [executeOperation]
  );

  const updateBilling = useCallback(
    async (billingId: string, data: Partial<SubscriptionBilling>) => {
      await executeOperation(() => updateBillingAction(billingId, data), { defaultValue: undefined });
    },
    [executeOperation]
  );

  const getSubscriptionBilling = useCallback(
    (subscriptionId: string) => 
      executeOperation(() => getBillingBySubscriptionIdAction(subscriptionId), { defaultValue: [] }),
    [executeOperation]
  );

  // --- Helpers ---
  const getSubscriptionFeatures = useCallback(async (salonId: string): Promise<string[]> => {
    return executeOperation(async () => {
      const subscription = await getSubscriptionBySalonIdAction(salonId);
      if (!subscription) return [];
      
      const plan = await getSubscriptionPlanAction(subscription.planId);
      return plan?.features || [];
    }, { defaultValue: [] });
  }, [executeOperation]);

  const value: SubscriptionContextType = useMemo(() => ({
    getSubscriptionPlan,
    getAllSubscriptionPlans,
    getActiveSubscriptionPlans,
    createSubscriptionPlan,
    updateSubscriptionPlan,
    deleteSubscriptionPlan,
    getSubscription,
    getSalonSubscription,
    getSalonSubscriptions,
    createSubscription,
    updateSubscription,
    cancelSubscription,
    renewSubscription,
    getExpiringSoonSubscriptions,
    createBilling,
    getBilling,
    updateBilling,
    getSubscriptionBilling,
    getSubscriptionFeatures,
    loading,
    error
  }), [
    loading,
    error,
    getSubscriptionPlan,
    getAllSubscriptionPlans,
    getActiveSubscriptionPlans,
    createSubscriptionPlan,
    updateSubscriptionPlan,
    deleteSubscriptionPlan,
    getSubscription,
    getSalonSubscription,
    getSalonSubscriptions,
    createSubscription,
    updateSubscription,
    cancelSubscription,
    renewSubscription,
    getExpiringSoonSubscriptions,
    createBilling,
    getBilling,
    updateBilling,
    getSubscriptionBilling,
    getSubscriptionFeatures
  ]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};