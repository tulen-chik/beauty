'use client';

import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

// Импортируем новые Server Actions
import {
  getSalonScheduleAction,
  createSalonScheduleAction,
  updateSalonScheduleAction,
  deleteSalonScheduleAction,
  addScheduleExceptionAction,
  removeScheduleExceptionAction,
  getEffectiveScheduleAction,
  getExceptionsInRangeAction,
  getScheduleForDateRangeAction,
  addMultipleExceptionsAction
} from '@/app/actions/salonActions';

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
      const schedule = await getSalonScheduleAction(salonId);
      return schedule;
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
      const schedule = await createSalonScheduleAction(salonId, data);
      return schedule;
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
      const updated = await updateSalonScheduleAction(salonId, data);
      return updated;
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
      await deleteSalonScheduleAction(salonId);
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
      const updated = await addScheduleExceptionAction(salonId, exception);
      return updated;
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
      const updated = await removeScheduleExceptionAction(salonId, date);
      return updated;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const getEffectiveSchedule = useCallback(async (salonId: string, date: string) => {
    setLoading(true);
    setError(null);
    try {
      const schedule = await getEffectiveScheduleAction(salonId, date);
      return schedule;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getExceptionsInRange = useCallback(async (salonId: string, startDate: string, endDate: string) => {
    setLoading(true);
    setError(null);
    try {
      const exceptions = await getExceptionsInRangeAction(salonId, startDate, endDate);
      return exceptions;
    } catch (e: any) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getScheduleForDateRange = useCallback(async (salonId: string, startDate: string, endDate: string) => {
    setLoading(true);
    setError(null);
    try {
      const schedule = await getScheduleForDateRangeAction(salonId, startDate, endDate);
      return schedule;
    } catch (e: any) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const addMultipleExceptions = useCallback(async (salonId: string, exceptions: SalonExceptionDay[]) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await addMultipleExceptionsAction(salonId, exceptions);
      return updated;
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