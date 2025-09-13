import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
  useMemo,
} from 'react';
import {
  subscriptionPlanOperations,
  subscriptionOperations,
  billingOperations,
} from '@/lib/firebase/subscriptions';
import type {
  SalonSubscriptionPlan,
  SalonSubscription,
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

/**
 * Error handling utility
 */
const handleError = (e: any) => {
  console.error(e);
  const errorMessage = e.message || 'Произошла ошибка';
  // Here you can add more sophisticated error handling, e.g., logging to a service
  return Promise.reject(new Error(errorMessage));
};

/**
 * Интерфейс для контекста управления подписками салонов
 */
interface SubscriptionContextType {
  // --- Методы для работы с планами подписок ---
  getSubscriptionPlan: (planId: string) => Promise<SalonSubscriptionPlan | null>;
  getAllSubscriptionPlans: () => Promise<SalonSubscriptionPlan[]>;
  getActiveSubscriptionPlans: () => Promise<SalonSubscriptionPlan[]>;
  createSubscriptionPlan: (planId: string, data: Omit<SalonSubscriptionPlan, 'id'>) => Promise<void>;
  updateSubscriptionPlan: (planId: string, data: Partial<SalonSubscriptionPlan>) => Promise<void>;
  deleteSubscriptionPlan: (planId: string) => Promise<void>;

  // --- Методы для управления подписками салонов ---
  getSubscription: (subscriptionId: string) => Promise<SalonSubscription | null>;
  getSalonSubscription: (salonId: string) => Promise<SalonSubscription | null>;
  getSalonSubscriptions: (salonId: string) => Promise<SalonSubscription[]>;
  createSubscription: (subscriptionId: string, data: Omit<SalonSubscription, 'id'>) => Promise<void>;
  updateSubscription: (subscriptionId: string, data: Partial<SalonSubscription>) => Promise<void>;
  cancelSubscription: (subscriptionId: string, reason?: string) => Promise<void>;
  renewSubscription: (subscriptionId: string, newEndDate: string) => Promise<void>;
  getExpiringSoonSubscriptions: (daysAhead?: number) => Promise<SalonSubscription[]>;

  // --- Методы для работы с платежами ---
  createBilling: (data: Omit<SubscriptionBilling, 'id'>) => Promise<string | null>;
  getBilling: (billingId: string) => Promise<SubscriptionBilling | null>;
  updateBilling: (billingId: string, data: Partial<SubscriptionBilling>) => Promise<void>;
  getSubscriptionBilling: (subscriptionId: string) => Promise<SubscriptionBilling[]>;

  // --- Вспомогательные методы ---
  getSubscriptionFeatures: (salonId: string) => Promise<string[]>;

  // --- Состояния контекста ---
  loading: boolean;
  error: string | null;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

/**
 * Хук для удобного доступа к SubscriptionContext
 */
export const useSubscription = () => {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within a SubscriptionProvider');
  return ctx;
};

/**
 * Провайдер для управления подписками салонов
 */
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

  // --- Методы для работы с планами подписок ---
  const getSubscriptionPlan = useCallback(
    (planId: string) => 
      executeOperation(() => subscriptionPlanOperations.read(planId), { defaultValue: null }),
    [executeOperation]
  );

  const getAllSubscriptionPlans = useCallback(
    () => 
      executeOperation(() => subscriptionPlanOperations.readAll(), { defaultValue: [] }),
    [executeOperation]
  );

  const getActiveSubscriptionPlans = useCallback(
    () => 
      executeOperation(() => subscriptionPlanOperations.readActive(), { defaultValue: [] }),
    [executeOperation]
  );

  const createSubscriptionPlan = useCallback(
    async (planId: string, data: Omit<SalonSubscriptionPlan, 'id'>) => {
      await executeOperation(() => subscriptionPlanOperations.create(planId, data), { defaultValue: undefined });
    },
    [executeOperation]
  );

  const updateSubscriptionPlan = useCallback(
    async (planId: string, data: Partial<SalonSubscriptionPlan>) => {
      await executeOperation(() => subscriptionPlanOperations.update(planId, data), { defaultValue: undefined });
    },
    [executeOperation]
  );

  const deleteSubscriptionPlan = useCallback(
    async (planId: string) => {
      await executeOperation(() => subscriptionPlanOperations.delete(planId), { defaultValue: undefined });
    },
    [executeOperation]
  );

  // --- Методы для управления подписками салонов ---
  const getSubscription = useCallback(
    (subscriptionId: string) => 
      executeOperation(() => subscriptionOperations.read(subscriptionId), { defaultValue: null }),
    [executeOperation]
  );

  const getSalonSubscription = useCallback(
    (salonId: string) => 
      executeOperation(() => subscriptionOperations.findBySalonId(salonId), { defaultValue: null }),
    [executeOperation]
  );

  const getSalonSubscriptions = useCallback(
    (salonId: string) => 
      executeOperation(() => subscriptionOperations.findAllBySalonId(salonId), { defaultValue: [] }),
    [executeOperation]
  );

  const createSubscription = useCallback(
    async (subscriptionId: string, data: Omit<SalonSubscription, 'id'>) => {
      await executeOperation(() => subscriptionOperations.create(subscriptionId, data), { defaultValue: undefined });
    },
    [executeOperation]
  );

  const updateSubscription = useCallback(
    async (subscriptionId: string, data: Partial<SalonSubscription>) => {
      await executeOperation(() => subscriptionOperations.update(subscriptionId, data), { defaultValue: undefined });
    },
    [executeOperation]
  );

  const cancelSubscription = useCallback(
    async (subscriptionId: string, reason?: string) => {
      await executeOperation(() => subscriptionOperations.cancelSubscription(subscriptionId, reason), { defaultValue: undefined });
    },
    [executeOperation]
  );

  const renewSubscription = useCallback(
    async (subscriptionId: string, newEndDate: string) => {
      await executeOperation(() => subscriptionOperations.renewSubscription(subscriptionId, newEndDate), { defaultValue: undefined });
    },
    [executeOperation]
  );

  const getExpiringSoonSubscriptions = useCallback(
    (daysAhead = 7) => 
      executeOperation(() => subscriptionOperations.findExpiringSoon(daysAhead), { defaultValue: [] }),
    [executeOperation]
  );

  // --- Методы для работы с платежами ---
  const createBilling = useCallback(
    (data: Omit<SubscriptionBilling, 'id'>): Promise<string | null> => {
      return executeOperation(() => billingOperations.create(data), { defaultValue: null });
    },
    [executeOperation]
  );

  const getBilling = useCallback(
    (billingId: string) => 
      executeOperation(() => billingOperations.read(billingId), { defaultValue: null }),
    [executeOperation]
  );

  const updateBilling = useCallback(
    async (billingId: string, data: Partial<SubscriptionBilling>) => {
      await executeOperation(() => billingOperations.update(billingId, data), { defaultValue: undefined });
    },
    [executeOperation]
  );

  const getSubscriptionBilling = useCallback(
    (subscriptionId: string) => 
      executeOperation(() => billingOperations.findBySubscriptionId(subscriptionId), { defaultValue: [] }),
    [executeOperation]
  );

  // --- Вспомогательные методы ---
  const getSubscriptionFeatures = useCallback(async (salonId: string): Promise<string[]> => {
    return executeOperation(async () => {
      const subscription = await getSalonSubscription(salonId);
      if (!subscription) return [];
      
      const plan = await getSubscriptionPlan(subscription.planId);
      return plan?.features || [];
    }, { defaultValue: [] });
  }, [executeOperation, getSalonSubscription, getSubscriptionPlan]);

  // --- Сборка значения контекста ---
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
