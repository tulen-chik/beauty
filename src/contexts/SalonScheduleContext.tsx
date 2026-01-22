'use client';

import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';


import type { SalonSchedule, SalonExceptionDay, SalonWorkDay } from '@/types/database';

interface SalonScheduleContextType {
  getSchedule: (salonId: string) => Promise<SalonSchedule | null>;
  createSchedule: (salonId: string, data: SalonSchedule) => Promise<SalonSchedule>;
  updateSchedule: (salonId: string, data: Partial<SalonSchedule>) => Promise<SalonSchedule>;
  deleteSchedule: (salonId: string) => Promise<void>;
  // Exception methods
  addException: (salonId: string, exception: SalonExceptionDay) => Promise<SalonSchedule>;
  removeException: (salonId: string, date: string) => Promise<SalonSchedule>;
  getEffectiveSchedule: (salonId: string, date: string) => Promise<SalonWorkDay | null>;
  getExceptionsInRange: (salonId: string, startDate: string, endDate: string) => Promise<SalonExceptionDay[]>;
  getScheduleForDateRange: (salonId: string, startDate: string, endDate: string) => Promise<Array<{ date: string; schedule: SalonWorkDay | null }>>;
  addMultipleExceptions: (salonId: string, exceptions: SalonExceptionDay[]) => Promise<SalonSchedule>;
  loading: boolean;
  error: string | null;
}

const SalonScheduleContext = createContext<SalonScheduleContextType | undefined>(undefined);

export const useSalonSchedule = () => {
  const ctx = useContext(SalonScheduleContext);
  if (!ctx) throw new Error('useSalonSchedule must be used within SalonScheduleProvider');
  return ctx;
};

export const SalonScheduleProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

const getSchedule = useCallback(async (salonId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/salons/${salonId}/schedule`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to get schedule');
      }
      return await response.json();
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createSchedule = useCallback(async (salonId: string, data: SalonSchedule) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/salons/${salonId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create schedule');
      }
      return await response.json();
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSchedule = useCallback(async (salonId: string, data: Partial<SalonSchedule>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/salons/${salonId}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update schedule');
      }
      return await response.json();
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteSchedule = useCallback(async (salonId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/salons/${salonId}/schedule`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete schedule');
      }
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  // Exception methods
  const addException = useCallback(async (salonId: string, exception: SalonExceptionDay) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/salons/${salonId}/schedule/exceptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exception),
      });
      if (!response.ok) {
        throw new Error('Failed to add exception');
      }
      return await response.json();
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeException = useCallback(async (salonId: string, date: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/salons/${salonId}/schedule/exceptions?date=${date}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to remove exception');
      }
      return await response.json();
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

const getEffectiveSchedule = useCallback(async (salonId: string, date: string) => {
    // НЕ устанавливаем глобальный loading, так как эта функция вызывается в цикле
    try {
      const response = await fetch(`/api/salons/${salonId}/schedule/effective?date=${date}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to get effective schedule');
      }
      return await response.json();
    } catch (e: any) {
      // Можно установить локальную ошибку, если нужно, но не глобальную
      console.error(`Failed to get effective schedule for ${date}:`, e.message);
      return null;
    }
  }, []);

  const getExceptionsInRange = useCallback(async (salonId: string, startDate: string, endDate: string) => {
    // НЕ устанавливаем глобальный loading
    try {
      const params = new URLSearchParams({ startDate, endDate });
      const response = await fetch(`/api/salons/${salonId}/schedule/exceptions?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to get exceptions in range');
      }
      return await response.json();
    } catch (e: any) {
      console.error(`Failed to get exceptions in range:`, e.message);
      return [];
    }
  }, []);

  const getScheduleForDateRange = useCallback(async (salonId: string, startDate: string, endDate: string) => {
    // НЕ устанавливаем глобальный loading
    try {
      const params = new URLSearchParams({ startDate, endDate });
      const response = await fetch(`/api/salons/${salonId}/schedule/range?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to get schedule for date range');
      }
      return await response.json();
    } catch (e: any) {
      console.error(`Failed to get schedule for date range:`, e.message);
      return [];
    }
  }, []);

  const addMultipleExceptions = useCallback(async (salonId: string, exceptions: SalonExceptionDay[]) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/salons/${salonId}/schedule/exceptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exceptions),
      });
      if (!response.ok) {
        throw new Error('Failed to add multiple exceptions');
      }
      return await response.json();
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const value: SalonScheduleContextType = useMemo(() => ({
    getSchedule,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    // Exception methods
    addException,
    removeException,
    getEffectiveSchedule,
    getExceptionsInRange,
    getScheduleForDateRange,
    addMultipleExceptions,
    loading,
    error,
  }), [
    getSchedule,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    addException,
    removeException,
    getEffectiveSchedule,
    getExceptionsInRange,
    getScheduleForDateRange,
    addMultipleExceptions,
    loading,
    error,
  ]);

  return (
    <SalonScheduleContext.Provider value={value}>
      {children}
    </SalonScheduleContext.Provider>
  );
};