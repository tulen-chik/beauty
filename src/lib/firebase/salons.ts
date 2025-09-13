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
};

export const serviceCategoryOperations = {
  create: (categoryId: string, data: Omit<ServiceCategory, 'id'>) =>
    createOperation(`serviceCategories/${categoryId}`, data, serviceCategorySchema),
  read: (categoryId: string) => readOperation<ServiceCategory>(`serviceCategories/${categoryId}`),
  update: (categoryId: string, data: Partial<ServiceCategory>) =>
    updateOperation(`serviceCategories/${categoryId}`, data, serviceCategorySchema),
  delete: (categoryId: string) => deleteOperation(`serviceCategories/${categoryId}`),
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
