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
      executeOperation(async () => {
      const response = await fetch(`/api/subscription-plans/${planId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to get subscription plan');
      }
      return await response.json();
    }, { defaultValue: null }),
    [executeOperation]
  );

  const getAllSubscriptionPlans = useCallback(
    () => 
      executeOperation(async () => {
      const response = await fetch('/api/subscription-plans');
      if (!response.ok) throw new Error('Failed to get all subscription plans');
      return await response.json();
    }, { defaultValue: [] }),
    [executeOperation]
  );

  const getActiveSubscriptionPlans = useCallback(
    () => 
      executeOperation(async () => {
      const response = await fetch('/api/subscription-plans?activeOnly=true');
      if (!response.ok) throw new Error('Failed to get active subscription plans');
      return await response.json();
    }, { defaultValue: [] }),
    [executeOperation]
  );

  const createSubscriptionPlan = useCallback(
    async (planId: string, data: Omit<SalonSubscriptionPlan, 'id'>) => {
      await executeOperation(async () => {
        const response = await fetch('/api/subscription-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId, ...data }),
        });
        if (!response.ok) throw new Error('Failed to create subscription plan');
      }, { defaultValue: undefined });
    },
    [executeOperation]
  );

  const updateSubscriptionPlan = useCallback(
    async (planId: string, data: Partial<SalonSubscriptionPlan>) => {
      await executeOperation(async () => {
        const response = await fetch(`/api/subscription-plans/${planId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update subscription plan');
      }, { defaultValue: undefined });
    },
    [executeOperation]
  );

  const deleteSubscriptionPlan = useCallback(
    async (planId: string) => {
      await executeOperation(async () => {
        const response = await fetch(`/api/subscription-plans/${planId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete subscription plan');
      }, { defaultValue: undefined });
    },
    [executeOperation]
  );

  // --- Subscriptions ---
  const getSubscription = useCallback(
    (subscriptionId: string) => 
      executeOperation(async () => {
      const response = await fetch(`/api/subscriptions/${subscriptionId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to get subscription');
      }
      return await response.json();
    }, { defaultValue: null }),
    [executeOperation]
  );

  const getSalonSubscription = useCallback(
    (salonId: string) => 
      executeOperation(async () => {
      const response = await fetch(`/api/salons/${salonId}/subscriptions`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to get salon subscription');
      }
      return await response.json();
    }, { defaultValue: null }),
    [executeOperation]
  );

  const getSalonSubscriptions = useCallback(
    (salonId: string) => 
      executeOperation(async () => {
      const response = await fetch(`/api/salons/${salonId}/subscriptions?all=true`);
      if (!response.ok) {
        throw new Error('Failed to get all salon subscriptions');
      }
      return await response.json();
    }, { defaultValue: [] }),
    [executeOperation]
  );

  const createSubscription = useCallback(
    async (subscriptionId: string, data: Omit<SalonSubscription, 'id'>) => {
      await executeOperation(async () => {
        const response = await fetch('/api/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscriptionId, ...data }),
        });
        if (!response.ok) throw new Error('Failed to create subscription');
      }, { defaultValue: undefined });
    },
    [executeOperation]
  );

  const updateSubscription = useCallback(
    async (subscriptionId: string, data: Partial<SalonSubscription>) => {
      await executeOperation(async () => {
        const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update subscription');
      }, { defaultValue: undefined });
    },
    [executeOperation]
  );

  const cancelSubscription = useCallback(
    async (subscriptionId: string, reason?: string) => {
      await executeOperation(async () => {
        const response = await fetch(`/api/subscriptions/${subscriptionId}/cancel`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        });
        if (!response.ok) throw new Error('Failed to cancel subscription');
      }, { defaultValue: undefined });
    },
    [executeOperation]
  );

  const renewSubscription = useCallback(
    async (subscriptionId: string, newEndDate: string) => {
      await executeOperation(async () => {
        const response = await fetch(`/api/subscriptions/${subscriptionId}/renew`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newEndDate }),
        });
        if (!response.ok) throw new Error('Failed to renew subscription');
      }, { defaultValue: undefined });
    },
    [executeOperation]
  );

  const getExpiringSoonSubscriptions = useCallback(
    (daysAhead = 7) => 
      executeOperation(async () => {
      const response = await fetch(`/api/subscriptions?expiring=true&daysAhead=${daysAhead}`);
      if (!response.ok) {
        throw new Error('Failed to get expiring subscriptions');
      }
      return await response.json();
    }, { defaultValue: [] }),
    [executeOperation]
  );

  // --- Billing ---
  const createBilling = useCallback(
    (data: Omit<SubscriptionBilling, 'id'>): Promise<string | null> => {
      return executeOperation(async () => {
        const response = await fetch('/api/billing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to create billing record');
        const result = await response.json();
        return result.id;
      }, { defaultValue: null });
    },
    [executeOperation]
  );

  const getBilling = useCallback(
    (billingId: string) => 
      executeOperation(async () => {
        const response = await fetch(`/api/billing/${billingId}`);
        if (!response.ok) {
          if (response.status === 404) return null;
          throw new Error('Failed to get billing record');
        }
        return await response.json();
      }, { defaultValue: null }),
    [executeOperation]
  );

  const updateBilling = useCallback(
    async (billingId: string, data: Partial<SubscriptionBilling>) => {
      await executeOperation(async () => {
        const response = await fetch(`/api/billing/${billingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update billing record');
      }, { defaultValue: undefined });
    },
    [executeOperation]
  );

  const getSubscriptionBilling = useCallback(
    (subscriptionId: string) => 
      executeOperation(async () => {
        const response = await fetch(`/api/subscriptions/${subscriptionId}/billing`);
        if (!response.ok) {
          throw new Error('Failed to get billing records for subscription');
        }
        return await response.json();
      }, { defaultValue: [] }),
    [executeOperation]
  );

  // --- Helpers ---
  const getSubscriptionFeatures = useCallback(async (salonId: string): Promise<string[]> => {
    return executeOperation(async () => {
      const subscription = await getSalonSubscription(salonId);
      if (!subscription) return [];

      const plan = await getSubscriptionPlan(subscription.planId);
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