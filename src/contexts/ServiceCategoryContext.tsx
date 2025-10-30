import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

// --- ИЗМЕНЕНИЕ 1: Импортируем новую функцию ---
import { getServiceCategoriesBySalonId, getRandomServiceCategories, serviceCategoryOperations } from '@/lib/firebase/database'; // Предполагается, что обе функции в одном файле

import type { ServiceCategory } from '@/types/database';

// --- ИЗМЕНЕНИЕ 2: Добавляем новый метод в тип контекста ---
interface ServiceCategoryContextType {
  getCategory: (categoryId: string) => Promise<ServiceCategory | null>;
  createCategory: (categoryId: string, data: Omit<ServiceCategory, 'id'>) => Promise<ServiceCategory>;
  updateCategory: (categoryId: string, data: Partial<ServiceCategory>) => Promise<ServiceCategory>;
  deleteCategory: (categoryId: string) => Promise<void>;
  getCategoriesBySalon: (salonId: string) => Promise<ServiceCategory[]>;
  getRandomCategories: (limit?: number) => Promise<ServiceCategory[]>; // Новый метод
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
      const category = await serviceCategoryOperations.read(categoryId); // Если вы используете serviceCategoryOperations
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
      const category = await serviceCategoryOperations.create(categoryId, data);
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
      const updated = await serviceCategoryOperations.update(categoryId, data);
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
      await serviceCategoryOperations.delete(categoryId);
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
      const categories = await getServiceCategoriesBySalonId(salonId);
      return categories;
    } catch (e: any) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // --- ИЗМЕНЕНИЕ 3: Реализуем новый метод в провайдере ---
  const getRandomCategories = useCallback(async (limit: number = 15) => {
    setLoading(true);
    setError(null);
    try {
      const categories = await getRandomServiceCategories(limit);
      return categories;
    } catch (e: any) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);


  // --- ИЗМЕНЕНИЕ 4: Добавляем метод в `value` и в зависимости `useMemo` ---
  const value: ServiceCategoryContextType = useMemo(() => ({
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoriesBySalon,
    getRandomCategories, // Добавлено
    loading,
    error,
  }), [
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoriesBySalon,
    getRandomCategories, // Добавлено
    loading,
    error,
  ]);

  return (
    <ServiceCategoryContext.Provider value={value}>
      {children}
    </ServiceCategoryContext.Provider>
  );
};