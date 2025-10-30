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

/**
 * Fetches a specified number of random service categories from the database.
 * @param limit The number of random categories to fetch.
 * @returns A promise that resolves to an array of random service categories.
 */
export const getRandomServiceCategories = async (limit: number = 15): Promise<ServiceCategory[]> => {
  const categoriesRef = ref(db, 'serviceCategories');
  const snapshot = await get(categoriesRef);

  if (!snapshot.exists()) {
    return [];
  }

  const categoriesData = snapshot.val();
  const allCategories: ServiceCategory[] = Object.entries(categoriesData).map(([id, data]) => ({
    ...(data as Omit<ServiceCategory, 'id'>),
    id,
  }));

  // Перемешиваем массив для получения случайного порядка (алгоритм Фишера–Йейтса)
  for (let i = allCategories.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allCategories[i], allCategories[j]] = [allCategories[j], allCategories[i]];
  }

  // Возвращаем первые 'limit' элементов из перемешанного массива
  return allCategories.slice(0, limit);
};


export const serviceCategoryOperations = {
  create: (categoryId: string, data: Omit<ServiceCategory, 'id'>) =>
    createOperation(`serviceCategories/${categoryId}`, data, serviceCategorySchema),
  read: (categoryId: string) => readOperation<ServiceCategory>(`serviceCategories/${categoryId}`),
  update: (categoryId: string, data: Partial<ServiceCategory>) =>
    updateOperation(`serviceCategories/${categoryId}`, data, serviceCategorySchema),
  delete: (categoryId: string) => deleteOperation(`serviceCategories/${categoryId}`),
  // Вы также можете добавить новый метод сюда для единообразия
  getRandom: (limit: number = 15) => getRandomServiceCategories(limit),
};