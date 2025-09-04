import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';
import { serviceCategoryOperations, getAllServiceCategories } from '@/lib/firebase/database';
import type { ServiceCategory } from '@/types/database';

interface ServiceCategoryContextType {
  getCategory: (categoryId: string) => Promise<ServiceCategory | null>;
  createCategory: (categoryId: string, data: Omit<ServiceCategory, 'id'>) => Promise<ServiceCategory>;
  updateCategory: (categoryId: string, data: Partial<ServiceCategory>) => Promise<ServiceCategory>;
  deleteCategory: (categoryId: string) => Promise<void>;
  getCategoriesBySalon: (salonId: string) => Promise<ServiceCategory[]>;
  getAllCategories: () => Promise<ServiceCategory[]>;
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
      const category = await serviceCategoryOperations.read(categoryId);
      setLoading(false);
      return category;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      return null;
    }
  }, []);

  const createCategory = useCallback(async (categoryId: string, data: Omit<ServiceCategory, 'id'>) => {
    setLoading(true);
    setError(null);
    try {
      const category = await serviceCategoryOperations.create(categoryId, data);
      setLoading(false);
      return category;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      throw e;
    }
  }, []);

  const updateCategory = useCallback(async (categoryId: string, data: Partial<ServiceCategory>) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await serviceCategoryOperations.update(categoryId, data);
      setLoading(false);
      return updated;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      throw e;
    }
  }, []);

  const deleteCategory = useCallback(async (categoryId: string) => {
    setLoading(true);
    setError(null);
    try {
      await serviceCategoryOperations.delete(categoryId);
      setLoading(false);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      throw e;
    }
  }, []);

  // Получить все категории по salonId
  const getCategoriesBySalon = useCallback(async (salonId: string) => {
    setLoading(true);
    setError(null);
    try {
      const all = await getAllServiceCategories();
      const result = Object.entries(all)
        .map(([id, data]) => ({ ...(data as any), id }))
        .filter((c) => c.salonId === salonId);
      setLoading(false);
      return result;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      return [];
    }
  }, []);

  // Получить все категории без фильтрации
  const getAllCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await getAllServiceCategories();
      const result = Object.entries(all)
        .map(([id, data]) => ({ ...(data as any), id }));
      setLoading(false);
      return result;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      return [];
    }
  }, []);

  const value: ServiceCategoryContextType = useMemo(() => ({
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoriesBySalon,
    getAllCategories,
    loading,
    error,
  }), [
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoriesBySalon,
    getAllCategories,
    loading,
    error,
  ]);

  return (
    <ServiceCategoryContext.Provider value={value}>
      {children}
    </ServiceCategoryContext.Provider>
  );
}; 