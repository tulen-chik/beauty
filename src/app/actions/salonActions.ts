'use server';

import * as admin from 'firebase-admin';
import { Database, getDatabase } from 'firebase-admin/database';
import { revalidatePath } from 'next/cache';

// Импортируем схемы и типы
import {
  salonSchema,
  userSalonsSchema,
  salonInvitationSchema,
  salonServiceSchema,
  salonScheduleSchema,
} from '@/lib/firebase/schemas';

import type {
  Salon,
  SalonInvitation,
  SalonMember,
  SalonSchedule,
  SalonService,
  UserSalons,
} from '@/types/database';

// --- Инициализация Firebase Admin SDK ---
function getDb(): Database {
  if (!admin.apps.length) {
    try {
      const serviceAccount = {
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      });
    } catch (error: any) {
      console.error('Firebase Admin initialization error:', error.message);
      throw new Error('Firebase Admin initialization failed.');
    }
  }
  return getDatabase();
}

// --- Вспомогательная функция чтения ---
const readOperation = async <T>(path: string): Promise<T | null> => {
  const snapshot = await getDb().ref(path).once('value');
  return snapshot.exists() ? (snapshot.val() as T) : null;
};

// ==========================================
// --- Действия для Салонов (Salon) ---
// ==========================================

export const createSalonAction = async (salonId: string, data: Omit<Salon, 'id'>): Promise<Salon> => {
  const validatedData = salonSchema.parse(data);
  await getDb().ref(`salons/${salonId}`).set(validatedData);
  revalidatePath('/salons');
  return { ...validatedData, id: salonId };
};

export const getSalonByIdAction = async (salonId: string): Promise<Salon | null> => {
  const data = await readOperation<Salon>(`salons/${salonId}`);
  return data ? { ...data, id: salonId } : null;
};

export const updateSalonAction = async (salonId: string, data: Partial<Salon>): Promise<Salon> => {
  const current = await readOperation<Salon>(`salons/${salonId}`);
  if (!current) throw new Error(`Salon with id ${salonId} not found.`);

  const validatedData = salonSchema.partial().parse(data);
  const updatedData = { ...current, ...validatedData }; // В схеме салона обычно нет updatedAt, но если есть - добавьте

  await getDb().ref(`salons/${salonId}`).update(updatedData);
  
  revalidatePath(`/salons/${salonId}`);
  revalidatePath('/salons');
  return { ...updatedData, id: salonId };
};

export const deleteSalonAction = async (salonId: string): Promise<void> => {
  await getDb().ref(`salons/${salonId}`).remove();
  revalidatePath('/salons');
};

/**
 * Обновляет URL аватара салона в БД.
 * Примечание: Загрузка файла (File) должна происходить либо на клиенте, либо через отдельный Server Action с FormData.
 * Здесь мы обновляем только запись в БД, как в примере с чатами.
 */
export const updateSalonAvatarDbAction = async (salonId: string, avatarUrl: string, avatarStoragePath: string): Promise<void> => {
  await getDb().ref(`salons/${salonId}`).update({
    avatarUrl,
    avatarStoragePath
  });
  revalidatePath(`/salons/${salonId}`);
};

export const removeSalonAvatarDbAction = async (salonId: string): Promise<void> => {
  await getDb().ref(`salons/${salonId}`).update({
    avatarUrl: '',
    avatarStoragePath: ''
  });
  revalidatePath(`/salons/${salonId}`);
};

// ==========================================
// --- Действия для Салонов Пользователя (UserSalons) ---
// ==========================================

export const createUserSalonsAction = async (userId: string, data: Omit<UserSalons, 'id'>): Promise<UserSalons> => {
  const validatedData = userSalonsSchema.parse(data);
  await getDb().ref(`userSalons/${userId}`).set(validatedData);
  return { ...validatedData, userId };
};

export const getUserSalonsAction = async (userId: string): Promise<UserSalons | null> => {
  const data = await readOperation<UserSalons>(`userSalons/${userId}`);
  return data ? { ...data, userId } : null;
};

export const updateUserSalonsAction = async (userId: string, data: Partial<UserSalons>): Promise<UserSalons> => {
  await getDb().ref(`userSalons/${userId}`).update(data);
  const updated = await readOperation<UserSalons>(`userSalons/${userId}`);
  return { ...updated!, userId };
};

// ==========================================
// --- Действия для Приглашений (SalonInvitation) ---
// ==========================================

export const createInvitationAction = async (invitationId: string, data: Omit<SalonInvitation, 'id'>): Promise<SalonInvitation> => {
  const validatedData = salonInvitationSchema.parse(data);
  await getDb().ref(`salonInvitations/${invitationId}`).set(validatedData);
  return { ...validatedData, id: invitationId };
};

export const getInvitationByIdAction = async (invitationId: string): Promise<SalonInvitation | null> => {
  const data = await readOperation<SalonInvitation>(`salonInvitations/${invitationId}`);
  return data ? { ...data, id: invitationId } : null;
};

export const updateInvitationAction = async (invitationId: string, data: Partial<SalonInvitation>): Promise<SalonInvitation> => {
  await getDb().ref(`salonInvitations/${invitationId}`).update(data);
  const updated = await readOperation<SalonInvitation>(`salonInvitations/${invitationId}`);
  return { ...updated!, id: invitationId };
};

export const deleteInvitationAction = async (invitationId: string): Promise<void> => {
  await getDb().ref(`salonInvitations/${invitationId}`).remove();
};

export const getInvitationsByEmailAction = async (email: string): Promise<SalonInvitation[]> => {
  const snapshot = await getDb().ref('salonInvitations').orderByChild('email').equalTo(email).once('value');
  if (!snapshot.exists()) return [];
  const data = snapshot.val() as Record<string, SalonInvitation>;
  return Object.entries(data).map(([id, val]) => ({ ...val, id }));
};

export const getInvitationsBySalonIdAction = async (salonId: string): Promise<SalonInvitation[]> => {
  const snapshot = await getDb().ref('salonInvitations').orderByChild('salonId').equalTo(salonId).once('value');
  if (!snapshot.exists()) return [];
  const data = snapshot.val() as Record<string, SalonInvitation>;
  return Object.entries(data).map(([id, val]) => ({ ...val, id }));
};

/**
 * Принимает приглашение в салон (Атомарная операция).
 */
export const acceptInvitationAction = async (invitationId: string, userId: string): Promise<void> => {
  const db = getDb();
  
  // 1. Получаем данные приглашения
  const invitation = await readOperation<SalonInvitation>(`salonInvitations/${invitationId}`);
  if (!invitation) throw new Error("Invitation not found.");
  
  if (invitation.status !== 'pending') {
    console.log(`Приглашение ${invitationId} уже обработано. Статус: ${invitation.status}.`);
    return;
  }

  // 2. Получаем данные салона
  const salon = await readOperation<Salon>(`salons/${invitation.salonId}`);
  if (!salon) throw new Error("Salon not found.");

  const updates: { [key: string]: any } = {};

  // Проверяем, является ли пользователь уже участником
  const isAlreadyMember = salon.members?.some(member => member.userId === userId);

  if (isAlreadyMember) {
    // Только обновляем статус приглашения
    updates[`salonInvitations/${invitationId}/status`] = 'accepted';
  } else {
    // Полное обновление: статус, участники салона, список салонов пользователя
    const userSalons = await readOperation<UserSalons>(`userSalons/${userId}`);
    const now = new Date().toISOString();

    const newMember: SalonMember = { userId, role: invitation.role, joinedAt: now };
    const updatedMembers = [...(salon.members || []), newMember];

    const newUserSalonEntry = { salonId: invitation.salonId, role: invitation.role, joinedAt: now };
    const updatedUserSalonsList = [...(userSalons?.salons || []), newUserSalonEntry];

    updates[`salonInvitations/${invitationId}/status`] = 'accepted';
    updates[`salons/${invitation.salonId}/members`] = updatedMembers;
    updates[`userSalons/${userId}/salons`] = updatedUserSalonsList;

    if (!userSalons) {
      updates[`userSalons/${userId}/userId`] = userId;
    }
  }

  // Проверка на ведущие слэши (как в исходном коде)
  for (const key in updates) {
    if (key.startsWith('/')) {
      throw new Error(`CRITICAL LOGIC ERROR: Path starts with slash: "${key}".`);
    }
  }

  if (Object.keys(updates).length > 0) {
    await db.ref().update(updates);
  }

  revalidatePath(`/salons/${invitation.salonId}`);
  revalidatePath(`/profile`); // Обновляем профиль пользователя, где могут быть видны салоны
};

// ==========================================
// --- Действия для Услуг (SalonService) ---
// ==========================================

export const createSalonServiceAction = async (serviceId: string, data: Omit<SalonService, 'id'>): Promise<SalonService> => {
  const validatedData = salonServiceSchema.parse(data);
  await getDb().ref(`salonServices/${serviceId}`).set(validatedData);
  revalidatePath(`/salons/${data.salonId}`);
  return { ...validatedData, id: serviceId };
};

export const getSalonServiceByIdAction = async (serviceId: string): Promise<SalonService | null> => {
  const data = await readOperation<SalonService>(`salonServices/${serviceId}`);
  return data ? { ...data, id: serviceId } : null;
};

export const updateSalonServiceAction = async (serviceId: string, data: Partial<SalonService>): Promise<SalonService> => {
  const current = await readOperation<SalonService>(`salonServices/${serviceId}`);
  if (!current) throw new Error("Service not found");

  const validatedData = salonServiceSchema.partial().parse(data);
  const updatedData = { ...current, ...validatedData };
  
  await getDb().ref(`salonServices/${serviceId}`).update(updatedData);
  revalidatePath(`/salons/${current.salonId}`);
  return { ...updatedData, id: serviceId };
};

export const deleteSalonServiceAction = async (serviceId: string): Promise<void> => {
  const current = await readOperation<SalonService>(`salonServices/${serviceId}`);
  await getDb().ref(`salonServices/${serviceId}`).remove();
  if (current) {
    revalidatePath(`/salons/${current.salonId}`);
  }
};

export const getServicesBySalonAction = async (salonId: string): Promise<SalonService[]> => {
  const snapshot = await getDb().ref('salonServices').orderByChild('salonId').equalTo(salonId).once('value');
  if (!snapshot.exists()) return [];
  const data = snapshot.val() as Record<string, SalonService>;
  return Object.entries(data).map(([id, val]) => ({ ...val, id }));
};

/**
 * Получает услуги с постраничной загрузкой
 */
export const getSalonServicesPaginatedAction = async (options: { 
  limit: number; 
  startAfterKey?: string 
}): Promise<{ services: SalonService[]; nextKey: string | null }> => {
  const { limit, startAfterKey } = options;
  let query = getDb().ref('salonServices').orderByChild('createdAt');

  if (startAfterKey) {
    const lastService = await readOperation<SalonService>(`salonServices/${startAfterKey}`);
    if (lastService) {
      query = query.startAfter(lastService.createdAt);
    }
  }

  // Берем limit + 1, чтобы проверить наличие следующей страницы
  const snapshot = await query.limitToFirst(limit + 1).once('value');

  if (!snapshot.exists()) {
    return { services: [], nextKey: null };
  }

  const data = snapshot.val() as Record<string, SalonService>;
  const services: SalonService[] = [];
  let lastKey: string | null = null;

  const entries = Object.entries(data);
  // Важно: Firebase Admin SDK возвращает объект, порядок ключей не гарантирован так же строго, как массив,
  // но orderByChild обычно работает корректно при итерации forEach в клиентском SDK.
  // В Admin SDK snapshot.val() возвращает Raw Object. Нам нужно отсортировать вручную, если мы хотим гарантий,
  // или использовать snapshot.forEach (который гарантирует порядок).
  
  // Используем snapshot.forEach для сохранения порядка сортировки
  let count = 0;
  snapshot.forEach((childSnap) => {
    if (count < limit) {
      services.push({ ...(childSnap.val() as Omit<SalonService, 'id'>), id: childSnap.key! });
    }
    lastKey = childSnap.key;
    count++;
  });

  const hasNextPage = count > limit;

  return {
    services,
    nextKey: hasNextPage ? lastKey : null
  };
};

/**
 * Получает услуги по городу с пагинацией (фильтрация на сервере + сортировка в памяти)
 */
export const getSalonServicesByCityPaginatedAction = async (options: {
  city: string;
  limit: number;
  startAfterKey?: string;
}): Promise<{ services: SalonService[]; nextKey: string | null }> => {
  const { city, limit, startAfterKey } = options;
  
  // Запрашиваем с запасом, так как фильтрация по equalTo и сортировка по createdAt сложна в RTDB без составного ключа.
  // Здесь мы повторяем логику клиента: берем по городу, сортируем в памяти.
  // Внимание: limitToFirst здесь применяется к сортировке по ключу (по умолчанию), если не указан orderBy.
  // Чтобы повторить логику клиента, мы должны получить достаточно данных.
  // Если данных ОЧЕНЬ много, это будет медленно.
  
  const snapshot = await getDb().ref('salonServices')
    .orderByChild('city')
    .equalTo(city)
    .limitToFirst(limit + 50) // Берем с запасом для сортировки
    .once('value');

  if (!snapshot.exists()) {
    return { services: [], nextKey: null };
  }

  const data = snapshot.val() as Record<string, SalonService>;
  
  // Сортируем по createdAt (новые сначала)
  let allServices = Object.entries(data).map(([id, val]) => ({
    ...val,
    id,
  })).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  let startIndex = 0;
  if (startAfterKey) {
    const lastIndex = allServices.findIndex(s => s.id === startAfterKey);
    if (lastIndex !== -1) {
      startIndex = lastIndex + 1;
    }
  }

  const servicesOnPage = allServices.slice(startIndex, startIndex + limit);
  const lastService = servicesOnPage.length > 0 ? servicesOnPage[servicesOnPage.length - 1] : null;
  const hasNextPage = startIndex + limit < allServices.length;

  return {
    services: servicesOnPage,
    nextKey: hasNextPage && lastService ? lastService.id : null,
  };
};

// ==========================================
// --- Действия для Расписания (SalonSchedule) ---
// ==========================================

export const createSalonScheduleAction = async (salonId: string, data: SalonSchedule): Promise<SalonSchedule> => {
  const validatedData = salonScheduleSchema.parse(data);
  await getDb().ref(`salonSchedules/${salonId}`).set(validatedData);
  revalidatePath(`/salons/${salonId}`);
  return validatedData;
};

export const getSalonScheduleAction = async (salonId: string): Promise<SalonSchedule | null> => {
  return await readOperation<SalonSchedule>(`salonSchedules/${salonId}`);
};

export const updateSalonScheduleAction = async (salonId: string, data: Partial<SalonSchedule>): Promise<SalonSchedule> => {
  const current = await readOperation<SalonSchedule>(`salonSchedules/${salonId}`);
  // Если расписания нет, создаем новое на основе частичных данных (или пустых)
  const base = current || { salonId, workDays: [], exceptions: [] }; // Упрощенная заглушка
  
  const validatedData = salonScheduleSchema.partial().parse(data);
  const updatedData = { ...base, ...validatedData } as SalonSchedule;

  await getDb().ref(`salonSchedules/${salonId}`).update(updatedData);
  revalidatePath(`/salons/${salonId}`);
  return updatedData;
};

export const deleteSalonScheduleAction = async (salonId: string): Promise<void> => {
  await getDb().ref(`salonSchedules/${salonId}`).remove();
  revalidatePath(`/salons/${salonId}`);
};

// ==========================================
// --- Сложные запросы (Пагинация Салонов) ---
// ==========================================

/**
 * Получает салоны в указанном городе с постраничной загрузкой.
 */
export const getSalonsByCityPaginatedAction = async (options: {
  city: string;
  limit: number;
  startAfterKey?: string;
}): Promise<{ salons: Salon[]; nextKey: string | null }> => {
  const { city, limit, startAfterKey } = options;
  
  // Аналогично услугам: фильтруем по городу, сортируем в памяти по ID
  const snapshot = await getDb().ref('salons')
    .orderByChild('city')
    .equalTo(city)
    .limitToFirst(limit + 50) // Запас
    .once('value');

  if (!snapshot.exists()) {
    return { salons: [], nextKey: null };
  }

  const data = snapshot.val() as Record<string, Salon>;

  // Сортировка по ID для стабильности
  let allSalons = Object.entries(data).map(([id, val]) => ({
    ...val,
    id,
  })).sort((a, b) => a.id.localeCompare(b.id));

  let startIndex = 0;
  if (startAfterKey) {
    const lastIndex = allSalons.findIndex(s => s.id === startAfterKey);
    if (lastIndex !== -1) {
      startIndex = lastIndex + 1;
    }
  }

  const salonsOnPage = allSalons.slice(startIndex, startIndex + limit);
  const lastSalon = salonsOnPage.length > 0 ? salonsOnPage[salonsOnPage.length - 1] : null;
  const hasNextPage = startIndex + limit < allSalons.length;

  return {
    salons: salonsOnPage,
    nextKey: hasNextPage && lastSalon ? lastSalon.id : null,
  };
};