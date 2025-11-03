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
  SalonMember,
  SalonSchedule,
  SalonService,
  ServiceCategory,
  UserSalons,
} from '@/types/database';

import { ref, query, get, orderByChild, equalTo, limitToFirst, startAfter, update } from "firebase/database"

import { db } from './init';
import { z } from 'zod';
import { deleteSalonAvatar, uploadSalonAvatar } from './storage';


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
  },
  /**
   * Обновляет аватар салона.
   * Удаляет старый аватар (если он есть), загружает новый и обновляет запись в базе данных.
   * @param salonId ID салона.
   * @param file Файл нового аватара.
   */
  updateAvatar: async (salonId: string, file: File) => {
    // 1. Получаем текущие данные салона, чтобы найти старый путь к аватару
    const currentSalon = await salonOperations.read(salonId, false); // `false` чтобы обойти кеш

    // 2. Если старый аватар существует, удаляем его из Storage
    if (currentSalon?.avatarStoragePath) {
      await deleteSalonAvatar(currentSalon.avatarStoragePath);
    }

    // 3. Загружаем новый файл аватара в Storage
    const { url, storagePath } = await uploadSalonAvatar(salonId, file);

    // 4. Обновляем запись салона в базе данных новыми ссылками
    // Эта операция автоматически очистит кеш для данного салона
    await salonOperations.update(salonId, {
      avatarUrl: url,
      avatarStoragePath: storagePath,
    });
  },

  /**
   * Удаляет аватар салона.
   * Удаляет файл из Storage и очищает соответствующие поля в базе данных.
   * @param salonId ID салона.
   */
  removeAvatar: async (salonId: string) => {
    // 1. Получаем текущие данные салона
    const currentSalon = await salonOperations.read(salonId, false);

    if (currentSalon?.avatarStoragePath) {
      // 2. Удаляем файл из Storage
      await deleteSalonAvatar(currentSalon.avatarStoragePath);

      // 3. Очищаем поля в базе данных
      await salonOperations.update(salonId, {
        avatarUrl: '',
        avatarStoragePath: '',
      });
    } else {
      console.log(`Salon ${salonId} has no avatar to remove.`);
    }
  },
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
    /**
   * Принимает приглашение в салон.
   * Атомарно обновляет статус приглашения, добавляет пользователя в список участников салона
   * и добавляет салон в список салонов пользователя.
   * @param options - Объект с ID приглашения и ID пользователя.
   * @returns Promise<void>
   */
  acceptInvitation: async (options: { invitationId: string; userId: string }): Promise<void> => {
    const { invitationId, userId } = options;
    const dbRef = ref(db);

    // --- Шаг 1: Получаем все необходимые данные ---
    const invitation = await salonInvitationOperations.read(invitationId);
    if (!invitation) throw new Error("Invitation not found.");
    if (invitation.status !== 'pending') {
        console.log(`Приглашение ${invitationId} уже обработано. Статус: ${invitation.status}.`);
        return; // Просто выходим, если приглашение уже не в статусе 'pending'
    }

    const salon = await salonOperations.read(invitation.salonId, false);
    if (!salon) throw new Error("Salon not found.");

    // --- Шаг 2: Готовим объект для многопутевого обновления ---
    const updates: { [key: string]: any } = {};

    // Проверяем, является ли пользователь уже участником
    const isAlreadyMember = salon.members?.some(member => member.userId === userId);

    if (isAlreadyMember) {
        console.warn(`User ${userId} is already a member of salon ${salon.id}. Only updating invitation status.`);
        // Если пользователь уже участник, нам нужно обновить ТОЛЬКО статус приглашения
        updates[`salonInvitations/${invitationId}/status`] = 'accepted';
    } else {
        // Если пользователь еще не участник, готовим полное обновление
        const userSalons = await userSalonsOperations.read(userId);
        const now = new Date().toISOString();

        const newMember: SalonMember = { userId, role: invitation.role, joinedAt: now };
        const updatedMembers = [...(salon.members || []), newMember];

        const newUserSalonEntry = { salonId: invitation.salonId, role: invitation.role, joinedAt: now };
        const updatedUserSalonsList = [...(userSalons?.salons || []), newUserSalonEntry];

        // Заполняем объект updates всеми необходимыми путями
        updates[`salonInvitations/${invitationId}/status`] = 'accepted';
        updates[`salons/${invitation.salonId}/members`] = updatedMembers;
        updates[`userSalons/${userId}/salons`] = updatedUserSalonsList;

        if (!userSalons) {
            updates[`userSalons/${userId}/userId`] = userId;
        }
    }

    // --- Шаг 3: Встроенная самодиагностика (ПРЕДПОЛЕТНАЯ ПРОВЕРКА) ---
    // Этот блок — наш предохранитель. Он проверит все ключи перед отправкой.
    for (const key in updates) {
        if (key.startsWith('/')) {
            // Если мы сюда попали, значит, в логике выше была допущена ошибка.
            // Вместо непонятной ошибки Firebase, мы получим нашу собственную, ясную ошибку.
            throw new Error(
                `КРИТИЧЕСКАЯ ОШИБКА ЛОГИКИ: Попытка сгенерировать путь с ведущим слэшем: "${key}". Выполнение прервано.`
            );
        }
    }

    // --- Шаг 4: Выполнение единственной операции записи ---
    // Если объект updates не пустой, выполняем атомарное обновление.
    if (Object.keys(updates).length > 0) {
        try {
            console.log('Выполняется update со следующими данными:', updates);
            await update(dbRef, updates);
            console.log('Обновление успешно завершено.');
        } catch (error) {
            console.error('Произошла ошибка при выполнении `update`:', error);
            // Если ошибка все еще здесь, то она не связана с ведущими слэшами.
            throw error; // Пробрасываем ошибку дальше
        }
    } else {
        console.log('Нечего обновлять. Выход из функции.');
    }

    // --- Шаг 5: Очистка кэша ---
    cache.delete(`salon_${invitation.salonId}`);
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