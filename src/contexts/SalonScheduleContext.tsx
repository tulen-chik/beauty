import React, { createContext, ReactNode, useCallback,useContext, useMemo, useState } from 'react';

import { salonScheduleOperations } from '@/lib/firebase/database';

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
      const schedule = await salonScheduleOperations.read(salonId);
      setLoading(false);
      return schedule;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      return null;
    }
  }, []);

  const createSchedule = useCallback(async (salonId: string, data: SalonSchedule) => {
    setLoading(true);
    setError(null);
    try {
      const schedule = await salonScheduleOperations.create(salonId, data);
      setLoading(false);
      return schedule;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      throw e;
    }
  }, []);

  const updateSchedule = useCallback(async (salonId: string, data: Partial<SalonSchedule>) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await salonScheduleOperations.update(salonId, data);
      setLoading(false);
      return updated;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      throw e;
    }
  }, []);

  const deleteSchedule = useCallback(async (salonId: string) => {
    setLoading(true);
    setError(null);
    try {
      await salonScheduleOperations.delete(salonId);
      setLoading(false);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
      throw e;
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