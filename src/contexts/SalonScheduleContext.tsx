'use client';

import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

// Импортируем новые Server Actions
import {
  getSalonScheduleAction,
  createSalonScheduleAction,
  updateSalonScheduleAction,
  deleteSalonScheduleAction
} from '@/app/actions/salonActions';

import type { SalonSchedule } from '@/types/database';

interface SalonScheduleContextType {
  getSchedule: (salonId: string) => Promise<SalonSchedule | null>;
  createSchedule: (salonId: string, data: SalonSchedule) => Promise<SalonSchedule>;
  updateSchedule: (salonId: string, data: Partial<SalonSchedule>) => Promise<SalonSchedule>;
  deleteSchedule: (salonId: string) => Promise<void>;
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

  const value: SalonScheduleContextType = useMemo(() => ({
    getSchedule,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    loading,
    error,
  }), [
    getSchedule,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    loading,
    error,
  ]);

  return (
    <SalonScheduleContext.Provider value={value}>
      {children}
    </SalonScheduleContext.Provider>
  );
};