import { ref, query, get, orderByChild, equalTo } from "firebase/database";
import { db } from './init';
import type { ServiceCategory } from '@/types/database';
import { createOperation, readOperation, updateOperation, deleteOperation } from "./crud";
import { serviceCategorySchema } from "./schemas";

/**
 * Fetches service categories for a specific salon
 * @param salonId ID of the salon
 * @returns Array of service categories
 */
export const getServiceCategoriesBySalonId = async (salonId: string): Promise<ServiceCategory[]> => {
  const categoriesRef = ref(db, 'serviceCategories');
  const categoriesQuery = query(categoriesRef, orderByChild('salonId'), equalTo(salonId));

  const snapshot = await get(categoriesQuery);

  if (!snapshot.exists()) {
    return [];
  }

  const categoriesData = snapshot.val();
  return Object.entries(categoriesData).map(([id, data]) => ({
    ...(data as Omit<ServiceCategory, 'id'>),
    id,
  }));
};

export const serviceCategoryOperations = {
  create: (categoryId: string, data: Omit<ServiceCategory, 'id'>) =>
    createOperation(`serviceCategories/${categoryId}`, data, serviceCategorySchema),
  read: (categoryId: string) => readOperation<ServiceCategory>(`serviceCategories/${categoryId}`),
  update: (categoryId: string, data: Partial<ServiceCategory>) =>
    updateOperation(`serviceCategories/${categoryId}`, data, serviceCategorySchema),
  delete: (categoryId: string) => deleteOperation(`serviceCategories/${categoryId}`),
};
