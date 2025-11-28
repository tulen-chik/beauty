'use client';

import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

// Импортируем новые Server Actions
import {
  createAppointmentAction,
  getAppointmentAction,
  updateAppointmentAction,
  deleteAppointmentAction,
  getAppointmentsBySalonAction,
  getAppointmentsByDayAction,
  getAppointmentsByUserAction,
  checkAppointmentAvailabilityAction
} from '@/app/actions/appointmentActions';

import type { Appointment, AppointmentStatus } from '@/types/database';

interface ListOptions {
  startAt?: string;
  endAt?: string;
  status?: AppointmentStatus;
  employeeId?: string;
  serviceId?: string;
  customerUserId?: string;
}

interface AppointmentContextType {
  // CRUD
  createAppointment: (
    salonId: string,
    appointmentId: string,
    data: Omit<Appointment, 'id'>
  ) => Promise<Appointment>;
  getAppointment: (salonId: string, appointmentId: string) => Promise<Appointment | null>;
  updateAppointment: (
    salonId: string,
    appointmentId: string,
    data: Partial<Appointment>
  ) => Promise<Appointment>;
  deleteAppointment: (salonId: string, appointmentId: string) => Promise<void>;

  // Queries
  listAppointments: (salonId: string, options?: ListOptions) => Promise<Appointment[]>;
  listAppointmentsByDay: (salonId: string, date: Date) => Promise<Appointment[]>;
  listAppointmentsByCustomer: (userId: string) => Promise<Appointment[]>;

  // Availability
  isTimeSlotAvailable: (
    salonId: string,
    startAtIso: string,
    durationMinutes: number,
    employeeId?: string,
    excludeAppointmentId?: string
  ) => Promise<boolean>;

  // Helper to book with availability check
  bookIfAvailable: (
    salonId: string,
    appointmentId: string,
    data: Omit<Appointment, 'id'>,
    employeeId?: string
  ) => Promise<{ ok: boolean; appointment?: Appointment; reason?: string }>;

  // UI state
  loading: boolean;
  error: string | null;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export const useAppointment = () => {
  const ctx = useContext(AppointmentContext);
  if (!ctx) throw new Error('useAppointment must be used within AppointmentProvider');
  return ctx;
};

export const AppointmentProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assertString = (value: string | undefined | null, message: string) => {
    if (!value || !value.trim()) {
      throw new Error(message);
    }
  };

  const assertCondition = (condition: boolean, message: string) => {
    if (!condition) {
      throw new Error(message);
    }
  };

  const createAppointment = useCallback(async (
    salonId: string,
    appointmentId: string,
    data: Omit<Appointment, 'id'>
  ) => {
    setLoading(true);
    setError(null);
    try {
      assertString(salonId, 'Не указан ID салона');
      assertString(appointmentId, 'Не указан ID записи');
      assertString(data?.serviceId, 'Не указана услуга');

      const created = await createAppointmentAction(salonId, appointmentId, data);
      return created;
    } catch (e: any) {
      const errorMessage = e?.message || 'Не удалось создать запись';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getAppointment = useCallback(async (salonId: string, appointmentId: string) => {
    setLoading(true);
    setError(null);
    try {
      assertString(salonId, 'Не указан ID салона');
      assertString(appointmentId, 'Не указан ID записи');

      const appt = await getAppointmentAction(salonId, appointmentId);
      return appt;
    } catch (e: any) {
      const errorMessage = e?.message || 'Не удалось получить запись';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAppointment = useCallback(async (
    salonId: string,
    appointmentId: string,
    data: Partial<Appointment>
  ) => {
    setLoading(true);
    setError(null);
    try {
      assertString(salonId, 'Не указан ID салона');
      assertString(appointmentId, 'Не указан ID записи');
      assertCondition(Boolean(data && Object.keys(data).length > 0), 'Нет данных для обновления');

      const updated = await updateAppointmentAction(salonId, appointmentId, data);
      return updated;
    } catch (e: any) {
      const errorMessage = e?.message || 'Не удалось обновить запись';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAppointment = useCallback(async (salonId: string, appointmentId: string) => {
    setLoading(true);
    setError(null);
    try {
      assertString(salonId, 'Не указан ID салона');
      assertString(appointmentId, 'Не указан ID записи');

      await deleteAppointmentAction(salonId, appointmentId);
    } catch (e: any) {
      const errorMessage = e?.message || 'Не удалось удалить запись';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const listAppointments = useCallback(async (salonId: string, options?: ListOptions) => {
    setLoading(true);
    setError(null);
    try {
      assertString(salonId, 'Не указан ID салона');

      const list = await getAppointmentsBySalonAction(salonId, options);
      return list;
    } catch (e: any) {
      const errorMessage = e?.message || 'Не удалось получить список записей';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const listAppointmentsByDay = useCallback(async (salonId: string, date: Date) => {
    setLoading(true);
    setError(null);
    try {
      assertString(salonId, 'Не указан ID салона');
      assertCondition(Boolean(date && !isNaN(date.getTime())), 'Неверная дата');

      const list = await getAppointmentsByDayAction(salonId, date);
      return list;
    } catch (e: any) {
      const errorMessage = e?.message || 'Не удалось получить записи за день';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const listAppointmentsByCustomer = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      assertString(userId, 'Не указан ID пользователя');

      const list = await getAppointmentsByUserAction(userId);
      return list;
    } catch (e: any) {
      const errorMessage = e?.message || 'Не удалось получить записи пользователя';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const isTimeSlotAvailable = useCallback(async (
    salonId: string,
    startAtIso: string,
    durationMinutes: number,
    employeeId?: string,
    excludeAppointmentId?: string
  ) => {
    // Здесь не ставим глобальный loading, чтобы не блокировать UI при проверках в фоне
    setError(null);
    try {
      assertString(salonId, 'Не указан ID салона');
      assertString(startAtIso, 'Не указана дата начала');
      assertCondition(durationMinutes > 0 && durationMinutes <= 1440, 'Неверная длительность');

      return await checkAppointmentAvailabilityAction(
        salonId,
        startAtIso,
        durationMinutes,
        employeeId,
        excludeAppointmentId
      );
    } catch (e: any) {
      console.error("Availability check failed:", e);
      return false;
    }
  }, []);

  const bookIfAvailable = useCallback(async (
    salonId: string,
    appointmentId: string,
    data: Omit<Appointment, 'id'>,
    employeeId?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      assertString(salonId, 'Не указан ID салона');
      assertString(appointmentId, 'Не указан ID записи');
      assertString(data?.serviceId, 'Не указана услуга');
      assertString(data?.startAt, 'Не указано время начала');
      assertCondition(Boolean(data?.durationMinutes), 'Не указана длительность');

      // 2. Создаем запись (внутри уже есть проверка доступности через транзакцию)
      const created = await createAppointmentAction(salonId, appointmentId, data);
      return { ok: true, appointment: created };
    } catch (e: any) {
      const errorMessage = e?.message || 'Не удалось создать запись';
      setError(errorMessage);
      return { ok: false, reason: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const value: AppointmentContextType = useMemo(() => ({
    createAppointment,
    getAppointment,
    updateAppointment,
    deleteAppointment,
    listAppointments,
    listAppointmentsByDay,
    isTimeSlotAvailable,
    listAppointmentsByCustomer,
    bookIfAvailable,
    loading,
    error,
  }), [
    createAppointment,
    getAppointment,
    updateAppointment,
    deleteAppointment,
    listAppointments,
    listAppointmentsByDay,
    isTimeSlotAvailable,
    listAppointmentsByCustomer,
    bookIfAvailable,
    loading,
    error,
  ]);

  return (
    <AppointmentContext.Provider value={value}>
      {children}
    </AppointmentContext.Provider>
  );
};