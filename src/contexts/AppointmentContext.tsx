'use client';

import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

// Импортируем новые Server Actions

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

      const response = await fetch(`/api/salons/${salonId}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId, ...data }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create appointment');
      }

      const created = await response.json();
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

      const response = await fetch(`/api/salons/${salonId}/appointments/${appointmentId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        const err = await response.json();
        throw new Error(err.error || 'Failed to get appointment');
      }
      const appt = await response.json();
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

      const response = await fetch(`/api/salons/${salonId}/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update appointment');
      }

      const updated = await response.json();
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

      const response = await fetch(`/api/salons/${salonId}/appointments/${appointmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to delete appointment');
      }
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

      const params = new URLSearchParams();
      if (options) {
        Object.entries(options).forEach(([key, value]) => {
          if (value) {
            params.append(key, String(value));
          }
        });
      }

      const response = await fetch(`/api/salons/${salonId}/appointments?${params.toString()}`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to get appointments');
      }

      const list = await response.json();
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
    const getDayBounds = (date: Date | string): { startIso: string; endIso: string } => {
      const dayStart = new Date(date);
      if (isNaN(dayStart.getTime())) {
        throw new Error('Неверная дата');
      }
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      return { startIso: dayStart.toISOString(), endIso: dayEnd.toISOString() };
    };

    const { startIso, endIso } = getDayBounds(date);
    return listAppointments(salonId, { startAt: startIso, endAt: endIso });
  }, []);

  const listAppointmentsByCustomer = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      assertString(userId, 'Не указан ID пользователя');

      const response = await fetch(`/api/users/${userId}/appointments`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to get user appointments');
      }
      const list = await response.json();
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

      const params = new URLSearchParams({
        startAtIso,
        durationMinutes: String(durationMinutes),
      });
      if (employeeId) params.append('employeeId', employeeId);
      if (excludeAppointmentId) params.append('excludeAppointmentId', excludeAppointmentId);

      const response = await fetch(`/api/salons/${salonId}/availability?${params.toString()}`);
      if (!response.ok) {
        console.error("Availability check failed:", await response.json());
        return false;
      }
      const data = await response.json();
      return data.isAvailable;
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
      const created = await createAppointment(salonId, appointmentId, data);
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