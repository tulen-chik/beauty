'use client'; // Не забудьте 'use client' для контекста

import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

// Импортируем отдельные функции
import { 
  createServiceCategoryAction,
  readServiceCategoryAction,
  updateServiceCategoryAction,
  deleteServiceCategoryAction,
  getServiceCategoriesBySalonIdAction,
  getRandomServiceCategoriesAction
} from '@/app/actions/serviceCategoryActions';

import type { ServiceCategory } from '@/types/database';

interface ServiceCategoryContextType {
  getCategory: (categoryId: string) => Promise<ServiceCategory | null>;
  createCategory: (categoryId: string, data: Omit<ServiceCategory, 'id'>) => Promise<ServiceCategory>;
  updateCategory: (categoryId: string, data: Partial<ServiceCategory>) => Promise<ServiceCategory>;
  deleteCategory: (categoryId: string) => Promise<void>;
  getCategoriesBySalon: (salonId: string) => Promise<ServiceCategory[]>;
  getRandomCategories: (limit?: number) => Promise<ServiceCategory[]>;
  loading: boolean;
  error: string | null;
}

const ServiceCategoryContext = createContext<ServiceCategoryContextType | undefined>(undefined);

export const useServiceCategory = () => {
  const ctx = useContext(ServiceCategoryContext);
  if (!ctx) throw new Error('useServiceCategory must be used within ServiceCategoryProvider');
  return ctx;
};

export const ServiceCategoryProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCategory = useCallback(async (categoryId: string) => {
    setLoading(true);
    setError(null);
    try {
      // Используем импортированную функцию напрямую
      const category = await readServiceCategoryAction(categoryId);
      return category;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createCategory = useCallback(async (categoryId: string, data: Omit<ServiceCategory, 'id'>) => {
    setLoading(true);
    setError(null);
    try {
      const category = await createServiceCategoryAction(categoryId, data);
      return category;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCategory = useCallback(async (categoryId: string, data: Partial<ServiceCategory>) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await updateServiceCategoryAction(categoryId, data);
      return updated;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCategory = useCallback(async (categoryId: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteServiceCategoryAction(categoryId);
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCategoriesBySalon = useCallback(async (salonId: string) => {
    setLoading(true);
    setError(null);
    try {
      const categories = await getServiceCategoriesBySalonIdAction(salonId);
      return categories;
    } catch (e: any) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getRandomCategories = useCallback(async (limit: number = 15) => {
    setLoading(true);
    setError(null);
    try {
      const categories = await getRandomServiceCategoriesAction(limit);
      return categories;
    } catch (e: any) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const value: ServiceCategoryContextType = useMemo(() => ({
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoriesBySalon,
    getRandomCategories,
    loading,
    error,
  }), [
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoriesBySalon,
    getRandomCategories,
    loading,
    error,
  ]);

  return (
    <ServiceCategoryContext.Provider value={value}>
      {children}
    </ServiceCategoryContext.Provider>
  );
};