import type { Salon, UserSalons, SalonInvitation, ServiceCategory, SalonService, SalonSchedule } from '@/types/database';
import { salonSchema, userSalonsSchema, salonInvitationSchema, serviceCategorySchema, salonServiceSchema, salonScheduleSchema } from './schemas';
import { createOperation, readOperation, updateOperation, deleteOperation } from './crud';

export const salonOperations = {
  create: (salonId: string, data: Omit<Salon, 'id'>) =>
    createOperation(`salons/${salonId}`, data, salonSchema),
  read: (salonId: string) => readOperation<Salon>(`salons/${salonId}`),
  update: (salonId: string, data: Partial<Salon>) =>
    updateOperation(`salons/${salonId}`, data, salonSchema),
  delete: (salonId: string) => deleteOperation(`salons/${salonId}`),
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
