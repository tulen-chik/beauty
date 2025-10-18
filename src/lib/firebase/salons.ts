import { batchOperation,createOperation, deleteOperation, readOperation, updateOperation } from './crud';
import {
  salonInvitationSchema,
  salonScheduleSchema,
  salonSchema,
  salonServiceSchema,
  serviceCategorySchema,
  userSalonsSchema,
} from './schemas';

import type {
  Salon,
  SalonInvitation,
  SalonSchedule,
  SalonService,
  ServiceCategory,
  UserSalons,
} from '@/types/database';

import { ref, query, get, orderByChild, equalTo, limitToFirst, startAfter } from "firebase/database"

import { db } from './init';
import { z } from 'zod';


// Simple in-memory cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper function to handle cache
const withCache = async <T>(
  key: string,
  fn: () => Promise<T>,
  useCache = true
): Promise<T> => {
  const now = Date.now();
  const cached = cache.get(key) as CacheEntry<T> | undefined;
  
  if (useCache && cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data = await fn();
  cache.set(key, { data, timestamp: now });
  return data;
};

export const salonOperations = {
  create: async (salonId: string, data: Omit<Salon, 'id'>) => {
    const result = await createOperation(`salons/${salonId}`, data, salonSchema);
    cache.delete(`salon_${salonId}`);
    return result;
  },
  read: (salonId: string, useCache = true) => 
    withCache<Salon | null>(
      `salon_${salonId}`,
      () => readOperation<Salon>(`salons/${salonId}`),
      useCache
    ),
  update: async (salonId: string, data: Partial<Salon>) => {
    const result = await updateOperation(`salons/${salonId}`, data, salonSchema);
    cache.delete(`salon_${salonId}`);
    return result;
  },
  delete: async (salonId: string) => {
    await deleteOperation(`salons/${salonId}`);
    cache.delete(`salon_${salonId}`);
  },
  // Batch operations
  batchUpdate: async (updates: Array<{id: string; data: Partial<Salon>}>) => {
    const paths = updates.map(update => `salons/${update.id}`);
    const data = updates.map(update => update.data);
    const results = await batchOperation(paths, data, salonSchema);
    updates.forEach(update => cache.delete(`salon_${update.id}`));
    return results;
  }
};

export const userSalonsOperations = {
  create: (userId: string, data: Omit<UserSalons, 'id'>) =>
    createOperation(`userSalons/${userId}`, data, userSalonsSchema),
  read: (userId: string) => readOperation<UserSalons>(`userSalons/${userId}`),
  update: (userId: string, data: Partial<UserSalons>) =>
    updateOperation(`userSalons/${userId}`, data, userSalonsSchema),
  delete: (userId: string) => deleteOperation(`userSalons/${userId}`),
};

export const salonInvitationOperations = {
  create: (invitationId: string, data: Omit<SalonInvitation, 'id'>) =>
    createOperation(`salonInvitations/${invitationId}`, data, salonInvitationSchema),
  read: (invitationId: string) => readOperation<SalonInvitation>(`salonInvitations/${invitationId}`),
  update: (invitationId: string, data: Partial<SalonInvitation>) =>
    updateOperation(`salonInvitations/${invitationId}`, data, salonInvitationSchema),
  delete: (invitationId: string) => deleteOperation(`salonInvitations/${invitationId}`),
  
  /**
   * Получает все приглашения для указанного email.
   * @param email Email пользователя для поиска приглашений.
   * @returns Массив приглашений.
   */
  getInvitationsByEmail: async (email: string): Promise<SalonInvitation[]> => {
    const invitationsRef = ref(db, 'salonInvitations');
    const invitationsQuery = query(invitationsRef, orderByChild('email'), equalTo(email));
    const snapshot = await get(invitationsQuery);

    if (!snapshot.exists()) {
      return [];
    }

    const invitationsData = snapshot.val();
    return Object.entries(invitationsData).map(([id, data]) => ({
      ...(data as Omit<SalonInvitation, 'id'>),
      id,
    }));
  },

  /**
   * Получает все приглашения для указанного салона.
   * @param salonId ID салона для поиска приглашений.
   * @returns Массив приглашений.
   */
  getInvitationsBySalonId: async (salonId: string): Promise<SalonInvitation[]> => {
    const invitationsRef = ref(db, 'salonInvitations');
    const invitationsQuery = query(invitationsRef, orderByChild('salonId'), equalTo(salonId));
    const snapshot = await get(invitationsQuery);

    if (!snapshot.exists()) {
      return [];
    }

    const invitationsData = snapshot.val();
    return Object.entries(invitationsData).map(([id, data]) => ({
      ...(data as Omit<SalonInvitation, 'id'>),
      id,
    }));
  },
};
export const salonServiceOperations = {
  create: (serviceId: string, data: Omit<SalonService, 'id'>) =>
    createOperation(`salonServices/${serviceId}`, data, salonServiceSchema),
  read: (serviceId: string) => readOperation<SalonService>(`salonServices/${serviceId}`),
  update: (serviceId: string, data: Partial<SalonService>) =>
    updateOperation(`salonServices/${serviceId}`, data, salonServiceSchema),
  delete: (serviceId: string) => deleteOperation(`salonServices/${serviceId}`),
  
};

export const salonScheduleOperations = {
  create: (salonId: string, data: SalonSchedule): Promise<SalonSchedule> =>
    createOperation<SalonSchedule>(`salonSchedules/${salonId}`, data, salonScheduleSchema),
  read: (salonId: string): Promise<SalonSchedule | null> => readOperation<SalonSchedule>(`salonSchedules/${salonId}`),
  update: (salonId: string, data: Partial<SalonSchedule>): Promise<SalonSchedule> =>
    updateOperation<SalonSchedule>(`salonSchedules/${salonId}`, data, salonScheduleSchema),
  delete: (salonId: string): Promise<void> => deleteOperation(`salonSchedules/${salonId}`),
};

export const getServicesBySalonFromDB = async (salonId: string): Promise<SalonService[]> => {
  const servicesRef = ref(db, 'salonServices');
  
  // Создаем запрос для фильтрации на сервере Firebase
  const servicesQuery = query(servicesRef, orderByChild('salonId'), equalTo(salonId));

  const snapshot = await get(servicesQuery);

  if (!snapshot.exists()) {
    return []; // Возвращаем пустой массив, если услуги не найдены
  }

  const servicesData = snapshot.val();
  // Преобразуем объект, полученный от Firebase, в массив
  return Object.entries(servicesData).map(([id, data]) => ({
    ...(data as Omit<SalonService, 'id'>),
    id,
  }));
};

/**
 * Получает услуги с постраничной загрузкой
 * @param options Опции пагинации
 * @returns Объект с массивом услуг и ключом для следующей страницы
 */
export const getSalonServicesPaginated = async (options: { 
  limit: number; 
  startAfterKey?: string 
}): Promise<{ services: SalonService[]; nextKey: string | null }> => {
  const { limit, startAfterKey } = options;
  const servicesRef = ref(db, 'salonServices');
  
  // Создаем базовый запрос с сортировкой по ключу
  let servicesQuery = query(
    servicesRef,
    orderByChild('createdAt'),
    limitToFirst(limit + 1) // Берем на 1 больше, чтобы определить, есть ли следующая страница
  );

  // Если передан ключ для пагинации, добавляем его в запрос
  if (startAfterKey) {
    const lastService = await readOperation<SalonService>(`salonServices/${startAfterKey}`);
    if (lastService) {
      servicesQuery = query(
        servicesRef,
        orderByChild('createdAt'),
        startAfter(lastService.createdAt),
        limitToFirst(limit + 1)
      );
    }
  }

  const snapshot = await get(servicesQuery);

  if (!snapshot.exists()) {
    return { services: [], nextKey: null };
  }

  const servicesData = snapshot.val();
  const services: SalonService[] = [];
  let lastKey: string | null = null;
  
  // Преобразуем объект в массив и получаем последний ключ
  Object.entries(servicesData).forEach(([id, data], index) => {
    if (index < limit) {
      services.push({
        ...(data as Omit<SalonService, 'id'>),
        id,
      });
    }
    lastKey = id;
  });

  // Проверяем, есть ли следующая страница
  const hasNextPage = Object.keys(servicesData).length > limit;
  
  return {
    services,
    nextKey: hasNextPage ? lastKey : null
  };
};

export const getSalonServicesByCityPaginated = async (options: {
  city: string;
  limit: number;
  startAfterKey?: string;
}): Promise<{ services: SalonService[]; nextKey: string | null }> => {
  const { city, limit, startAfterKey } = options;
  const servicesRef = ref(db, 'salonServices');

  // Базовый запрос фильтрует по городу и сортирует по дате создания для пагинации.
  // Firebase Realtime Database требует, чтобы поле для фильтрации (equalTo)
  // было тем же, что и поле для сортировки (orderByChild).
  // Для более сложных запросов (например, фильтрация по городу и сортировка по дате)
  // может потребоваться денормализация данных (например, создание поля "city_createdAt").
  // В данном случае мы предполагаем, что сортировка по `createdAt` внутри `city` достаточна.
  let servicesQuery = query(
    servicesRef,
    orderByChild('city'),
    equalTo(city),
    limitToFirst(limit + 1)
  );

  // Пагинация в запросе с `equalTo` сложна. Вместо этого мы будем фильтровать результаты.
  // Этот подход менее эффективен, чем настоящая курсорная пагинация, но работает для
  // умеренных наборов данных.
  // Для больших наборов данных рекомендуется использовать Firestore.
  
  const snapshot = await get(servicesQuery);

  if (!snapshot.exists()) {
    return { services: [], nextKey: null };
  }

  const servicesData = snapshot.val();
  
  // Преобразуем объект в массив и сортируем по `createdAt` в порядке убывания (сначала новые)
  let allServicesForCity: SalonService[] = Object.entries(servicesData).map(([id, data]) => ({
    ...(data as Omit<SalonService, 'id'>),
    id,
  })).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  let startIndex = 0;
  if (startAfterKey) {
    const lastIndex = allServicesForCity.findIndex(s => s.id === startAfterKey);
    if (lastIndex !== -1) {
      startIndex = lastIndex + 1;
    }
  }

  const servicesOnPage = allServicesForCity.slice(startIndex, startIndex + limit);
  const lastServiceOnPage = servicesOnPage.length > 0 ? servicesOnPage[servicesOnPage.length - 1] : null;

  const hasNextPage = startIndex + limit < allServicesForCity.length;

  return {
    services: servicesOnPage,
    nextKey: hasNextPage && lastServiceOnPage ? lastServiceOnPage.id : null,
  };
};
/**
 * Получает салоны в указанном городе с постраничной загрузкой.
 * 
 * @param options - Опции для пагинации и фильтрации.
 * @param options.city - Город для поиска салонов.
 * @param options.limit - Количество салонов на странице.
 * @param options.startAfterKey - ID салона, после которого нужно начать выборку.
 * @returns Объект с массивом салонов и ключом для следующей страницы.
 */
export const getSalonsByCityPaginated = async (options: {
  city: string;
  limit: number;
  startAfterKey?: string;
}): Promise<{ salons: Salon[]; nextKey: string | null }> => {
  const { city, limit, startAfterKey } = options;
  const salonsRef = ref(db, 'salons');

  // Firebase Realtime Database требует, чтобы поле для фильтрации (equalTo)
  // было тем же, что и поле для сортировки (orderByChild).
  // Для пагинации мы будем запрашивать на один элемент больше, чтобы определить,
  // есть ли следующая страница.
  let salonsQuery = query(
    salonsRef,
    orderByChild('city'),
    equalTo(city),
    limitToFirst(limit + 1)
  );

  // Для пагинации с `equalTo` мы не можем использовать `startAfter` напрямую с другим полем.
  // Вместо этого мы будем фильтровать результаты на клиенте.
  // Этот подход менее эффективен для очень больших наборов данных.
  // Для сложных запросов рекомендуется Firestore.

  const snapshot = await get(salonsQuery);

  if (!snapshot.exists()) {
    return { salons: [], nextKey: null };
  }

  const salonsData = snapshot.val();

  // Преобразуем объект в массив и сортируем по ключу (ID), чтобы обеспечить стабильный порядок
  let allSalonsInCity: Salon[] = Object.entries(salonsData).map(([id, data]) => ({
    ...(data as Omit<Salon, 'id'>),
    id,
  })).sort((a, b) => a.id.localeCompare(b.id)); // Сортировка по ID для консистентности

  let startIndex = 0;
  if (startAfterKey) {
    const lastIndex = allSalonsInCity.findIndex(s => s.id === startAfterKey);
    if (lastIndex !== -1) {
      startIndex = lastIndex + 1;
    }
  }

  const salonsOnPage = allSalonsInCity.slice(startIndex, startIndex + limit);
  const lastSalonOnPage = salonsOnPage.length > 0 ? salonsOnPage[salonsOnPage.length - 1] : null;

  const hasNextPage = startIndex + limit < allSalonsInCity.length;

  return {
    salons: salonsOnPage,
    nextKey: hasNextPage && lastSalonOnPage ? lastSalonOnPage.id : null,
  };
};